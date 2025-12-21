-- Supabase — Portal Modelo — Inicialização de Tabelas
-- Cole este arquivo no SQL Editor do Supabase e execute
-- Isso criará tabelas, índices e políticas de segurança básicas

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

-- Permitir admin ler todos os perfis
create policy "admin can read all profiles" on profiles
  for select using (auth.uid() in (select id from profiles where role = 'admin'));

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

-- Permitir proprietário ler sua própria loja
create policy "owner_read_store" on stores
  for select using (auth.uid() = owner_id);

-- Permitir admin ler todas as lojas
create policy "admin_read_all_stores" on stores
  for select using (auth.uid() in (select id from profiles where role = 'admin'));

create index on stores (owner_id);
create index on stores (status);
create index on stores (created_at desc);

-- ============================================
-- 3. TABELA news (notícias)
-- ============================================
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content text,
  link text,
  source text,
  image_urls jsonb,         -- array de URLs (Firebase Storage ou Supabase Storage)
  published_at timestamptz default now(),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table news enable row level security;

-- Permitir leitura pública de notícias
create policy "public_read_news" on news
  for select using (true);

-- Permitir inserção apenas para admin
-- NOTE: para políticas `FOR INSERT` o Postgres/Supabase aceita apenas `WITH CHECK`,
-- a cláusula `USING` não é permitida. Removemos o USING e mantivemos a checagem.
create policy "admin_insert_news" on news
  for insert with check (auth.uid() in (select id from profiles where role = 'admin'));

-- Permitir update apenas para criador ou admin
create policy "admin_update_news" on news
  for update using (created_by = auth.uid() or auth.uid() in (select id from profiles where role = 'admin'))
  with check (created_by = auth.uid() or auth.uid() in (select id from profiles where role = 'admin'));

-- Permitir delete apenas para admin
create policy "admin_delete_news" on news
  for delete using (auth.uid() in (select id from profiles where role = 'admin'));

create index on news (published_at desc);
create index on news using gin (image_urls);

-- ============================================
-- 4. TABELA audit_logs (logs de auditoria)
-- ============================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text,
  meta jsonb,
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;

-- Permitir admin ler logs
create policy "admin_read_audit_logs" on audit_logs
  for select using (auth.uid() in (select id from profiles where role = 'admin'));

-- Permitir qualquer usuário autenticado escrever logs (será controlado via app ou trigger)
-- Para INSERT usamos apenas WITH CHECK
create policy "authenticated_insert_audit_logs" on audit_logs
  for insert with check (auth.uid() is not null);

create index on audit_logs (created_at desc);

-- ============================================
-- 5. TABELA classifieds (classificados)
-- ============================================
create table if not exists classifieds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  location text,
  price numeric,
  image_urls jsonb,
  seller_id uuid references profiles(id) on delete cascade,
  status text default 'active', -- 'active', 'sold', 'removed'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table classifieds enable row level security;

-- Permitir leitura pública de classificados ativos
create policy "public_read_active_classifieds" on classifieds
  for select using (status = 'active');

-- Permitir vendedor ler seus próprios anúncios
create policy "seller_read_own_classifieds" on classifieds
  for select using (seller_id = auth.uid());

create index on classifieds (seller_id);
create index on classifieds (status);
create index on classifieds (created_at desc);

-- ============================================
-- 6. TABELA professionals (profissionais)
-- ============================================
create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  specialty text,
  bio text,
  image_url text,
  status text default 'pending', -- 'pending', 'active', 'blocked'
  created_at timestamptz default now()
);

alter table professionals enable row level security;

-- Permitir leitura pública de profissionais ativos
create policy "public_read_active_professionals" on professionals
  for select using (status = 'active');

-- Permitir profissional ler seu próprio perfil
create policy "professional_read_own" on professionals
  for select using (profile_id = auth.uid());

-- Permitir admin ler todos
create policy "admin_read_all_professionals" on professionals
  for select using (auth.uid() in (select id from profiles where role = 'admin'));

create index on professionals (profile_id);
create index on professionals (status);

-- ============================================
-- 7. FUNÇÃO para sincronizar profiles com auth.users
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

-- ============================================
-- 8. FUNÇÃO para executar SQL arbitrário (apenas para admin)
-- ============================================
create or replace function public.exec_sql(sql text)
returns void as $$
begin
  -- Apenas admin pode executar
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Acesso negado: apenas administradores podem executar SQL';
  end if;
  
  execute sql;
end;
$$ language plpgsql security definer;

-- ============================================
-- 9. COMENTÁRIOS E OBSERVAÇÕES
-- ============================================
-- RLS (Row Level Security) está habilitado em todas as tabelas
-- Políticas padrão permitem leitura pública de dados públicos
-- Admin (role = 'admin') pode ler/escrever dados sensíveis
-- Para usar custom claims (recomendado para produção), configure auth.jwt() ->> 'role' = 'admin'
-- Trigger sync_profile() cria automaticamente um row em profiles quando novo usuário se registra
