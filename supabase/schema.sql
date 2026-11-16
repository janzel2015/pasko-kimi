-- ============================================================
-- Pasko Photo Magic — Supabase schema
-- i-paste buo sa Supabase SQL Editor
-- ============================================================
create extension if not exists "uuid-ossp";

-- ---------- SETTINGS (CMS key/value) ----------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- TEMPLATES (5 Christmas styles) ----------
create table if not exists public.templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  emoji       text not null default '✦',
  tagline     text not null default '',
  description text not null default '',
  image_url   text not null default '',
  prompt      text not null default '',      -- AI prompt, ginagamit ng api/generate.js
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id             uuid primary key default uuid_generate_v4(),
  customer_name  text not null default 'Customer',
  contact        text not null default '',
  photo_url      text,                       -- supabase storage path o dataURL (demo)
  template_id    uuid references public.templates(id) on delete set null,
  template_name  text not null default '',
  plan           text not null default 'Basic Magic — ₱99 — No Music',
  price          numeric(10,2) not null default 99,
  payment_method text not null default 'GCash',
  payment_ref    text not null default '',
  status         text not null default 'pending'
                 check (status in ('pending','paid','generating','done','failed','refunded')),
  result_urls    jsonb not null default '[]'::jsonb,
  slideshow_url  text,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

-- ---------- STORAGE BUCKET for uploaded photos ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.settings  enable row level security;
alter table public.templates enable row level security;
alter table public.orders    enable row level security;

-- Public read ng settings/templates
create policy "public read settings"  on public.settings  for select using (true);
create policy "public read templates" on public.templates for select using (active = true);

-- Anon/customer: puwedeng mag-insert ng order at magbasa ng SARILI nilang order via id
create policy "public insert orders" on public.orders for insert with check (true);
create policy "public read orders"   on public.orders for select using (true);

-- Lahat ng write/update/delete: service role lang (api functions gamit ang SERVICE KEY)
-- ⚠️ Never i-expose ang service key sa frontend!

-- ---------- DEFAULT SETTINGS ----------
insert into public.settings (key, value) values
  ('site_title',      '"Pasko Photo Magic — Old Foto, Magical Xmas!"'),
  ('pricing_eyebrow', '"✦ BESTSELLER THIS SEASON"'),
  ('pricing_title',   '"Five joyful portraits"'),
  ('price_99',        '{"name":"Basic Magic","price":99,"detail":"1 Photo Package · 5 Christmas Portraits · No Music"}'),
  ('price_149',       '{"name":"Magic with Music","price":149,"detail":"1 Photo Package · 5 Portraits & Music"}'),
  ('payment',         '{"gcash":"0917 123 4567","maya":"0917 123 4567","name":"Pasko Photo Magic"}')
on conflict (key) do nothing;

-- ---------- DEFAULT TEMPLATES ----------
insert into public.templates (name, emoji, tagline, description, sort_order, prompt) values
  ('Binibining Gabi',            '❤️', 'Elegant Christmas portraits with a festive glow.',   'A warm, elegant holiday look with sparkling lights and classic Christmas details.', 1, 'elegant Christmas portrait, festive golden glow, sparkling bokeh lights, classic holiday details'),
  ('Sweater Weather',            '🎄', 'Cozy outfits and heartwarming holiday vibes.',        'Soft, cozy Christmas styling for relaxed and joyful family portraits.',             2, 'cozy Christmas sweater portrait, warm fireplace, heartwarming holiday vibes'),
  ('Bright Celebration',         '⭐', 'Bright colors and cheerful Christmas energy.',        'A bright festive scene filled with cheerful colors and celebration.',               3, 'vibrant colorful Christmas celebration, confetti, cheerful energy'),
  ('Traditional / Bahay Kubo',   '🏡', 'Rustic, nostalgic Filipino Christmas.',              'A nostalgic Filipino-inspired Christmas atmosphere with homey details.',            4, 'rustic Filipino Christmas, bahay kubo, parol lantern, nostalgic warm atmosphere'),
  ('Christmas Elegance',         '✨', 'Classic holiday glamour and timeless portraits.',    'Elegant outfits, beautiful Christmas lighting and timeless holiday portraits.',     5, 'classic glamorous holiday portrait, elegant outfit, cinematic Christmas lighting')
on conflict do nothing;
