-- Adicionar campos para aceite de termos à tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna para aceite de termos (boolean)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms boolean default false;

-- Adicionar coluna para versão dos termos aceitos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version text;

-- Adicionar coluna para data/hora do aceite
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Adicionar comentários às colunas (opcional, para documentação)
COMMENT ON COLUMN profiles.accepted_terms IS 'Se o usuário aceitou os termos de uso';
COMMENT ON COLUMN profiles.terms_version IS 'Versão dos termos aceitos (ex: v1.0)';
COMMENT ON COLUMN profiles.accepted_at IS 'Data e hora do aceite dos termos';