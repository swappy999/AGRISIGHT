-- ============================================================
-- AgriSight Migration 002 — Field Intelligence
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create fields table
CREATE TABLE IF NOT EXISTS public.fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    location_name   TEXT DEFAULT '',
    latitude        DOUBLE PRECISION DEFAULT 22.57,
    longitude       DOUBLE PRECISION DEFAULT 88.36,
    area_acres      DOUBLE PRECISION DEFAULT 1.0,
    soil_type       TEXT DEFAULT 'Alluvial',
    irrigation_type TEXT DEFAULT 'Drip',
    boundary_geojson JSONB DEFAULT NULL,
    notes           TEXT DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security — users can only access their own fields
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fields"
    ON public.fields FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fields"
    ON public.fields FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fields"
    ON public.fields FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fields"
    ON public.fields FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Link crops and analyses to fields
ALTER TABLE public.crops
    ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL;

ALTER TABLE public.analyses
    ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 4. Indexes for fast geospatial & user queries
CREATE INDEX IF NOT EXISTS idx_fields_user_id ON public.fields(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_field_id ON public.crops(field_id);
CREATE INDEX IF NOT EXISTS idx_analyses_field_id ON public.analyses(field_id);

-- 5. Trigger for updated_at
CREATE TRIGGER fields_updated_at
    BEFORE UPDATE ON public.fields
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
