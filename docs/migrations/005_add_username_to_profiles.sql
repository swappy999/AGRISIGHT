-- ============================================================
-- AgriSight Migration 005 — Username Support
-- Adds unique, case-insensitive username to public.profiles
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add username column (nullable initially to allow existing rows)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT DEFAULT NULL;

-- 2. Create a unique index (case-insensitive via LOWER())
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
    ON public.profiles (LOWER(username))
    WHERE username IS NOT NULL;

-- 3. Helper function: check if username is available (callable from frontend)
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(username) = LOWER(p_username)
    );
$$;
