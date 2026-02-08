const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

// Usuários reais que devem ser mantidos
const USUARIOS_REAIS = [
  'lojista915b@hotmail.com',
  'sapoinfoshop@gmail.com',
  'dfkdaniel@gmail.com'
];

async function cleanupTestUsers() {
  console.log('🔍 Buscando usuários...\n');

  // Buscar todos os profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Erro ao buscar profiles:', profilesError);
    return;
  }

  console.log(`📋 Total de usuários: ${profiles.length}\n`);

  // Separar usuários de teste
  const testUsers = profiles.filter(
    p => !USUARIOS_REAIS.includes(p.email.toLowerCase())
  );

  if (testUsers.length === 0) {
    console.log('✅ Nenhum usuário de teste para remover');
    return;
  }

  console.log(`🗑️  Usuários de teste a remover (${testUsers.length}):`);
  testUsers.forEach(u => {
    console.log(`   - ${u.email} (${u.role} - ${u.status})`);
  });

  console.log('\n⏳ Removendo usuários de teste...\n');

  for (const user of testUsers) {
    // Remover lojas do usuário
    const { data: stores } = await supabase
      .from('stores')
      .select('id, store_name')
      .eq('owner_id', user.id);

    if (stores && stores.length > 0) {
      console.log(`   🏪 Removendo ${stores.length} loja(s) de ${user.email}...`);
      const { error: storesError } = await supabase
        .from('stores')
        .delete()
        .eq('owner_id', user.id);
      
      if (storesError) {
        console.error(`      ❌ Erro ao remover lojas: ${storesError.message}`);
      }
    }

    // Remover profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error(`   ❌ Erro ao remover ${user.email}: ${profileError.message}`);
    } else {
      console.log(`   ✅ Removido: ${user.email}`);
    }

    // Remover do auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error(`   ⚠️  Erro ao remover auth de ${user.email}: ${authError.message}`);
    }
  }

  console.log('\n✅ Limpeza concluída!\n');

  // Mostrar usuários restantes
  const { data: remaining } = await supabase
    .from('profiles')
    .select('email, role, status')
    .order('email');

  console.log('👥 Usuários mantidos:');
  remaining?.forEach(u => {
    console.log(`   ✓ ${u.email} (${u.role} - ${u.status})`);
  });
}

cleanupTestUsers().catch(console.error);
