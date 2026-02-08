require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAuthAndProfile() {
  console.log('\n🔄 SINCRONIZANDO AUTH E PERFIL\n');
  console.log('='.repeat(60));

  const email = 'sapoinfoshop@gmail.com';
  const correctProfileId = 'bb6f3a4f-d900-40a3-94a4-44532d43537c';
  const wrongAuthId = 'e2a809e8-e8c6-40de-8ff3-f734e0c3f9ac';

  console.log('\n📊 Situação atual:');
  console.log('- Perfil/Loja vinculados a:', correctProfileId);
  console.log('- Auth aponta para:', wrongAuthId);
  console.log('\n❌ IDs diferentes = loja não carrega!\n');

  // 1. Deletar usuário Auth errado
  console.log('1️⃣ Deletando usuário Auth com ID errado...');
  
  const { error: deleteError } = await supabase.auth.admin.deleteUser(wrongAuthId);
  
  if (deleteError) {
    console.error('❌ Erro ao deletar:', deleteError.message);
  } else {
    console.log('✅ Usuário Auth deletado');
  }

  // 2. Criar novo usuário Auth com ID correto
  console.log('\n2️⃣ Criando usuário Auth com ID correto...');
  
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'Test@123456',
    email_confirm: true,
    user_metadata: {
      role: 'lojista'
    }
  });

  if (createError) {
    console.error('❌ Erro ao criar usuário:', createError.message);
    return;
  }

  console.log('✅ Novo usuário Auth criado:');
  console.log('   - ID:', newUser.user.id);
  console.log('   - Email:', newUser.user.email);

  const newAuthId = newUser.user.id;

  // 3. Atualizar perfil para usar novo Auth ID
  console.log('\n3️⃣ Atualizando perfil para novo ID...');
  
  // Primeiro, verificar se já existe perfil com novo ID
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', newAuthId)
    .single();

  if (existingProfile) {
    console.log('⚠️  Perfil com novo ID já existe, deletando...');
    await supabase.from('profiles').delete().eq('id', newAuthId);
  }

  // Deletar perfil antigo
  await supabase.from('profiles').delete().eq('id', correctProfileId);

  // Criar novo perfil com ID correto
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: newAuthId,
      email: email,
      display_name: 'sapoinfoshop',
      role: 'lojista',
      status: 'active',
      phone: null,
      accepted_terms: true,
      terms_version: 'v1.0',
      accepted_at: new Date().toISOString(),
      approved_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('❌ Erro ao criar perfil:', profileError.message);
  } else {
    console.log('✅ Perfil criado com ID:', newAuthId);
  }

  // 4. Atualizar loja para novo owner_id
  console.log('\n4️⃣ Atualizando loja para novo owner_id...');
  
  const { error: storeError } = await supabase
    .from('stores')
    .update({ owner_id: newAuthId })
    .eq('owner_id', correctProfileId);

  if (storeError) {
    console.error('❌ Erro ao atualizar loja:', storeError.message);
  } else {
    console.log('✅ Loja atualizada com novo owner_id');
  }

  // 5. Verificação final
  console.log('\n5️⃣ Verificação final...\n');
  
  const { data: finalCheck } = await supabase
    .from('profiles')
    .select('id, email, role, status, stores(id, store_name, status)')
    .eq('email', email)
    .single();

  if (finalCheck) {
    console.log('✅ Configuração final:');
    console.log('   - Profile ID:', finalCheck.id);
    console.log('   - Email:', finalCheck.email);
    console.log('   - Role:', finalCheck.role);
    console.log('   - Status:', finalCheck.status);
    console.log('   - Lojas:', finalCheck.stores?.length || 0);
    
    if (finalCheck.stores && finalCheck.stores.length > 0) {
      console.log('   - Loja:', finalCheck.stores[0].store_name);
      console.log('   - Status loja:', finalCheck.stores[0].status);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!\n');
  console.log('✅ Auth ID e Profile ID agora são iguais');
  console.log('✅ Loja vinculada ao usuário correto\n');
  console.log('📋 Teste agora:');
  console.log('1. Limpe cookies (Ctrl+Shift+Delete)');
  console.log('2. Acesse: http://localhost:3000/login');
  console.log('3. Login: sapoinfoshop@gmail.com / Test@123456');
  console.log('4. A loja deve aparecer na sidebar!\n');
}

syncAuthAndProfile()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
