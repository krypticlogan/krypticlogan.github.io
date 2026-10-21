// The scheduled Spotify workflow publishes a snapshot, never client credentials.
const track = document.querySelector('#track-link');
const artist = document.querySelector('#track-artist');
const label = document.querySelector('#music-label');
const note = document.querySelector('#music-note');
const cover = document.querySelector('#album-cover');
const safeHttps = value => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
};
async function updateMusic() {
  try {
    const response = await fetch('/now-playing.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Music feed unavailable');
    const data = await response.json();
    if (!data.title) throw new Error('No track');
    track.textContent = data.title;
    artist.textContent = data.artist || 'Unknown artist';
    const url = safeHttps(data.url);
    if (url) { track.href = url; track.target = '_blank'; track.rel = 'noopener noreferrer'; }
    else track.removeAttribute('href');
    const age = Date.now() - Date.parse(data.updatedAt);
    const fresh = Number.isFinite(age) && age >= -60000 && age < 20 * 60 * 1000;
    label.textContent = data.isPlaying && fresh ? 'Listening now' : 'On repeat';
    note.textContent = fresh ? 'Latest scheduled Spotify update' : 'Last available Spotify snapshot';
    if (safeHttps(data.cover)) {
      cover.onerror = () => { cover.hidden = true; document.querySelector('.album-placeholder').hidden = false; };
      cover.onload = () => { cover.hidden = false; document.querySelector('.album-placeholder').hidden = true; };
      if (cover.getAttribute('src') !== data.cover) cover.src = data.cover;
    } else { cover.hidden = true; document.querySelector('.album-placeholder').hidden = false; }
  } catch {
    track.textContent = 'Nothing on the turntable';
    track.removeAttribute('href');
    artist.textContent = 'Music will show up here when available.';
    label.textContent = 'Spotify';
    note.textContent = 'Taking a quiet moment';
    cover.hidden = true;
    document.querySelector('.album-placeholder').hidden = false;
  }
}
updateMusic();
setInterval(updateMusic, 60000);
// Posts are ordinary HTML pages. The manifest supplies homepage previews.
async function updatePosts() {
  try {
    const response = await fetch('/posts/posts.json');
    if (!response.ok) return;
    const posts = await response.json();
    if (!Array.isArray(posts) || !posts.length) return;
    const cards = posts.map(post => {
      if (!/^[a-z0-9-]+$/.test(post.slug)) throw new Error('Invalid post slug');
      const a = document.createElement('a'); a.className = 'post-card'; a.href = `/posts/${post.slug}/`;
      const time = document.createElement('time'); time.dateTime = post.date; time.textContent = post.label || post.date;
      const title = document.createElement('h3'); title.textContent = post.title;
      const arrow = document.createElement('span'); arrow.textContent = '↗'; title.append(arrow);
      const blurb = document.createElement('p'); blurb.textContent = post.blurb;
      const read = document.createElement('span'); read.className = 'read-link'; read.textContent = 'Read notes →';
      a.append(time, title, blurb, read); return a;
    });
    const panel = document.querySelector('.posts-scroll');
    panel.querySelectorAll('.post-card').forEach(card => card.remove());
    panel.prepend(...cards);
  } catch { /* Keep the server-rendered archive links if the feed is unavailable. */ }
}
updatePosts();
