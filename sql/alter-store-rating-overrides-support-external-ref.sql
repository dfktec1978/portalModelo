-- =============================================================
-- Migração: permitir overrides por referência externa (slug/id)
-- sem exigir registro em stores
-- =============================================================

ALTER TABLE store_rating_overrides
  ADD COLUMN IF NOT EXISTS store_ref TEXT;

ALTER TABLE store_rating_overrides
  ALTER COLUMN store_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS store_rating_overrides_store_ref_unique
  ON store_rating_overrides(store_ref)
  WHERE store_ref IS NOT NULL;

-- Garante que ao menos uma referência exista
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

SELECT 'Store rating overrides external ref migration executed.' AS result;
