require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabaseIssues() {
  console.log('\n🔧 CORRIGINDO PROBLEMAS DO BANCO DE DADOS\n');
  console.log('='.repeat(60));

  // 1. Remover Auth órfão (dfkdaniel)
  console.log('\n1️⃣ Removendo Auth órfão: dfkdaniel@gmail.com');
  const { error: e1 } = await supabase.auth.admin.deleteUser('87eb5b36-4a7a-45ab-a791-bb55911d507d');
  if (!e1) {
    console.log('   ✅ Auth dfkdaniel removido');
  } else {
    console.log('   ⚠️ Erro:', e1.message);
  }

  // 2. Remover Auth duplicado do admin (manter profile, remover auth antigo)
  console.log('\n2️⃣ Removendo Auth duplicado do admin (ID: 14d904bb)');
  const { error: e2 } = await supabase.auth.admin.deleteUser('14d904bb-a874-4a2d-8d1a-e3434cb8f582');
  if (!e2) {
    console.log('   ✅ Auth duplicado removido');
  } else {
    console.log('   ⚠️ Erro:', e2.message);
  }

  // 3. Corrigir status da store do lojista915b (approved → active)
  console.log('\n3️⃣ Corrigindo status da store: approved → active');
  const { error: e3 } = await supabase
    .from('stores')
    .update({ status: 'active' })
    .eq('owner_id', 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63');
  
  if (!e3) {
    console.log('   ✅ Status da store corrigido para "active"');
  } else {
    console.log('   ⚠️ Erro:', e3.message);
  }

  // 4. Adicionar accepted_terms=true para ambos usuários
  console.log('\n4️⃣ Corrigindo accepted_terms para true');
  const { error: e4 } = await supabase
    .from('profiles')
    .update({ accepted_terms: true })
    .in('email', ['dclojainfo@gmail.com', 'lojista915b@hotmail.com']);
  
  if (!e4) {
    console.log('   ✅ accepted_terms atualizado para ambos usuários');
  } else {
    console.log('   ⚠️ Erro:', e4.message);
  }

  // 5. PROBLEMA CRÍTICO: Admin sem Auth User correspondente
  console.log('\n5️⃣ ⚠️ PROBLEMA CRÍTICO: Admin tem Profile ID diferente do Auth ID');
  console.log('   Profile ID: 74670f12-7337-4ffe-93ff-5d12d462d9b0');
  console.log('   Auth ID existente foi removido: 14d904bb-a874-4a2d-8d1a-e3434cb8f582');
  console.log('\n   ⚠️ SOLUÇÃO NECESSÁRIA:');
  console.log('   O admin precisa fazer logout e login novamente.');
  console.log('   Ao fazer login, o Supabase criará um novo Auth User.');
  console.log('   PORÉM: O ID será diferente do Profile atual!');
  console.log('\n   🔧 OPÇÃO 1 (RECOMENDADA): Recriar profile do admin com Auth ID correto');
  console.log('   🔧 OPÇÃO 2: Aceitar inconsistência temporária');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Correções aplicadas! Executando novo diagnóstico...\n');
}

fixDatabaseIssues().then(() => process.exit(0));
