require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDatabaseConsistency() {
  console.log('\n🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS\n');
  console.log('='.repeat(60));

  let issues = 0;

  // 1. Listar todos os profiles
  console.log('\n📋 1. PROFILES CADASTRADOS:\n');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id,email,role,status,accepted_terms,approved_at')
    .order('email');

  if (!profiles || profiles.length === 0) {
    console.log('⚠️ Nenhum profile encontrado!');
    issues++;
  } else {
    profiles.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.email}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Role: ${p.role} | Status: ${p.status}`);
      console.log(`   Termos: ${p.accepted_terms ? '✅' : '❌'} | Aprovado: ${p.approved_at ? '✅' : '⏳'}`);
      console.log('');
    });

    // Verificar duplicatas de email
    const emails = profiles.map(p => p.email);
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicates.length > 0) {
      console.log(`\n❌ DUPLICATAS ENCONTRADAS: ${duplicates.join(', ')}`);
      issues++;
    } else {
      console.log('✅ Sem duplicatas de email nos profiles');
    }
  }

  // 2. Verificar Auth Users
  console.log('\n📋 2. AUTH USERS:\n');
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUsers = authData?.users || [];

  if (authUsers.length === 0) {
    console.log('⚠️ Nenhum auth user encontrado!');
    issues++;
  } else {
    authUsers.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.email}`);
      console.log(`   Auth ID: ${u.id}`);
      console.log('');
    });
  }

  // 3. Sincronização Auth <-> Profile
  console.log('\n📋 3. SINCRONIZAÇÃO AUTH ↔ PROFILE:\n');
  
  // Auth sem Profile
  const authWithoutProfile = [];
  for (const authUser of authUsers) {
    const profile = profiles?.find(p => p.id === authUser.id);
    if (!profile) {
      authWithoutProfile.push(authUser.email);
      console.log(`❌ Auth sem Profile: ${authUser.email} (${authUser.id})`);
      issues++;
    }
  }

  // Profile sem Auth
  const profileWithoutAuth = [];
  if (profiles) {
    for (const profile of profiles) {
      const authUser = authUsers.find(a => a.id === profile.id);
      if (!authUser) {
        profileWithoutAuth.push(profile.email);
        console.log(`❌ Profile sem Auth: ${profile.email} (${profile.id})`);
        issues++;
      }
    }
  }

  if (authWithoutProfile.length === 0 && profileWithoutAuth.length === 0) {
    console.log('✅ Todos os Auth Users têm Profile correspondente');
    console.log('✅ Todos os Profiles têm Auth User correspondente');
  }

  // 4. Verificar Stores
  console.log('\n📋 4. LOJAS (STORES):\n');
  const { data: stores } = await supabase
    .from('stores')
    .select('id,owner_id,store_name,status,approved_at');

  if (!stores || stores.length === 0) {
    console.log('⚠️ Nenhuma loja encontrada!');
  } else {
    stores.forEach((s, idx) => {
      const owner = profiles?.find(p => p.id === s.owner_id);
      console.log(`${idx + 1}. ${s.store_name}`);
      console.log(`   ID: ${s.id}`);
      console.log(`   Owner: ${owner?.email || '❌ SEM DONO'} (${s.owner_id})`);
      console.log(`   Status: ${s.status} | Aprovada: ${s.approved_at ? '✅' : '⏳'}`);
      console.log('');

      // Verificar loja órfã
      if (!owner) {
        console.log(`❌ LOJA ÓRFÃ: ${s.store_name} (owner_id: ${s.owner_id} não existe)`);
        issues++;
      }
    });
  }

  // 5. Consistência de Status (Profile vs Store)
  console.log('\n📋 5. CONSISTÊNCIA DE STATUS:\n');
  if (profiles && stores) {
    for (const profile of profiles) {
      if (profile.role === 'lojista') {
        const userStores = stores.filter(s => s.owner_id === profile.id);
        
        if (userStores.length === 0) {
          console.log(`⚠️ Lojista sem loja: ${profile.email}`);
          if (profile.status === 'active') {
            console.log(`   ⚠️ Status 'active' mas sem loja cadastrada!`);
            issues++;
          }
        } else {
          userStores.forEach(store => {
            if (profile.status !== store.status) {
              console.log(`❌ INCONSISTÊNCIA: ${profile.email}`);
              console.log(`   Profile status: ${profile.status} | Store status: ${store.status}`);
              issues++;
            }
          });
        }
      }
    }
    console.log('✅ Verificação de consistência de status concluída');
  }

  // 6. Resumo Final
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO FINAL:\n');
  console.log(`Total de Profiles: ${profiles?.length || 0}`);
  console.log(`Total de Auth Users: ${authUsers.length}`);
  console.log(`Total de Stores: ${stores?.length || 0}`);
  console.log(`\nProblemas encontrados: ${issues}`);

  if (issues === 0) {
    console.log('\n✅ BANCO DE DADOS CONSISTENTE! Sem problemas detectados.\n');
  } else {
    console.log(`\n⚠️ ${issues} PROBLEMA(S) DETECTADO(S)! Revisar acima.\n`);
  }

  // 7. Verificar se temos apenas os 2 usuários esperados
  console.log('='.repeat(60));
  console.log('\n🎯 VALIDAÇÃO FINAL:\n');
  
  const expectedUsers = ['dclojainfo@gmail.com', 'lojista915b@hotmail.com'];
  const actualEmails = profiles?.map(p => p.email).sort() || [];
  const expectedEmails = expectedUsers.sort();
  
  if (JSON.stringify(actualEmails) === JSON.stringify(expectedEmails)) {
    console.log('✅ Base de dados contém APENAS os 2 usuários esperados:');
    console.log('   1. dclojainfo@gmail.com (Admin)');
    console.log('   2. lojista915b@hotmail.com (Lojista)');
  } else {
    console.log('⚠️ Usuários encontrados diferem do esperado:');
    console.log('   Esperado:', expectedEmails);
    console.log('   Atual:', actualEmails);
    
    const extra = actualEmails.filter(e => !expectedEmails.includes(e));
    const missing = expectedEmails.filter(e => !actualEmails.includes(e));
    
    if (extra.length > 0) {
      console.log(`   ➕ Extras: ${extra.join(', ')}`);
    }
    if (missing.length > 0) {
      console.log(`   ➖ Faltando: ${missing.join(', ')}`);
    }
  }
}

diagnoseDatabaseConsistency().then(() => process.exit(0));
