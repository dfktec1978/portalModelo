-- Desabilitar política RLS recursiva em profiles (DEBUG)
-- Execute isto se receber erro: "infinite recursion detected in policy"

-- Primeiro, desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Ou, remover as políticas específicas
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all" ON profiles;

-- Re-habilitar RLS com políticas simples
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política simples: qualquer um pode ler
CREATE POLICY "Public read" ON profiles
  FOR SELECT USING (true);

-- Política: apenas o dono pode atualizar
CREATE POLICY "Users can update own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: apenas o dono pode deletar
CREATE POLICY "Users can delete own" ON profiles
  FOR DELETE
  USING (auth.uid() = id);
