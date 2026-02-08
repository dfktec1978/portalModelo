-- Permitir remover cores do catálogo para usuários autenticados
-- Execute no Supabase SQL Editor

DROP POLICY IF EXISTS "Permitir remover cores" ON product_colors;
CREATE POLICY "Permitir remover cores"
  ON product_colors FOR DELETE
  USING (auth.uid() IS NOT NULL);
