require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteUsers() {
  const emails = ['dkworksstudio@gmail.com', 'dfkdaniel@gmail.com'];

  for (const email of emails) {
    console.log(`\n🗑️ Removendo: ${email}`);
    
    // Buscar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      console.log(`   ⚠️ Perfil não encontrado`);
      continue;
    }

    const userId = profile.id;
    console.log(`   📋 ID: ${userId}`);

    // Deletar stores
    const { error: storeError } = await supabase
      .from('stores')
      .delete()
      .eq('owner_id', userId);

    if (!storeError) {
      console.log(`   ✅ Loja(s) removida(s)`);
    }

    // Deletar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (!profileError) {
      console.log(`   ✅ Perfil removido`);
    }

    // Deletar do Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (!authError) {
      console.log(`   ✅ Auth removido`);
    } else {
      console.log(`   ⚠️ Auth: ${authError.message}`);
    }
  }

  console.log(`\n✅ Limpeza concluída!\n`);
}

deleteUsers().then(() => process.exit(0));
