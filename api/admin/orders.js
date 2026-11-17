import { requireAdminAuth } from "../_lib/admin-auth.js";
import { getAdmin } from "../_lib/supabase.js";
export default async function handler(req,res){
  try{ requireAdminAuth(req); }catch(e){ return res.status(401).json({error:"Unauthorized - "+e.message}); }
  try{
    const supabase=getAdmin();
    const {status}=req.query||{};
    let q=supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(200);
    if(status) q=q.eq("status", status);
    const {data, error}=await q;
    if(error) throw error;
    return res.status(200).json(data||[]);
  }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
}
