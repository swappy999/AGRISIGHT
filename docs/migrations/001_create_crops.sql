-- ============================================================
-- AgriSight Migration 001 — Crop Management
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create crops table
CREATE TABLE IF NOT EXISTS public.crops (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    variety     TEXT DEFAULT '',
    planting_date DATE,
    growth_stage TEXT DEFAULT '',
    field_name  TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security — users can only access their own crops
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crops"
    ON public.crops FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crops"
    ON public.crops FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crops"
    ON public.crops FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crops"
    ON public.crops FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Add crop_id to analyses table (optional link — nullable)
ALTER TABLE public.analyses
    ADD COLUMN IF NOT EXISTS crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL;

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_crops_user_id ON public.crops(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_crop_id ON public.analyses(crop_id);

-- 5. Auto-update updated_at on crops
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crops_updated_at
    BEFORE UPDATE ON public.crops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Done!
-- After running this migration, restart the backend server.
