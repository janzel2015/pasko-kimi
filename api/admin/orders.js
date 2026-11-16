// ============================================================
// api/admin/orders.js — Admin: orders + stats
// GET   /api/admin/orders?status=done
// PATCH /api/admin/orders  { id, status }   // paid/generating/done/refunded…
// GET   /api/admin/orders?stats=1          // { total, revenue, pending, done }
// ============================================================
import { getAdmin, requireAdmin, json, handleError } from '../_lib/supabase.js'

export default async function handler(req, res) {
  try {
    requireAdmin(req)
    const supabase = getAdmin()

    if (req.method === 'GET') {
      if (req.query.stats) {
        const { data: all, error } = await supabase.from('orders').select('status, price')
        if (error) throw error
        const paid = all.filter(o => ['paid', 'generating', 'done'].includes(o.status))
        return json(res, 200, {
          total: all.length,
          pending: all.filter(o => o.status === 'pending').length,
          done: all.filter(o => o.status === 'done').length,
          revenue: paid.reduce((s, o) => s + (+o.price || 0), 0)
        })
      }
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
      if (req.query.status) q = q.eq('status', req.query.status)
      const { data, error } = await q
      if (error) throw error
      return json(res, 200, data)
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body || {}
      if (!id || !status) return json(res, 400, { error: 'id and status required' })
      const patch = { status }
      if (status === 'paid') patch.paid_at = new Date().toISOString()
      const { error } = await supabase.from('orders').update(patch).eq('id', id)
      if (error) throw error
      return json(res, 200, { ok: true })
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) { handleError(res, err) }
}
