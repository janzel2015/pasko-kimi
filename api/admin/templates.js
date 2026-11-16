// ============================================================
// api/admin/templates.js — Admin: CRUD templates
// GET    /api/admin/templates
// POST   /api/admin/templates          { name, emoji, tagline, description, image_url, prompt, sort_order }
// PUT    /api/admin/templates          { id, ...fields }
// DELETE /api/admin/templates?id=xxx   (soft delete: active=false)
// ============================================================
import { getAdmin, requireAdmin, json, handleError } from '../_lib/supabase.js'

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getAdmin()

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('templates').select('*').order('sort_order')
      if (error) throw error
      return json(res, 200, data)
    }
    if (req.method === 'POST') {
      const { error } = await supabase.from('templates').insert(req.body)
      if (error) throw error
      return json(res, 201, { ok: true })
    }
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body || {}
      if (!id) return json(res, 400, { error: 'id required' })
      const { error } = await supabase.from('templates').update(fields).eq('id', id)
      if (error) throw error
      return json(res, 200, { ok: true })
    }
    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return json(res, 400, { error: 'id required' })
      const { error } = await supabase.from('templates').update({ active: false }).eq('id', id)
      if (error) throw error
      return json(res, 200, { ok: true })
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) { handleError(res, err) }
}
