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

async function checkAdminStatus() {
  console.log('🔍 Verificando status do admin...\n');

  // Buscar no Auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erro ao buscar usuários:', authError);
    return;
  }

  console.log('📧 Usuários no Auth:');
  users.forEach(u => {
    console.log(`   - ${u.email} (${u.id})`);
    console.log(`     Confirmado: ${u.email_confirmed_at ? 'Sim' : 'Não'}`);
    console.log(`     Criado: ${new Date(u.created_at).toLocaleString('pt-BR')}`);
  });

  console.log('\n📋 Profiles no banco:');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, status');

  profiles?.forEach(p => {
    console.log(`   - ${p.email} (${p.role} - ${p.status})`);
  });

  // Verificar especificamente o admin
  console.log('\n🔐 Verificando admin dclojainfo@gmail.com:');
  
  const adminInAuth = users.find(u => u.email === 'dclojainfo@gmail.com');
  const adminInProfiles = profiles?.find(p => p.email === 'dclojainfo@gmail.com');

  if (adminInAuth) {
    console.log('✓ Encontrado no Auth');
    console.log(`  ID: ${adminInAuth.id}`);
    console.log(`  Email confirmado: ${adminInAuth.email_confirmed_at ? 'Sim' : 'Não'}`);
  } else {
    console.log('❌ NÃO encontrado no Auth!');
  }

  if (adminInProfiles) {
    console.log('✓ Encontrado no Profiles');
    console.log(`  ID: ${adminInProfiles.id}`);
    console.log(`  Role: ${adminInProfiles.role}`);
    console.log(`  Status: ${adminInProfiles.status}`);
  } else {
    console.log('❌ NÃO encontrado no Profiles!');
  }
}

checkAdminStatus().catch(console.error);
