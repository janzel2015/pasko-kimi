# 🎄 Pasko Photo Magic

Old foto, bagong saya ng Pasko! AI Christmas portraits — ₱99 Basic / ₱149 Magic with Music.

## Structure
```
pasko-photo-ai/
├── admin.html / admin.js        # CMS Dashboard (login + Settings/Templates/Orders tabs)
├── index.html                   # Frontend (nagbabasa ng Supabase settings)
├── slideshow.html / slideshow.js# ₱149 30s slideshow player
├── templates.js / app.js        # Frontend logic (carousel, checkout modal, CMS binding)
├── styles.css
├── supabase/
│   ├── schema.sql               # Full DB schema — i-paste sa Supabase SQL Editor
│   ├── client.js                # Frontend Supabase client
│   └── .env.supabase.example    # Kopyahin → .env.local, i-fill ang values
├── api/
│   ├── generate.js              # AI, ⛔ BLOCKED kung order ay hindi PAID
│   ├── checkout.js              # Gumagawa ng order + payment instructions (GCash/Maya)
│   ├── render-slideshow.js      # Server-side 30s MP4 (ffmpeg)
│   └── admin/
│       ├── settings.js          # Admin: edit page/title/prices
│       ├── templates.js         # Admin: CRUD templates
│       └── orders.js            # Admin: orders + stats
```

## Setup (Vercel + Supabase)

1. **Supabase**: gumawa ng project → SQL Editor → i-paste ang buong `supabase/schema.sql` → Run.
2. **Env vars** (Vercel → Settings → Environment Variables, o `.env.local` para sa `vercel dev`):
   kopyahin ang `supabase/.env.supabase.example` at i-fill:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` → ilagay din sa `index.html`:
     ```html
     <script>window.PASKO_SUPABASE_URL="..."; window.PASKO_SUPABASE_ANON_KEY="..."</script>
     ```
   - `SUPABASE_SERVICE_KEY` (SECRET — api/ lang), `ADMIN_TOKEN` (para sa admin.html)
   - `AI_API_KEY` (opsyonal; kung wala, demo placeholder images ang lalabas)
3. **Deploy**: `npm i && vercel --prod`
4. **Admin**: pumunta sa `/admin.html`, i-login gamit ang `ADMIN_TOKEN`.

## Flow
1. Customer mag-upload ng foto → pili ng template → pili ng package → GCash/Maya payment.
2. `api/checkout.js` gumagawa ng `pending` order; `demoPaid` button ang simulate ng bayad (sa production, payment-gateway webhook ang papalit).
3. `api/generate.js` — **blocked (402) kung hindi PAID**. Pag paid na: AI generation (o demo placeholders) → 5 portraits.
4. ₱149: `api/render-slideshow.js` ang gumagawa ng 30s MP4 (kailangan ng ffmpeg sa server).
5. Admin dashboard: settings, templates CRUD, order tracking + revenue stats.

⚠️ **Demo mode**: kung hindi pa naka-configure ang Supabase, tumatakbo ang site gamit ang default na prices/templates — perfect for testing!
