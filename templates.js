// ============================================================
// templates.js — i-render ang 5 Christmas styles galing Supabase
// ============================================================
import { getTemplates } from './supabase/client.js'

function slideHTML(t) {
  return `<article class="template-slide">
    ${t.image_url ? `<img src="${t.image_url}" alt="${t.name} Christmas portrait">` : ''}
    <div class="template-info">
      <h3>${t.emoji ? t.emoji + ' ' : ''}${t.name}</h3>
      <p>${t.tagline || t.description || ''}</p>
    </div>
  </article>`
}

export async function renderTemplates() {
  const templates = await getTemplates()

  // Carousel
  const track = document.querySelector('.template-track')
  if (track) track.innerHTML = templates.map(slideHTML).join('')

  // Style list (accordion)
  const list = document.querySelector('.style-list')
  if (list) {
    const icons = ['✿', '♟', '✦', '❋', '✧']
    const bgs = ['red-bg', 'green-bg', 'green-bg', 'gold-bg', 'red-bg']
    list.innerHTML = templates.map((t, i) => `<details>
      <summary>
        <span class="style-icon ${bgs[i % bgs.length]}">${icons[i % icons.length]}</span>
        <span><b>${t.name}</b><small>${t.tagline || ''}</small></span><i>›</i>
      </summary>
      <p>${t.description || t.tagline || ''}</p>
    </details>`).join('')
  }
  return templates
}
