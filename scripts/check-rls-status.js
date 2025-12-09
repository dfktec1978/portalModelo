#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkPolicies() {
  console.log('🔍 Verificando RLS Policies Atuais...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Query que lista as políticas
    const { data, error } = await supabase.rpc('get_policies', {});
    
    if (error && error.message.includes('function')) {
      console.log('RPC não disponível, tentando acessar via SQL direto...\n');
      
      // Alternativa: tentar acessar information_schema
      const { data: policies } = await supabase
        .from('information_schema.role_table_grants')
        .select('*')
        .eq('grantee', 'postgres')
        .catch(() => ({ data: null }));
      
      if (policies) {
        console.log('Políticas encontradas:');
        console.log(JSON.stringify(policies.slice(0, 5), null, 2));
      } else {
        console.log('Não foi possível obter via information_schema');
      }
    } else {
      console.log('Políticas:');
      console.log(JSON.stringify(data, null, 2));
    }

    // Teste simples: tentar ler com join
    console.log('\n🧪 Teste: SELECT news WITH join profiles');
    const { data: testData, error: testError } = await supabase
      .from('news')
      .select('id, title, created_by(id, display_name)')
      .limit(1);

    if (testError) {
      console.log(`   ❌ Erro: ${testError.message}`);
      console.log('\n⚠️  RLS ainda está causando recursão!\n');
      console.log('Solução: Executar novamente o SQL em remove-recursive-policies.sql');
    } else {
      console.log(`   ✓ Sucesso! ${testData.length} registros lidos\n`);
    }

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

checkPolicies();
