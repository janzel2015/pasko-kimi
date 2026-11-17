const { getSupabaseAdmin } = require('./_lib/supabase');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error: 'POST only'});
  const { orderCode, images } = req.body || {};
  if (!orderCode || !images) return res.status(400).json({error: 'orderCode and images required'});
  console.log(`[SLIDESHOW] ${orderCode} ${images.length} images 30s MP4`);
  const manifest = { orderCode, images, duration: 30, music: true, created_at: new Date().toISOString(), mp4_url: `results/${orderCode}/slideshow.mp4` };
  return res.json({ success: true, url: manifest.mp4_url, slideshow_url: manifest.mp4_url, manifest });
};
