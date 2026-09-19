-- ============================================================
-- AgriSight Migration 003 — Farming Intervention & Outcome Tracking
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create interventions table
CREATE TABLE IF NOT EXISTS public.interventions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_id         UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    field_id        UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    action_type     TEXT NOT NULL DEFAULT 'Inspection',
    action_title    TEXT NOT NULL,
    notes           TEXT DEFAULT '',
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security — users can only access their own logged actions
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interventions"
    ON public.interventions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interventions"
    ON public.interventions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interventions"
    ON public.interventions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interventions"
    ON public.interventions FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON public.interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_crop_id ON public.interventions(crop_id);
CREATE INDEX IF NOT EXISTS idx_interventions_field_id ON public.interventions(field_id);
