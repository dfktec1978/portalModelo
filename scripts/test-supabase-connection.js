#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase
 * Uso: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('🔍 Testando conexão com Supabase...\n');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

  try {
    // Test 1: Check health
    console.log('✓ Cliente Supabase inicializado');

    // Test 2: Query news table
    console.log('\n📰 Tentando buscar notícias da tabela "news"...');
    const { data, error, status } = await supabase
      .from('news')
      .select('*')
      .limit(5);

    if (error) {
      console.error(`❌ Erro ao buscar notícias: ${error.message}`);
      console.error(`   Código: ${error.code}`);
    } else {
      console.log(`✓ Sucesso! Status: ${status}`);
      console.log(`  Total de notícias retornadas: ${data?.length || 0}`);
      if (data && data.length > 0) {
        console.log('\n  Primeiras notícias:');
        data.slice(0, 2).forEach((news, i) => {
          console.log(`    ${i + 1}. ${news.title}`);
        });
      }
    }

    // Test 3: Check other tables
    console.log('\n🗂️  Verificando existência de outras tabelas...');
    const tables = ['profiles', 'stores', 'classifieds', 'professionals', 'audit_logs'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('1').limit(1);
      const status = error ? '❌' : '✓';
      console.log(`  ${status} ${table}`);
    }

    console.log('\n✅ Teste de conexão concluído!\n');
  } catch (e) {
    console.error('❌ Erro inesperado:', e);
    process.exit(1);
  }
}

test();
