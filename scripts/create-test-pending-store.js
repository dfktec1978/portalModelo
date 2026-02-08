const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestPendingStore() {
  console.log('🏪 Criando loja de teste com status PENDING...\n');
  
  // Buscar um lojista existente para vincular
  const { data: lojistas, error: lojistaError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'lojista')
    .limit(1);
  
  if (lojistaError || !lojistas || lojistas.length === 0) {
    console.error('❌ Nenhum lojista encontrado. Criando um novo...\n');
    
    // Criar usuário de teste
    const testEmail = `lojista-teste-${Date.now()}@test.com`;
    const testPassword = 'Teste@123';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: 'lojista',
        display_name: 'Lojista Teste'
      }
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError);
      return;
    }
    
    console.log('✅ Usuário criado:', testEmail);
    
    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        display_name: 'Lojista Teste',
        role: 'lojista',
        status: 'pending',
        phone: '49999999999'
      });
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      return;
    }
    
    console.log('✅ Perfil criado\n');
    
    // Criar loja pendente
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: authData.user.id,
        store_name: 'Loja Teste Pendente',
        phone: '49999999999',
        status: 'pending'
      })
      .select()
      .single();
    
    if (storeError) {
      console.error('❌ Erro ao criar loja:', storeError);
      return;
    }
    
    console.log('✅ Loja criada com sucesso!');
    console.log(`   Nome: ${newStore.store_name}`);
    console.log(`   Status: ${newStore.status}`);
    console.log(`   ID: ${newStore.id}`);
    console.log(`\n📧 Credenciais de teste:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);
    
  } else {
    const lojista = lojistas[0];
    console.log(`✅ Usando lojista existente: ${lojista.email}\n`);
    
    // Criar loja pendente
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: lojista.id,
        store_name: 'Loja Teste Pendente',
        phone: lojista.phone || '49999999999',
        status: 'pending'
      })
      .select()
      .single();
    
    if (storeError) {
      console.error('❌ Erro ao criar loja:', storeError);
      return;
    }
    
    console.log('✅ Loja criada com sucesso!');
    console.log(`   Nome: ${newStore.store_name}`);
    console.log(`   Status: ${newStore.status}`);
    console.log(`   ID: ${newStore.id}`);
    console.log(`   Owner: ${lojista.email}`);
  }
}

createTestPendingStore().then(() => {
  console.log('\n✅ Processo concluído');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
