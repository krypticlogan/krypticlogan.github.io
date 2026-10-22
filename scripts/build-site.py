"""Build the static site from Markdown files directly inside posts/."""

import argparse
import datetime as dt
import html
import json
import re
import shutil
import tomllib
import unicodedata
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
NAME_PATTERN = re.compile(
    r"^(?P<name>.+)-(?P<month>0[1-9]|1[0-2])"
    r"(?:-(?P<day>0[1-9]|[12]\d|3[01]))?-(?P<year>\d{2})$"
)
MARKER = ".generated-by-build-site"


def slugify(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-z0-9\s-]", "", value.lower())
    return re.sub(r"[\s-]+", "-", value).strip("-")


def parse_post(path):
    match = NAME_PATTERN.fullmatch(path.stem)
    if not match:
        raise ValueError(f"{path.name}: expected title-mm-dd-yy.md or title-mm-yy.md")

    month, day, year = (
        int(match[key]) if match[key] else None for key in ("month", "day", "year")
    )
    if year is None or month is None:
        raise ValueError(f"{path.name}: invalid date")
    try:
        date = dt.date(2000 + year, month, day or 1)
    except ValueError as error:
        raise ValueError(f"{path.name}: invalid date: {error}") from error

    raw = path.read_text(encoding="utf-8")
    metadata = {}
    body = raw
    if raw.startswith("+++\n"):
        divider = raw.find("\n+++\n", 4)
        if divider < 0:
            raise ValueError(f"{path.name}: missing closing +++ front matter delimiter")
        metadata = tomllib.loads(raw[4:divider])
        body = raw[divider + 5 :].lstrip("\n")

    title = metadata["title"] if "title" in metadata else match["name"].replace("-", " ").title()
    if not isinstance(title, str) or not title.strip():
        raise ValueError(f"{path.name}: title must be a nonempty string")
    filename_slug = slugify(match["name"])
    if not filename_slug:
        raise ValueError(f"{path.name}: filename title must contain characters usable in a URL")
    if not body.strip():
        raise ValueError(f"{path.name}: post is empty")
    if "date_label" in metadata:
        raise ValueError(f"{path.name}: date_label is no longer supported; the date comes from the filename")

    date_key = date.isoformat() if day else date.strftime("%Y-%m")
    route = f"{filename_slug}-{date_key}"
    display_date = date.strftime("%m/%d/%Y") if day else date.strftime("%m/%Y")
    summary = metadata.get("summary") or first_paragraph(body)
    tags = metadata.get("tags", [])
    for key, value in (("title", title), ("summary", summary)):
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{path.name}: {key} must be a nonempty string")
    if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
        raise ValueError(f"{path.name}: tags must be a list of strings")
    project_url = metadata.get("project_url")
    if project_url is not None and (
        not isinstance(project_url, str) or not project_url.startswith("https://")
    ):
        raise ValueError(f"{path.name}: project_url must be an HTTPS URL")

    return {
        "path": path,
        "body": body,
        "title": title,
        "slug": route,
        "date": date_key,
        "sort_date": date,
        "display_date": display_date,
        "blurb": summary,
        "tags": tags,
        "project_url": project_url,
    }


def first_paragraph(body):
    blocks = re.split(r"\n\s*\n", body.strip())
    for block in blocks:
        if block.startswith(("#", "<!--", "```", "- ", "* ")):
            continue
        plain = re.sub(r"!?\[([^]]+)\]\([^)]*\)", r"\1", block)
        plain = re.sub(r"[`*_]", "", plain)
        return " ".join(plain.split())
    raise ValueError("Add a summary or an opening paragraph to this post")


def render_post(template, post):
    escaped = {
        key: html.escape(str(post[key]), quote=True)
        for key in ("title", "date", "display_date", "blurb")
    }
    tags = "\n".join(
        f'                        <span class="tag">{html.escape(tag)}</span>'
        for tag in post["tags"]
    )
    tags_block = (
        f'<div class="devlog-tags">\n{tags}\n                    </div>' if tags else ""
    )
    project_link = (
        f'<div class="devlog-links"><a href="{html.escape(post["project_url"], quote=True)}" class="btn-small" target="_blank" rel="noopener noreferrer">View project →</a></div>'
        if post["project_url"]
        else ""
    )
    replacements = {
        "{{TITLE}}": escaped["title"],
        "{{DATE}}": escaped["date"],
        "{{DATE_DISPLAY}}": escaped["display_date"],
        "{{SUMMARY}}": escaped["blurb"],
        "{{TAGS_BLOCK}}": tags_block,
        "{{MARKDOWN_PATH}}": html.escape(
            f"/posts/{quote(post['path'].name, safe='')}", quote=True
        ),
        "{{PROJECT_LINK}}": project_link,
    }
    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)
    return template


def build(source, output=None):
    source = source.resolve()
    output = output.resolve() if output is not None else source
    in_place = output == source
    posts = [parse_post(path) for path in (source / "posts").glob("*.md")]
    if not posts:
        raise ValueError("posts/ has no Markdown files")
    routes = {}
    for post in posts:
        route = post["slug"]
        if route in routes:
            raise ValueError(
                f"Route /posts/{route}/ is used by both {routes[route]} and {post['path'].name}"
            )
        routes[route] = post["path"].name
    posts.sort(key=lambda post: (post["sort_date"], post["slug"]), reverse=True)

    if not in_place:
        if output.exists():
            if not (output / MARKER).is_file():
                raise ValueError(f"Refusing to replace {output}: it is not a generated staging directory")
            shutil.rmtree(output)
        output.mkdir(parents=True)
        (output / MARKER).write_text("Temporary public site staged by scripts/build-site.py\n")
        for name in (
            "index.html", "style.css", "portfolio.js", "site-shell.js",
            "post-renderer.js", "posts-list.js", "header.html", "footer.html",
            "now-playing.json",
        ):
            shutil.copy2(source / name, output / name)
        shutil.copytree(source / "assets", output / "assets")
        (output / ".nojekyll").write_text("")
        (output / "posts").mkdir()
        shutil.copy2(source / "posts/index.html", output / "posts/index.html")

    post_output = output / "posts"
    manifest = [
        {key: post[key] for key in ("slug", "title", "date", "blurb")}
        for post in posts
    ]
    (post_output / "posts.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    )

    template = (source / "templates/post.html").read_text()
    generated = "<!-- Generated by scripts/build-site.py -->\n"
    for post in posts:
        if not in_place:
            shutil.copy2(post["path"], post_output / post["path"].name)
        route_dir = post_output / post["slug"]
        route_dir.mkdir(exist_ok=True)
        page = route_dir / "index.html"
        if page.exists() and not page.read_text().startswith(generated):
            raise ValueError(f"Refusing to overwrite authored page: {page}")
        page.write_text(generated + render_post(template, post))

    if in_place:
        for folder in post_output.iterdir():
            page = folder / "index.html"
            if folder.is_dir() and page.is_file() and page.read_text().startswith(generated) and folder.name not in routes:
                page.unlink()
                if not any(folder.iterdir()):
                    folder.rmdir()
    return posts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="stage public files in a temporary directory instead of writing routes in place")
    args = parser.parse_args()
    built = build(ROOT, args.output)
    print(f"Built {len(built)} posts in {args.output or ROOT / 'posts'}")
