#!/usr/bin/env node

/**
 * Script para inserir dados de teste via Supabase SQL Editor
 * Este script gera um arquivo com as queries SQL necessárias
 */

const fs = require('fs');

const sqlContent = `
-- Script de seed para tabela de notícias no Supabase
-- Execute este script no SQL Editor do Supabase Console

-- Limpar dados antigos (opcional - descomente se necessário)
-- DELETE FROM news;
-- ALTER SEQUENCE news_id_seq RESTART WITH 1;

-- Inserir notícias de exemplo
INSERT INTO news (title, summary, content, source, image_urls, published_at) VALUES
(
  'Portal Modelo inaugura seção de notícias',
  'Bem-vindo ao Portal Modelo! Este é o primeiro teste de notícia com suporte a múltiplas imagens.',
  '<p>Bem-vindo ao <strong>Portal Modelo</strong>!</p><p>Este é um conteúdo HTML de exemplo com formatação.</p><p>Você pode incluir:</p><ul><li>Títulos e parágrafos</li><li>Listas</li><li>Links</li><li>Imagens</li></ul><p>Tudo em HTML.</p>',
  'Portal Modelo',
  '["https://via.placeholder.com/800x450.png?text=Portal+Modelo"]'::jsonb,
  NOW()
),
(
  'Como usar o Portal Modelo',
  'Guia rápido para entender as principais funcionalidades da plataforma.',
  '<p>O <strong>Portal Modelo</strong> oferece várias funcionalidades para sua comunidade:</p><ul><li><strong>Lojas:</strong> Registre e gerencie sua loja online</li><li><strong>Classificados:</strong> Compre, venda e troque itens</li><li><strong>Profissionais:</strong> Encontre e contrate profissionais</li><li><strong>Notícias:</strong> Mantenha-se informado</li></ul><p>Cada seção oferece ferramentas específicas para melhor atender suas necessidades.</p>',
  'Portal Modelo',
  '["https://via.placeholder.com/800x450.png?text=Como+Usar"]'::jsonb,
  NOW() - INTERVAL '1 day'
),
(
  'Dicas para melhorar seu empreendimento',
  'Conselhos práticos para aumentar visibilidade e vendas no Portal Modelo.',
  '<p>Aumente suas chances de sucesso no Portal Modelo com estas dicas:</p><ol><li><strong>Fotos de qualidade:</strong> Use imagens claras e bem iluminadas</li><li><strong>Descrição detalhada:</strong> Quanto mais informações, melhor</li><li><strong>Atualização regular:</strong> Mantenha conteúdo fresco</li><li><strong>Interação:</strong> Responda mensagens rapidamente</li><li><strong>Preços competitivos:</strong> Pesquise o mercado</li></ol>',
  'Blog Portal',
  '["https://via.placeholder.com/800x450.png?text=Dicas"]'::jsonb,
  NOW() - INTERVAL '2 days'
);

-- Verificar dados inseridos
SELECT 'Notícias inseridas com sucesso!' as msg;
SELECT COUNT(*) as total_noticias FROM news;
`;

const filename = 'supabase-seed-manual.sql';
fs.writeFileSync(filename, sqlContent);
console.log('✓ Arquivo gerado: ' + filename);
console.log('\n📋 Instruções:');
console.log('1. Acesse: https://app.supabase.com');
console.log('2. Acesse seu projeto Portal Modelo');
console.log('3. Vá em "SQL Editor"');
console.log('4. Clique em "+ New Query"');
console.log('5. Cole o conteúdo do arquivo ' + filename);
console.log('6. Execute a query (Ctrl+Enter ou clique em "Run")');
console.log('\nOu abra o arquivo manualmente em qualquer editor de texto.');
