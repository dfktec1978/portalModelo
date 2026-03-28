-- =============================================================
-- Migração: avaliações de loja por pedido finalizado
-- =============================================================

CREATE TABLE IF NOT EXISTS store_reviews (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID         NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id    UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID         NOT NULL, -- auth.users UUID
  rating      SMALLINT     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     VARCHAR(100) NOT NULL,
  is_anonymous BOOLEAN     NOT NULL DEFAULT false,
  owner_reply VARCHAR(100),
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Um único registro por pedido
CREATE UNIQUE INDEX IF NOT EXISTS store_reviews_order_id_unique
  ON store_reviews(order_id);

CREATE INDEX IF NOT EXISTS store_reviews_store_id_idx
  ON store_reviews(store_id);

CREATE INDEX IF NOT EXISTS store_reviews_customer_id_idx
  ON store_reviews(customer_id);

-- Row Level Security
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- Avaliações são públicas (conteúdo de marketplace)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'store_reviews' AND policyname = 'store_reviews_public_read'
  ) THEN
    CREATE POLICY store_reviews_public_read
      ON store_reviews FOR SELECT USING (true);
  END IF;
END;
$$;

-- Clientes inserem apenas suas próprias avaliações
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'store_reviews' AND policyname = 'store_reviews_customer_insert'
  ) THEN
    CREATE POLICY store_reviews_customer_insert
      ON store_reviews FOR INSERT
      WITH CHECK (auth.uid() = customer_id);
  END IF;
END;
$$;

-- Lojistas atualizam apenas owner_reply de avaliações da sua loja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'store_reviews' AND policyname = 'store_reviews_owner_update'
  ) THEN
    CREATE POLICY store_reviews_owner_update
      ON store_reviews FOR UPDATE
      USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));
  END IF;
END;
$$;

SELECT 'Store reviews migration executed.' AS result;
