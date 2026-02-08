require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicateAdmin() {
  console.log('\n🔍 Verificando profiles do admin...\n');
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id,email,role')
    .eq('email', 'dclojainfo@gmail.com');

  console.log('Profiles encontrados:', profiles?.length || 0);
  profiles?.forEach(p => {
    console.log(`  - ID: ${p.id}`);
  });

  // Verificar qual tem Auth correspondente
  const { data: authData } = await supabase.auth.admin.listUsers();
  const adminAuth = authData?.users.find(u => u.email === 'dclojainfo@gmail.com');
  
  console.log(`\nAuth User ID: ${adminAuth?.id || 'NÃO ENCONTRADO'}`);

  // Deletar profiles que NÃO correspondem ao Auth ID
  if (adminAuth && profiles) {
    const orphans = profiles.filter(p => p.id !== adminAuth.id);
    
    for (const orphan of orphans) {
      console.log(`\n🗑️ Deletando profile órfão: ${orphan.id}`);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', orphan.id);
      
      if (!error) {
        console.log('✅ Deletado com sucesso');
      } else {
        console.log('❌ Erro:', error.message);
      }
    }
  }

  // Verificar resultado final
  const { data: finalProfiles } = await supabase
    .from('profiles')
    .select('id,email')
    .eq('email', 'dclojainfo@gmail.com');

  console.log(`\n✅ Profiles restantes: ${finalProfiles?.length || 0}`);
  finalProfiles?.forEach(p => {
    console.log(`  - ${p.email} (${p.id})`);
  });
}

cleanupDuplicateAdmin().then(() => process.exit(0));
