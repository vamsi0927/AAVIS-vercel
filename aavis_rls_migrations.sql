-- ==========================================
-- AAVIS Row Level Security (RLS) Migrations
-- Strict mapping for verified production tables only
-- ==========================================

-- Enable RLS on all existing user-owned tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Enable RLS on public tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation macro
DO $$
DECLARE
  table_names text[] := ARRAY[
    'bookmarks', 'password_reset_tokens', 'reports', 'scans', 'search_history', 'verification_tokens'
  ];
  t text;
BEGIN
  -- Profiles table (auth.uid() = id)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can delete own profile') THEN
    CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
  END IF;

  -- User-owned tables (auth.uid() = user_id)
  FOREACH t IN ARRAY table_names
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('Users can view own %I', t)) THEN
      EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id)', t, t);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('Users can insert own %I', t)) THEN
      EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('Users can update own %I', t)) THEN
      EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = format('Users can delete own %I', t)) THEN
      EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = user_id)', t, t);
    END IF;
  END LOOP;

  -- Public tables (Read-only for everyone)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Products are publicly viewable') THEN
    CREATE POLICY "Products are publicly viewable" ON public.products FOR SELECT USING (true);
  END IF;

END $$;
