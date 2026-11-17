import { createSessionToken, setSessionCookie, verifyAdminPassword } from '../_lib/admin-auth.js';
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {password}=req.body||{};
    if(!password) return res.status(400).json({error:'Password required'});
    const ok=await verifyAdminPassword(password);
    if(!ok) return res.status(401).json({error:'Invalid password'});
    const token=createSessionToken();
    setSessionCookie(res,token);
    return res.status(200).json({ok:true});
  }catch(e){
    console.error(e);
    return res.status(500).json({error:'Login failed'});
  }
}
