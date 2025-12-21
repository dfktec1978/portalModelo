-- Adicionar função exec_sql e coluna hero_image_index
-- Execute este SQL no painel do Supabase ou via script

-- Função para executar SQL (apenas admin)
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  -- Apenas admin pode executar
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar SQL';
  END IF;

  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar coluna hero_image_index à tabela news
ALTER TABLE news ADD COLUMN IF NOT EXISTS hero_image_index INTEGER DEFAULT 0;