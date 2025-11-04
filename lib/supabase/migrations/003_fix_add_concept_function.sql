-- Migration 003: Fix add_concept_to_all_metrics function
-- Execute this in Supabase Dashboard → SQL Editor

-- Recreate the function to add concept to all metrics with correct column name
CREATE OR REPLACE FUNCTION add_concept_to_all_metrics()
RETURNS TRIGGER AS $$
DECLARE
  metric_record RECORD;
  rank_value INTEGER;
  M_value INTEGER;
BEGIN
  -- Get M from rank_config (use "M" with quotes)
  SELECT "M" INTO M_value FROM rank_config WHERE id = 1;
  
  -- For each metric
  FOR metric_record IN SELECT id FROM metrics LOOP
    -- Add rows to metric_weights_rank (for all ranks)
    FOR rank_value IN 1..M_value LOOP
      INSERT INTO metric_weights_rank (metric_id, rank, concept_id, value)
      VALUES (metric_record.id, rank_value, NEW.id, 0)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Add pairs with new concept in same and diff
    -- For all existing concepts where i < j
    INSERT INTO metric_weights_same (metric_id, i_concept_id, j_concept_id, value)
    SELECT metric_record.id, LEAST(c.id, NEW.id), GREATEST(c.id, NEW.id), 0
    FROM concepts c
    WHERE c.id != NEW.id
    ON CONFLICT DO NOTHING;
    
    -- Same for diff
    INSERT INTO metric_weights_diff (metric_id, i_concept_id, j_concept_id, value)
    SELECT metric_record.id, LEAST(c.id, NEW.id), GREATEST(c.id, NEW.id), 0
    FROM concepts c
    WHERE c.id != NEW.id
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_concept_added ON concepts;
CREATE TRIGGER on_concept_added
AFTER INSERT ON concepts
FOR EACH ROW
EXECUTE FUNCTION add_concept_to_all_metrics();

-- Migration complete!
SELECT 'Migration 003 completed successfully! add_concept_to_all_metrics function fixed.' as status;

