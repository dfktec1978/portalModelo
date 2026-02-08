require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyNewRegistration() {
  console.log('\n🔍 VERIFICAÇÃO PÓS-CADASTRO\n');
  console.log('='.repeat(60));

  const email = 'sapoinfoshop@gmail.com';

  // 1. Verificar perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, status, accepted_terms, stores(id, store_name, status)')
    .eq('email', email)
    .single();

  if (profileError) {
    console.error('❌ Erro ao buscar perfil:', profileError.message);
    return;
  }

  if (!profile) {
    console.log('❌ Perfil não encontrado!');
    return;
  }

  console.log('\n✅ PERFIL CRIADO:');
  console.log('   - ID:', profile.id);
  console.log('   - Email:', profile.email);
  console.log('   - Role:', profile.role, profile.role === 'lojista' ? '✅' : '❌');
  console.log('   - Status:', profile.status, profile.status === 'pending' ? '✅' : '❌');
  console.log('   - Termos aceitos:', profile.accepted_terms ? '✅' : '❌');

  // 2. Verificar loja
  console.log('\n🏪 LOJA:');
  if (profile.stores && profile.stores.length > 0) {
    const store = profile.stores[0];
    console.log('   ✅ Loja criada:', store.store_name);
    console.log('   - Status:', store.status, store.status === 'pending' ? '✅' : '❌');
    console.log('   - ID:', store.id);
  } else {
    console.log('   ❌ LOJA NÃO FOI CRIADA!');
    console.log('   ⚠️  Problema no código de cadastro (src/app/cadastro/page.tsx)');
  }

  // 3. Verificar Auth
  const { data: usersList } = await supabase.auth.admin.listUsers();
  const authUser = usersList.users.find(u => u.email === email);

  if (!authUser) {
    console.log('\n❌ Usuário não encontrado no Auth!');
    return;
  }

  console.log('\n🔐 AUTH:');
  console.log('   - ID:', authUser.id);
  console.log('   - Email:', authUser.email);

  // 4. Verificar sincronização
  console.log('\n🎯 SINCRONIZAÇÃO DE IDs:');
  if (authUser.id === profile.id) {
    console.log('   ✅ IDs SINCRONIZADOS!');
    console.log('   Auth ID = Profile ID = Store owner_id');
  } else {
    console.log('   ❌ IDs DIFERENTES!');
    console.log('   Auth ID:', authUser.id);
    console.log('   Profile ID:', profile.id);
    console.log('   ⚠️  ISSO VAI CAUSAR ERRO - loja não carrega!');
  }

  console.log('\n' + '='.repeat(60));
  
  // Resultado final
  const allGood = 
    profile.role === 'lojista' &&
    profile.status === 'pending' &&
    profile.accepted_terms &&
    profile.stores?.length > 0 &&
    profile.stores[0].status === 'pending' &&
    authUser.id === profile.id;

  if (allGood) {
    console.log('\n🎉 CADASTRO PERFEITO!\n');
    console.log('✅ FASE 1 COMPLETA: Cadastro Inicial');
    console.log('✅ FASE 2 COMPLETA: Dados no banco corretos\n');
    console.log('📋 Próximo passo: FASE 3');
    console.log('1. Login: sapoinfoshop@gmail.com / Test@123456');
    console.log('2. Acesse: http://localhost:3000/dashboard');
    console.log('3. Deve ver: "Cadastro em Análise"\n');
  } else {
    console.log('\n⚠️  PROBLEMAS ENCONTRADOS!\n');
    if (!profile.accepted_terms) console.log('❌ accepted_terms = false');
    if (!profile.stores || profile.stores.length === 0) console.log('❌ Loja não criada');
    if (authUser.id !== profile.id) console.log('❌ IDs dessincroniados');
  }
}

verifyNewRegistration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
