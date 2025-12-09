#!/usr/bin/env node

/**
 * Script para popular dados de exemplo no Supabase
 * Uso: SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/supabase-seed.js
 * 
 * Nota: Este script usa SERVICE_ROLE_KEY (server-side) e deve ser executado localmente ou em CI/CD,
 * nunca exponha a chave no cliente.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  console.error('   Use: SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/supabase-seed.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log('🌱 Iniciando seed de dados...\n');

  try {
    // ============================================
    // 1. Inserir notícias de exemplo
    // ============================================
    console.log('📰 Inserindo notícias...');
    const newsData = [
      {
        title: 'Portal Modelo inaugura seção de notícias',
        summary: 'Bem-vindo ao Portal Modelo! Este é o primeiro teste de notícia.',
        content: '<p>Bem-vindo ao Portal Modelo! Este é um conteúdo HTML de exemplo.</p><p>Você pode incluir formatação e links aqui.</p>',
        source: 'Portal Modelo',
        image_urls: JSON.stringify(['https://via.placeholder.com/800x450.png?text=Portal+Modelo']),
        published_at: new Date().toISOString(),
      },
      {
        title: 'Como usar o Portal Modelo',
        summary: 'Guia rápido para entender as principais funcionalidades.',
        content: '<p>O Portal Modelo oferece várias funcionalidades:</p><ul><li>Lojas</li><li>Classificados</li><li>Profissionais</li><li>Notícias</li></ul>',
        source: 'Portal Modelo',
        image_urls: JSON.stringify(['https://via.placeholder.com/800x450.png?text=Como+Usar']),
        published_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
      },
      {
        title: 'Dicas para melhorar seu empreendimento',
        summary: 'Confira estratégias úteis para crescer seu negócio.',
        content: '<p>Aqui estão algumas dicas para melhorar seu empreendimento:</p><p>1. Mantenha a comunicação ativa com clientes</p><p>2. Invista em redes sociais</p><p>3. Escute feedback</p>',
        source: 'Redação',
        image_urls: JSON.stringify(['https://via.placeholder.com/800x450.png?text=Dicas+Negocio']),
        published_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
      },
    ];

    for (const news of newsData) {
      const { error } = await supabase.from('news').insert([news]);
      if (error) {
        console.warn(`  ⚠️  Erro ao inserir notícia "${news.title}": ${error.message}`);
      } else {
        console.log(`  ✅ Notícia inserida: "${news.title}"`);
      }
    }

    console.log('\n✅ Seed concluído com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   - Notícias: ${newsData.length} inseridas`);
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse http://localhost:3000/supabase-test');
    console.log('   2. Verifique se as notícias aparecem na lista');
    console.log('   3. Adapte as queries do app conforme necessário\n');

  } catch (err) {
    console.error('❌ Erro durante seed:', err);
    process.exit(1);
  }
}

seed();
