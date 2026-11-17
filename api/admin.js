const crypto = require('crypto');

function getSessionFromReq(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/admin_session=([^;]+)/);
  return match ? match[1] : null;
}

function verifySession(sessionValue) {
  const SECRET = process.env.ADMIN_SESSION_SECRET;
  if (!sessionValue || !SECRET) return false;
  const parts = sessionValue.split('.');
  if (parts.length !== 3) return false;
  const [token, expiry, sig] = parts;
  if (Date.now() > parseInt(expiry)) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(`${token}.${expiry}`).digest('hex');
  return sig === expected;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || '';
  console.log(`[ADMIN] action=${action} method=${req.method}`);

  // Session - NO DB, instant
  if (action === 'session') {
    const sess = getSessionFromReq(req);
    const ok = verifySession(sess);
    return res.json({ authenticated: ok });
  }

  // Login - NO DB, instant
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({error: 'POST only'});
    let body = req.body;
    if (!body) {
      try { body = JSON.parse(req.body || '{}'); } catch {}
    }
    // Vercel may need manual body parse
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const password = body?.password || '';
    const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH;
    const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
    if (!ADMIN_HASH || !SESSION_SECRET) return res.status(500).json({error: 'Admin env not set'});
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== ADMIN_HASH) return res.status(401).json({error: 'Invalid password'});
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 24*60*60*1000;
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(`${token}.${expiry}`).digest('hex');
    const cookieValue = `${token}.${expiry}.${signature}`;
    res.setHeader('Set-Cookie', `admin_session=${cookieValue}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
    return res.json({ success: true });
  }

  if (action === 'logout') {
    res.setHeader('Set-Cookie', `admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
    return res.json({ success: true });
  }

  // For orders and other actions, require auth
  const sess = getSessionFromReq(req);
  if (!verifySession(sess)) return res.status(401).json({error: 'Unauthorized'});

  // Orders - with timeout protection
  if (action === 'orders') {
    try {
      const { getSupabaseAdmin } = require('./_lib/supabase');
      const supabase = getSupabaseAdmin();
      const { status, stats } = req.query;
      
      if (stats === '1' || stats === 'true') {
        // Quick stats with timeout
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
        const query = supabase.from('orders').select('package,status');
        const { data: all } = await Promise.race([query, timeout]).catch(() => ({ data: [] }));
        const total = all?.length || 0;
        const pending = all?.filter(o=>o.status==='pending').length || 0;
        const completed = all?.filter(o=>o.status==='completed').length || 0;
        const revenue = (all?.filter(o=>o.status==='completed').reduce((s,o)=> s + (o.package==='P149'?149:99),0)) || 0;
        return res.json({ total, pending, completed, revenue });
      }
      
      let q = supabase.from('orders').select('*').order('created_at', {ascending: false}).limit(50);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) return res.status(500).json({error: error.message});
      return res.json(data);
    } catch (e) {
      console.error('[ADMIN orders]', e.message);
      return res.status(500).json({error: e.message});
    }
  }

  if (action === 'update-status') {
    try {
      const { getSupabaseAdmin } = require('./_lib/supabase');
      const supabase = getSupabaseAdmin();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      const { orderId, status } = body || {};
      if (!orderId || !status) return res.status(400).json({error: 'orderId and status required'});
      const { error } = await supabase.from('orders').update({status}).eq('id', orderId);
      if (error) return res.status(500).json({error: error.message});
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({error: e.message});
    }
  }

  if (action === 'generate') {
    try {
      const { getSupabaseAdmin } = require('./_lib/supabase');
      const supabase = getSupabaseAdmin();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      const { orderId } = body || {};
      if (!orderId) return res.status(400).json({error: 'orderId required'});
      const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (!order) return res.status(404).json({error: 'Order not found'});
      
      const MODEL_API_KEY = process.env.MODEL_API_KEY;
      if (!MODEL_API_KEY) return res.status(500).json({error: 'MODEL_API_KEY not set'});
      
      let provider;
      try { provider = require('./_lib/providers/real'); } catch { provider = require('./_lib/providers/real'); }
      
      const templates = ['parol-magic','noche-buena','snow-pinas','simbang-gabi','family-belen'];
      const results = [];
      for (let tpl of templates) {
        try {
          const gen = await provider.generateRealPortrait({ photoUrl: order.photo_url, templateId: tpl, customerName: order.customer_name, orderCode: order.order_code });
          results.push({template: tpl, url: gen.imageUrl, success: true});
        } catch (err) {
          results.push({template: tpl, error: err.message, success: false});
        }
      }
      
      const finalFileUrl = JSON.stringify({ portraits: results, slideshow: order.package === 'P149' ? `results/${order.order_code}/slideshow.mp4` : null });
      await supabase.from('orders').update({ status: 'completed', final_file_url: finalFileUrl }).eq('id', orderId);
      
      return res.json({ success: true, orderCode: order.order_code, generated: results.filter(r=>r.success).length, results, package: order.package, provider: 'real' });
    } catch (e) {
      console.error('[ADMIN generate]', e.message);
      return res.status(500).json({error: e.message});
    }
  }

  return res.status(400).json({error: 'Invalid action. Use ?action=login|logout|session|orders|update-status|generate'});
};
