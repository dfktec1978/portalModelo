require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndDelete() {
  const email = 'sapoinfoshop@gmail.com';
  
  console.log(`\n🔍 Verificando ${email}...\n`);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role,status,stores(id,store_name)')
    .eq('email', email);

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('✅ Usuário NÃO encontrado (já foi removido)\n');
    return;
  }

  console.log(`⚠️ ENCONTRADO ${data.length} registro(s):\n`);
  
  for (let i = 0; i < data.length; i++) {
    const user = data[i];
    console.log(`${i + 1}. ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Lojas: ${user.stores?.length || 0}\n`);
  }

  console.log('🗑️ Removendo todos os registros...\n');

  for (const user of data) {
    const userId = user.id;
    
    // Deletar stores
    await supabase.from('stores').delete().eq('owner_id', userId);
    console.log(`✅ Lojas do ID ${userId} removidas`);
    
    // Deletar perfil
    await supabase.from('profiles').delete().eq('id', userId);
    console.log(`✅ Perfil ${userId} removido`);
    
    // Deletar Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (!authError) {
      console.log(`✅ Auth ${userId} removido`);
    } else {
      console.log(`⚠️ Auth ${userId}: ${authError.message}`);
    }
    console.log('');
  }

  console.log('✅ Remoção completa!\n');
}

checkAndDelete().then(() => process.exit(0));
