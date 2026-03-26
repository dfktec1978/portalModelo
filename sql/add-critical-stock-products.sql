-- Adiciona limite de estoque crítico à tabela products (para Alimentação)
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS critical_stock INTEGER;

-- Evita valores negativos no limite configurado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_critical_stock_non_negative'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_critical_stock_non_negative
    CHECK (critical_stock IS NULL OR critical_stock >= 0);
  END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'critical_stock';
