import { getSessionFromReq, verifySessionToken } from '../_lib/admin-auth.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const token=getSessionFromReq(req);
  const payload=verifySessionToken(token);
  return res.status(200).json({authenticated:!!payload});
}
