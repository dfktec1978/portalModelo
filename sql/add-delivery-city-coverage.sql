-- =============================================================
-- Migração: cobertura de entrega por cidade (Destaque/Premium)
-- =============================================================

-- Campos gerais para regras globais de entrega
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,2) DEFAULT 0;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS delivery_fee_envio DECIMAL(10,2) DEFAULT 0;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '{"retirada": true, "envio": true, "condicional": false}'::jsonb;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS min_order_delivery DECIMAL(10,2) DEFAULT 0;

-- Tabela de cidades de cobertura por loja
CREATE TABLE IF NOT EXISTS store_delivery_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state VARCHAR(2) NOT NULL,
  zipcode VARCHAR(10),
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  eta_business_days INT NOT NULL DEFAULT 1,
  is_base_city BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_delivery_cities_store_id_idx ON store_delivery_cities(store_id);
CREATE INDEX IF NOT EXISTS store_delivery_cities_city_state_idx ON store_delivery_cities(city, state);

-- Um único registro de cidade base por loja
CREATE UNIQUE INDEX IF NOT EXISTS store_delivery_cities_base_city_unique
  ON store_delivery_cities(store_id)
  WHERE is_base_city = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger de atualização de updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_store_delivery_cities_updated_at'
  ) THEN
    CREATE TRIGGER update_store_delivery_cities_updated_at
      BEFORE UPDATE ON store_delivery_cities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

SELECT 'Store delivery city coverage migration executed.' AS result;
