-- SQL para criar tabelas essenciais do Portal Modelo
-- Execute este código no SQL Editor do Supabase: https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql

-- ============================================
-- 1. TABELA profiles (perfis de usuários)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  role text default 'cliente', -- 'cliente', 'lojista', 'profissional', 'admin'
  status text default 'active', -- 'active', 'pending', 'blocked'
  metadata jsonb,
  created_at timestamptz default now(),
  approved_at timestamptz,
  phone text
);

alter table profiles enable row level security;

-- Permitir leitura própria do perfil
create policy "users can read own profile" on profiles
  for select using (auth.uid() = id);

-- Permitir inserção própria (durante cadastro)
create policy "users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Permitir update próprio
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

-- ============================================
-- 2. TABELA stores (lojas/empreendimentos)
-- ============================================
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  store_name text not null,
  phone text,
  address jsonb,
  status text default 'pending', -- 'pending', 'active', 'blocked'
  created_at timestamptz default now(),
  approved_at timestamptz
);

alter table stores enable row level security;

-- Permitir leitura pública de lojas ativas
create policy "public_read_active_stores" on stores
  for select using (status = 'active');

-- Permitir proprietário gerenciar sua própria loja
create policy "owner_manage_store" on stores
  for all using (auth.uid() = owner_id);

-- Índices
create index on stores (owner_id);
create index on stores (status);

-- ============================================
-- 3. FUNÇÃO para sincronizar profiles com auth.users
-- ============================================
create or replace function public.sync_profile()
returns trigger as $$
begin
  insert into profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do update set email = new.email;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para auto-criar perfil ao registrar novo usuário
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.sync_profile();