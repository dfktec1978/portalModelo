#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function initDatabase() {
  try {
    console.log('🔧 Inicializando banco de dados do Supabase...');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'supabase-init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executando SQL de inicialização...');

    // Executar o SQL usando a função exec_sql
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error.message);
      return;
    }

    console.log('✅ Banco de dados inicializado com sucesso!');

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    const tables = ['profiles', 'stores', 'news', 'classifieds', 'professionals', 'audit_logs'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: OK`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Erro inesperado`);
      }
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

initDatabase();