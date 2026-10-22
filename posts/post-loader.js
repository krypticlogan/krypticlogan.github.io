async function loadPost() {
    const content = document.querySelector('.devlog-content');

    try {
        const response = await fetch('post.html');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content.innerHTML = await response.text();
    } catch {
        content.innerHTML = '<p>Unable to load this post. <a href="post.html">Open the post directly</a>.</p>';
    }
}

loadPost();
