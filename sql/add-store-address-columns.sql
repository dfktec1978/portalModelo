-- Adicionar colunas de endereço e configurações à tabela stores

-- Colunas de endereço
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS zipcode TEXT;

-- Configurações adicionais
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Comentários
COMMENT ON COLUMN stores.address IS 'Endereço completo da loja (rua, número, complemento)';
COMMENT ON COLUMN stores.city IS 'Cidade da loja';
COMMENT ON COLUMN stores.state IS 'Estado (UF) da loja';
COMMENT ON COLUMN stores.zipcode IS 'CEP da loja';
COMMENT ON COLUMN stores.delivery_fee IS 'Taxa de entrega padrão (para categoria alimentacao)';
COMMENT ON COLUMN stores.is_active IS 'Se a loja está ativa (lojista pode desativar temporariamente)';
