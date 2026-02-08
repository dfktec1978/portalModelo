-- Tabela de relacionamento entre produtos e adicionais (muitos para muitos)
-- Permite que cada produto tenha seus próprios adicionais específicos

CREATE TABLE IF NOT EXISTS product_additionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  additional_id UUID NOT NULL REFERENCES additionals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que o mesmo adicional não seja vinculado duas vezes ao mesmo produto
  UNIQUE(product_id, additional_id)
);

-- Índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_product_additionals_product_id ON product_additionals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_additionals_additional_id ON product_additionals(additional_id);

-- RLS (Row Level Security)
ALTER TABLE product_additionals ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler (necessário para página pública)
CREATE POLICY "Permitir leitura pública de product_additionals"
  ON product_additionals
  FOR SELECT
  USING (true);

-- Política: Apenas o dono da loja pode inserir/atualizar/deletar
CREATE POLICY "Donos podem gerenciar product_additionals"
  ON product_additionals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = product_additionals.product_id
      AND s.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE product_additionals IS 'Relacionamento muitos-para-muitos entre produtos e adicionais específicos';
COMMENT ON COLUMN product_additionals.product_id IS 'ID do produto';
COMMENT ON COLUMN product_additionals.additional_id IS 'ID do adicional vinculado ao produto';
