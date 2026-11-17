// Secure checkout - no direct Supabase, uses server /api/checkout with private storage
function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}
async function handleSecureCheckout(e){
  e.preventDefault();
  const btn=e.target.querySelector('button[type="submit"]');
  const orig=btn?btn.textContent:'';
  try{
    if(btn){ btn.disabled=true; btn.textContent='Uploading... Please wait'; }
    const nameEl=document.getElementById('customer_name')||document.getElementById('name')||document.querySelector('[name="customer_name"]');
    const contactEl=document.getElementById('contact_info')||document.getElementById('contact')||document.querySelector('[name="contact_info"]');
    const pkgEl=document.getElementById('package')||document.querySelector('[name="package"]:checked')||document.querySelector('[name="package"]');
    const photoEl=document.getElementById('photo')||document.querySelector('[name="photo"]');
    const proofEl=document.getElementById('payment_proof')||document.getElementById('gcash_proof')||document.querySelector('[name="payment_proof"]');
    const customer_name=nameEl?.value?.trim();
    const contact_info=contactEl?.value?.trim();
    const pkg=pkgEl?.value||'P99';
    const photoFile=photoEl?.files?.[0];
    const proofFile=proofEl?.files?.[0];
    if(!customer_name||customer_name.length<2) throw new Error('Name required');
    if(!contact_info||contact_info.length<5) throw new Error('Contact required');
    if(!photoFile) throw new Error('Upload your photo');
    if(!proofFile) throw new Error('Upload ?entity-GCash¦canonical_name=GCash? proof');
    if(photoFile.size>10*1024*1024) throw new Error('Photo too large - max 10MB');
    if(proofFile.size>10*1024*1024) throw new Error('Proof too large');
    const photo_base64=await fileToBase64(photoFile);
    const payment_proof_base64=await fileToBase64(proofFile);
    const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_name,contact_info,package:pkg,photo_base64,payment_proof_base64})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Checkout failed');
    window.location.href=data.tracking_url;
  }catch(err){
    alert(err.message);
    if(btn){ btn.disabled=false; btn.textContent=orig; }
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('form').forEach(f=>{
    if(f.id==='checkoutForm'||f.action.includes('checkout')||f.querySelector('#photo')){
      f.addEventListener('submit', handleSecureCheckout);
    }
  });
});
