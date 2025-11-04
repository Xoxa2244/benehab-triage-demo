-- Migration 001: Initial schema for psychosemantics admin module
-- Execute this in Supabase Dashboard → SQL Editor

-- 1. Create enum for metric status
DO $$ BEGIN
  CREATE TYPE metric_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create concepts table
CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create rank_config table
CREATE TABLE IF NOT EXISTS rank_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  "M" INTEGER NOT NULL CHECK ("M" >= 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize rank_config
INSERT INTO rank_config (id, "M") VALUES (1, 5) 
ON CONFLICT (id) DO NOTHING;

-- 4. Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  status metric_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create metric_weights_same table
CREATE TABLE IF NOT EXISTS metric_weights_same (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  i_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  j_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  value REAL NOT NULL DEFAULT 0 CHECK (value >= -1 AND value <= 1),
  CONSTRAINT same_weights_pk PRIMARY KEY (metric_id, i_concept_id, j_concept_id),
  CONSTRAINT same_weights_order CHECK (i_concept_id < j_concept_id)
);

-- 6. Create metric_weights_diff table
CREATE TABLE IF NOT EXISTS metric_weights_diff (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  i_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  j_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  value REAL NOT NULL DEFAULT 0 CHECK (value >= -1 AND value <= 1),
  CONSTRAINT diff_weights_pk PRIMARY KEY (metric_id, i_concept_id, j_concept_id),
  CONSTRAINT diff_weights_order CHECK (i_concept_id < j_concept_id)
);

-- 7. Create metric_weights_rank table
CREATE TABLE IF NOT EXISTS metric_weights_rank (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  value REAL NOT NULL DEFAULT 0 CHECK (value >= -1 AND value <= 1),
  CONSTRAINT rank_weights_pk PRIMARY KEY (metric_id, rank, concept_id)
);

-- 8. Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  self_concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  ideal_concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  positive_anchors UUID[] DEFAULT '{}',
  negative_anchors UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize admin_settings
INSERT INTO admin_settings (id) VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- 9. Create metric_audit table
CREATE TABLE IF NOT EXISTS metric_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  actor TEXT,
  change JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metric_weights_same_metric ON metric_weights_same(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_weights_diff_metric ON metric_weights_diff(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_weights_rank_metric ON metric_weights_rank(metric_id);
CREATE INDEX IF NOT EXISTS idx_metrics_status ON metrics(status);
CREATE INDEX IF NOT EXISTS idx_metric_audit_metric ON metric_audit(metric_id);

-- 11. Create function to add concept to all metrics
CREATE OR REPLACE FUNCTION add_concept_to_all_metrics()
RETURNS TRIGGER AS $$
DECLARE
  metric_record RECORD;
  rank_value INTEGER;
  M_value INTEGER;
BEGIN
  -- Get M from rank_config
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

-- Create trigger for adding concepts
DROP TRIGGER IF EXISTS on_concept_added ON concepts;
CREATE TRIGGER on_concept_added
AFTER INSERT ON concepts
FOR EACH ROW
EXECUTE FUNCTION add_concept_to_all_metrics();

-- 12. Create function to update rank config
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

-- Create trigger for updating rank config
DROP TRIGGER IF EXISTS on_rank_config_updated ON rank_config;
CREATE TRIGGER on_rank_config_updated
BEFORE UPDATE ON rank_config
FOR EACH ROW
WHEN (OLD."M" IS DISTINCT FROM NEW."M")
EXECUTE FUNCTION update_rank_config();

-- 13. Enable Row Level Security (optional - can be disabled for admin)
-- For now, we'll use service_role key which bypasses RLS
-- Uncomment below if you want to enable RLS with policies

/*
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_weights_same ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_weights_diff ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_weights_rank ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_audit ENABLE ROW LEVEL SECURITY;

-- Admin policies (allow all for service_role - adjust as needed)
CREATE POLICY "Allow all for admin" ON concepts FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON rank_config FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metrics FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_weights_same FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_weights_diff FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_weights_rank FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON admin_settings FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON metric_audit FOR ALL USING (true);
*/

-- Migration complete!
SELECT 'Migration 001 completed successfully!' as status;

