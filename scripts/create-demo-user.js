#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createConfirmedUser() {
  if (!supabaseServiceKey || supabaseServiceKey.length < 20) {
    console.log('❌ Service key inválida');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔐 Criando usuário confirmado via Admin\n');

  const testEmail = `demo${Date.now()}@hotmail.com`;
  const testPassword = 'SecurePass123!@';

  const { data, error } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Marcar como confirmado
  });

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log('✅ Usuário criado e confirmado:');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  console.log('   ID:', data.user.id);

  // Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verificar profile
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.log('\n⚠️  Profile não criado (trigger pode estar desabilitado)');
    console.log('   Criando manualmente...');

    const { error: insertError } = await admin
      .from('profiles')
      .insert({
        id: data.user.id,
        email: testEmail,
        display_name: 'Demo User',
        role: 'cliente',
        status: 'active',
      });

    if (insertError) {
      console.log('   ❌ Erro:', insertError.message);
    } else {
      console.log('   ✅ Profile criado manualmente');
    }
  } else {
    console.log('\n✅ Profile criado automaticamente:');
    console.log('   Role:', profiles.role);
    console.log('   Status:', profiles.status);
  }

  // Agora testar login
  console.log('\n🧪 Testando login...');

  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (loginError) {
    console.log('❌ Login falhou:', loginError.message);
  } else {
    console.log('✅ Login bem-sucedido!');
    console.log('   Token:', loginData.session?.access_token?.substring(0, 20) + '...');
  }
}

createConfirmedUser().catch(console.error);
