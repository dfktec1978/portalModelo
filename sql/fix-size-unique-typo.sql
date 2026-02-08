-- Corrigir grafia do tamanho "Único" no catálogo
-- Execute no Supabase SQL Editor

UPDATE product_sizes
SET name = 'Único'
WHERE name IN ('Âsnico', 'Unico', 'Único ');
