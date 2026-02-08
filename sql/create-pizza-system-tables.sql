Bucket products criado com sucesso!-- Tabelas para sistema de pizzas com sabores e tamanhos

-- Tabela de sabores de pizza
CREATE TABLE IF NOT EXISTS pizza_flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, name)
);

-- Tabela de tamanhos de pizza (relacionado ao produto base)
CREATE TABLE IF NOT EXISTS pizza_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_name TEXT NOT NULL, -- Pequena, Média, Grande
  price DECIMAL(10, 2) NOT NULL,
  max_flavors INTEGER NOT NULL, -- 2, 3, 4
  slices INTEGER, -- 4, 6, 8
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(product_id, size_name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pizza_flavors_store_id ON pizza_flavors(store_id);
CREATE INDEX IF NOT EXISTS idx_pizza_sizes_product_id ON pizza_sizes(product_id);

-- RLS (Row Level Security)
ALTER TABLE pizza_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pizza_sizes ENABLE ROW LEVEL SECURITY;

-- Políticas pizza_flavors
CREATE POLICY "Permitir leitura pública de sabores"
  ON pizza_flavors FOR SELECT USING (true);

CREATE POLICY "Donos podem gerenciar sabores"
  ON pizza_flavors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = pizza_flavors.store_id
      AND s.owner_id = auth.uid()
    )
  );

-- Políticas pizza_sizes
CREATE POLICY "Permitir leitura pública de tamanhos"
  ON pizza_sizes FOR SELECT USING (true);

CREATE POLICY "Donos podem gerenciar tamanhos"
  ON pizza_sizes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = pizza_sizes.product_id
      AND s.owner_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE pizza_flavors IS 'Sabores de pizza cadastrados pela loja';
COMMENT ON TABLE pizza_sizes IS 'Tamanhos disponíveis para cada pizza (produto) com limite de sabores';
COMMENT ON COLUMN pizza_sizes.max_flavors IS 'Número máximo de sabores permitidos (Pequena=2, Média=3, Grande=4)';
