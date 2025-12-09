-- Supabase SQL — Preparar para migração de profiles
-- Execute isto antes de migrar usuários do Firestore

-- ============================================
-- PASSO 1: Desabilitar Foreign Key temporariamente
-- ============================================

-- Remover constraint de FK
alter table profiles drop constraint if exists profiles_id_fkey;

-- ============================================
-- PASSO 2: Criar profiles sem referência a auth.users
-- ============================================
-- (A tabela já existe, então nada a fazer aqui)

-- ============================================
-- PASSO 3: Após migração estar completa
-- ============================================
-- Executar o PASSO 4 abaixo para restaurar a FK

-- ============================================
-- PASSO 4: Restaurar Foreign Key (após migração)
-- ============================================
-- Descomente isto APÓS migrar todos os usuários e ter auth.users criados

/*
alter table profiles 
add constraint profiles_id_fkey 
foreign key (id) references auth.users on delete cascade;
*/

-- ============================================
-- PASSO 5: Criar índices para performance
-- ============================================

create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_status on profiles(status);

-- ============================================
-- RESUMO
-- ============================================
-- 1. Execute this script no Supabase SQL Editor
-- 2. Isto desabilita a FK para permitir inserção de profiles sem auth.users
-- 3. Depois execute: npm run migrate-users
-- 4. Após sucesso, restaure a FK descomentando PASSO 4
