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

async function checkAuthUsers() {
  console.log('🔍 Verificando usuários no Auth...\n');

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`Total no Auth: ${users.length}\n`);
  
  users.forEach(u => {
    console.log(`📧 ${u.email}`);
    console.log(`   ID: ${u.id}`);
    console.log(`   Criado: ${new Date(u.created_at).toLocaleString('pt-BR')}`);
    console.log(`   Último login: ${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}\n`);
  });
}

checkAuthUsers().catch(console.error);
