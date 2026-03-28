-- =============================================================
-- Migração: overrides de avaliação legado + função de agregação
-- =============================================================

CREATE TABLE IF NOT EXISTS store_rating_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  store_ref TEXT UNIQUE,
  avg_rating_legacy NUMERIC(2,1) NOT NULL CHECK (avg_rating_legacy >= 0 AND avg_rating_legacy <= 5),
  total_reviews_legacy INT NOT NULL CHECK (total_reviews_legacy >= 0),
  source_note VARCHAR(120),
  active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_rating_overrides_store_id_idx
  ON store_rating_overrides(store_id);

CREATE INDEX IF NOT EXISTS store_rating_overrides_store_ref_idx
  ON store_rating_overrides(store_ref);

CREATE INDEX IF NOT EXISTS store_rating_overrides_active_idx
  ON store_rating_overrides(active);

CREATE OR REPLACE FUNCTION update_store_rating_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_rating_overrides_updated_at'
  ) THEN
    CREATE TRIGGER trg_store_rating_overrides_updated_at
      BEFORE UPDATE ON store_rating_overrides
      FOR EACH ROW
      EXECUTE FUNCTION update_store_rating_overrides_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'store_rating_overrides_store_ref_or_store_id'
  ) THEN
    ALTER TABLE store_rating_overrides
      ADD CONSTRAINT store_rating_overrides_store_ref_or_store_id
      CHECK (store_id IS NOT NULL OR store_ref IS NOT NULL);
  END IF;
END;
$$;

-- Agregação orgânica no banco (performance para /api/reviews?all_summary=true)
CREATE OR REPLACE FUNCTION get_store_rating_summary()
RETURNS TABLE (
  store_id UUID,
  avg_rating NUMERIC,
  total_reviews BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    sr.store_id,
    ROUND(AVG(sr.rating)::numeric, 1) AS avg_rating,
    COUNT(*)::bigint AS total_reviews
  FROM store_reviews sr
  GROUP BY sr.store_id;
$$;

SELECT 'Store rating overrides migration executed.' AS result;
