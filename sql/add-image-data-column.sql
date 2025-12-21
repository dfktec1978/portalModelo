-- Adicionar coluna image_data à tabela news se não existir
-- Execute no Supabase Console: https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new

-- Verificar se a coluna existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'news' AND column_name = 'image_data'
    ) THEN
        ALTER TABLE news ADD COLUMN image_data TEXT;
        RAISE NOTICE 'Coluna image_data adicionada à tabela news';
    ELSE
        RAISE NOTICE 'Coluna image_data já existe na tabela news';
    END IF;
END $$;

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'news'
ORDER BY ordinal_position;