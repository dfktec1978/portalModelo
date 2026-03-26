-- ============================================================
-- MIGRATION INCREMENTAL: HARDENING COBRANCA MENSAL PIX
-- Data: 2026-03-26
-- Objetivo:
-- 1) Definir PIX como metodo padrao para novas faturas
-- 2) Garantir constraints explicitas de provider/metodo
-- 3) Garantir indices para reconciliacao por provider_charge_id
-- ============================================================

-- Ajusta default para novas linhas (nao altera historico existente)
ALTER TABLE IF EXISTS public.monthly_billing_invoices
  ALTER COLUMN payment_method SET DEFAULT 'pix';

-- Normaliza apenas registros sem metodo definido
UPDATE public.monthly_billing_invoices
SET payment_method = 'pix'
WHERE payment_method IS NULL;

-- Indice para lookup rapido por txid/provider_charge_id (webhook)
CREATE INDEX IF NOT EXISTS monthly_billing_invoices_provider_charge_idx
  ON public.monthly_billing_invoices(provider_charge_id);

-- Unicidade parcial para evitar reconciliacao ambigua de txid
CREATE UNIQUE INDEX IF NOT EXISTS monthly_billing_invoices_provider_charge_unique_idx
  ON public.monthly_billing_invoices(provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;

-- Constraints explicitas (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monthly_billing_invoices_payment_provider_check'
  ) THEN
    ALTER TABLE public.monthly_billing_invoices
      ADD CONSTRAINT monthly_billing_invoices_payment_provider_check
      CHECK (payment_provider IN ('efi', 'inter'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monthly_billing_invoices_payment_method_check'
  ) THEN
    ALTER TABLE public.monthly_billing_invoices
      ADD CONSTRAINT monthly_billing_invoices_payment_method_check
      CHECK (payment_method IN ('pix', 'boleto'));
  END IF;
END $$;

SELECT 'Monthly billing PIX hardening migration: OK' AS status;
