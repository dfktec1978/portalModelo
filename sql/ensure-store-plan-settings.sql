-- Script manual para garantir a tabela de configuração dos planos de loja.
-- Pode ser executado diretamente no SQL Editor do Supabase.

create table if not exists public.store_plan_settings (
  id text primary key,
  name text not null,
  price_label text not null,
  product_limit integer not null default 0,
  photo_limit integer not null default 10,
  priority_weight integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint store_plan_settings_id_check check (id in ('presenca', 'landingpage', 'destaque', 'premium')),
  constraint store_plan_settings_product_limit_check check (product_limit >= 0),
  constraint store_plan_settings_photo_limit_check check (photo_limit >= 0),
  constraint store_plan_settings_priority_weight_check check (priority_weight >= 0)
);

insert into public.store_plan_settings (id, name, price_label, product_limit, photo_limit, priority_weight)
values
  ('presenca', 'Plano Presença', 'Grátis', 0, 10, 1),
  ('destaque', 'Plano Destaque', 'R$ 89,90/mês', 70, 5, 2),
  ('premium', 'Plano Premium', 'R$ 129,90/mês', 300, 5, 3)
on conflict (id) do update
set
  name = excluded.name,
  price_label = excluded.price_label,
  product_limit = excluded.product_limit,
  photo_limit = excluded.photo_limit,
  priority_weight = excluded.priority_weight,
  updated_at = now();
