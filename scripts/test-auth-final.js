#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🧪 Teste: Signup com validação de email desabilitada\n');
console.log('URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('Anon Key:', supabaseAnonKey?.substring(0, 30) + '...\n');

async function test() {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Tentar signup com email simples
  const testEmail = `user${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';

  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Senha: ${testPassword}\n`);

  const { data: authData, error: authError } = await client.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    }
  });

  if (authError) {
    console.log('❌ Signup failed:', authError.message);
    return;
  }

  console.log('✅ Signup OK');
  const userId = authData.user?.id;
  console.log('   User ID:', userId);
  console.log('   Email:', authData.user?.email);
  console.log('   Confirmed:', authData.user?.email_confirmed_at ? 'YES' : 'NO');

  if (!userId) return;

  // Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verificar profile
  console.log('\n📋 Verificando profile...');
  
  // Usar anon client com auth header
  const { data: { user }, error: userError } = await client.auth.getUser();
  
  if (userError) {
    console.log('⚠️  Não conseguimos confirmar sessão:', userError.message);
  }

  // Tentar acessar profile (anon pode ler?)
  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.log('❌ Profile não encontrado:', profileError.message);
    console.log('   (Trigger pode ter falhado ou RLS bloqueando)');
  } else {
    console.log('✅ Profile criado:');
    console.log('   Role:', profiles.role);
    console.log('   Status:', profiles.status);
  }

  // Tentar login
  console.log('\n🔐 Testando login...');
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (loginError) {
    console.log('❌ Login failed:', loginError.message);
  } else {
    console.log('✅ Login OK');
    console.log('   Session token:', loginData.session?.access_token?.substring(0, 20) + '...');
  }
}

test().catch(console.error);
