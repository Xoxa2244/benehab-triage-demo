-- Fix script for rank_config table
-- Run this in Supabase SQL Editor if the table was created without quotes

-- Option 1: If table exists with lowercase 'm', rename it to uppercase 'M'
ALTER TABLE rank_config RENAME COLUMN m TO "M";

-- Option 2: If table doesn't exist or needs to be recreated, drop and recreate:
-- DROP TABLE IF EXISTS rank_config CASCADE;
-- CREATE TABLE rank_config (
--   id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
--   "M" INTEGER NOT NULL CHECK ("M" >= 2),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- INSERT INTO rank_config (id, "M") VALUES (1, 5) ON CONFLICT (id) DO NOTHING;

