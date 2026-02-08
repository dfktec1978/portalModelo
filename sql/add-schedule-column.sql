-- Adicionar coluna schedule à tabela stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT NULL;

-- Comentário
COMMENT ON COLUMN stores.schedule IS 'Horários de funcionamento por dia da semana (JSONB)';

-- Índice para queries
CREATE INDEX IF NOT EXISTS idx_stores_schedule ON stores USING gin (schedule);
