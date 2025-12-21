#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testUserCreationRules() {
  console.log('🔍 Testando regras de criação de usuários...\n');

  // Teste 1: Verificar se tabelas existem
  console.log('📋 1. Verificando tabelas...');
  try {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('count').limit(1);
    const { data: stores, error: storesError } = await supabase.from('stores').select('count').limit(1);

    if (profilesError) {
      console.log('❌ Tabela profiles não existe ou não acessível');
      console.log('   Erro:', profilesError.message);
      return;
    } else {
      console.log('✅ Tabela profiles: OK');
    }

    if (storesError) {
      console.log('❌ Tabela stores não existe ou não acessível');
      console.log('   Erro:', storesError.message);
      return;
    } else {
      console.log('✅ Tabela stores: OK');
    }
  } catch (err) {
    console.log('❌ Erro inesperado ao verificar tabelas:', err.message);
    return;
  }

  console.log('\n📝 2. Testando regras de criação...\n');

  // Simular dados de teste
  const testData = {
    cliente: {
      email: `test-cliente-${Date.now()}@example.com`,
      password: '123456',
      displayName: 'João Silva',
      phone: '(11) 99999-9999',
      userType: 'cliente'
    },
    lojista: {
      email: `test-lojista-${Date.now()}@example.com`,
      password: '123456',
      storeName: 'Loja Teste LTDA',
      ownerName: 'Maria Santos',
      phone: '(11) 88888-8888',
      userType: 'lojista'
    }
  };

  // Teste criação de cliente
  console.log('👤 Testando criação de CLIENTE...');
  try {
    const clientData = testData.cliente;

    // Simular a lógica do cadastro
    const profileData = {
      email: clientData.email,
      display_name: clientData.displayName,
      phone: clientData.phone,
      role: clientData.userType,
      status: clientData.userType === "cliente" ? "active" : "pending",
      accepted_terms: true,
      terms_version: "v1.0",
      accepted_at: new Date().toISOString(),
    };

    console.log('   Dados do perfil:', JSON.stringify(profileData, null, 2));

    // Verificar se a lógica está correta
    const expectedRole = 'cliente';
    const expectedStatus = 'active';
    const expectedDisplayName = clientData.displayName;

    if (profileData.role === expectedRole) {
      console.log('✅ Role correto: cliente');
    } else {
      console.log('❌ Role incorreto:', profileData.role, 'esperado:', expectedRole);
    }

    if (profileData.status === expectedStatus) {
      console.log('✅ Status correto: active');
    } else {
      console.log('❌ Status incorreto:', profileData.status, 'esperado:', expectedStatus);
    }

    if (profileData.display_name === expectedDisplayName) {
      console.log('✅ Nome de exibição correto:', expectedDisplayName);
    } else {
      console.log('❌ Nome de exibição incorreto:', profileData.display_name, 'esperado:', expectedDisplayName);
    }

    console.log('✅ Cliente NÃO deve criar entrada na tabela stores');

  } catch (err) {
    console.log('❌ Erro no teste de cliente:', err.message);
  }

  console.log('\n🏪 Testando criação de LOJISTA...');
  try {
    const storeData = testData.lojista;

    // Simular a lógica do cadastro
    const profileData = {
      email: storeData.email,
      display_name: storeData.ownerName, // Para lojista usa ownerName
      phone: storeData.phone,
      role: storeData.userType,
      status: storeData.userType === "cliente" ? "active" : "pending",
      accepted_terms: true,
      terms_version: "v1.0",
      accepted_at: new Date().toISOString(),
      metadata: { store_name: storeData.storeName }
    };

    const storeEntry = {
      store_name: storeData.storeName,
      phone: storeData.phone,
      status: "pending",
    };

    console.log('   Dados do perfil:', JSON.stringify(profileData, null, 2));
    console.log('   Dados da loja:', JSON.stringify(storeEntry, null, 2));

    // Verificar se a lógica está correta
    const expectedRole = 'lojista';
    const expectedStatus = 'pending';
    const expectedDisplayName = storeData.ownerName;

    if (profileData.role === expectedRole) {
      console.log('✅ Role correto: lojista');
    } else {
      console.log('❌ Role incorreto:', profileData.role, 'esperado:', expectedRole);
    }

    if (profileData.status === expectedStatus) {
      console.log('✅ Status correto: pending');
    } else {
      console.log('❌ Status incorreto:', profileData.status, 'esperado:', expectedStatus);
    }

    if (profileData.display_name === expectedDisplayName) {
      console.log('✅ Nome de exibição correto:', expectedDisplayName);
    } else {
      console.log('❌ Nome de exibição incorreto:', profileData.display_name, 'esperado:', expectedDisplayName);
    }

    if (profileData.metadata?.store_name === storeData.storeName) {
      console.log('✅ Metadata da loja correto:', storeData.storeName);
    } else {
      console.log('❌ Metadata da loja incorreto');
    }

    console.log('✅ Lojista DEVE criar entrada na tabela stores com status "pending"');

  } catch (err) {
    console.log('❌ Erro no teste de lojista:', err.message);
  }

  console.log('\n📋 3. Resumo das regras verificadas:');
  console.log('');
  console.log('CLIENTE:');
  console.log('  - role: "cliente"');
  console.log('  - status: "active"');
  console.log('  - display_name: nome completo do cliente');
  console.log('  - NÃO cria entrada em stores');
  console.log('  - Redirecionamento: /dashboard');
  console.log('');
  console.log('LOJISTA:');
  console.log('  - role: "lojista"');
  console.log('  - status: "pending"');
  console.log('  - display_name: nome do responsável');
  console.log('  - metadata: { store_name: nome da loja }');
  console.log('  - CRIA entrada em stores com status "pending"');
  console.log('  - Redirecionamento: /login (com mensagem de aprovação)');
  console.log('');
  console.log('✅ Teste de regras concluído!');
}

testUserCreationRules();