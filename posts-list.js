async function loadPostList() {
    const list = document.querySelector('.posts-scroll, .archive-list');
    if (!list) return;

    try {
        const response = await fetch('/posts/posts.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const posts = await response.json();
        const cards = posts.map(post => {
            const card = document.createElement('a');
            card.className = 'post-card';
            card.href = `/posts/${post.slug}/`;

            const date = document.createElement('time');
            date.dateTime = post.date;
            const [year, month, day] = post.date.split('-');
            date.textContent = day ? `${month}/${day}/${year}` : `${month}/${year}`;

            const title = document.createElement('h3');
            title.textContent = post.title;
            const arrow = document.createElement('span');
            arrow.textContent = '↗';
            title.append(arrow);

            const summary = document.createElement('p');
            summary.textContent = post.blurb;
            const read = document.createElement('span');
            read.className = 'read-link';
            read.textContent = 'Read more →';
            card.append(date, title, summary, read);
            return card;
        });
        list.replaceChildren(...cards);
    } catch (error) {
        console.error('Unable to load posts', error);
        list.textContent = 'Posts are unavailable right now.';
    }
}

loadPostList();
