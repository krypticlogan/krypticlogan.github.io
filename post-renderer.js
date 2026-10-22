async function renderPost() {
    const content = document.querySelector('[data-markdown]');

    try {
        const response = await fetch(content.dataset.markdown);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!window.marked) throw new Error('Markdown renderer unavailable');
        const source = await response.text();
        const body = source.startsWith('+++\n')
            ? source.replace(/^\+\+\+\n[\s\S]*?\n\+\+\+\n/, '').trimStart()
            : source;
        content.innerHTML = window.marked.parse(body);
    } catch (error) {
        console.error('Unable to render post', error);
        const message = document.createElement('p');
        const link = document.createElement('a');
        link.href = content.dataset.markdown;
        link.textContent = 'Open the Markdown';
        message.append('Unable to load this post. ', link, '.');
        content.replaceChildren(message);
    }
}

renderPost();
