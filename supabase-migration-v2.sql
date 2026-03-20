-- ============================================================
-- SOLARWIN: Installer/Broker Branding Migration (v2)
-- Run this ONCE in Supabase → SQL Editor
-- ============================================================

-- Add branding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS trade_name TEXT;
