-- Tabela de variantes de produtos (tamanho/cor/estoque individual)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  size TEXT,
  color TEXT,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  price DECIMAL(10,2), -- NULL = usa preço do produto pai
  image_url TEXT, -- imagem específica da variante (cor)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Garantir que não há duplicatas de size+color no mesmo produto
  CONSTRAINT unique_product_size_color UNIQUE (product_id, size, color)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(active);

-- Adicionar coluna ao produto pai para indicar se tem variantes
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();

-- RLS (Row Level Security) - mesmo padrão dos produtos
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados podem ver variantes de produtos ativos
CREATE POLICY "Public can view active product variants"
  ON product_variants FOR SELECT
  TO anon, authenticated
  USING (
    active = true 
    AND EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.active = true
    )
  );

-- Policy: lojistas podem gerenciar variantes dos próprios produtos
CREATE POLICY "Store owners can manage their product variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_variants.product_id
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_variants.product_id
      AND s.owner_id = auth.uid()
    )
  );

-- Verificar criação
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'product_variants'
ORDER BY ordinal_position;
