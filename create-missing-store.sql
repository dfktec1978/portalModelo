-- Script para criar loja para usuário lojista que não tem registro na tabela stores

-- Verificar se já existe
SELECT 
  p.id as profile_id,
  p.email,
  p.role,
  p.status as profile_status,
  s.id as store_id,
  s.status as store_status
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
WHERE p.email = 'sapoinfoshop@gmail.com';

-- Se a loja não existir, criar
INSERT INTO stores (owner_id, store_name, status, created_at, approved_at)
SELECT 
  id,
  COALESCE(display_name, email) || ' Store',
  'active',
  NOW(),
  NOW()
FROM profiles
WHERE email = 'sapoinfoshop@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM stores WHERE owner_id = profiles.id
  );

-- Verificar novamente
SELECT 
  p.id as profile_id,
  p.email,
  p.display_name,
  p.role,
  p.status as profile_status,
  s.id as store_id,
  s.store_name,
  s.status as store_status,
  s.approved_at
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
WHERE p.email = 'sapoinfoshop@gmail.com';
