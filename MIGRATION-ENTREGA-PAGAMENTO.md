# 📋 Instrução: Aplicar Migration de Entrega e Pagamento

## ⚡ Passo 1: Acessar Supabase Dashboard

1. Abra [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto Portal Modelo
3. Vá para **SQL Editor** (lado esquerdo)

## 📝 Passo 2: Executar SQL

### Opção A: Executar completo
1. Clique em **New Query**
2. Copie TODO o conteúdo de: `sql/add-delivery-payment-system.sql`
3. Cole no editor
4. Clique **Run** (Ctrl+Enter)
5. Aguarde 10-20 segundos

### Opção B: Executar em partes (se houver erro)

Se ocorrer erro, execute CADA statement separadamente:

```sql
-- 1️⃣ Adicionar colunas na tabela STORES
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '{"retirada": true, "envio": false, "condicional": false}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_fee_envio DECIMAL(10,2) DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_fee_condicional DECIMAL(10,2) DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_options JSONB DEFAULT '{"pix": true, "na_retirada": true}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS schedule_delivery BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS min_order_delivery DECIMAL(10,2) DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
```

```sql
-- 2️⃣ Criar tabela ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  client_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('retirada', 'envio', 'condicional')),
  delivery_date TIMESTAMP NOT NULL,
  delivery_address TEXT,
  delivery_instructions TEXT,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('pix', 'na_retirada')),
  payment_status VARCHAR(20) DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'processando', 'confirmado', 'falhou')),
  pix_qr_code TEXT,
  pix_qr_code_url TEXT,
  pix_copy_paste VARCHAR(255),
  pix_key_used VARCHAR(255),
  payment_confirmed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

```sql
-- 3️⃣ Criar índices
CREATE INDEX IF NOT EXISTS orders_store_id_idx ON orders(store_id);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_delivery_date_idx ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
```

```sql
-- 4️⃣ Ativar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'authenticated');
```

```sql
-- 5️⃣ Criar tabela PIX_TRANSACTIONS
CREATE TABLE IF NOT EXISTS pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE,
  pix_key VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'devolvido', 'expirado')),
  received_at TIMESTAMP,
  received_from VARCHAR(100),
  qr_code TEXT,
  qr_code_url TEXT,
  copy_paste VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pix_transactions_order_id_idx ON pix_transactions(order_id);
CREATE INDEX IF NOT EXISTS pix_transactions_status_idx ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS pix_transactions_expires_at_idx ON pix_transactions(expires_at);
```

```sql
-- 6️⃣ Criar função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pix_transactions_updated_at BEFORE UPDATE ON pix_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## ✅ Passo 3: Verificar

Após executar, verifique que tudo funcionou:

```sql
-- Ver tabelas criadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Ver colunas da stores
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stores';

-- Ver RLS da orders
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

## 🚨 Se houver erro

**Erro comum:** "column X of relation Y already exists"
- **Solução:** Já foi aplicado antes, ou coluna existe. Execute o script todo de novo - tem `IF NOT EXISTS` para evitar duplicatas.

**Erro:** "cannot execute CREATE TRIGGER within a transaction block"
- **Solução:** Não coloque CREATE TRIGGER junto com ALTER TABLE. Execute em blocos separados.

## 📊 Próximos passos

1. ✅ Migration aplicada
2. 👷 Criar components React (DeliverySelectionModal, PaymentSelectionModal)
3. 🔌 Integrar Pix (Gerencianet)
4. 📦 Implementar fluxo de checkout
5. 👨‍💼 Painel lojista - configurações

---

**Status:** Pronto para aplicar!
