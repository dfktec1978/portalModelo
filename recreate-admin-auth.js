require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recreateAdminAuth() {
  console.log('\n🔧 RECRIANDO AUTH USER DO ADMIN\n');
  
  const adminEmail = 'dclojainfo@gmail.com';
  const adminPassword = 'admin123'; // Senha padrão - TROCAR DEPOIS!
  const adminProfileId = '74670f12-7337-4ffe-93ff-5d12d462d9b0';

  console.log(`Email: ${adminEmail}`);
  console.log(`Profile ID existente: ${adminProfileId}`);
  console.log('Nova senha temporária: admin123');
  console.log('\n⚠️ IMPORTANTE: Trocar senha após primeiro login!\n');

  // Criar novo Auth User com o ID do Profile existente
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      role: 'admin'
    }
  });

  if (error) {
    console.log('❌ Erro ao criar Auth User:', error.message);
    
    // Se o erro for "User already registered", deletar e recriar
    if (error.message.includes('already registered')) {
      console.log('\n⚠️ Usuário já existe no Auth. Tentando remover completamente...\n');
      
      // Buscar todos os auth users com este email
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === adminEmail);
      
      if (existingUser) {
        console.log(`Removendo Auth User existente: ${existingUser.id}`);
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('✅ Auth User antigo removido');
        
        // Tentar criar novamente
        console.log('\nCriando novo Auth User...\n');
        const { data: newData, error: newError } = await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            role: 'admin'
          }
        });
        
        if (newError) {
          console.log('❌ Erro na segunda tentativa:', newError.message);
        } else {
          console.log('✅ Auth User criado!');
          console.log(`   Auth ID: ${newData.user.id}`);
          console.log(`\n⚠️ ATENÇÃO: Auth ID (${newData.user.id}) ≠ Profile ID (${adminProfileId})`);
          console.log('\n🔧 SOLUÇÃO: Atualizar Profile ID para corresponder ao Auth ID');
          
          // Atualizar Profile ID
          console.log('\nAtualizando Profile ID...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id: newData.user.id })
            .eq('email', adminEmail);
          
          if (updateError) {
            console.log('❌ Erro ao atualizar Profile ID:', updateError.message);
            console.log('\n🔧 SOLUÇÃO MANUAL:');
            console.log('1. Deletar profile do admin');
            console.log('2. Admin faz login (criará profile automaticamente)');
          } else {
            console.log('✅ Profile ID atualizado com sucesso!');
            console.log('\n🎉 Admin sincronizado:');
            console.log(`   Auth ID: ${newData.user.id}`);
            console.log(`   Profile ID: ${newData.user.id}`);
          }
        }
      }
    }
    return;
  }

  console.log('✅ Auth User criado!');
  console.log(`   Auth ID: ${data.user.id}`);
  
  if (data.user.id !== adminProfileId) {
    console.log(`\n⚠️ IDs diferentes!`);
    console.log(`   Auth ID: ${data.user.id}`);
    console.log(`   Profile ID: ${adminProfileId}`);
    console.log('\n   Isso CAUSARÁ PROBLEMAS no login!');
  }
}

recreateAdminAuth().then(() => process.exit(0));
