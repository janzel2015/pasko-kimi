// ============================================================
// api/generate.js — AI photo generation
// ⛔ BLOCKED kung ang order ay hindi PAID
// POST /api/generate { orderId }
// Kung may AI_API_KEY: tumatawag sa AI_PROVIDER (Replicate SDXL etc.)
// Kung wala: 5 placeholder portraits (gradient + overlay) — demo mode
// ============================================================
import { getAdmin, json, handleError } from './_lib/supabase.js'

// Demo placeholder — kapag walang AI key, ito ang output
function placeholderPortrait(name, i) {
  const hues = [350, 140, 45, 20, 275]
  const h = hues[i % hues.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h},60%,25%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360},70%,45%)"/>
    </linearGradient></defs>
    <rect width="600" height="800" fill="url(#g)"/>
    <text x="300" y="360" font-size="90" text-anchor="middle">🎄</text>
    <text x="300" y="450" font-size="34" text-anchor="middle" fill="#fff" font-family="Georgia">${name}</text>
    <text x="300" y="500" font-size="20" text-anchor="middle" fill="#f4dca4" font-family="Georgia">Pasko Photo Magic ✦ Demo</text>
  </svg>`
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
}

async function generateWithAI(order, template) {
  // Halimbawa gamit ang Replicate:
  // const replicate = new Replicate({ auth: process.env.AI_API_KEY })
  // const output = await replicate.run(process.env.AI_MODEL, { input: {
  //   prompt: `${template?.prompt || 'Christmas portrait'}, photorealistic, festive`,
  //   image: order.photo_url  // img2img gamit ang uploaded photo
  // }})
  // return Array.isArray(output) ? output : [output]
  throw new Error('AI_PROVIDER not implemented — lagay ang AI_API_KEY o gamitin ang demo mode')
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
    const { orderId } = req.body || {}
    if (!orderId) return json(res, 400, { error: 'orderId required' })
    const supabase = getAdmin()

    // 1. Kunin ang order
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (error || !order) return json(res, 404, { error: 'Order not found' })

    // 2. ⛔ GATE: blocked kung hindi PAID
    if (order.status === 'pending' || order.status === 'refunded') {
      return json(res, 402, { error: 'Payment required — bayad muna bago generate!' })
    }
    if (order.status === 'done' && order.result_urls?.length) {
      return json(res, 200, order) // idempotent: may results na
    }

    // 3. Mark as generating
    await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

    // 4. Generate
    let resultUrls
    const { data: tpl } = await supabase.from('templates').select('*').eq('id', order.template_id).single()
    try {
      if (process.env.AI_API_KEY) {
        resultUrls = await generateWithAI(order, tpl)
      } else {
        resultUrls = Array.from({ length: 5 }, (_, i) => placeholderPortrait(order.template_name || 'Christmas', i))
      }
    } catch (genErr) {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      throw genErr
    }

    // 5. I-save ang results
    const { data: updated, error: upErr } = await supabase.from('orders')
      .update({ status: 'done', result_urls: resultUrls })
      .eq('id', orderId).select().single()
    if (upErr) throw upErr
    return json(res, 200, updated)
  } catch (err) { handleError(res, err) }
}
