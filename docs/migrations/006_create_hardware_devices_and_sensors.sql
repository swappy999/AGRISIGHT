-- Migration 006: Hardware Devices & Sensor Readings
-- Implements Sections 7, 14, and 17 of AgriSight Hardware-Ready Application Master Specification.

-- 1. Hardware Devices Table
CREATE TABLE IF NOT EXISTS public.hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('ESP32_SENSOR_NODE', 'IRRIGATION_CONTROLLER', 'WEATHER_NODE', 'SOIL_NODE', 'CUSTOM')),
    device_identifier TEXT NOT NULL,
    connection_type TEXT NOT NULL CHECK (connection_type IN ('WIFI', 'BLUETOOTH', 'BLE', 'MQTT', 'SERIAL')),
    firmware_version TEXT,
    status TEXT NOT NULL DEFAULT 'unpaired' CHECK (status IN ('online', 'offline', 'pairing', 'error', 'unpaired')),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hardware_devices_user_id ON public.hardware_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_field_id ON public.hardware_devices(field_id);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_identifier ON public.hardware_devices(device_identifier);

-- Enable Row Level Security (RLS) (§17 Account Isolation)
ALTER TABLE public.hardware_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own hardware devices"
ON public.hardware_devices
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Sensor Readings Table
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    device_id TEXT NOT NULL,
    soil_moisture NUMERIC(5, 2),
    temperature NUMERIC(5, 2),
    humidity NUMERIC(5, 2),
    soil_ph NUMERIC(4, 2),
    water_flow NUMERIC(6, 2),
    sensor_status JSONB DEFAULT '{}'::jsonb,
    source TEXT NOT NULL DEFAULT 'hardware' CHECK (source IN ('hardware', 'manual', 'imported')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_user_id ON public.sensor_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_field_id ON public.sensor_readings(field_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own sensor readings"
ON public.sensor_readings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
