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

const EMAIL = 'cicerakroth@gmail.com';

async function removeUser() {
  console.log(`🗑️  Removendo ${EMAIL}...\n`);

  // Buscar profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', EMAIL)
    .single();

  if (profile) {
    console.log(`✓ Profile encontrado: ${profile.id}`);
    
    // Remover lojas
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', profile.id);

    if (stores && stores.length > 0) {
      await supabase.from('stores').delete().eq('owner_id', profile.id);
      console.log(`✓ ${stores.length} loja(s) removida(s)`);
    }

    // Remover profile
    await supabase.from('profiles').delete().eq('id', profile.id);
    console.log(`✓ Profile removido`);

    // Remover auth
    await supabase.auth.admin.deleteUser(profile.id);
    console.log(`✓ Auth removido`);
  } else {
    console.log('⚠️  Profile não encontrado, tentando remover apenas do Auth...');
    
    // Buscar no auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === EMAIL);
    
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id);
      console.log(`✓ Usuário removido do Auth`);
    }
  }

  console.log('\n✅ Concluído!');
}

removeUser().catch(console.error);
