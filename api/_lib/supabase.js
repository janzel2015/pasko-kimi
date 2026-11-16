// api/_lib/supabase.js — shared server-side Supabase admin client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY env vars')
  return createClient(url, key)
}

export function requireAdmin(req) {
  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    const e = new Error('Unauthorized — maling admin token')
    e.status = 401
    throw e
  }
}

export function json(res, status, body) {
  res.status(status).json(body)
}

export function handleError(res, err) {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
}
