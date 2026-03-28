-- Campos para perfil de vitrine (Plano Gratis e LandingPage)
-- Execute no SQL Editor do Supabase

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS business_hours TEXT,
  ADD COLUMN IF NOT EXISTS landing_description TEXT,
  ADD COLUMN IF NOT EXISTS landing_photo_urls JSONB DEFAULT '[]'::jsonb;

-- Garantir que landing_photo_urls seja um array e respeite o photo_limit da loja
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_landing_photo_urls_limit_check;

-- Corrigir dados legados invalidos
UPDATE public.stores
SET landing_photo_urls = '[]'::jsonb
WHERE landing_photo_urls IS NOT NULL
  AND jsonb_typeof(landing_photo_urls) <> 'array';

UPDATE public.stores
SET landing_photo_urls = '[]'::jsonb
WHERE landing_photo_urls IS NULL;

UPDATE public.stores
SET photo_limit = CASE
  WHEN plan = 'landingpage' THEN 10
  WHEN plan IN ('presenca', 'destaque', 'premium') THEN 5
  ELSE GREATEST(1, COALESCE(photo_limit, 5))
END
WHERE photo_limit IS NULL
   OR photo_limit < 1
   OR (plan = 'landingpage' AND photo_limit <> 10)
   OR (plan IN ('presenca', 'destaque', 'premium') AND photo_limit <> 5);

-- Ajustar dados que tenham mais fotos do que o limite configurado da loja
UPDATE public.stores
SET landing_photo_urls = (
  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
  FROM (
    SELECT value
    FROM jsonb_array_elements(landing_photo_urls) AS value
    LIMIT GREATEST(1, COALESCE(photo_limit, 1))
  ) t
)
WHERE jsonb_typeof(landing_photo_urls) = 'array'
  AND jsonb_array_length(landing_photo_urls) > GREATEST(1, COALESCE(photo_limit, 1));

ALTER TABLE public.stores
  ADD CONSTRAINT stores_landing_photo_urls_limit_check
  CHECK (
    jsonb_typeof(landing_photo_urls) = 'array'
    AND jsonb_array_length(landing_photo_urls) <= GREATEST(1, COALESCE(photo_limit, 1))
  );

-- Blindagem: antes de qualquer insert/update, normaliza landing_photo_urls para array
CREATE OR REPLACE FUNCTION public.normalize_store_landing_photo_urls()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.landing_photo_urls IS NULL THEN
    NEW.landing_photo_urls := '[]'::jsonb;
  ELSIF jsonb_typeof(NEW.landing_photo_urls) <> 'array' THEN
    NEW.landing_photo_urls := '[]'::jsonb;
  END IF;

  IF NEW.photo_limit IS NULL OR NEW.photo_limit < 1 THEN
    NEW.photo_limit := 1;
  END IF;

  IF jsonb_array_length(NEW.landing_photo_urls) > GREATEST(1, COALESCE(NEW.photo_limit, 1)) THEN
    NEW.landing_photo_urls := (
      SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
      FROM (
        SELECT value
        FROM jsonb_array_elements(NEW.landing_photo_urls) AS value
        LIMIT GREATEST(1, COALESCE(NEW.photo_limit, 1))
      ) t
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_store_landing_photo_urls ON public.stores;

CREATE TRIGGER trg_normalize_store_landing_photo_urls
BEFORE INSERT OR UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.normalize_store_landing_photo_urls();

COMMENT ON COLUMN public.stores.specialty IS 'Especialidade da empresa (vitrine/gratis/landing)';
COMMENT ON COLUMN public.stores.facebook_url IS 'Link Facebook da vitrine';
COMMENT ON COLUMN public.stores.instagram_url IS 'Link Instagram da vitrine';
COMMENT ON COLUMN public.stores.business_hours IS 'Horarios de atendimento';
COMMENT ON COLUMN public.stores.landing_description IS 'Descricao curta para perfil vitrine/landing';
COMMENT ON COLUMN public.stores.landing_photo_urls IS 'Lista de URLs de fotos da vitrine/landing, respeitando o photo_limit da loja';

SELECT 'Landing profile fields migration: OK' AS status;
