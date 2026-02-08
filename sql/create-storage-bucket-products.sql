-- ============================================
-- CRIAR BUCKET DE STORAGE PARA PRODUTOS E SABORES
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar bucket 'products' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir leitura pública dos arquivos
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 3. Permitir upload para usuários autenticados (lojistas)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- 4. Permitir lojistas atualizarem suas próprias imagens
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- 5. Permitir lojistas deletarem suas próprias imagens
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

SELECT 'Bucket products criado com sucesso!' AS result;
