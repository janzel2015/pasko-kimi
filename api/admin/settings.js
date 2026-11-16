// ============================================================
// api/admin/settings.js — Admin: edit page/title/prices
// GET  /api/admin/settings        (Bearer ADMIN_TOKEN)
// PUT  /api/admin/settings        { key, value }  → upsert
// ============================================================
import { getAdmin, requireAdmin, json, handleError } from '../_lib/supabase.js'

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getAdmin()

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error
      return json(res, 200, data)
    }

    if (req.method === 'PUT') {
      const { key, value } = req.body || {}
      if (!key) return json(res, 400, { error: 'key required' })
      const { data, error } = await supabase.from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .select().single()
      if (error) throw error
      return json(res, 200, data)
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) { handleError(res, err) }
}
