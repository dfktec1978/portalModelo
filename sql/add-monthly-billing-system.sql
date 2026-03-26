-- ============================================================
-- COBRANCA MENSAL AUTOMATICA DO PORTAL (LOJISTAS)
-- Vencimento padrao: dia 15
-- Lembrete por e-mail: 5 dias antes (dia 10)
-- Fluxo principal atual: PIX (boleto permanece suportado)
-- ============================================================

ALTER TABLE stores ADD COLUMN IF NOT EXISTS billing_day SMALLINT DEFAULT 15;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS billing_enabled BOOLEAN DEFAULT true;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS billing_email TEXT;

CREATE TABLE IF NOT EXISTS monthly_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  reference_month DATE NOT NULL, -- sempre primeiro dia do mes: YYYY-MM-01
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'expired', 'canceled')),

  payment_provider VARCHAR(20) DEFAULT 'efi', -- efi | inter
  payment_method VARCHAR(20) DEFAULT 'pix', -- pix | boleto

  provider_charge_id TEXT,
  boleto_barcode TEXT,
  boleto_link TEXT,
  boleto_pdf TEXT,

  reminder_sent_at TIMESTAMP,
  paid_at TIMESTAMP,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT monthly_billing_unique_store_month UNIQUE(store_id, reference_month)
);

CREATE INDEX IF NOT EXISTS monthly_billing_invoices_store_idx
  ON monthly_billing_invoices(store_id);

CREATE INDEX IF NOT EXISTS monthly_billing_invoices_due_date_idx
  ON monthly_billing_invoices(due_date);

CREATE INDEX IF NOT EXISTS monthly_billing_invoices_status_idx
  ON monthly_billing_invoices(status);

CREATE INDEX IF NOT EXISTS monthly_billing_invoices_provider_charge_idx
  ON monthly_billing_invoices(provider_charge_id);

CREATE UNIQUE INDEX IF NOT EXISTS monthly_billing_invoices_provider_charge_unique_idx
  ON monthly_billing_invoices(provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monthly_billing_invoices_payment_provider_check'
  ) THEN
    ALTER TABLE monthly_billing_invoices
      ADD CONSTRAINT monthly_billing_invoices_payment_provider_check
      CHECK (payment_provider IN ('efi', 'inter'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monthly_billing_invoices_payment_method_check'
  ) THEN
    ALTER TABLE monthly_billing_invoices
      ADD CONSTRAINT monthly_billing_invoices_payment_method_check
      CHECK (payment_method IN ('pix', 'boleto'));
  END IF;
END $$;

ALTER TABLE monthly_billing_invoices ENABLE ROW LEVEL SECURITY;

-- Somente service_role deve manipular cobranca mensal automatica.
-- (Sem policies de client anon/authenticated).

CREATE OR REPLACE FUNCTION update_monthly_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_monthly_billing_updated_at ON monthly_billing_invoices;
CREATE TRIGGER trg_monthly_billing_updated_at
  BEFORE UPDATE ON monthly_billing_invoices
  FOR EACH ROW EXECUTE FUNCTION update_monthly_billing_updated_at();

SELECT 'Monthly billing migration: OK' AS status;
