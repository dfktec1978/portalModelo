require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser() {
  const email = 'sapoinfoshop@gmail.com';
  
  console.log('\n🗑️  REMOVENDO USUÁRIO:', email);
  console.log('='.repeat(60));

  try {
    // 1. Buscar dados do usuário
    console.log('\n1️⃣ Buscando dados do usuário...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, stores(*)')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    if (!profile) {
      console.log('⚠️  Usuário não encontrado no banco');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('   - ID:', profile.id);
    console.log('   - Email:', profile.email);
    console.log('   - Role:', profile.role);
    console.log('   - Lojas:', profile.stores?.length || 0);

    const userId = profile.id;

    // 2. Deletar loja(s) associada(s)
    if (profile.stores && profile.stores.length > 0) {
      console.log('\n2️⃣ Deletando lojas...');
      
      for (const store of profile.stores) {
        console.log(`   - Deletando loja: ${store.store_name} (${store.id})`);
        
        const { error: storeError } = await supabase
          .from('stores')
          .delete()
          .eq('id', store.id);

        if (storeError) {
          console.error('   ❌ Erro:', storeError.message);
        } else {
          console.log('   ✅ Loja deletada');
        }
      }
    } else {
      console.log('\n2️⃣ Nenhuma loja para deletar');
    }

    // 3. Deletar perfil
    console.log('\n3️⃣ Deletando perfil...');
    
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('❌ Erro ao deletar perfil:', deleteProfileError.message);
    } else {
      console.log('✅ Perfil deletado');
    }

    // 4. Deletar do auth.users (requer admin API)
    console.log('\n4️⃣ Deletando usuário do Auth...');
    
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('❌ Erro ao deletar auth:', authError.message);
    } else {
      console.log('✅ Usuário deletado do Auth');
    }

    // 5. Verificar remoção
    console.log('\n5️⃣ Verificando remoção...');
    
    const { data: checkProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkProfile) {
      console.log('⚠️  Perfil ainda existe no banco');
    } else {
      console.log('✅ Perfil removido com sucesso');
    }

    const { data: checkStores } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', userId);

    if (checkStores && checkStores.length > 0) {
      console.log('⚠️  Ainda existem', checkStores.length, 'lojas no banco');
    } else {
      console.log('✅ Lojas removidas com sucesso');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ REMOÇÃO CONCLUÍDA\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Acesse: http://localhost:3000/cadastro');
    console.log('   2. Email: sapoinfoshop@gmail.com');
    console.log('   3. Senha: (sua escolha)');
    console.log('   4. Tipo: Lojista');
    console.log('   5. Preencha dados da loja');
    console.log('   6. Verifique status "pending"');
    console.log('   7. Aprove em /admin/usuarios');
    console.log('   8. Verifique email de aprovação');
    console.log('   9. Acesse dashboard como lojista aprovado\n');

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error);
  }
}

deleteUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
