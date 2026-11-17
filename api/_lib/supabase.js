// api/_lib/supabase.js — shared server-side Supabase admin client
import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

export function getAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL;
  // Accept either the new or legacy variable name for safety
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY env vars');
  }

  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false } // Prevents memory leaks in serverless
  });
  
  return supabaseAdmin;
}

export function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  
  // Accepts either ADMIN_TOKEN or ADMIN_KEY to match your frontend
  const expected = process.env.ADMIN_TOKEN || process.env.ADMIN_KEY;
  
  if (!expected || !token || token !== expected) {
    const e = new Error('Unauthorized — maling admin token');
    e.status = 401;
    throw e;
  }
}

export function json(res, status, body) {
  // Uses statusCode for maximum Vercel compatibility
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function handleError(res, err) {
  console.error('API Error:', err);
  const status = err.status || 500;
  json(res, status, { error: err.message || 'Server error' });
}
