-- ============================================
-- GRUPOS DE TAMANHOS FLEXÍVEIS
-- Adicionar números de calçados e sistema de grupos
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna de grupo/categoria aos tamanhos
ALTER TABLE product_sizes 
  ADD COLUMN IF NOT EXISTS size_group TEXT DEFAULT 'roupas';

-- 2. Adicionar números de calçados
INSERT INTO product_sizes (name, display_order, size_group) VALUES
  ('33', 33, 'calcados'),
  ('34', 34, 'calcados'),
  ('35', 35, 'calcados'),
  ('36', 36, 'calcados'),
  ('37', 37, 'calcados'),
  ('38', 38, 'calcados'),
  ('39', 39, 'calcados'),
  ('40', 40, 'calcados'),
  ('41', 41, 'calcados'),
  ('42', 42, 'calcados'),
  ('43', 43, 'calcados'),
  ('44', 44, 'calcados'),
  ('45', 45, 'calcados'),
  ('46', 46, 'calcados')
ON CONFLICT (name) DO UPDATE 
  SET size_group = 'calcados';

-- 2b. Adicionar tamanhos adicionais de roupas
INSERT INTO product_sizes (name, display_order, size_group) VALUES
  ('XP', 0, 'roupas'),
  ('3G', 8, 'roupas'),
  ('4G', 9, 'roupas'),
  ('5G', 10, 'roupas')
ON CONFLICT (name) DO UPDATE 
  SET size_group = 'roupas';

-- 2c. Adicionar tamanhos infantis
INSERT INTO product_sizes (name, display_order, size_group) VALUES
  ('2', 2, 'infantil'),
  ('4', 4, 'infantil'),
  ('6', 6, 'infantil'),
  ('8', 8, 'infantil'),
  ('10', 10, 'infantil'),
  ('12', 12, 'infantil'),
  ('14', 14, 'infantil'),
  ('16', 16, 'infantil')
ON CONFLICT (name) DO UPDATE 
  SET size_group = 'infantil';

-- 3. Atualizar tamanhos existentes para o grupo 'roupas'
UPDATE product_sizes 
SET size_group = 'roupas'
WHERE name IN ('PP', 'P', 'M', 'G', 'GG', 'EG', 'XGG', 'Único')
AND size_group IS NULL;

-- 4. Criar tabela de categorias de produto com grupo de tamanho padrão
CREATE TABLE IF NOT EXISTS product_category_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  default_size_group TEXT DEFAULT 'roupas',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, category_name)
);

-- 5. Inserir configurações padrão comuns
-- (Essas são sugestões, cada loja pode personalizar)
COMMENT ON TABLE product_category_configs IS 'Configuração de qual grupo de tamanho usar por categoria de produto';
COMMENT ON COLUMN product_sizes.size_group IS 'Grupo de tamanhos: roupas, calcados, infantil, lingerie, etc';

-- 6. Função helper para obter tamanhos por grupo
CREATE OR REPLACE FUNCTION get_sizes_by_group(group_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.id, ps.name, ps.display_order
  FROM product_sizes ps
  WHERE ps.size_group = group_name
  ORDER BY ps.display_order;
END;
$$ LANGUAGE plpgsql;

-- 7. Adicionar campo ao products para definir qual grupo usar
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_group TEXT DEFAULT 'roupas';

COMMENT ON COLUMN products.size_group IS 'Define qual grupo de tamanhos usar: roupas, calcados, infantil, lingerie';

SELECT 'Sistema de grupos de tamanhos criado com sucesso! ✅' AS result;
