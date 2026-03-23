-- ============================================================
-- CREDENCIAIS EFÍ PAY POR LOJISTA
-- Cada lojista cadastra suas próprias credenciais.
-- O dinheiro vai direto para a conta deles (Sicoob/Sicredi).
-- ============================================================

-- 1. Flags não-sensíveis na tabela stores (o frontend pode ler)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS efi_configured BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_methods_enabled JSONB 
  DEFAULT '{"pix": true, "boleto": false, "card_debit": false}';

-- 2. Tabela separada para credenciais sensíveis
--    RLS sem política de SELECT = ninguém lê pelo client (apenas service role)
CREATE TABLE IF NOT EXISTS store_payment_credentials (
  store_id    UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  efi_client_id       TEXT,
  efi_client_secret   TEXT,          -- sensível
  efi_certificate_b64 TEXT,          -- base64 do .p12 — muito sensível
  efi_sandbox         BOOLEAN DEFAULT true,
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE store_payment_credentials ENABLE ROW LEVEL SECURITY;

-- SEM política de SELECT → apenas service_role pode ler
-- SEM política de INSERT/UPDATE → apenas service_role pode escrever
-- (O portal usa supabaseAdmin nas API routes para ler/escrever)

-- 3. Índice
CREATE INDEX IF NOT EXISTS store_payment_credentials_store_id_idx
  ON store_payment_credentials(store_id);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION update_payment_creds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_payment_creds_updated_at ON store_payment_credentials;
CREATE TRIGGER trg_payment_creds_updated_at
  BEFORE UPDATE ON store_payment_credentials
  FOR EACH ROW EXECUTE FUNCTION update_payment_creds_updated_at();

SELECT 'Migration Efí Pay credentials: OK' AS status;
