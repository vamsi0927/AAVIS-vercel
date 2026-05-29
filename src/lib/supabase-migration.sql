-- ═══════════════════════════════════════════════════════════════
-- AAVIS — Full Database Schema (v2 — with Supabase Auth)
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Users (profiles linked to Supabase Auth) ──────────────
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
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

-- Drop old permissive policies first
drop policy if exists "Allow all for users" on users;
drop policy if exists "Allow all for scans" on scans;
drop policy if exists "Allow all for products" on products;
drop policy if exists "Allow all for bookmarks" on bookmarks;
drop policy if exists "Allow read for memes" on memes;
drop policy if exists "Allow all for search_history" on search_history;
drop policy if exists "Allow all for reports" on reports;

-- USERS: each user can only see/edit their own row
create policy "users_select_own" on users for select using (id = auth.uid());
create policy "users_update_own" on users for update using (id = auth.uid());
create policy "users_insert_own" on users for insert with check (id = auth.uid());

-- SCANS: user can only access their own scans
create policy "scans_select_own" on scans for select using (user_id = auth.uid());
create policy "scans_insert_own" on scans for insert with check (user_id = auth.uid());
create policy "scans_delete_own" on scans for delete using (user_id = auth.uid());

-- PRODUCTS: public read, no write from client
create policy "products_read_all" on products for select using (true);

-- BOOKMARKS: user's own only
create policy "bookmarks_select_own" on bookmarks for select using (user_id = auth.uid());
create policy "bookmarks_insert_own" on bookmarks for insert with check (user_id = auth.uid());
create policy "bookmarks_delete_own" on bookmarks for delete using (user_id = auth.uid());

-- MEMES: public read
create policy "memes_read_all" on memes for select using (true);

-- SEARCH HISTORY: user's own only
create policy "search_history_select_own" on search_history for select using (user_id = auth.uid());
create policy "search_history_insert_own" on search_history for insert with check (user_id = auth.uid());

-- REPORTS: user can insert, admin can read all (handled server-side)
create policy "reports_insert_own" on reports for insert with check (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- AUTH TRIGGER: Auto-create user profile on signup
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════
-- SUPABASE AUTH SETTINGS (configure in Dashboard)
-- ═══════════════════════════════════════════════════════════════
-- 1. Go to Supabase Dashboard → Authentication → Providers
-- 2. Enable "Email" provider
-- 3. DISABLE "Confirm email" for instant login (recommended for development)
--    (Settings → Auth → Email → Toggle off "Enable email confirmations")
-- 4. Set minimum password length to 6
