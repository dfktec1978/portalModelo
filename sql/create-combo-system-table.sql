-- ============================================
-- SISTEMA DE COMBOS CONFIGURÁVEIS
-- Execute no Supabase SQL Editor
-- ============================================

-- Tabela de itens que compõem um combo
CREATE TABLE IF NOT EXISTS combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  category_label TEXT, -- Ex: "Escolha seu hambúrguer", "Escolha sua bebida"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(combo_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_combo_items_combo_id ON combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product_id ON combo_items(product_id);

-- RLS (Row Level Security)
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir leitura pública de itens do combo"
  ON combo_items FOR SELECT USING (true);

CREATE POLICY "Donos podem gerenciar itens do combo"
  ON combo_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = combo_items.combo_id
      AND s.owner_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE combo_items IS 'Produtos que fazem parte de um combo';
COMMENT ON COLUMN combo_items.quantity IS 'Quantidade deste item no combo';
COMMENT ON COLUMN combo_items.category_label IS 'Label para agrupar escolhas (ex: Escolha seu lanche)';

SELECT 'Tabela combo_items criada com sucesso!' AS result;
