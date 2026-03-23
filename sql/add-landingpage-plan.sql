-- Adicionar Plano Landing Page na tabela store_plan_settings
-- Execute no SQL Editor do Supabase Console

-- 1. Remover a constraint antiga que só permite presenca/destaque/premium
ALTER TABLE public.store_plan_settings
  DROP CONSTRAINT IF EXISTS store_plan_settings_id_check;

-- 2. Recriar a constraint incluindo o novo plano
ALTER TABLE public.store_plan_settings
  ADD CONSTRAINT store_plan_settings_id_check
  CHECK (id IN ('presenca', 'landingpage', 'destaque', 'premium'));

-- 3. Inserir ou atualizar o novo plano
INSERT INTO store_plan_settings (id, name, price_label, product_limit, photo_limit, priority_weight, updated_at)
VALUES (
  'landingpage',
  'Plano Landing Page',
  'R$ 44,90/mês',
  0,
  10,
  1,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  price_label     = EXCLUDED.price_label,
  product_limit   = EXCLUDED.product_limit,
  photo_limit    = EXCLUDED.photo_limit,
  priority_weight = EXCLUDED.priority_weight,
  updated_at     = NOW();

-- Confirmar
SELECT id, name, price_label, product_limit, photo_limit, priority_weight
FROM store_plan_settings
ORDER BY priority_weight, id;
