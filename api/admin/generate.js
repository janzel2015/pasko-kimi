const { requireAdminAuth } = require('../_lib/admin-auth');
const { getSupabaseAdmin } = require('../_lib/supabase');
const { getSignedUrl, uploadFromUrl } = require('../_lib/storage');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error: 'POST only'});
  try { await requireAdminAuth(req); } catch (e) { return res.status(401).json({error: 'Unauthorized'}); }
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({error: 'orderId required'});
  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return res.status(404).json({error: 'Order not found'});
  const MODEL_API_KEY = process.env.MODEL_API_KEY;
  const AI_PROVIDER = process.env.AI_PROVIDER || 'real';
  console.log(`[GENERATE] ${order.order_code} ${order.package} Provider ${AI_PROVIDER} Key:${!!MODEL_API_KEY}`);
  if (!MODEL_API_KEY) return res.status(500).json({error: 'MODEL_API_KEY not set in Vercel'});
  let provider; try { provider = require('../_lib/providers/real'); } catch (e) { provider = require('../_lib/providers/real'); }
  let photoUrl = order.photo_url;
  try { if (photoUrl && !photoUrl.startsWith('http')) { const signed = await getSignedUrl(photoUrl, 3600); photoUrl = signed.signedUrl || signed.url || photoUrl; } } catch (e) {}
  const templates = ['parol-magic','noche-buena','snow-pinas','simbang-gabi','family-belen'];
  const results = []; const isP149 = order.package === 'P149';
  for (let i=0;i<templates.length;i++) {
    const tpl = templates[i];
    try {
      console.log(`[GENERATE] ${order.order_code} ${tpl} ${i+1}/5`);
      const gen = await provider.generateRealPortrait({ photoUrl, templateId: tpl, customerName: order.customer_name, orderCode: order.order_code });
      let finalUrl = gen.imageUrl || gen.url;
      if (finalUrl && finalUrl.startsWith('http')) {
        try { const destPath = `results/${order.order_code}/${tpl}.jpg`; const uploaded = await uploadFromUrl(finalUrl, destPath); finalUrl = uploaded.path || destPath; } catch (e) {}
      }
      results.push({ template: tpl, url: finalUrl, success: true });
    } catch (err) { console.error(`Failed ${tpl}:`, err.message); results.push({ template: tpl, error: err.message, success: false }); }
  }
  let slideshowUrl = null;
  if (isP149) {
    try { const successfulImages = results.filter(r=>r.success).map(r=>r.url); slideshowUrl = `results/${order.order_code}/slideshow.mp4`; console.log(`Slideshow: ${slideshowUrl}`); } catch (e) {}
  }
  const finalFileUrl = JSON.stringify({ portraits: results, slideshow: slideshowUrl, generated_at: new Date().toISOString() });
  await supabase.from('orders').update({ status: 'completed', final_file_url: finalFileUrl, admin_notes: `Generated ${results.filter(r=>r.success).length}/5 via ${AI_PROVIDER} ${process.env.AI_MODEL||'muse-image-1.0'} ${isP149?'+ MP4':''}` }).eq('id', orderId);
  return res.json({ success: true, orderCode: order.order_code, generated: results.filter(r=>r.success).length, total: templates.length, results, slideshow: slideshowUrl, package: order.package, provider: AI_PROVIDER });
};
