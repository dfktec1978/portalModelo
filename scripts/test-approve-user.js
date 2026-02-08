const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USER_ID = '2af300ce-55bf-4f0b-ae2f-e6e3a933a797'; // sapoinfoshop@gmail.com

async function testApprove() {
  console.log('🧪 Testando aprovação de usuário...\n');

  // 1. Verificar status atual
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', USER_ID)
    .single();

  console.log('📋 Profile atual:');
  console.log(`   Email: ${profile.email}`);
  console.log(`   Role: ${profile.role}`);
  console.log(`   Status: ${profile.status}`);
  console.log(`   Approved at: ${profile.approved_at}\n`);

  // 2. Verificar loja
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', USER_ID)
    .single();

  if (store) {
    console.log('🏪 Loja encontrada:');
    console.log(`   Nome: ${store.store_name}`);
    console.log(`   Status: ${store.status}`);
    console.log(`   Approved at: ${store.approved_at}\n`);
  } else {
    console.log('⚠️  Nenhuma loja encontrada\n');
  }

  // 3. Tentar aprovar profile
  console.log('⏳ Aprovando profile...');
  const { data: updatedProfile, error: profileError } = await supabase
    .from('profiles')
    .update({
      status: 'active',
      approved_at: new Date().toISOString()
    })
    .eq('id', USER_ID)
    .select();

  if (profileError) {
    console.error('❌ Erro ao aprovar profile:', profileError);
  } else {
    console.log('✅ Profile aprovado:', updatedProfile[0]);
  }

  // 4. Tentar aprovar loja
  if (store) {
    console.log('\n⏳ Aprovando loja...');
    const { data: updatedStore, error: storeError } = await supabase
      .from('stores')
      .update({
        status: 'active',
        approved_at: new Date().toISOString()
      })
      .eq('owner_id', USER_ID)
      .select();

    if (storeError) {
      console.error('❌ Erro ao aprovar loja:', storeError);
    } else {
      console.log('✅ Loja aprovada:', updatedStore[0]);
    }
  }

  // 5. Verificar resultado final
  const { data: finalProfile } = await supabase
    .from('profiles')
    .select('email, role, status, approved_at')
    .eq('id', USER_ID)
    .single();

  const { data: finalStore } = await supabase
    .from('stores')
    .select('store_name, status, approved_at')
    .eq('owner_id', USER_ID)
    .single();

  console.log('\n📊 Resultado final:');
  console.log('   Profile:', finalProfile);
  console.log('   Store:', finalStore);
}

testApprove().catch(console.error);
