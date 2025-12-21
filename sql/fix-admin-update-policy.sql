-- Permitir que admins atualizem qualquer perfil
-- Execute este SQL no Supabase SQL Editor

-- Primeiro, verificar se já existe uma política para admins
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;

-- Criar política para admins poderem atualizar qualquer perfil
CREATE POLICY "admin_update_all_profiles" ON profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';