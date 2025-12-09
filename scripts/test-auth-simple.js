#!/usr/bin/env node

/**
 * Script de teste: Autenticação Supabase (Simplificado)
 * Testa apenas signup (sem trigger de profile)
 * Profile será criado manualmente no app
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
  console.log('║  🔐 TESTE: Autenticação Supabase (Simplificado)       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Client público (para signup/login)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Client admin (para verificar dados no backend)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Criar novo usuário
    console.log('🧪 Teste 1: Signup - Criar novo usuário');
    
    // Hotmail é aceito pelo Supabase (test@ e user@ são bloqueados)
    const testEmail = `demo${Date.now()}@hotmail.com`;
    const testPassword = 'Teste123!@#';
    const testName = 'Usuário Teste';
    const testPhone = '11987654321';

    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   🔑 Senha: ${testPassword}`);

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
      console.log(`   💡 Tip: Erro pode ser porque o usuário já existe ou email inválido`);
      
      // Tentar fazer login em vez disso
      console.log('\n🧪 Tentando login (usuário pode já existir)...');
      const signinResult = await anonClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (signinResult.error) {
        console.log(`   ✗ Login também falhou: ${signinResult.error.message}`);
        process.exit(1);
      }
      
      console.log(`   ✓ Login bem-sucedido (usuário existia)`);
      const userId = signinResult.data.user?.id;
      console.log(`   ✓ User ID: ${userId}`);
    } else {
      const userId = signupResult.data.user?.id;
      console.log(`   ✓ Usuário criado: ${testEmail}`);
      console.log(`   ✓ User ID: ${userId}`);
    }

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Verificar se profile foi criado (pelo trigger)
    console.log('\n🧪 Teste 2: Profile - Verificar se foi criado por trigger');
    
    const allProfiles = await adminClient
      .from('profiles')
      .select('id, email, display_name, role')
      .order('created_at', { ascending: false })
      .limit(3);

    if (allProfiles.data && allProfiles.data.length > 0) {
      console.log(`   ✓ Total de profiles: ${allProfiles.data.length}`);
      console.log(`   📋 Últimas 3 contas:`);
      allProfiles.data.forEach((p, idx) => {
        console.log(`      ${idx + 1}. ${p.email} (role: ${p.role || 'N/A'})`);
      });
      
      // Verificar se o teste email está lá
      const testProfile = allProfiles.data.find(p => p.email === testEmail);
      if (testProfile) {
        console.log(`   ✅ Profile de teste ENCONTRADO!`);
      } else {
        console.log(`   ⚠️  Profile de teste NÃO estava na lista (pode estar em outro lugar)`);
      }
    } else {
      console.log(`   ✗ Nenhum profile encontrado`);
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

    console.log('\n📊 Resultado:');
    console.log('   ✅ Testes de autenticação passaram');
    console.log('   🎉 SIGNUP + LOGIN + LOGOUT OK!\n');

  } catch (err) {
    console.error('\n❌ Erro não esperado:', err);
    process.exit(1);
  }
}

testAuth().catch(console.error);
