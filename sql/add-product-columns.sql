-- Adicionar colunas extras à tabela products
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna de tamanhos (JSON text array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes TEXT;

-- Adicionar coluna de cores (JSON text array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS colors TEXT;

-- Adicionar coluna de estoque (inteiro)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('sizes', 'colors', 'stock')
ORDER BY column_name;
