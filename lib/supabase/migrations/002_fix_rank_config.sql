-- Migration 002: Fix rank_config column name and trigger function
-- Execute this in Supabase Dashboard → SQL Editor

-- Step 1: Check and fix column name
-- First, let's see what columns exist
DO $$
DECLARE
  col_exists_m BOOLEAN;
  col_exists_M BOOLEAN;
BEGIN
  -- Check if column 'm' (lowercase) exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rank_config' 
      AND table_schema = 'public'
      AND column_name = 'm'
  ) INTO col_exists_m;

  -- Check if column 'M' (uppercase) exists  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rank_config' 
      AND table_schema = 'public'
      AND column_name = 'M'
  ) INTO col_exists_M;

  -- If lowercase 'm' exists, rename to "M"
  IF col_exists_m AND NOT col_exists_M THEN
    ALTER TABLE rank_config RENAME COLUMN m TO "M";
    RAISE NOTICE 'Renamed column m to "M"';
  ELSIF col_exists_M THEN
    RAISE NOTICE 'Column "M" already exists with correct name';
  ELSE
    RAISE NOTICE 'Warning: No column found in rank_config. Table might not exist or have different structure.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Step 2: Recreate the trigger function with correct column name
CREATE OR REPLACE FUNCTION update_rank_config()
RETURNS TRIGGER AS $$
DECLARE
  old_M INTEGER;
  new_M INTEGER;
  metric_record RECORD;
  concept_record RECORD;
  rank_value INTEGER;
BEGIN
  old_M := OLD."M";
  new_M := NEW."M";
  
  IF new_M > old_M THEN
    -- Increased M: add rows for new ranks
    FOR metric_record IN SELECT id FROM metrics LOOP
      FOR concept_record IN SELECT id FROM concepts LOOP
        FOR rank_value IN (old_M + 1)..new_M LOOP
          INSERT INTO metric_weights_rank (metric_id, rank, concept_id, value)
          VALUES (metric_record.id, rank_value, concept_record.id, 0)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  ELSIF new_M < old_M THEN
    -- Decreased M: delete rows with rank > new_M
    DELETE FROM metric_weights_rank
    WHERE rank > new_M;
  END IF;
  
  -- Update updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_rank_config_updated ON rank_config;
CREATE TRIGGER on_rank_config_updated
BEFORE UPDATE ON rank_config
FOR EACH ROW
WHEN (OLD."M" IS DISTINCT FROM NEW."M")
EXECUTE FUNCTION update_rank_config();

-- Migration complete!
SELECT 'Migration 002 completed successfully! rank_config column renamed and trigger fixed.' as status;

