// ============================================================
// app.js — Pasko Photo Magic frontend logic
// nav, toast, FAQ, carousel, CMS settings, checkout modal flow
// ============================================================
import { getSettings, uploadPhoto, CONFIGURED } from './supabase/client.js'
import { renderTemplates } from './templates.js'

// ---------------- CMS SETTINGS → page ----------------
(async function applySettings() {
  const s = await getSettings()
  document.querySelectorAll('[data-setting]').forEach(el => {
    const v = s[el.dataset.setting]
    if (typeof v === 'string') el.textContent = v
  })
  if (document.title && s.site_title) document.title = s.site_title
  for (const key of ['99', '149']) {
    const p = s['price_' + key]
    if (!p) continue
    const priceEl = document.querySelector(`[data-price-for="${key}"]`)
    const nameEl  = document.querySelector(`[data-plan-name-for="${key}"]`)
    if (priceEl) priceEl.textContent = '₱' + p.price
    if (nameEl)  nameEl.textContent = p.name
    document.querySelectorAll(`.pay-opt[data-price="${key}"]`).forEach(b => {
      b.dataset.plan = `${p.name} — ₱${p.price}${key === '99' ? ' — No Music' : ''}`
      b.innerHTML = `<b>♫ Pasko Memories</b><br>₱${p.price} · ${p.name}<br><small>${p.detail}</small>`
    })
  }
  window.PASKO_PAYMENT = s.payment || {}
})()

// ---------------- MOBILE NAV ----------------
const menuToggle = document.getElementById('menuToggle')
const mobileMenu = document.getElementById('mobileMenu')
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open')
    menuToggle.setAttribute('aria-expanded', String(open))
  })
  mobileMenu.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open')
      menuToggle.setAttribute('aria-expanded', 'false')
    }))
}

// ---------------- HELP TOAST ----------------
const toast = document.getElementById('toast')
const helpButton = document.getElementById('helpButton')
let toastTimer
if (toast && helpButton) helpButton.addEventListener('click', () => {
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200)
})

// ---------------- FAQ: isang open lang ----------------
document.querySelectorAll('.faq-list details').forEach(item =>
  item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.faq-list details').forEach(o => {
      if (o !== item) o.open = false
    })
  }))

// ---------------- TEMPLATES + CAROUSEL ----------------
const state = {
  templates: [], selectedTpl: null, selectedTplId: null,
  plan: 'Basic Magic — ₱99 — No Music', price: '99', pay: 'GCash',
  photoDataUrl: null, photoUrl: null, orderId: null
}

function buildCarousel() {
  const track = document.querySelector('.template-track')
  const slides = [...document.querySelectorAll('.template-slide')]
  const dotsContainer = document.querySelector('.slide-dots')
  const nextButton = document.querySelector('.next')
  const prevButton = document.querySelector('.prev')
  if (!track || !slides.length || !dotsContainer) return

  dotsContainer.innerHTML = ''
  slides.forEach((slide, index) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.setAttribute('aria-label', `Go to Christmas style ${index + 1}`)
    dot.addEventListener('click', () => {
      const target = track.scrollLeft + slide.getBoundingClientRect().left -
        track.getBoundingClientRect().left - (track.clientWidth - slide.getBoundingClientRect().width) / 2
      track.scrollTo({ left: target, behavior: 'smooth' })
    })
    dotsContainer.appendChild(dot)
  })
  const dots = [...dotsContainer.children]

  function updateDots() {
    const center = track.getBoundingClientRect().left + track.clientWidth / 2
    let activeIndex = 0, shortest = Infinity
    slides.forEach((slide, index) => {
      const c = slide.getBoundingClientRect().left + slide.getBoundingClientRect().width / 2
      if (Math.abs(center - c) < shortest) { shortest = Math.abs(center - c); activeIndex = index }
    })
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === activeIndex)
      d.setAttribute('aria-current', i === activeIndex ? 'true' : 'false')
    })
  }
  const step = dir => {
    const gap = parseFloat(getComputedStyle(track).gap) || 0
    track.scrollBy({ left: dir * (slides[0].offsetWidth + gap), behavior: 'smooth' })
  }
  nextButton?.addEventListener('click', () => step(1))
  prevButton?.addEventListener('click', () => step(-1))
  track.addEventListener('scroll', updateDots, { passive: true })
  window.addEventListener('resize', updateDots)
  updateDots()
}

