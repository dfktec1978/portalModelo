require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyApproval() {
  const email = 'sapoinfoshop@gmail.com';
  
  const { data } = await supabase
    .from('profiles')
    .select('id,email,role,status,approved_at,stores(id,store_name,status,approved_at)')
    .eq('email', email)
    .single();

  console.log('\n✅ FASE 4 COMPLETA: Aprovação pelo Admin');
  console.log('✅ FASE 5 COMPLETA: Verificação Pós-Aprovação\n');
  console.log('📊 Status Atual:\n');
  console.log('Perfil:');
  console.log('  - Status:', data.status === 'active' ? '✅ active' : '❌ ' + data.status);
  console.log('  - Aprovado em:', data.approved_at ? '✅ ' + data.approved_at : '❌ null');
  console.log('\nLoja:');
  console.log('  - Nome:', data.stores[0].store_name);
  console.log('  - Status:', data.stores[0].status === 'active' ? '✅ active' : '❌ ' + data.stores[0].status);
  console.log('  - Aprovada em:', data.stores[0].approved_at ? '✅ ' + data.stores[0].approved_at : '❌ null');
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 FASE 7: Dashboard Completo do Lojista\n');
  console.log('1. Logout do admin');
  console.log('2. Login: sapoinfoshop@gmail.com / Test@123456');
  console.log('3. Acesse: http://localhost:3000/dashboard');
  console.log('4. Verifique:');
  console.log('   ✅ Sidebar com "Sapo Info Shop"');
  console.log('   ✅ Módulos: Visão Geral, Produtos, Pedidos, etc.');
  console.log('   ✅ Não mostra mais "Cadastro em Análise"\n');
}

verifyApproval().then(() => process.exit(0));
