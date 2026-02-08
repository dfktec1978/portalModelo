-- ========================================
-- TABELA DE PEDIDOS (ORDERS)
-- ========================================

-- Remover tabela antiga se existir (para recriar com estrutura completa)
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relações
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informações do Cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Endereço de Entrega
  delivery_address TEXT,
  delivery_neighborhood VARCHAR(100),
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(2),
  delivery_zipcode VARCHAR(10),
  delivery_complement TEXT,
  delivery_reference TEXT,
  
  -- Itens do Pedido (JSONB)
  -- Formato: [{ product_id, name, price, quantity, additionals: [...] }]
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Valores
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Status do Pedido
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Valores possíveis: 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
  
  -- Tipo de Entrega
  delivery_type VARCHAR(20) NOT NULL DEFAULT 'delivery',
  -- Valores: 'delivery', 'pickup'
  
  -- Pagamento
  payment_method VARCHAR(50),
  -- Valores: 'pix', 'credit_card', 'debit_card', 'cash', 'other'
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Valores: 'pending', 'paid', 'failed', 'refunded'
  
  -- Observações
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Índice GIN para pesquisas em items (JSONB)
CREATE INDEX IF NOT EXISTS idx_orders_items ON orders USING gin (items);

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON TABLE orders IS 'Pedidos realizados nas lojas';
COMMENT ON COLUMN orders.store_id IS 'ID da loja que recebeu o pedido';
COMMENT ON COLUMN orders.customer_id IS 'ID do usuário autenticado (pode ser NULL para pedidos de visitantes)';
COMMENT ON COLUMN orders.items IS 'Array JSON com itens do pedido';
COMMENT ON COLUMN orders.status IS 'Status atual do pedido (pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled)';
COMMENT ON COLUMN orders.delivery_type IS 'Tipo de entrega: delivery (entrega) ou pickup (retirada)';
COMMENT ON COLUMN orders.payment_method IS 'Método de pagamento escolhido';
COMMENT ON COLUMN orders.payment_status IS 'Status do pagamento';

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy 1: Lojistas podem ver todos os pedidos das suas lojas
DROP POLICY IF EXISTS "Store owners can view their store orders" ON orders;
CREATE POLICY "Store owners can view their store orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Policy 2: Lojistas podem atualizar pedidos das suas lojas
DROP POLICY IF EXISTS "Store owners can update their store orders" ON orders;
CREATE POLICY "Store owners can update their store orders"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Policy 3: Clientes autenticados podem ver seus próprios pedidos
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
CREATE POLICY "Customers can view their own orders"
ON orders FOR SELECT
USING (customer_id = auth.uid());

-- Policy 4: Qualquer um autenticado pode criar pedidos
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 5: Admins podem ver todos os pedidos
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ========================================
-- TRIGGER PARA UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- ========================================
-- TRIGGER PARA ATUALIZAR TIMESTAMPS DE STATUS
-- ========================================

CREATE OR REPLACE FUNCTION update_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at = now();
  END IF;
  
  -- Se status mudou para 'ready'
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    NEW.ready_at = now();
  END IF;
  
  -- Se status mudou para 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = now();
  END IF;
  
  -- Se status mudou para 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_status_timestamps ON orders;
CREATE TRIGGER order_status_timestamps
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_order_status_timestamps();
