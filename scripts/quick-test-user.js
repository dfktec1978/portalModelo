#!/usr/bin/env node

/**
 * 🎯 SCRIPT RÁPIDO - Gerar Usuário de Teste
 * 
 * Uso:
 *   node scripts/quick-test-user.js
 * 
 * Resultado:
 *   Cria usuário com email confirmado
 *   Salva credenciais na tela
 *   Pronto para usar em /login
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function quickTestUser() {
  if (!supabaseServiceKey || supabaseServiceKey.length < 30) {
    console.log('❌ Service key não configurada');
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const ts = Math.random().toString(36).substring(7);
  const email = `demo${ts}@hotmail.com`;
  const password = 'SecurePass123!@';

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎯 GERADOR DE USUÁRIO DE TESTE                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Criar usuário
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.log('❌ Erro ao criar usuário:', createError.message);
    process.exit(1);
  }

  console.log('✅ Usuário criado:\n');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   ID:       ${userData.user.id}\n`);

  // Criar profile
  await new Promise(resolve => setTimeout(resolve, 500));

  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id: userData.user.id,
      email,
      display_name: 'Demo User',
      role: 'cliente',
      status: 'active',
    });

  if (!profileError) {
    console.log('✅ Profile criado\n');
  }

  // Testar login
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.log('❌ Login falhou:', loginError.message);
    process.exit(1);
  }

  console.log('✅ Login funciona!\n');
  console.log('📋 PRÓXIMAS AÇÕES:\n');
  console.log('   1. Abra: http://localhost:3000/login');
  console.log(`   2. Email: ${email}`);
  console.log(`   3. Senha: ${password}`);
  console.log('   4. Click: ENTRAR\n');
  console.log('💡 Salve essas credenciais! Elas expiram quando você sair.\n');
}

quickTestUser().catch(console.error);
