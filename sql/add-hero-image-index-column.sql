-- Adicionar coluna hero_image_index à tabela news
ALTER TABLE news ADD COLUMN IF NOT EXISTS hero_image_index INTEGER DEFAULT 0;