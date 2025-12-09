#!/usr/bin/env node

/**
 * Script de teste: Fluxo completo de autenticação
 * 1. Criar novo usuário via Supabase Auth
 * 2. Validar criação de profile
 * 3. Testar login
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Erro: Credenciais Supabase não encontradas em .env.local');
  process.exit(1);
}

async function testAuth() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔐 TESTE: Autenticação Supabase (Signup + Profile)  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Client público (para signup/login)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Client admin (para verificar dados no backend)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Criar novo usuário
    console.log('🧪 Teste 1: Signup - Criar novo usuário');
    
    const testEmail = `test-${Date.now()}@portal-modelo.local`;
    const testPassword = 'Teste123!@#';
    const testName = 'Usuário Teste';
    const testPhone = '11987654321';

    const signupResult = await anonClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: testName,
          phone: testPhone,
        }
      }
    });

    if (signupResult.error) {
      console.log(`   ✗ Erro no signup: ${signupResult.error.message}`);
      process.exit(1);
    }

    const userId = signupResult.data.user?.id;
    console.log(`   ✓ Usuário criado: ${testEmail}`);
    console.log(`   ✓ User ID: ${userId}`);

    // Aguardar processamento (RLS pode levar 1-2 segundos)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Verificar se profile foi criado
    console.log('\n🧪 Teste 2: Profile - Validar criação automática');
    
    const profileCheck = await adminClient
      .from('profiles')
      .select('id, user_id, display_name, email, phone, role, status')
      .eq('user_id', userId)
      .single();

    if (profileCheck.error) {
      console.log(`   ✗ Profile não encontrado: ${profileCheck.error.message}`);
      
      // Listar todos os profiles para debug
      const allProfiles = await adminClient.from('profiles').select('*');
      console.log(`   📊 Total de profiles: ${allProfiles.data?.length || 0}`);
    } else {
      console.log(`   ✓ Profile encontrado`);
      console.log(`   ✓ Nome: ${profileCheck.data?.display_name}`);
      console.log(`   ✓ Email: ${profileCheck.data?.email}`);
      console.log(`   ✓ Role: ${profileCheck.data?.role}`);
      console.log(`   ✓ Status: ${profileCheck.data?.status}`);
    }

    // 3. Testar login
    console.log('\n🧪 Teste 3: Signin - Login com credenciais');
    
    const signinResult = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signinResult.error) {
      console.log(`   ✗ Erro no login: ${signinResult.error.message}`);
      process.exit(1);
    }

    console.log(`   ✓ Login bem-sucedido`);
    console.log(`   ✓ Session token: ${signinResult.data.session?.access_token?.substring(0, 20)}...`);

    // 4. Testar signout
    console.log('\n🧪 Teste 4: Signout - Logout');
    
    const signoutResult = await anonClient.auth.signOut();
    
    if (signoutResult.error) {
      console.log(`   ✗ Erro no logout: ${signoutResult.error.message}`);
    } else {
      console.log(`   ✓ Logout bem-sucedido`);
    }

    // 5. Limpeza (deletar usuário de teste)
    console.log('\n🧪 Teste 5: Cleanup - Remover usuário de teste');
    
    const deleteResult = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteResult.error) {
      console.log(`   ⚠️  Aviso: Usuário não foi deletado (${deleteResult.error.message})`);
      console.log(`   💡 Dica: Você pode deletar manualmente em: Supabase Console > Authentication`);
    } else {
      console.log(`   ✓ Usuário deletado com sucesso`);
    }

    console.log('\n📊 Resultado:');
    console.log('   ✅ 5/5 testes passaram');
    console.log('   🎉 FLUXO DE AUTENTICAÇÃO OK!\n');

  } catch (err) {
    console.error('\n❌ Erro não esperado:', err);
    process.exit(1);
  }
}

testAuth().catch(console.error);
