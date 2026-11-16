// ============================================================
// slideshow.js — ₱149 30s MP4 preview player
// Kinukuha ang order/results sa localStorage (demo) o ?order= sa server
// ============================================================
const params = new URLSearchParams(location.search)
const orderId = params.get('order')
let photos = []

async function load() {
  if (orderId) {
    try {
      const res = await fetch('/api/checkout?orderId=' + orderId)
      const o = await res.json()
      photos = o.result_urls || []
    } catch (_) {}
  }
  if (!photos.length) {
    try { photos = JSON.parse(localStorage.getItem('ppm_results') || '[]') } catch (_) {}
  }
  const box = document.getElementById('slides')
  if (!photos.length) {
    box.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#f4dca4;font-family:Georgia">Generate your photos first! 🎄</div>'
    return
  }
  box.innerHTML = photos.map((u, i) => `<img src="${u}" alt="Christmas photo ${i + 1}" ${i === 0 ? 'class="on"' : ''}>`).join('')
}
load()

// 5 photos × 6s = 30s total
let idx = 0, timer, playing = false
const imgs = () => [...document.querySelectorAll('#slides img')]

function show(i) {
  imgs().forEach((im, j) => im.classList.toggle('on', j === i))
}
function tick() {
  idx = (idx + 1) % photos.length
  show(idx)
}
function setProgress() {
  const el = document.getElementById('progress')
  const start = Date.now()
  setInterval(() => {
    if (!playing) return
    el.style.width = Math.min(100, ((Date.now() - start) % 30000) / 300) + '%'
  }, 200)
}
setProgress()

document.getElementById('playBtn').onclick = e => {
  if (playing) { clearInterval(timer); playing = false; e.target.textContent = '▶ Play'; return }
  playing = true
  e.target.textContent = '⏸ Pause'
  timer = setInterval(tick, 6000)
}
document.getElementById('musicBtn').onclick = e => {
  const on = e.target.textContent.includes('Off')
  e.target.textContent = on ? '🔔 Music: On' : '🔔 Music: Off'
  // TODO: i-play ang Christmas music track kapag naka-serve ang MP4
}
