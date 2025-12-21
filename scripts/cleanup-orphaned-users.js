#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function cleanupOrphanedUsers() {
  if (!supabaseServiceKey || (!supabaseServiceKey.startsWith('sb_secret_') && supabaseServiceKey.length < 50)) {
    console.log('❌ Chave de serviço inválida ou não configurada');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Investigando TODOS os usuários do sistema...\n');

  // Buscar todos os usuários do auth
  const { data: { users }, error: authError } = await admin.auth.admin.listUsers();

  if (authError) {
    console.log('❌ Erro ao consultar auth:', authError.message);
    return;
  }

  console.log(`📊 Total de usuários em auth.users: ${users.length}\n`);

  // Buscar todos os perfis
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, email, role, status');

  if (profilesError) {
    console.log('❌ Erro ao consultar profiles:', profilesError.message);
    return;
  }

  console.log(`📊 Total de perfis em profiles: ${profiles.length}\n`);

  // Criar mapa de perfis por email
  const profilesMap = new Map();
  profiles.forEach(profile => {
    profilesMap.set(profile.email, profile);
  });

  // Classificar usuários
  const usersWithProfiles = [];
  const orphanedUsers = [];
  let adminUser = null;

  for (const user of users) {
    const profile = profilesMap.get(user.email);

    if (user.email === 'dclojainfo@gmail.com') {
      adminUser = { user, profile };
    } else if (profile) {
      usersWithProfiles.push({ user, profile });
    } else {
      orphanedUsers.push(user);
    }
  }

  // Exibir resultados
  console.log('👑 USUÁRIO ADMIN (SERÁ MANTIDO):');
  if (adminUser) {
    const { user, profile } = adminUser;
    console.log(`   ✅ ${user.email}`);
    console.log(`      Auth ID: ${user.id}`);
    console.log(`      Perfil: ${profile ? 'SIM' : 'NÃO'}`);
    if (profile) {
      console.log(`      Role: ${profile.role}, Status: ${profile.status}`);
    }
  } else {
    console.log('   ❌ Admin não encontrado!');
  }

  console.log('\n👥 USUÁRIOS COM PERFIS VÁLIDOS (SERÃO MANTIDOS):');
  usersWithProfiles.forEach(({ user, profile }) => {
    console.log(`   ✅ ${user.email} (${profile.role}, ${profile.status})`);
  });

  console.log('\n⚠️  USUÁRIOS ÓRFÃOS (SERÃO REMOVIDOS):');
  orphanedUsers.forEach(user => {
    console.log(`   ❌ ${user.email} (Auth ID: ${user.id})`);
    console.log(`      Criado em: ${user.created_at}`);
    console.log(`      Último login: ${user.last_sign_in_at || 'Nunca'}`);
  });

  console.log(`\n📈 RESUMO DA LIMPEZA:`);
  console.log(`   Admin: ${adminUser ? 1 : 0}`);
  console.log(`   Com perfis válidos: ${usersWithProfiles.length}`);
  console.log(`   Órfãos a remover: ${orphanedUsers.length}`);
  console.log(`   Total atual: ${users.length}`);
  console.log(`   Total após limpeza: ${users.length - orphanedUsers.length}`);

  if (orphanedUsers.length === 0) {
    console.log('\n✅ Nenhum usuário órfão encontrado! Sistema limpo.');
    return;
  }

  // Confirmar remoção
  console.log('\n🗑️  INICIANDO REMOÇÃO DOS USUÁRIOS ÓRFÃOS...');
  console.log('   Isso impedirá que eles façam login no futuro.');
  console.log('   Os usuários com perfis válidos e o admin serão preservados.\n');

  let removedCount = 0;
  let errorCount = 0;

  for (const user of orphanedUsers) {
    console.log(`   Removendo: ${user.email}...`);
    try {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.log(`   ❌ Erro ao remover ${user.email}: ${deleteError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Removido com sucesso: ${user.email}`);
        removedCount++;
      }
    } catch (err) {
      console.log(`   ❌ Erro inesperado ao remover ${user.email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n🎉 LIMPEZA CONCLUÍDA!`);
  console.log(`   ✅ Removidos com sucesso: ${removedCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Erros durante remoção: ${errorCount}`);
  }
  console.log(`   👑 Admin mantido: ${adminUser ? 1 : 0}`);
  console.log(`   👥 Usuários válidos mantidos: ${usersWithProfiles.length}`);
  console.log(`   🔒 Sistema agora seguro contra acessos não autorizados.`);
}

cleanupOrphanedUsers().catch(console.error);