-- Migration 002: Fix rank_config column name and trigger function
-- Execute this in Supabase Dashboard → SQL Editor

-- Step 1: Check if column exists as 'm' (lowercase) and rename it to "M" (uppercase with quotes)
DO $$
BEGIN
  -- Check if column 'm' exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rank_config' 
    AND column_name = 'm'
  ) THEN
    -- Rename column from 'm' to "M"
    ALTER TABLE rank_config RENAME COLUMN m TO "M";
    RAISE NOTICE 'Renamed column m to "M"';
  ELSE
    RAISE NOTICE 'Column "M" already exists or table does not exist';
  END IF;
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

