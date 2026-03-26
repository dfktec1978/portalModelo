-- Atualiza o CHECK de theme_color para aceitar os novos temas
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_theme_check;

ALTER TABLE stores ADD CONSTRAINT stores_theme_check
CHECK (
  theme_color IN (
    'azul',
    'verde',
    'preto-branco',
    'vermelho',
    'roxo',
    'laranja',
    'petroleo',
    'terracota'
  )
);

-- Verificação rápida
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'stores_theme_check';
