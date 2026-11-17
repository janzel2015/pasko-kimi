import { RealAIProvider } from "./providers/real.js";
export const TEMPLATES=[
  {id:'parol-magic', prompt:'Beautiful Filipino Christmas with glowing parol lanterns, warm festive lights'},
  {id:'noche-buena', prompt:'Cozy Noche Buena Christmas dinner, warm Filipino home, Christmas feast'},
  {id:'snow-pinas', prompt:'Magical snow in Philippines, Christmas sweater, snowflakes, winter wonderland'},
  {id:'simbang-gabi', prompt:'Simbang Gabi church dawn, candles, elegant Filipino Christmas'},
  {id:'family-belen', prompt:'Beautiful Belen nativity, Christmas family portrait, warm glow'}
];
export async function renderFivePortraits({imageBuffer}){
  const provider=new RealAIProvider();
  const results=[];
  for(const tpl of TEMPLATES){
    try{
      const r=await provider.generate({imageBuffer, prompt:tpl.prompt, templateId:tpl.id});
      results.push({templateId:tpl.id, buffer:r.buffer, provider:r.provider});
      await new Promise(res=>setTimeout(res,1500));
    }catch(e){
      console.error(`Template ${tpl.id} error:`, e.message);
      results.push({templateId:tpl.id, error:e.message, buffer:null});
    }
  }
  const success=results.filter(r=>r.buffer).length;
  if(success===0) throw new Error('All 5 templates failed - check Vercel logs for Meta API error. Ensure MODEL_API_KEY valid and has billing.');
  return results;
}
