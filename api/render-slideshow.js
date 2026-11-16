// ============================================================
// api/render-slideshow.js — server-side 30s MP4 para sa ₱149 plan
// POST /api/render-slideshow { orderId }
// Requirement: naka-install ang ffmpeg; npm: fluent-ffmpeg
// ============================================================
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { getAdmin, json, handleError } from './_lib/supabase.js'

// I-download ang image → local file para sa ffmpeg
async function downloadFile(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Download failed: ' + url)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
    const { orderId } = req.body || {}
    if (!orderId) return json(res, 400, { error: 'orderId required' })
    const supabase = getAdmin()

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (error || !order) return json(res, 404, { error: 'Order not found' })

    // ⛔ ₱149 lang ang may slideshow (Magic with Music)
    if (+order.price < 149) return json(res, 403, { error: 'Slideshow is for Magic with Music (₱149) packages only' })
    if (order.status !== 'done' || !order.result_urls?.length) {
      return json(res, 409, { error: 'Photos not ready yet — generate muna' })
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pasko-'))
    const files = []
    for (let i = 0; i < order.result_urls.length; i++) {
      const f = path.join(tmp, `img${i}.png`)
      await downloadFile(order.result_urls[i], f)
      files.push(f)
    }
    const out = path.join(tmp, 'slideshow.mp4')
    // 5 photos × 6s each = 30s, may crossfade; dagdagan ng audio:
    // .input('music.mp3') + .outputOptions(['-shortest','-c:a','aac'])
    await new Promise((resolve, reject) => {
      const cmd = ffmpeg()
      files.forEach(f => cmd.input(f).inputOptions(['-loop 1', '-t 6']))
      cmd
        .complexFilter(files.map((_, i) =>
          `[${i}:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,fade=t=in:st=0:d=0.5[v${i}]`).join(';'))
        .outputOptions(['-r 30', '-pix_fmt yuv420p', '-t 30'])
        .on('end', resolve).on('error', reject)
        .save(out)
    })

    // I-upload sa Supabase storage
    const storagePath = `slideshows/${orderId}.mp4`
    const { error: upErr } = await supabase.storage
      .from(process.env.STORAGE_BUCKET || 'photos')
      .upload(storagePath, fs.readFileSync(out), { contentType: 'video/mp4', upsert: true })
    if (upErr) throw upErr

    const { data: pub } = supabase.storage.from(process.env.STORAGE_BUCKET || 'photos').getPublicUrl(storagePath)
    await supabase.from('orders').update({ slideshow_url: pub.publicUrl }).eq('id', orderId)
    fs.rmSync(tmp, { recursive: true, force: true })
    return json(res, 200, { slideshowUrl: pub.publicUrl })
  } catch (err) { handleError(res, err) }
}
