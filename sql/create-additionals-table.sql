-- Criar tabela de adicionais para cardápio (exclusivo para lojas de alimentação)
CREATE TABLE IF NOT EXISTS additionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category VARCHAR(50), -- ex: 'bebidas', 'molhos', 'ingredientes'
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_additionals_store_id ON additionals(store_id);
CREATE INDEX IF NOT EXISTS idx_additionals_available ON additionals(available);
CREATE INDEX IF NOT EXISTS idx_additionals_category ON additionals(category);

-- Comentários
COMMENT ON TABLE additionals IS 'Adicionais disponíveis para itens do cardápio (exclusivo alimentação)';
COMMENT ON COLUMN additionals.store_id IS 'ID da loja (apenas lojas de categoria alimentacao)';
COMMENT ON COLUMN additionals.name IS 'Nome do adicional (ex: Queijo Extra, Bacon, Molho Especial)';
COMMENT ON COLUMN additionals.price IS 'Preço adicional cobrado';
COMMENT ON COLUMN additionals.category IS 'Categoria do adicional para organização';
COMMENT ON COLUMN additionals.available IS 'Se o adicional está disponível no momento';

-- RLS Policies
ALTER TABLE additionals ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ver adicionais de lojas ativas
CREATE POLICY "Public can view active store additionals"
ON additionals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = additionals.store_id 
    AND stores.status = 'active'
  )
);

-- Policy: Lojistas podem gerenciar seus próprios adicionais
CREATE POLICY "Store owners can manage their additionals"
ON additionals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = additionals.store_id 
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = additionals.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_additionals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER additionals_updated_at
BEFORE UPDATE ON additionals
FOR EACH ROW
EXECUTE FUNCTION update_additionals_updated_at();
