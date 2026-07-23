-- ==========================================
-- Custom Auth Token Tables for Resend Verification
-- Run these in your Supabase SQL Editor
-- ==========================================

-- 1. Verification Tokens (For Registration)
CREATE TABLE IF NOT EXISTS public.verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hashed_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_hashed_token ON public.verification_tokens(hashed_token);

-- Secure the verification_tokens table (Admin API only)
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
-- No policies defined, meaning it defaults to deny-all for anon/authenticated users.
-- Only the service_role (Admin API) can access this table.

-- 2. Password Reset Tokens (For Forgot Password)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hashed_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hashed_token ON public.password_reset_tokens(hashed_token);

-- We assume public.users (or public.profiles) already exists as per user confirmation.