renderTemplates().then(t => { state.templates = t; buildCarousel() })

// ---------------- CHECKOUT MODAL ----------------
const modal = document.getElementById('checkoutModal')
function openCheckout(plan) {
  modal.classList.add('open')
  buildTplGrid()
  if (plan) document.querySelectorAll('.pay-opt').forEach(b => { if (b.dataset.price === plan) b.click() })
  goStep(1)
}
function closeCheckout() { modal.classList.remove('open') }

// Intercept lahat ng checkout.html links
document.querySelectorAll('a[href*="checkout.html"]').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault()
    openCheckout(new URL(a.href).searchParams.get('plan'))
  }))

document.getElementById('modalClose')?.addEventListener('click', closeCheckout)
modal?.addEventListener('click', e => { if (e.target === modal) closeCheckout() })

function goStep(n) {
  document.querySelectorAll('.order-step').forEach(s => s.classList.toggle('active', s.dataset.step == n))
  document.querySelectorAll('#stepper span').forEach(s => s.classList.toggle('active', s.dataset.step == n))
}
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => goStep(+b.dataset.goto)))
document.getElementById('toStep2')?.addEventListener('click', () => {
  if (!state.photoDataUrl) { alert('Please upload a photo muna 📸'); return }
  goStep(2)
})
document.getElementById('toStep3')?.addEventListener('click', () => {
  if (!state.selectedTpl) { alert('Please pick a Christmas style muna 🎄'); return }
  goStep(3)
})

// ---- Step 1: photo upload ----
const photoInput = document.getElementById('photoInput')
photoInput?.addEventListener('change', async e => {
  const f = e.target.files[0]
  if (!f) return
  document.getElementById('photoDropText').textContent = 'Uploading… ⏳'
  try {
    const { dataUrl } = await uploadPhoto(f)
    state.photoDataUrl = dataUrl
    const img = document.getElementById('previewImg')
    img.src = dataUrl; img.style.display = 'block'
    document.getElementById('photoName').textContent = 'Uploaded: ' + f.name
    document.getElementById('photoDropText').textContent = 'Photo ready! ✨ Tap to change'
  } catch (err) {
    document.getElementById('photoDropText').textContent = 'Upload failed — try again'
  }
})

// ---- Step 2: template grid ----
function buildTplGrid() {
  const grid = document.getElementById('tplGrid')
  if (!grid || grid.children.length) return
  state.templates.forEach(t => {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.tpl = t.name
    b.dataset.tplId = t.id || ''
    b.innerHTML = `<b>${t.emoji || '✦'} ${t.name}</b><small>${t.tagline || ''}</small>`
    b.addEventListener('click', () => {
      grid.querySelectorAll('button').forEach(x => x.classList.remove('selected'))
      b.classList.add('selected')
      state.selectedTpl = t.name
      state.selectedTplId = t.id || null
      document.getElementById('tplPicked').textContent = 'Selected: ' + t.name
    })
    grid.appendChild(b)
  })
}

// ---- Step 3: package + payment ----
document.querySelectorAll('.pay-opt').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.pay-opt').forEach(x => x.classList.remove('selected'))
  b.classList.add('selected')
  state.plan = b.dataset.plan
  state.price = b.dataset.price
}))
document.querySelectorAll('#payMethods button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#payMethods button').forEach(x => x.classList.remove('selected'))
  b.classList.add('selected')
  state.pay = b.textContent.trim()
}))

// ---- Step 4: order + payment + generate ----
const statusEl = () => document.getElementById('orderStatus')
const payBox = document.getElementById('payInstructions')

