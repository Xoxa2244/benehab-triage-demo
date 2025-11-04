-- Migration 004: Add rank colors table
-- Execute this in Supabase Dashboard → SQL Editor

-- Create rank_colors table
CREATE TABLE IF NOT EXISTS rank_colors (
  rank INTEGER PRIMARY KEY CHECK (rank >= 1),
  hex_color TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize default colors for ranks 1-11 (based on current colors in values.js)
INSERT INTO rank_colors (rank, hex_color, label) VALUES
  (1, '#EF4444', 'Red'),
  (2, '#3B82F6', 'Blue'),
  (3, '#10B981', 'Green'),
  (4, '#FBBF24', 'Yellow'),
  (5, '#A78BFA', 'Purple'),
  (6, '#F97316', 'Orange'),
  (7, '#EC4899', 'Pink'),
  (8, '#92400E', 'Brown'),
  (9, '#9CA3AF', 'Gray'),
  (10, '#1F2937', 'Black'),
  (11, '#FFFFFF', 'White')
ON CONFLICT (rank) DO NOTHING;

-- Create function to sync colors when M changes
CREATE OR REPLACE FUNCTION sync_rank_colors_on_m_change()
RETURNS TRIGGER AS $$
DECLARE
  old_M INTEGER;
  new_M INTEGER;
  rank_value INTEGER;
BEGIN
  old_M := OLD."M";
  new_M := NEW."M";
  
  IF new_M > old_M THEN
    -- Add default colors for new ranks
    FOR rank_value IN (old_M + 1)..new_M LOOP
      INSERT INTO rank_colors (rank, hex_color, label)
      VALUES (rank_value, '#CCCCCC', 'Color ' || rank_value)
      ON CONFLICT (rank) DO NOTHING;
    END LOOP;
  ELSIF new_M < old_M THEN
    -- Remove colors for ranks > new_M
    DELETE FROM rank_colors WHERE rank > new_M;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync colors when M changes
DROP TRIGGER IF EXISTS on_rank_config_m_changed ON rank_config;
CREATE TRIGGER on_rank_config_m_changed
AFTER UPDATE ON rank_config
FOR EACH ROW
WHEN (OLD."M" IS DISTINCT FROM NEW."M")
EXECUTE FUNCTION sync_rank_colors_on_m_change();

-- Migration complete!
SELECT 'Migration 004 completed successfully! rank_colors table created.' as status;

