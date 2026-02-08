-- Tabela para categorias personalizadas de produtos
-- Permite que cada loja crie suas próprias categorias além das padrões

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍴',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que não haja categorias duplicadas na mesma loja
  UNIQUE(store_id, name)
);

-- Índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_product_categories_store_id ON product_categories(store_id);

-- RLS (Row Level Security)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler (necessário para página pública)
CREATE POLICY "Permitir leitura pública de categorias"
  ON product_categories
  FOR SELECT
  USING (true);

-- Política: Apenas o dono da loja pode gerenciar
CREATE POLICY "Donos podem gerenciar categorias"
  ON product_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = product_categories.store_id
      AND s.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE product_categories IS 'Categorias personalizadas criadas por cada loja';
COMMENT ON COLUMN product_categories.store_id IS 'ID da loja dona da categoria';
COMMENT ON COLUMN product_categories.name IS 'Nome da categoria';
COMMENT ON COLUMN product_categories.icon IS 'Emoji/ícone da categoria';
