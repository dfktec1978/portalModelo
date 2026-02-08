require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkApproval() {
  const email = 'sapoinfoshop@gmail.com';
  
  console.log('\n✅ FASE 5: VERIFICAÇÃO PÓS-APROVAÇÃO');
  console.log('='.repeat(60));

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role,status,approved_at,stores(id,store_name,status,approved_at)')
    .eq('email', email)
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('\n📊 Dados após aprovação:\n');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 CHECKLIST:\n');
  
  const profileOk = data.status === 'active';
  const profileApprovedAt = data.approved_at !== null;
  const storeOk = data.stores?.[0]?.status === 'active';
  const storeApprovedAt = data.stores?.[0]?.approved_at !== null;

  console.log(`${profileOk ? '✅' : '❌'} profiles.status: ${data.status} (esperado: active)`);
  console.log(`${profileApprovedAt ? '✅' : '❌'} profiles.approved_at: ${data.approved_at || 'null'}`);
  console.log(`${storeOk ? '✅' : '❌'} stores.status: ${data.stores?.[0]?.status || 'null'} (esperado: active)`);
  console.log(`${storeApprovedAt ? '✅' : '❌'} stores.approved_at: ${data.stores?.[0]?.approved_at || 'null'}`);

  console.log('\n' + '='.repeat(60));

  if (profileOk && storeOk && profileApprovedAt && storeApprovedAt) {
    console.log('\n🎉 APROVAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('✅ FASE 4 COMPLETA: Aprovação pelo Admin');
    console.log('✅ FASE 5 COMPLETA: Verificação Pós-Aprovação\n');
    console.log('🎯 PRÓXIMA FASE: FASE 7 - Dashboard Completo\n');
    console.log('📋 Instruções:');
    console.log('1. Fazer logout do admin');
    console.log('2. Login: sapoinfoshop@gmail.com / Test@123456');
    console.log('3. Acessar: http://localhost:3000/dashboard');
    console.log('4. Verificar sidebar de navegação');
    console.log('5. Verificar módulos disponíveis');
    console.log('6. Testar criação de produto\n');
  } else {
    console.log('\n⚠️ PROBLEMAS DETECTADOS!\n');
    if (!profileOk) console.log('❌ Perfil não foi aprovado (status != active)');
    if (!profileApprovedAt) console.log('❌ approved_at do perfil não foi preenchido');
    if (!storeOk) console.log('❌ Loja não foi aprovada (status != active)');
    if (!storeApprovedAt) console.log('❌ approved_at da loja não foi preenchido');
    console.log('\n💡 Possíveis causas:');
    console.log('- Função approve_user não foi executada corretamente');
    console.log('- Erro na API /api/admin/usuarios/route.ts');
    console.log('- Verificar console do navegador para erros\n');
  }
}

checkApproval()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
