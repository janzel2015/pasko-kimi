import { requireAdminAuth } from "../_lib/admin-auth.js";
import { getAdmin } from "../_lib/supabase.js";
export default async function handler(req,res){
  try{ requireAdminAuth(req); }catch{ return res.status(401).json({error:"Unauthorized"}); }
  try{
    const {path, isImage}=req.query||{};
    if(!path) return res.status(400).json({error:"path required"});
    const supabase=getAdmin();
    const bucket=process.env.SUPABASE_BUCKET_PRIVATE||"uploads";
    const {data, error}=await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if(error) throw error;
    return res.status(200).json({url:data.signedUrl, path});
  }catch(e){ return res.status(500).json({error:e.message}); }
}
