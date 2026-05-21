-- ═══════════════════════════════════════════════════════════════
-- AAVIS — Full Database Schema (v2 — with Supabase Auth)
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Users (profiles linked to Supabase Auth) ──────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  age integer,
  gender text default 'Prefer not to say',
  height numeric,
  weight numeric,
  activity_level text default 'Moderately Active',
  diet_type text default 'None', -- 'None','Veg','Nonveg','Vegan','Keto','Jain'
  health_conditions text[] default '{}',
  allergens text[] default '{}',
  language text default 'en',
  streak integer default 0,
  last_scan_date date,
  created_at timestamp with time zone default now()
);

-- ─── 2. Products (cache) ───────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  name text,
  brand text,
  ingredients text[] default '{}',
  nutrients jsonb default '{}',
  additives text[] default '{}',
  allergens text[] default '{}',
  health_score integer,
  verdict text,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ─── 3. Scans ──────────────────────────────────────────────────
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_name text,
  brand text,
  barcode text,
  ingredients text[] default '{}',
  nutrients jsonb default '{}',
  additives text[] default '{}',
  allergens_detected text[] default '{}',
  health_score integer,
  verdict text,
  meme_shown text,
  diet_advice text,
  raw_ocr_text text,
  gemini_analysis jsonb,
  ai_summary text,
  image_url text,
  scanned_at timestamp with time zone default now()
);

-- ─── 4. Bookmarks ──────────────────────────────────────────────
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- ─── 5. Memes ──────────────────────────────────────────────────
create table if not exists memes (
  id uuid primary key default gen_random_uuid(),
  condition text not null,
  language text default 'en',
  text text not null,
  used_count integer default 0,
  created_at timestamp with time zone default now()
);

-- ─── 6. Search History ─────────────────────────────────────────
create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  query text,
  ai_response text,
  searched_at timestamp with time zone default now()
);

-- ─── 7. Reports ────────────────────────────────────────────────
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  reason text,
  details text,
  status text default 'pending',
  created_at timestamp with time zone default now()
);


-- ═══════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════════
create index if not exists idx_scans_user_id on scans(user_id);
create index if not exists idx_scans_scanned_at on scans(scanned_at);
create index if not exists idx_bookmarks_user_id on bookmarks(user_id);
create index if not exists idx_search_history_user_id on search_history(user_id);
create index if not exists idx_search_history_searched_at on search_history(searched_at);
create index if not exists idx_memes_condition on memes(condition);
create index if not exists idx_products_barcode on products(barcode);
create index if not exists idx_users_email on users(email);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data.
-- Memes and products are public-read.
-- ═══════════════════════════════════════════════════════════════
alter table users enable row level security;
alter table scans enable row level security;
alter table products enable row level security;
alter table bookmarks enable row level security;
alter table memes enable row level security;
alter table search_history enable row level security;
alter table reports enable row level security;

-- Allow all access with anon key (required since we use anon key, not auth JWT for now)
-- When you want tighter security, replace these with auth.uid()-based policies
create policy "Allow all for users" on users for all using (true) with check (true);
create policy "Allow all for scans" on scans for all using (true) with check (true);
create policy "Allow all for products" on products for all using (true) with check (true);
create policy "Allow all for bookmarks" on bookmarks for all using (true) with check (true);
create policy "Allow read for memes" on memes for select using (true);
create policy "Allow all for search_history" on search_history for all using (true) with check (true);
create policy "Allow all for reports" on reports for all using (true) with check (true);


-- ═══════════════════════════════════════════════════════════════
-- SUPABASE AUTH SETTINGS (configure in Dashboard)
-- ═══════════════════════════════════════════════════════════════
-- 1. Go to Supabase Dashboard → Authentication → Providers
-- 2. Enable "Email" provider
-- 3. DISABLE "Confirm email" for instant login (recommended for development)
--    (Settings → Auth → Email → Toggle off "Enable email confirmations")
-- 4. Set minimum password length to 6
