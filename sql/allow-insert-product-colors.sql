-- Permitir inserir cores no catálogo para usuários autenticados
-- Execute no Supabase SQL Editor

DROP POLICY IF EXISTS "Permitir inserir cores" ON product_colors;
CREATE POLICY "Permitir inserir cores"
  ON product_colors FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
