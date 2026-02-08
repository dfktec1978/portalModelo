require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetSapoPassword() {
  console.log('\n🔐 RESETANDO SENHA DO USUÁRIO\n');
  console.log('='.repeat(60));

  const email = 'sapoinfoshop@gmail.com';
  const newPassword = 'Test@123456';
  const userId = 'bb6f3a4f-d900-40a3-94a4-44532d43537c';

  // 1. Listar todos os usuários do Auth
  console.log('\n1️⃣ Procurando usuário no Auth...\n');
  
  const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message);
    return;
  }

  const sapoUser = usersList.users.find(u => u.email === email);
  
  if (sapoUser) {
    console.log('✅ Usuário encontrado no Auth:');
    console.log('   - ID:', sapoUser.id);
    console.log('   - Email:', sapoUser.email);
    console.log('   - Email confirmado:', sapoUser.email_confirmed_at ? 'Sim' : 'Não');
    console.log('   - Criado em:', sapoUser.created_at);

    // 2. Resetar senha
    console.log('\n2️⃣ Resetando senha para:', newPassword);
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      sapoUser.id,
      { 
        password: newPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('❌ Erro ao resetar senha:', updateError.message);
    } else {
      console.log('✅ Senha resetada com sucesso!');
    }
  } else {
    console.log('⚠️  Usuário não encontrado no Auth');
    console.log('   Verificando se existe no profiles...');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (profile) {
      console.log('\n📋 Perfil encontrado no banco mas sem Auth:');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      
      console.log('\n🆕 Criando usuário no Auth...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { 
          id: userId 
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
      } else {
        console.log('✅ Usuário criado no Auth:');
        console.log('   - ID:', newUser.user.id);
        console.log('   ⚠️  ATENÇÃO: ID diferente do perfil!');
        console.log('   - Perfil ID:', userId);
        console.log('   - Auth ID:', newUser.user.id);
        console.log('\n   Será necessário atualizar o perfil!');
      }
    } else {
      console.log('❌ Nem perfil nem Auth encontrados!');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ CREDENCIAIS ATUALIZADAS:\n');
  console.log('Email:', email);
  console.log('Senha:', newPassword);
  console.log('\n📋 Próximos passos:');
  console.log('1. Acesse: http://localhost:3000/login');
  console.log('2. Login:', email);
  console.log('3. Senha:', newPassword);
  console.log('4. Verifique console: deve mostrar ID bb6f3a4f-...\n');
}

resetSapoPassword()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
