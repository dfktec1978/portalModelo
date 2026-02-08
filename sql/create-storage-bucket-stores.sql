-- ============================================
-- CRIAR BUCKET DE STORAGE PARA LOGOS DAS LOJAS
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar bucket 'stores' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('stores', 'stores', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;

-- 3. Permitir leitura pública dos arquivos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'stores');

-- 4. Permitir upload para usuários autenticados (lojistas)
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stores' AND (storage.foldername(name))[1] = 'logos');

-- 5. Permitir lojistas atualizarem suas próprias logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'stores' AND (storage.foldername(name))[1] = 'logos');

-- 6. Permitir lojistas deletarem suas próprias logos
CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'stores' AND (storage.foldername(name))[1] = 'logos');

SELECT 'Bucket e políticas criadas com sucesso!' AS result;
