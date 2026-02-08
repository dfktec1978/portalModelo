require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAuthSession() {
  console.log('\n🔧 CORRIGINDO SESSÃO DUPLICADA\n');
  console.log('='.repeat(60));

  // 1. Verificar usuário fantasma
  const ghostId = '2af300ce-55bf-4f0b-ae2f-e6e3a933a797';
  console.log('\n1️⃣ Verificando usuário fantasma:', ghostId);

  const { data: ghostUser, error: ghostError } = await supabase.auth.admin.getUserById(ghostId);
  
  if (ghostUser) {
    console.log('👻 Usuário fantasma encontrado no Auth:');
    console.log('   - Email:', ghostUser.user?.email || 'Sem email');
    console.log('   - Created:', ghostUser.user?.created_at);
    
    // Deletar usuário fantasma
    console.log('\n🗑️  Deletando usuário fantasma...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(ghostId);
    
    if (deleteError) {
      console.error('❌ Erro ao deletar:', deleteError.message);
    } else {
      console.log('✅ Usuário fantasma deletado com sucesso');
    }
  } else {
    console.log('⚠️  Usuário fantasma não encontrado no Auth');
    if (ghostError) console.log('   Erro:', ghostError.message);
  }

  // 2. Verificar sapoinfoshop correto
  const correctId = 'bb6f3a4f-d900-40a3-94a4-44532d43537c';
  console.log('\n2️⃣ Verificando sapoinfoshop correto:', correctId);

  const { data: correctUser, error: correctError } = await supabase.auth.admin.getUserById(correctId);
  
  if (correctUser) {
    console.log('✅ sapoinfoshop@gmail.com encontrado:');
    console.log('   - ID:', correctUser.user?.id);
    console.log('   - Email:', correctUser.user?.email);
    console.log('   - Email confirmado:', correctUser.user?.email_confirmed_at ? 'Sim' : 'Não');
  } else {
    console.log('❌ sapoinfoshop não encontrado no Auth');
    if (correctError) console.log('   Erro:', correctError.message);
  }

  // 3. Verificar perfis
  console.log('\n3️⃣ Verificando perfis no banco:');
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, role, status')
    .in('id', [ghostId, correctId]);

  console.log(`\nPerfis encontrados: ${profiles?.length || 0}\n`);
  
  profiles?.forEach(p => {
    console.log(`- ${p.email || 'Sem email'}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Role: ${p.role}`);
    console.log(`  Status: ${p.status}`);
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('\n📋 INSTRUÇÕES:\n');
  console.log('1. No navegador, pressione Ctrl+Shift+Delete');
  console.log('2. Marque "Cookies" e "Cache"');
  console.log('3. Clique em "Limpar dados"');
  console.log('4. Feche TODAS as abas do localhost:3000');
  console.log('5. Abra nova aba incógnita: Ctrl+Shift+N');
  console.log('6. Acesse: http://localhost:3000/login');
  console.log('7. Login: sapoinfoshop@gmail.com / Test@123456');
  console.log('8. Verifique console: deve mostrar ID bb6f3a4f-...\n');
}

fixAuthSession()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
