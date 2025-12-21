#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkSuspiciousUsers() {
  if (!supabaseServiceKey || (!supabaseServiceKey.startsWith('sb_secret_') && supabaseServiceKey.length < 50)) {
    console.log('❌ Chave de serviço inválida ou não configurada');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Verificando usuários suspeitos...\n');

  const suspiciousEmails = ['dfkdaniel@gmail.com', 'sapoinfoshop@gmail.com'];

  for (const email of suspiciousEmails) {
    console.log(`📧 Verificando: ${email}`);

    // Verificar na tabela auth.users
    const { data: { users }, error: authError } = await admin.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Erro ao consultar auth:', authError.message);
      continue;
    }

    const authUser = users.find(u => u.email === email);

    if (authUser) {
      console.log(`   ✅ Existe em auth.users:`);
      console.log(`      ID: ${authUser.id}`);
      console.log(`      Email confirmado: ${authUser.email_confirmed_at ? 'SIM' : 'NÃO'}`);
      console.log(`      Criado em: ${authUser.created_at}`);
      console.log(`      Último login: ${authUser.last_sign_in_at || 'Nunca'}`);
    } else {
      console.log(`   ❌ NÃO existe em auth.users`);
    }

    // Verificar na tabela profiles
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Erro ao consultar profiles:', profileError.message);
    } else if (profile) {
      console.log(`   ✅ Existe em profiles:`);
      console.log(`      ID: ${profile.id}`);
      console.log(`      Role: ${profile.role}`);
      console.log(`      Status: ${profile.status}`);
      console.log(`      Criado em: ${profile.created_at}`);
    } else {
      console.log(`   ❌ NÃO existe em profiles`);
    }

    // Verificar se há correspondência
    if (authUser && profile) {
      if (authUser.id === profile.id) {
        console.log(`   ✅ IDs correspondem`);
      } else {
        console.log(`   ⚠️  IDs NÃO correspondem!`);
        console.log(`      Auth ID: ${authUser.id}`);
        console.log(`      Profile ID: ${profile.id}`);
      }
    } else if (authUser && !profile) {
      console.log(`   ⚠️  Usuário existe em auth mas NÃO em profiles!`);
    } else if (!authUser && profile) {
      console.log(`   ⚠️  Usuário existe em profiles mas NÃO em auth!`);
    }

    console.log(''); // Linha em branco
  }

  // Verificar total de usuários
  const { data: { users: allUsers }, error: countError } = await admin.auth.admin.listUsers();
  if (!countError) {
    console.log(`📊 Total de usuários em auth: ${allUsers.length}`);

    const { data: allProfiles, error: profilesError } = await admin
      .from('profiles')
      .select('id', { count: 'exact' });

    if (!profilesError) {
      console.log(`📊 Total de perfis: ${allProfiles.length}`);
    }
  }
}

checkSuspiciousUsers().catch(console.error);