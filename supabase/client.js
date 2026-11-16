// ============================================================
// Pasko Photo Magic — Frontend Supabase client
// i-set ang window.PASKO_SUPABASE_URL / ANON_KEY sa index.html
// o i-fill ang defaults sa ibaba pagkatapos ng `supabase/schema.sql`
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = window.https://vllqavcfqydtscbdrcex.supabase.co || 'https://YOUR-PROJECT.supabase.co'
const SUPABASE_ANON_KEY = window.sb_publishable_00WuqggovnPv7Kve34jdag_PjYzPtO7 || 'YOUR-ANON-KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const CONFIGURED = !SUPABASE_URL.includes('pasko-ai')

// ---------- CMS SETTINGS ----------
export const DEFAULT_SETTINGS = {
  site_title: 'Pasko Photo Magic — Old Foto, Magical Xmas!',
  pricing_eyebrow: '✦ BESTSELLER THIS SEASON',
  pricing_title: 'Five joyful portraits',
  price_99:  { name: 'Basic Magic',      price: 99,  detail: '1 Photo Package · 5 Christmas Portraits · No Music' },
  price_149: { name: 'Magic with Music', price: 149, detail: '1 Photo Package · 5 Portraits & Music' },
  payment:   { gcash: '0917 123 4567', maya: '0917 123 4567', name: 'Pasko Photo Magic' }
}

export async function getSettings() {
  if (!CONFIGURED) return { ...DEFAULT_SETTINGS }
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error || !data) return { ...DEFAULT_SETTINGS }
  const out = { ...DEFAULT_SETTINGS }
  for (const row of data) out[row.key] = row.value
  return out
}

// ---------- TEMPLATES ----------
export const DEFAULT_TEMPLATES = [
  { id: 't1', name: 'Binibining Gabi ❤️',          tagline: 'Elegant Christmas portraits with a festive glow.' },
  { id: 't2', name: 'Sweater Weather 🎄',          tagline: 'Cozy outfits and heartwarming holiday vibes.' },
  { id: 't3', name: 'Bright Celebration ⭐',       tagline: 'Bright colors and cheerful Christmas energy.' },
  { id: 't4', name: 'Traditional / Bahay Kubo 🏡', tagline: 'Rustic, nostalgic Filipino Christmas.' },
  { id: 't5', name: 'Christmas Elegance ✨',       tagline: 'Classic holiday glamour and timeless portraits.' }
]

export async function getTemplates() {
  if (!CONFIGURED) return DEFAULT_TEMPLATES
  const { data, error } = await supabase
    .from('templates').select('*')
    .eq('active', true).order('sort_order')
  if (error || !data?.length) return DEFAULT_TEMPLATES
  return data
}

// ---------- PHOTO UPLOAD (storage bucket 'photos') ----------
export async function uploadPhoto(file) {
  if (!CONFIGURED) {
    // demo mode: dataURL lang, sagip sa localStorage
    const dataUrl = await new Promise(res => {
      const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file)
    })
    try { localStorage.setItem('ppm_photo', dataUrl); localStorage.setItem('ppm_photo_name', file.name) } catch (_) {}
    return { path: null, dataUrl }
  }
  const path = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
  const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return { path: data.publicUrl, dataUrl: data.publicUrl }
}
