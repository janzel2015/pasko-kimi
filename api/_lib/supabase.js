// api/_lib/supabase.js — shared server-side Supabase admin client
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getAdmin() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  // accept either name so your old deployments don't break
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) env vars'
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const expected =
    process.env.ADMIN_KEY ||
    process.env.ADMIN_TOKEN; // accept both names
  if (!expected || !token || token !== expected) {
    const e = new Error('Unauthorized');
    e.status = 401;
    throw e;
  }
}

export function json(res, status, body) {
  // Vercel supports res.status().json() — but statusCode + setHeader is safest
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function handleError(res, err) {
  console.error(err);
  json(res, err.status || 500, { error: err.message || 'Server error' });
}
