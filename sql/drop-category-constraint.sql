-- =============================================================
-- Migração: remover constraint de categoria para permitir
-- categorias amigáveis como "Restaurante", "Lanchonete" etc.
-- =============================================================
-- Execute este script no Supabase SQL Editor (uma única vez).

-- 1. Remove o constraint antigo que só admitia 'varejo' e 'alimentacao'
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_category_check;

-- 2. Mantém os valores legados válidos (retrocompatível)
-- Não é necessário alterar rows existentes; 'varejo' e 'alimentacao'
-- ainda são valores aceitos e continuarão funcionando.

SELECT 'Constraint de categoria removido com sucesso!' AS result;
