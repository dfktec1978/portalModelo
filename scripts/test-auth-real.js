#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test() {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Usar email único com timestamp
  const ts = Math.random().toString(36).substring(7);
  const testEmail = `portal${ts}@dfktec.com.br`;
  const testPassword = 'SecurePass123!@';

  console.log('\n🧪 Teste: Signup com email real\n');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Senha: ${testPassword}\n`);

  const { data: authData, error: authError } = await client.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError) {
    console.log('❌ Signup failed');
    console.log('   Erro:', authError.message);
    console.log('   Status:', authError.status);
    return;
  }

  console.log('✅ Signup OK!');
  const userId = authData.user?.id;
  console.log('   User ID:', userId);
  console.log('   Email:', authData.user?.email);

  // Aguardar
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Verificar profile
  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (profileError) {
    console.log('\n❌ Profile query failed:', profileError.message);
  } else {
    if (profiles && profiles.length > 0) {
      console.log('\n✅ Profile criado!');
      console.log('   Role:', profiles[0].role);
    } else {
      console.log('\n⚠️  Profile NÃO encontrado (trigger não rodou?)');
    }
  }

  // Testar login
  console.log('\n🔐 Testando login...');
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (loginError) {
    console.log('❌ Login failed:', loginError.message);
  } else {
    console.log('✅ Login OK!');
    console.log('   Usuário:', loginData.user.email);
  }

  // Logout
  await client.auth.signOut();
  console.log('\n✅ Logout OK');
}

test().catch(console.error);
