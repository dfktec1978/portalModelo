-- ============================================
-- ADICIONAR COLUNAS ESSENCIAIS À TABELA STORES
-- Execute este código no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna category (varejo | alimentacao)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'varejo';

-- 2. Adicionar coluna theme_color (tema de cores)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'azul';

-- 3. Adicionar coluna logo_url (URL da logo)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 4. Adicionar coluna description (descrição da loja)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Adicionar coluna slug (URL amigável)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug TEXT;

-- 6. Adicionar coluna external_url (site externo opcional)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS external_url TEXT;

-- 7. Adicionar coluna gallery (galeria de imagens)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';

-- Criar índice para categoria (buscas frequentes)
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);

-- Criar índice para slug (URL única)
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- Criar constraint para validar category
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_category_check;
ALTER TABLE stores ADD CONSTRAINT stores_category_check 
  CHECK (category IN ('varejo', 'alimentacao'));

-- Criar constraint para validar theme_color
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_theme_check;
ALTER TABLE stores ADD CONSTRAINT stores_theme_check 
  CHECK (theme_color IN ('azul', 'verde', 'preto-branco', 'vermelho', 'roxo', 'laranja'));

-- Comentários para documentação
COMMENT ON COLUMN stores.category IS 'Categoria da loja: varejo (produtos físicos) ou alimentacao (restaurantes/lanchonetes)';
COMMENT ON COLUMN stores.theme_color IS 'Tema de cores pré-definido escolhido pelo lojista';
COMMENT ON COLUMN stores.logo_url IS 'URL da logo da loja armazenada no Storage';
COMMENT ON COLUMN stores.description IS 'Descrição curta da loja (máx 500 caracteres)';
COMMENT ON COLUMN stores.slug IS 'URL amigável única da loja (ex: loja-modelo)';

-- Atualizar lojas existentes (se houver)
UPDATE stores SET category = 'varejo' WHERE category IS NULL;
UPDATE stores SET theme_color = 'azul' WHERE theme_color IS NULL;
UPDATE stores SET gallery = '[]' WHERE gallery IS NULL;

SELECT 'Colunas adicionadas com sucesso!' AS result;
