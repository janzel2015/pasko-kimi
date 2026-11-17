import { getAdmin } from "../_lib/supabase.js";
export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const {code, token}=req.query||{};
    if(!code||!token) return res.status(400).json({error:"Missing code or token"});
    const supabase=getAdmin();
    const {data:order, error}=await supabase.from("orders").select("*").eq("order_code", code).eq("delivery_token", token).single();
    if(error||!order) return res.status(404).json({error:"Order not found"});
    let finalUrl=null;
    if(order.status==="completed"&&order.final_file_url){
      try{
        const bucket=process.env.SUPABASE_BUCKET_RESULTS||process.env.SUPABASE_BUCKET_PRIVATE||"uploads";
        const {data}=await supabase.storage.from(bucket).createSignedUrl(order.final_file_url, 3600*6);
        finalUrl=data?.signedUrl||null;
      }catch{}
    }
    return res.status(200).json({order_code:order.order_code, status:order.status, package:order.package, customer_name:order.customer_name, created_at:order.created_at, render_status:order.render_status||null, final_file_url:finalUrl});
  }catch(e){ return res.status(500).json({error:e.message}); }
}
