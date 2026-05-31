-- ═══════════════════════════════════════════════════════════════
-- AAVIS — Supabase Database Schema (v3)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. PROFILES (Extends auth.users) ──────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  gender TEXT DEFAULT 'Prefer not to say',
  height_cm NUMERIC,
  weight_kg NUMERIC,
  activity_level TEXT DEFAULT 'Moderately Active',
  dietary_preferences TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  health_conditions TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  streak INTEGER DEFAULT 0,
  last_scan_date DATE,
  status TEXT CHECK (status IN ('active','banned')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 2. SCANS (Consolidates history & bookmarks) ──────────────
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_name TEXT,
  brand TEXT,
  barcode TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  ingredients TEXT[] DEFAULT '{}',
  nutrients JSONB DEFAULT '{}',
  additives TEXT[] DEFAULT '{}',
  allergens_detected TEXT[] DEFAULT '{}',
  ocr_text TEXT,
  ai_analysis JSONB,
  health_score INTEGER,
  verdict TEXT,
  diet_advice TEXT,

  is_bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_bookmarked ON scans(user_id) WHERE is_bookmarked = true;
CREATE INDEX IF NOT EXISTS idx_scans_barcode ON scans(barcode);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update/insert their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Scans: Users can only read/insert/update/delete their own scans, unless banned
CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active')
);
CREATE POLICY "Users can insert own scans" ON scans FOR INSERT WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active')
);
CREATE POLICY "Users can update own scans" ON scans FOR UPDATE USING (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active')
);
CREATE POLICY "Users can delete own scans" ON scans FOR DELETE USING (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active')
);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at, updated_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scans_updated_at ON scans;
CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
