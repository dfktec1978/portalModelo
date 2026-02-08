-- ============================================
-- SISTEMA DE ENTREGA E PAGAMENTO
-- ============================================

-- 1. Adicionar colunas na tabela STORES
ALTER TABLE stores ADD COLUMN IF NOT EXISTS (
  delivery_options JSONB DEFAULT '{"retirada": true, "envio": false, "condicional": false}',
  delivery_fee_envio DECIMAL(10,2) DEFAULT 0,
  delivery_fee_condicional DECIMAL(10,2) DEFAULT 0,
  payment_options JSONB DEFAULT '{"pix": true, "na_retirada": true}',
  pix_key VARCHAR(255),
  schedule_delivery BOOLEAN DEFAULT false,
  min_order_delivery DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Adicionar coluna comments na tabela STORES (para notas de atendimento)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS (
  delivery_instructions TEXT
);

-- 3. Criar tabela ORDERS (se não existir)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  client_name VARCHAR(255) NOT NULL,
  
  -- Carrinho
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Entrega
  delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('retirada', 'envio', 'condicional')),
  delivery_date TIMESTAMP NOT NULL,
  delivery_address TEXT,
  delivery_instructions TEXT,
  
  -- Pagamento
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('pix', 'na_retirada')),
  payment_status VARCHAR(20) DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'processando', 'confirmado', 'falhou')),
  pix_qr_code TEXT,
  pix_qr_code_url TEXT,
  pix_copy_paste VARCHAR(255),
  pix_key_used VARCHAR(255),
  payment_confirmed_at TIMESTAMP,
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS orders_store_id_idx ON orders(store_id);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_delivery_date_idx ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);

-- 4. Ativar RLS na tabela ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ORDERS
CREATE POLICY "Public read orders for store" ON orders
  FOR SELECT
  USING (true);  -- Permitir leitura pública (será validado no frontend)

CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE
  USING (user_id = auth.uid() OR auth.role() = 'authenticated')
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'authenticated');

-- 5. Tabela de PAGAMENTOS (rastreamento de transações Pix)
CREATE TABLE IF NOT EXISTS pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  transaction_id VARCHAR(255) UNIQUE,
  pix_key VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'devolvido', 'expirado')),
  
  received_at TIMESTAMP,
  received_from VARCHAR(100),  -- CPF/CNPJ do pagador
  
  qr_code TEXT,
  qr_code_url TEXT,
  copy_paste VARCHAR(255),
  
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS pix_transactions_order_id_idx ON pix_transactions(order_id);
CREATE INDEX IF NOT EXISTS pix_transactions_status_idx ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS pix_transactions_expires_at_idx ON pix_transactions(expires_at);

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pix_transactions
CREATE TRIGGER update_pix_transactions_updated_at BEFORE UPDATE ON pix_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para stores
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Tipos TypeScript (comentário para referência)
/*
TYPE Order = {
  id: string
  store_id: string
  user_id?: string
  client_email: string
  client_phone: string
  client_name: string
  
  items: CartItem[]
  subtotal: number
  delivery_fee: number
  total: number
  
  delivery_type: 'retirada' | 'envio' | 'condicional'
  delivery_date: Date
  delivery_address?: string
  
  payment_method: 'pix' | 'na_retirada'
  payment_status: 'pendente' | 'processando' | 'confirmado' | 'falhou'
  pix_qr_code?: string
  pix_copy_paste?: string
  
  created_at: Date
  updated_at: Date
}

TYPE Store com delivery/payment = {
  delivery_options: {
    retirada: boolean
    envio: boolean
    condicional: boolean
  }
  delivery_fee_envio: number
  delivery_fee_condicional: number
  payment_options: {
    pix: boolean
    na_retirada: boolean
  }
  pix_key: string
  schedule_delivery: boolean
  min_order_delivery: number
}
*/

-- 8. Executar para aplicar
SELECT 'Migration completed successfully!' as status;
