const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
  console.log('🔍 Verificando emails duplicados...\n');
  
  // Buscar todos os perfis
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Erro ao buscar perfis:', error);
    return;
  }
  
  // Agrupar por email
  const emailMap = new Map();
  
  profiles.forEach(profile => {
    if (!emailMap.has(profile.email)) {
      emailMap.set(profile.email, []);
    }
    emailMap.get(profile.email).push(profile);
  });
  
  // Encontrar duplicatas
  const duplicates = [];
  emailMap.forEach((list, email) => {
    if (list.length > 1) {
      duplicates.push({ email, profiles: list });
    }
  });
  
  if (duplicates.length === 0) {
    console.log('✅ Nenhum email duplicado encontrado nos perfis');
  } else {
    console.log(`⚠️ Encontrados ${duplicates.length} emails duplicados:\n`);
    
    for (const dup of duplicates) {
      console.log(`\n📧 Email: ${dup.email}`);
      console.log(`   Total de contas: ${dup.profiles.length}\n`);
      
      for (let i = 0; i < dup.profiles.length; i++) {
        const p = dup.profiles[i];
        console.log(`   ${i + 1}. ID: ${p.id}`);
        console.log(`      Nome: ${p.display_name}`);
        console.log(`      Role: ${p.role}`);
        console.log(`      Status: ${p.status}`);
        console.log(`      Criado em: ${p.created_at}`);
        
        // Buscar lojas associadas
        const { data: stores } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', p.id);
        
        if (stores && stores.length > 0) {
          console.log(`      Lojas: ${stores.length}`);
          stores.forEach(s => {
            console.log(`         - ${s.store_name} (${s.status})`);
          });
        } else {
          console.log(`      Lojas: 0`);
        }
        console.log('');
      }
      
      console.log(`   💡 RECOMENDAÇÃO: Manter o mais antigo (ID: ${dup.profiles[0].id})`);
      console.log(`   💡 Para excluir, rode: DELETE FROM auth.users WHERE id = 'ID_AQUI';\n`);
    }
  }
  
  // Verificar duplicatas também em auth.users
  console.log('\n🔍 Verificando duplicatas em auth.users...\n');
  
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError);
    return;
  }
  
  const emailMapAuth = new Map();
  users.forEach(user => {
    if (!emailMapAuth.has(user.email)) {
      emailMapAuth.set(user.email, []);
    }
    emailMapAuth.get(user.email).push(user);
  });
  
  const authDuplicates = [];
  emailMapAuth.forEach((list, email) => {
    if (list.length > 1) {
      authDuplicates.push({ email, users: list });
    }
  });
  
  if (authDuplicates.length === 0) {
    console.log('✅ Nenhum email duplicado encontrado em auth.users\n');
  } else {
    console.log(`⚠️ Encontrados ${authDuplicates.length} emails duplicados em auth.users:\n`);
    
    authDuplicates.forEach(dup => {
      console.log(`📧 Email: ${dup.email}`);
      dup.users.forEach((u, i) => {
        console.log(`   ${i + 1}. ID: ${u.id} - Criado: ${u.created_at}`);
      });
      console.log('');
    });
  }
}

checkDuplicates().then(() => {
  console.log('\n✅ Verificação concluída');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
