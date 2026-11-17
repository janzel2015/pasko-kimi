import { getAdmin } from "./_lib/supabase.js";
import { genOrderCode, genDeliveryToken } from "./_lib/tokens.js";
export const config={api:{bodyParser:{sizeLimit:"15mb"}}};
function parseBase64(dataUrl){
  const m=dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if(!m) throw new Error("Invalid image - use JPG/PNG/WEBP");
  return {mime:m[1], buffer:Buffer.from(m[3],"base64")};
}
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {customer_name, contact_info, package:pkg, photo_base64, payment_proof_base64}=req.body||{};
    if(!customer_name||customer_name.trim().length<2) return res.status(400).json({error:"Name required"});
    if(!contact_info) return res.status(400).json({error:"Contact required"});
    if(!photo_base64) return res.status(400).json({error:"Photo required"});
    if(!payment_proof_base64) return res.status(400).json({error:"GCash proof required"});
    const packageCode=pkg&&pkg.includes("149")?"P149":"P99";
    const photo=parseBase64(photo_base64);
    const proof=parseBase64(payment_proof_base64);
    const supabase=getAdmin();
    const order_code=genOrderCode();
    const delivery_token=genDeliveryToken();
    const ext1=photo.mime.split("/")[1].replace("jpeg","jpg");
    const ext2=proof.mime.split("/")[1].replace("jpeg","jpg");
    const photo_path=`orders/${order_code}/photo.${ext1}`;
    const proof_path=`orders/${order_code}/proof.${ext2}`;
    const bucket=process.env.SUPABASE_BUCKET_PRIVATE||"uploads";
    await supabase.storage.from(bucket).upload(photo_path, photo.buffer, {contentType:photo.mime, upsert:true});
    await supabase.storage.from(bucket).upload(proof_path, proof.buffer, {contentType:proof.mime, upsert:true});
    const {data, error}=await supabase.from("orders").insert({order_code, customer_name:customer_name.trim(), contact_info:contact_info.trim(), package:packageCode, photo_url:photo_path, payment_proof_url:proof_path, status:"pending", delivery_token, final_file_url:null}).select("id, order_code, delivery_token").single();
    if(error) throw error;
    return res.status(200).json({ok:true, order_code:data.order_code, delivery_token:data.delivery_token, tracking_url:`/success.html?code=${data.order_code}&token=${data.delivery_token}`});
  }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
}
