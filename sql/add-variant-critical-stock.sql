-- Adiciona limite de estoque critico por variacao (override opcional)
ALTER TABLE IF EXISTS public.product_variants
ADD COLUMN IF NOT EXISTS critical_stock INTEGER;

-- Evita valores negativos no limite configurado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_variants_critical_stock_non_negative'
  ) THEN
    ALTER TABLE public.product_variants
    ADD CONSTRAINT product_variants_critical_stock_non_negative
    CHECK (critical_stock IS NULL OR critical_stock >= 0);
  END IF;
END $$;
