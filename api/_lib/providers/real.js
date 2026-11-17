export class RealAIProvider {
  constructor(){ this.name='meta-muse-image'; }
  async generate({imageBuffer, prompt, templateId}){
    const apiKey=process.env.MODEL_API_KEY;
    if(!apiKey) throw new Error('MODEL_API_KEY missing in Vercel');

    const apiUrl=process.env.MODEL_API_URL||'https://api.meta.ai/v1/responses';
    const model=process.env.AI_MODEL||'muse-image-1.0';

    console.log(`[AI] ${templateId} - Calling ${model} at ${apiUrl}`);

    // For image-to-image, we need to include reference image
    // ?entity-Meta¦canonical_name=Meta? API supports multi-modal input
    const base64Image=imageBuffer.toString('base64');

    const payload={
      model: model,
      input:[
        {
          type:'message',
          role:'user',
          content:[
            {
              type:'input_text',
              text: `${prompt}, Filipino Christmas portrait, same person as reference, keep facial identity, high quality, 4k, warm festive lighting, professional photography, Christmas costume, Pasko Photo Magic style`
            },
            {
              type:'input_image',
              image_url: `data:image/jpeg;base64,${base64Image}`
            }
          ]
        }
      ]
    };

    try{
      const res=await fetch(apiUrl,{
        method:'POST',
        headers:{
          'Authorization':`Bearer ${apiKey}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify(payload)
      });

      const data=await res.json();

      if(!res.ok){
        console.error('Meta API Error:', JSON.stringify(data).substring(0,1000));
        throw new Error(data.error?.message||data.message||JSON.stringify(data).substring(0,300));
      }

      console.log(`[AI] ${templateId} response keys:`, Object.keys(data));

      // Response includes base64 image bytes in image_generation_
      let buffer=null;

      // Try different response formats
      if(data.output){
        for(const out of data.output){
          if(out.type==='image_generation'&&out.result){
            buffer=Buffer.from(out.result,'base64');
            break;
          }
          if(out.content){
            for(const c of out.content){
              if(c.type==='image_generation'&&c.result){
                buffer=Buffer.from(c.result,'base64');
                break;
              }
              if(c.type==='image'&&c.image_url){
                const r=await fetch(c.image_url);
                buffer=Buffer.from(await r.arrayBuffer());
                break;
              }
            }
          }
        }
      }

      // Fallback: check image_generation_ field
      if(!buffer&&data.image_generation_){
        buffer=Buffer.from(data.image_generation_,'base64');
      }
      if(!buffer&&data.data?.[0]?.b64_json){
        buffer=Buffer.from(data.data[0].b64_json,'base64');
      }

      if(!buffer){
        console.error('Full response:', JSON.stringify(data).substring(0,2000));
        throw new Error('No image returned - check logs');
      }

      console.log(`[AI] ${templateId} success ${buffer.length} bytes`);
      return {provider:model, buffer};

    }catch(e){
      console.error(`[AI] ${templateId} failed:`, e.message);
      throw e;
    }
  }
}
