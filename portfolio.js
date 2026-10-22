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
    if (safeHttps(data.cover)) {
      cover.onerror = () => { cover.hidden = true; document.querySelector('.album-placeholder').hidden = false; };
      cover.onload = () => { cover.hidden = false; document.querySelector('.album-placeholder').hidden = true; };
      if (cover.getAttribute('src') !== data.cover) cover.src = data.cover;
    } else { cover.hidden = true; document.querySelector('.album-placeholder').hidden = false; }
  } catch {
    track.textContent = 'Nothing on the turntable';
    track.removeAttribute('href');
    artist.textContent = 'Music would be here, but its unavailable now.';
    label.textContent = 'Spotify';
    note.textContent = '';
    cover.hidden = true;
    document.querySelector('.album-placeholder').hidden = false;
  }
}
updateMusic();
setInterval(updateMusic, 60000);
