#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectSchema() {
  console.log('🔍 Verificando estrutura das tabelas...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Verificar colunas de professionals
  console.log('📋 Colunas em professionals:');
  const { data: profCols, error: profErr } = await supabase.rpc('get_table_columns', {
    table_name: 'professionals'
  }).catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

  if (profErr) {
    console.log('   (RPC indisponível, tentando query info_schema)');
  }

  // Query info_schema diretamente via supabase
  const { data: infoCols } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'professionals')
    .catch(() => ({ data: null }));

  if (infoCols && infoCols.length > 0) {
    infoCols.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
  } else {
    console.log('   (Não foi possível obter via info_schema)');
  }

  // Tentar ler um registro de professionals para ver estrutura real
  console.log('\n📋 Estrutura real (primeira linha de professionals):');
  const { data: profData, error: profReadErr } = await supabase
    .from('professionals')
    .select('*')
    .limit(1);

  if (profReadErr) {
    console.log(`   ✗ Erro ao ler: ${profReadErr.message}`);
  } else if (profData && profData.length > 0) {
    console.log('   Colunas encontradas:');
    Object.keys(profData[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof profData[0][key]}`);
    });
  } else {
    console.log('   (Tabela vazia)');
  }

  // Repetir para stores
  console.log('\n📋 Estrutura real (primeira linha de stores):');
  const { data: storeData, error: storeReadErr } = await supabase
    .from('stores')
    .select('*')
    .limit(1);

  if (storeReadErr) {
    console.log(`   ✗ Erro ao ler: ${storeReadErr.message}`);
  } else if (storeData && storeData.length > 0) {
    console.log('   Colunas encontradas:');
    Object.keys(storeData[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof storeData[0][key]}`);
    });
  } else {
    console.log('   (Tabela vazia)');
  }

  // Repetir para classifieds
  console.log('\n📋 Estrutura real (primeira linha de classifieds):');
  const { data: classData, error: classReadErr } = await supabase
    .from('classifieds')
    .select('*')
    .limit(1);

  if (classReadErr) {
    console.log(`   ✗ Erro ao ler: ${classReadErr.message}`);
  } else if (classData && classData.length > 0) {
    console.log('   Colunas encontradas:');
    Object.keys(classData[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof classData[0][key]}`);
    });
  } else {
    console.log('   (Tabela vazia)');
  }
}

inspectSchema().catch(console.error);
