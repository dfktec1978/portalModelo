-- Correção mais abrangente para grafia de "Único"
-- Execute no Supabase SQL Editor

UPDATE product_sizes
SET name = 'Único'
WHERE (name ILIKE '%nico%' OR name ILIKE '%único%')
  AND name <> 'Único';
