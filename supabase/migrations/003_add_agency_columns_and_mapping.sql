-- ====================================================================
-- 003_add_agency_columns_and_mapping.sql
-- Add missing columns to agencies table and fix column mappings
-- ====================================================================

-- 1. Add missing columns to agencies table
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#4B6B5B';
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS logo TEXT DEFAULT '';
