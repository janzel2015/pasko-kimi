// ============================================================
// api/checkout.js — gumagawa ng order + nagpapakita ng payment popup
// POST   /api/checkout          → create order (status: pending)
// GET    /api/checkout?orderId= → poll order status
// PATCH  /api/checkout          → {orderId, action:'simulate_pay'} (demo)
// ============================================================
import { getAdmin, json, handleError } from './_lib/supabase.js'

export default async function handler(req, res) {
  try {
    const supabase = getAdmin()

    if (req.method === 'POST') {
      const { name, ref, templateId, templateName, plan, price, paymentMethod, photoUrl, contact } = req.body || {}
      if (!plan || !price) return json(res, 400, { error: 'plan and price are required' })
      const { data, error } = await supabase.from('orders').insert({
        customer_name: name || 'Customer',
        contact: contact || '',
        template_id: templateId || null,
        template_name: templateName || '',
        plan, price, payment_method: paymentMethod || 'GCash',
        payment_ref: ref || '', photo_url: photoUrl || null,
        status: 'pending'
      }).select().single()
      if (error) throw error
      return json(res, 200, { orderId: data.id, status: data.status })
    }

    if (req.method === 'GET') {
      const orderId = req.query.orderId
      if (!orderId) return json(res, 400, { error: 'orderId required' })
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (error) throw error
      return json(res, 200, data)
    }

    if (req.method === 'PATCH') {
      const { orderId, action, payment_ref } = req.body || {}
      if (!orderId) return json(res, 400, { error: 'orderId required' })
      if (action === 'simulate_pay') {
        // ⚠️ DEMO ONLY — sa production, ito ang callback ng payment gateway
        const { data, error } = await supabase.from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', orderId).select().single()
        if (error) throw error
        return json(res, 200, { orderId, status: data.status })
      }
      if (payment_ref) {
        const { error } = await supabase.from('orders')
          .update({ payment_ref }).eq('id', orderId)
        if (error) throw error
      }
      return json(res, 200, { ok: true })
    }

    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) { handleError(res, err) }
}
