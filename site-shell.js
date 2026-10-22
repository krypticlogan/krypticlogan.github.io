async function attachFragment(element) {
    try {
        const response = await fetch(element.dataset.include);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        element.innerHTML = await response.text();
    } catch (error) {
        console.error(`Unable to load ${element.dataset.include}`, error);
    }
}

document.querySelectorAll('[data-include]').forEach(attachFragment);
