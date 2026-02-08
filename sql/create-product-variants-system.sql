-- ============================================
-- SISTEMA DE VARIAÇÕES DE PRODUTOS (VAREJO)
-- Cores, Tamanhos, SKU, Estoque por Variação
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar campos ao products (informações técnicas e controle de variações)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS technical_description TEXT,
  ADD COLUMN IF NOT EXISTS composition TEXT,
  ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT;

-- 2. Criar tabela de variações de produtos
DROP TABLE IF EXISTS product_variants CASCADE;
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  price_adjustment DECIMAL(10,2) DEFAULT 0.00,
  images TEXT[], -- Fotos específicas desta variação (opcional)
  weight_grams INTEGER, -- Peso para cálculo de frete (opcional)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que não existam variações duplicadas
  UNIQUE(product_id, color, size),
  
  -- Garantir que o SKU seja único globalmente
  CONSTRAINT sku_format CHECK (sku ~ '^[A-Z0-9-]+$')
);

-- 3. Criar tabela de cores disponíveis (catálogo)
DROP TABLE IF EXISTS product_colors CASCADE;
CREATE TABLE product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- Ex: "Preto", "Branco", "Azul Marinho"
  hex_code TEXT, -- Ex: "#000000", "#FFFFFF", "#001F3F"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inserir cores padrão
INSERT INTO product_colors (name, hex_code) VALUES
  ('Preto', '#000000'),
  ('Branco', '#FFFFFF'),
  ('Cinza', '#808080'),
  ('Azul Marinho', '#001F3F'),
  ('Vermelho', '#D62828'),
  ('Verde', '#28A745'),
  ('Amarelo', '#FDC500'),
  ('Rosa', '#FF69B4'),
  ('Marrom', '#8B4513'),
  ('Bege', '#F5F5DC')
ON CONFLICT (name) DO NOTHING;

-- 5. Criar tabela de tamanhos disponíveis (catálogo)
DROP TABLE IF EXISTS product_sizes CASCADE;
CREATE TABLE product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- Ex: "P", "M", "G", "GG", "EG"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inserir tamanhos padrão
INSERT INTO product_sizes (name, display_order) VALUES
  ('PP', 1),
  ('P', 2),
  ('M', 3),
  ('G', 4),
  ('GG', 5),
  ('EG', 6),
  ('XGG', 7),
  ('Único', 0)
ON CONFLICT (name) DO NOTHING;

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_has_variants ON products(has_variants);

-- 8. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_variants_updated_at ON product_variants;
CREATE TRIGGER trigger_update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();

-- 9. RLS (Row Level Security)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de leitura pública (clientes podem ver variações disponíveis)
DROP POLICY IF EXISTS "Permitir leitura pública de variações" ON product_variants;
CREATE POLICY "Permitir leitura pública de variações"
  ON product_variants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de cores" ON product_colors;
CREATE POLICY "Permitir leitura pública de cores"
  ON product_colors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de tamanhos" ON product_sizes;
CREATE POLICY "Permitir leitura pública de tamanhos"
  ON product_sizes FOR SELECT
  USING (true);

-- 11. Políticas de escrita (apenas donos da loja podem gerenciar)
DROP POLICY IF EXISTS "Donos podem gerenciar variações de seus produtos" ON product_variants;
CREATE POLICY "Donos podem gerenciar variações de seus produtos"
  ON product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_variants.product_id
      AND s.owner_id = auth.uid()
    )
  );

-- 12. Comentários para documentação
COMMENT ON TABLE product_variants IS 'Variações de produtos (cor + tamanho) para lojas de varejo';
COMMENT ON COLUMN product_variants.sku IS 'Código único da variação (ex: CAM-001-P-PRETO)';
COMMENT ON COLUMN product_variants.color IS 'Cor da variação';
COMMENT ON COLUMN product_variants.size IS 'Tamanho da variação';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Estoque disponível desta variação específica';
COMMENT ON COLUMN product_variants.price_adjustment IS 'Ajuste de preço (+/-) em relação ao preço base do produto';
COMMENT ON COLUMN product_variants.images IS 'Fotos específicas desta variação (opcional, usa images do produto se vazio)';
COMMENT ON COLUMN products.has_variants IS 'TRUE se produto tem variações de cor/tamanho';
COMMENT ON COLUMN products.technical_description IS 'Descrição técnica detalhada do produto';
COMMENT ON COLUMN products.composition IS 'Composição/material do produto (ex: 100% algodão)';
COMMENT ON COLUMN products.characteristics IS 'Array JSON de características (ex: ["Respirável", "Secagem rápida"])';

SELECT 'Sistema de variações criado com sucesso! ✅' AS result;
