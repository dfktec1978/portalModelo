-- ============================================
-- Restaurar Foreign Keys após Migração
-- ============================================
-- Execute isto no Supabase SQL Editor após confirmar que profiles foram migrados

-- PASSO 1: Remover FK antiga (se existir)
alter table profiles drop constraint if exists profiles_id_fkey cascade;

-- PASSO 2: Restaurar FK correta (opcional - só se usar auth.users)
-- Descomente se quiser FK com auth.users
-- alter table profiles 
-- add constraint profiles_id_fkey 
-- foreign key (id) references auth.users on delete cascade;

-- PASSO 3: Verificar integridade
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_stores FROM stores;

-- PASSO 4: Validar stores referencia profiles
SELECT s.id, s.store_name, p.display_name 
FROM stores s 
LEFT JOIN profiles p ON s.owner_id = p.id 
LIMIT 10;
