# krypticlogan.github.io
Dev Portfolio and Blog

Nice to see you here! This serves as documentation of my development personality and projects that I've created over the years.
If you see anything you'd like to speak about feel free to reach out!

## Editing the portfolio

This is a static GitHub Pages site with no build step or package installation.
Serve the repository root over HTTP to preview it (for example, `python3 -m http.server 8000`).

- `index.html`: summary, skills, socials, current project, and selected work.
- `style.css`: dark purple theme and responsive layout.
- `portfolio.js`: Spotify snapshot and homepage post previews.
- `posts/index.html`: the `/posts/` archive, usable without JavaScript.
- `posts/<slug>/index.html`: individual post pages with direct, shareable URLs.
- `posts/posts.json`: title, date, date label, slug, and blurb for homepage previews, in display order (newest first).

To publish a post, copy an existing post directory, replace its article content and metadata,
then add its entry to `posts/posts.json` and its preview link to `posts/index.html`.
Keep the homepage's fallback links in sync if you want the newest entries visible without JavaScript.
The migrated notes retain their original project start dates; these are not publication dates.
`devlogs.html` forwards old bookmarks to the new archive.

Spotify credentials stay in GitHub Actions secrets. The existing scheduled workflow updates
`now-playing.json`; the browser reads only that public snapshot. “Listening now” is shown
only for a playing snapshot less than 20 minutes old. Older snapshots use “On repeat.”
