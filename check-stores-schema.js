#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkStoresSchema() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Verificando schema da tabela stores...\n');

  const { data, error } = await admin
    .from('stores')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('📊 Colunas encontradas na tabela stores:');
    console.log('─'.repeat(50));
    Object.keys(data[0]).forEach(col => {
      console.log(`  • ${col}`);
    });
    console.log('─'.repeat(50));
    console.log(`\nTotal de colunas: ${Object.keys(data[0]).length}`);
  } else {
    console.log('⚠️ Nenhuma loja encontrada no banco');
  }
}

checkStoresSchema();
