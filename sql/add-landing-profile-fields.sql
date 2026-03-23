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

-- Garantir no maximo 5 fotos para vitrine/landing
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_landing_photo_urls_limit_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_landing_photo_urls_limit_check
  CHECK (
    jsonb_typeof(landing_photo_urls) = 'array'
    AND jsonb_array_length(landing_photo_urls) <= 5
  );

COMMENT ON COLUMN public.stores.specialty IS 'Especialidade da empresa (vitrine/gratis/landing)';
COMMENT ON COLUMN public.stores.facebook_url IS 'Link Facebook da vitrine';
COMMENT ON COLUMN public.stores.instagram_url IS 'Link Instagram da vitrine';
COMMENT ON COLUMN public.stores.business_hours IS 'Horarios de atendimento';
COMMENT ON COLUMN public.stores.landing_description IS 'Descricao curta para perfil vitrine/landing';
COMMENT ON COLUMN public.stores.landing_photo_urls IS 'Lista (max 5) de URLs de fotos da vitrine/landing';

SELECT 'Landing profile fields migration: OK' AS status;
