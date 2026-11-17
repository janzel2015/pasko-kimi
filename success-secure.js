// Token-protected tracking - uses delivery_token
async function loadStatus(){
  const p=new URLSearchParams(location.search);
  const code=p.get('code'); const token=p.get('token');
  const statusEl=document.getElementById('orderStatus')||document.getElementById('status')||document.getElementById('trackingStatus');
  const codeEl=document.getElementById('orderCode');
  if(codeEl&&code) codeEl.textContent=code;
  if(!code||!token){ if(statusEl) statusEl.innerHTML='<p style="color:red">Invalid link - use link from checkout</p>'; return; }
  try{
    const r=await fetch(`/api/customer/status?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`);
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||'Not found');
    if(statusEl){
      if(d.status==='pending') statusEl.innerHTML='<h3>? Waiting for ?entity-GCash¦canonical_name=GCash? verification</h3><p>Order '+d.order_code+' - we verify manually</p>';
      else if(d.status==='approved') statusEl.innerHTML='<h3>? Approved</h3><p>Your 5 Christmas portraits are being rendered on server...</p><p>Render: '+(d.render_status||'queued')+'</p>';
      else if(d.status==='completed'&&d.final_file_url) statusEl.innerHTML=`<h3>?? Ready!</h3><p>Package ${d.package}</p><a href="${d.final_file_url}" class="btn" download style="display:inline-block;padding:12px 24px;background:#0d4f3c;color:white;border-radius:8px;text-decoration:none">Download Your Portraits</a><p style="font-size:12px;color:#666;margin-top:8px">Link expires in 6 hours - you can return to this page to retry</p>`;
      else statusEl.innerHTML=`<p>Status: ${d.status}</p>`;
    }
  }catch(e){ if(statusEl) statusEl.innerHTML=`<p style="color:red">${e.message}</p>`; }
}
document.addEventListener('DOMContentLoaded', loadStatus);
