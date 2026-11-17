const els={loginScreen:document.getElementById('loginScreen'),dashboard:document.getElementById('dashboard'),loginInput:document.getElementById('adminKeyInput'),ordersList:document.getElementById('ordersList')};
async function api(p,o={}){ const r=await fetch(p,{...o,headers:{'Content-Type':'application/json',...(o.headers||{})},credentials:'include'}); if(r.status===401){ showLogin(); throw new Error('Unauthorized'); } const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error||'Failed'); return j; }
function showLogin(){ if(els.loginScreen) els.loginScreen.style.display='block'; if(els.dashboard) els.dashboard.style.display='none'; }
function showDashboard(){ if(els.loginScreen) els.loginScreen.style.display='none'; if(els.dashboard) els.dashboard.style.display='block'; }
async function checkSession(){ try{ const r=await fetch('/api/admin/session',{credentials:'include'}); const j=await r.json(); return j.authenticated; }catch{ return false; } }
async function login(){ const pwd=els.loginInput?.value?.trim(); if(!pwd) return alert('Enter admin key'); try{ await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:pwd})}); location.reload(); }catch{ alert('Maling password!'); } }
async function logout(){ await fetch('/api/admin/logout',{method:'POST',credentials:'include'}); location.reload(); }
window.login=login; window.logout=logout;
async function loadOrders(status,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  if(!els.ordersList) return;
  els.ordersList.innerHTML='<p>Loading...</p>';
  try{
    const d=await api(`/api/admin/orders?status=${status||''}`);
    const orders=Array.isArray(d)?d:(d.orders||d||[]);
    if(!orders.length){ els.ordersList.innerHTML='<p>No orders - status='+ (status||'all') +'</p>'; return; }
    els.ordersList.innerHTML='';
    orders.forEach(o=>{
      const div=document.createElement('div'); div.className='order-card';
      const esc=s=>(s||'').toString().replace(/</g,'&lt;');
      const photo=o.photo_url||o.photo_signed_url||'';
      const proof=o.payment_proof_url||o.payment_proof_signed_url||'';
      const safeProof=proof.startsWith('http')?proof:`#`;
      div.innerHTML=`<img src="${esc(photo)}" class="order-image" onerror="this.style.display='none'"><div class="order-details"><p><b>${esc(o.order_code)}</b> - ${esc(o.customer_name)} (${esc(o.contact_info)})</p><p>${esc(o.package)} - ${esc(o.status).toUpperCase()}</p><p style="font-size:12px;color:#666;">${new Date(o.created_at).toLocaleString()}</p>${proof?`<a href="${esc(safeProof)}" target="_blank">View GCash Proof</a>`:''}</div><div class="actions">${o.status==='pending'?`<button class="btn btn-approve" onclick="updateStatus('${o.id}','approved')">Approve</button>`:''}${o.status==='approved'?`<button class="btn btn-complete" onclick="startGenerate('${o.id}')">Generate 5 Portraits</button>`:''}<button class="btn btn-reject" onclick="updateStatus('${o.id}','rejected')">Reject</button>${o.status==='completed'?`<button class="btn" onclick="startGenerate('${o.id}')">Retry Render</button>`:''}</div>`;
      els.ordersList.appendChild(div);
    });
  }catch(e){ els.ordersList.innerHTML=`<p style="color:red">${e.message}</p>`; }
}
window.loadOrders=loadOrders;
async function updateStatus(id,st){ const notes=st==='rejected'?prompt('Reject reason:'):prompt('Notes:'); if(st==='rejected'&&notes===null) return; if(!confirm(`Mark as ${st}?`)) return; await api('/api/admin/update-status',{method:'POST',body:JSON.stringify({orderId:id,status:st,admin_notes:notes||''})}); loadOrders(st==='rejected'?'pending':st, document.querySelector('.tab-btn.active')); }
window.updateStatus=updateStatus;
async function startGenerate(id){ if(!confirm('Start AI rendering 5 Christmas templates? (P149 includes 30s MP4)')) return; try{ const r=await api('/api/admin/generate',{method:'POST',body:JSON.stringify({orderId:id})}); alert('Generated '+(r.generated||0)+'/5 portraits'); loadOrders('completed',document.querySelector('.tab-btn.active')); }catch(e){ alert('Generate failed: '+e.message); } }
window.startGenerate=startGenerate;
(async()=>{ const a=await checkSession(); if(a){ showDashboard(); const firstTab=document.querySelector('.tab-btn'); loadOrders('pending',firstTab); } else { showLogin(); } })();
