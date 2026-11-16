// ============================================================
// admin.js — CMS dashboard: login, settings, templates CRUD, orders
// ============================================================
const token = () => sessionStorage.getItem('ppm_admin') || localStorage.getItem('ppm_admin') || ''
const setToken = t => { localStorage.setItem('ppm_admin', t) }
const clearToken = () => { localStorage.removeItem('ppm_admin'); sessionStorage.removeItem('ppm_admin') }

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token(), ...(opts.headers || {}) }
  })
  if (res.status === 401) { showLogin(); throw new Error('Unauthorized') }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const $ = id => document.getElementById(id)
function showLogin() { $('loginView').style.display = 'block'; $('dashView').style.display = 'none' }
function showDash()  { $('loginView').style.display = 'none'; $('dashView').style.display = 'block'; loadAll() }

$('loginBtn').onclick = async () => {
  setToken($('adminToken').value.trim())
  try { await api('/api/admin/orders?stats=1'); showDash() }
  catch (e) { $('loginMsg').textContent = '✖ Wrong token. Try again.' }
}
$('logoutBtn').onclick = () => { clearToken(); location.reload() }

// Tabs
document.querySelectorAll('.tabs [data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs [data-tab]').forEach(x => x.classList.remove('active'))
  document.querySelectorAll('.tab-pane').forEach(x => x.classList.remove('active'))
  b.classList.add('active')
  $('tab-' + b.dataset.tab).classList.add('active')
})

// ---------- SETTINGS ----------
async function loadSettings() {
  const rows = await api('/api/admin/settings')
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
  const set = (id, v) => { if (v !== undefined) $(id).value = typeof v === 'object' ? JSON.stringify(v) : v }
  set('set_site_title', map.site_title)
  set('set_pricing_eyebrow', map.pricing_eyebrow)
  set('set_pricing_title', map.pricing_title)
  if (map.price_99)  { set('set_price_99_name', map.price_99.name);  set('set_price_99_detail', map.price_99.detail) }
  if (map.price_149) { set('set_price_149_name', map.price_149.name); set('set_price_149_detail', map.price_149.detail) }
  if (map.payment)   { set('set_payment_gcash', map.payment.gcash);  set('set_payment_maya', map.payment.maya) }
}

$('saveSettings').onclick = async () => {
  const puts = [
    ['site_title', $('set_site_title').value],
    ['pricing_eyebrow', $('set_pricing_eyebrow').value],
    ['pricing_title', $('set_pricing_title').value],
    ['price_99',  { name: $('set_price_99_name').value,  price: 99,  detail: $('set_price_99_detail').value }],
    ['price_149', { name: $('set_price_149_name').value, price: 149, detail: $('set_price_149_detail').value }],
    ['payment',   { gcash: $('set_payment_gcash').value, maya: $('set_payment_maya').value, name: 'Pasko Photo Magic' }]
  ]
  for (const [key, value] of puts) await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value }) })
  $('saveMsg').textContent = ' ✅ Saved! Nag-reflect na sa homepage.'
}

// ---------- TEMPLATES ----------
async function loadTemplates() {
  const list = await api('/api/admin/templates')
  $('tplList').innerHTML = list.filter(t => t.active).map(t => `
    <div class="admin-card"><div class="tpl-admin">
      <div>
        <b>${t.emoji || '✦'} ${t.name}</b>
        <input class="field" value="${t.name}" data-f="name" data-id="${t.id}">
        <input class="field" value="${t.emoji || ''}" data-f="emoji" data-id="${t.id}" placeholder="emoji">
        <input class="field" value="${t.sort_order}" data-f="sort_order" data-id="${t.id}" type="number" placeholder="sort order">
      </div>
      <div>
        <input class="field" value="${t.tagline || ''}" data-f="tagline" data-id="${t.id}" placeholder="tagline">
        <input class="field" value="${t.prompt || ''}" data-f="prompt" data-id="${t.id}" placeholder="AI prompt">
        <div class="row-btns">
          <button class="btn btn-green" onclick="saveTpl('${t.id}')">💾 Save</button>
          <button class="btn btn-outline" onclick="delTpl('${t.id}')">🗑 Remove</button>
        </div>
      </div>
    </div></div>`).join('')
}
window.saveTpl = async id => {
  const fields = {}
  document.querySelectorAll(`[data-id="${id}"]`).forEach(el => fields[el.dataset.f] = el.value)
  fields.sort_order = +fields.sort_order || 0
  await api('/api/admin/templates', { method: 'PUT', body: JSON.stringify({ id, ...fields }) })
  loadTemplates()
}
window.delTpl = async id => {
  if (!confirm('Remove this template?')) return
  await fetch('/api/admin/templates?id=' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token() } })
  loadTemplates()
}
$('addTpl').onclick = async () => {
  await api('/api/admin/templates', { method: 'POST', body: JSON.stringify({
    name: $('tpl_name').value, emoji: $('tpl_emoji').value,
    tagline: $('tpl_tagline').value, prompt: $('tpl_prompt').value,
    sort_order: 99, active: true
  })})
  ;['tpl_name', 'tpl_emoji', 'tpl_tagline', 'tpl_prompt'].forEach(i => $(i).value = '')
  loadTemplates()
}

// ---------- ORDERS ----------
async function loadOrders() {
  const [orders, stats] = await Promise.all([
    api('/api/admin/orders'), api('/api/admin/orders?stats=1')
  ])
  $('stTotal').textContent = stats.total
  $('stRevenue').textContent = '₱' + stats.revenue.toLocaleString()
  $('stPending').textContent = stats.pending
  $('stDone').textContent = stats.done
  $('ordersBody').innerHTML = orders.map(o => `
    <tr>
      <td><b>${o.customer_name}</b><br><small>${new Date(o.created_at).toLocaleDateString()}</small></td>
      <td>${o.template_name || '—'}</td>
      <td>${o.plan}<br><b>₱${o.price}</b></td>
      <td>${o.payment_method}</td>
      <td>${o.payment_ref || '—'}</td>
      <td><span class="badge st-${o.status}">${o.status}</span></td>
      <td><select onchange="setStatus('${o.id}', this.value)">
        ${['pending','paid','generating','done','failed','refunded'].map(s =>
          `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select></td>
    </tr>`).join('')
}
window.setStatus = (id, status) => api('/api/admin/orders', { method: 'PATCH', body: JSON.stringify({ id, status }) }).then(loadOrders)

function loadAll() { loadSettings(); loadTemplates(); loadOrders() }

// Auto-login kung may token
if (token()) api('/api/admin/orders?stats=1').then(showDash).catch(showLogin)
