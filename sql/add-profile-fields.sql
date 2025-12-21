-- Adicionar campos de foto de perfil e redes sociais à tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna para foto de perfil (URL da imagem)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image text;

-- Adicionar coluna para Instagram
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram text;

-- Adicionar coluna para Facebook
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook text;

-- Adicionar comentários às colunas (opcional, para documentação)
COMMENT ON COLUMN profiles.profile_image IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN profiles.instagram IS 'Nome de usuário do Instagram (sem @)';
COMMENT ON COLUMN profiles.facebook IS 'URL ou nome de usuário do Facebook';