cd "I:\---Clone---\Chatgpt\pasko-kimi-patch"

Set-Content api\admin\orders.js @'
import { requireAdminAuth } from '../_lib/admin-auth.js';
import { getAdmin } from '../_lib/supabase.js';
import { createSignedUrl, PRIVATE_BUCKET } from '../_lib/storage.js';

export default async function handler(req,res){
  try{ requireAdminAuth(req); }catch{ return res.status(401).json({error:'Unauthorized - login again'}); }
  if(req.method==='GET'){
    try{
      const {status, stats}=req.query||{};
      const supabase=getAdmin();
      if(stats){
        const {data:all, error}=await supabase.from('orders').select('status, package');
        if(error) throw error;
        const completed=all.filter(o=>o.status==='completed').length;
        const pending=all.filter(o=>o.status==='pending').length;
        const approved=all.filter(o=>o.status==='approved').length;
        const revenue=all.filter(o=>['approved','completed'].includes(o.status)).reduce((s,o)=>s+(o.package==='P149'?149:99),0);
        return res.status(200).json({total:all.length, pending, approved, completed, revenue});
      }
      let q=supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(200);
      if(status) q=q.eq('status', status);
      const {data, error}=await q;
      if(error) throw error;
      const enriched=await Promise.all((data||[]).map(async (o)=>{
        let proofUrl=null, photoUrl=null;
        try{ if(o.payment_proof_url) proofUrl=await createSignedUrl(o.payment_proof_url, 3600*2, PRIVATE_BUCKET); }catch{}
        try{ if(o.photo_url) photoUrl=await createSignedUrl(o.photo_url, 3600*2, PRIVATE_BUCKET); }catch{}
        return {...o, proof_signed_url:proofUrl, photo_signed_url:photoUrl};
      }));
      return res.status(200).json(enriched.length?enriched:{orders:enriched});
    }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
  }
  if(req.method==='PATCH'){
    try{
      const {id, status}=req.body||{};
      if(!id||!status) return res.status(400).json({error:'id and status required'});
      if(!['pending','approved','rejected','completed'].includes(status)) return res.status(400).json({error:'Invalid status - use pending/approved/rejected/completed'});
      const supabase=getAdmin();
      const patch={status};
      const {error}=await supabase.from('orders').update(patch).eq('id', id);
      if(error) throw error;
      return res.status(200).json({ok:true});
    }catch(e){ return res.status(500).json({error:e.message}); }
  }
  return res.status(405).json({error:'Method not allowed'});
}
'@

# Also fix _lib/supabase.js to have getAdmin only - remove old requireAdmin
Get-Content api\_lib\supabase.js

node --check api/admin/orders.js

git add api/admin/orders.js
git commit -m "fix: secure admin orders - use HttpOnly auth, signed URLs, correct status enum"
git push origin main