document.getElementById('submitOrder')?.addEventListener('click', async () => {
  if (!state.photoDataUrl) { alert('Photo is required 📸'); return }
  if (!state.selectedTpl)  { alert('Style is required 🎄'); return }
  const name = document.getElementById('custName').value.trim() || 'Customer'
  const ref  = document.getElementById('custRef').value.trim()
  goStep(4)
  payBox.textContent = 'Creating your order… ⏳'
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, ref, templateId: state.selectedTplId, templateName: state.selectedTpl,
        plan: state.plan, price: +state.price, paymentMethod: state.pay,
        photoUrl: state.photoDataUrl
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Order failed')
    state.orderId = data.orderId
    const pay = window.PASKO_PAYMENT || {}
    payBox.innerHTML =
      `Send <b>₱${state.price}</b> via <b>${state.pay}</b> to:<br>` +
      (state.pay === 'GCash' ? `GCash: <b>${pay.gcash || '0917 123 4567'}</b>` :
       state.pay === 'Maya'  ? `Maya: <b>${pay.maya || '0917 123 4567'}</b>` :
       `Card payment: <b>link sent via SMS/email</b>`) +
      `<br>Account name: <b>${pay.name || 'Pasko Photo Magic'}</b>` +
      (ref ? `<br>Ref: <b>${ref}</b>` : '<br>Then paste your ref no. back in Step 3 ✏️')
    statusEl().textContent = 'Order #' + data.orderId.slice(0, 8) + ' · status: ⏳ pending payment'
    startPolling()
  } catch (err) {
    payBox.textContent = '⚠️ ' + err.message + (CONFIGURED ? '' : ' (Supabase not configured — demo mode)')
  }
})

// Poll order status habang nakabukas ang modal
let pollTimer
function startPolling() {
  clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    if (!state.orderId) return
    try {
      const res = await fetch('/api/checkout?orderId=' + state.orderId)
      const o = await res.json()
      if (o.status === 'paid' || o.status === 'done' || o.status === 'generating') {
        clearInterval(pollTimer)
        document.getElementById('generateBtn').disabled = false
        statusEl().textContent = '✅ Payment received! Pindutin ang "Generate my photos" ✨'
        if (o.status === 'done') showResults(o)
      }
    } catch (_) {}
  }, 4000)
}

// Demo: mark as paid (para ma-test end-to-end nang walang tunay na bayad)
document.getElementById('demoPaid')?.addEventListener('click', async () => {
  if (!state.orderId) return
  await fetch('/api/checkout', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: state.orderId, action: 'simulate_pay' })
  })
  document.getElementById('generateBtn').disabled = false
  statusEl().textContent = '✅ (Demo) Payment received!'
})

// Generate — blocked ng server kung hindi PAID
document.getElementById('generateBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('generateBtn')
  btn.disabled = true
  statusEl().textContent = '🪄 Generating your 5 magical photos… (30–90s)'
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: state.orderId })
    })
    const data = await res.json()
    if (res.status === 402) { statusEl().textContent = '⚠️ Not paid yet — bayad muna bago magic!'; btn.disabled = false; return }
    if (!res.ok) throw new Error(data.error || 'Generation failed')
    showResults(data)
    if (+state.price >= 149) renderSlideshow()
  } catch (err) {
    statusEl().textContent = '⚠️ ' + err.message
    btn.disabled = false
  }
})

function showResults(o) {
  const grid = document.getElementById('resultGrid')
  const urls = o.result_urls || o.resultUrls || []
  grid.innerHTML = urls.map(u => `<div><img src="${u}" alt="Christmas portrait result"></div>`).join('')
  grid.style.display = 'grid'
  statusEl().textContent = `🎉 ${urls.length} magical photos ready! Salamat sa pag-order! ♥`
  if (o.slideshow_url) {
    const p = document.getElementById('slideshowLink')
    p.innerHTML = `🎬 Slideshow MP4: <a href="${o.slideshow_url}" target="_blank">download</a>`
    p.style.display = 'block'
  }
}

async function renderSlideshow() {
  try {
    const res = await fetch('/api/render-slideshow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: state.orderId })
    })
    const data = await res.json()
    if (res.ok) {
      document.getElementById('slideshowBtn').style.display = 'inline-flex'
      const p = document.getElementById('slideshowLink')
      p.innerHTML = `🎬 Slideshow MP4: <a href="${data.slideshowUrl}" target="_blank">download</a>`
      p.style.display = 'block'
    }
  } catch (_) {}
}
