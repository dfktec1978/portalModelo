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

async function fixUserRole() {
  const email = 'cicerakroth@gmail.com';

  console.log(`🔧 Corrigindo perfil do usuário: ${email}\n`);

  try {
    // Primeiro, obter o perfil atual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return;
    }

    console.log('📋 Perfil atual:');
    console.log('   Role:', profile.role);
    console.log('   Status:', profile.status);
    console.log('   Display Name:', profile.display_name);
    console.log('   Phone:', profile.phone);
    console.log('');

    // Dados para correção
    const storeName = 'Loja Cicera'; // Nome sugerido baseado no nome do usuário
    const ownerName = profile.display_name; // Usar o nome atual como responsável

    console.log('🔄 Aplicando correções...');

    // 1. Atualizar perfil para lojista
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        role: 'lojista',
        status: 'pending',
        metadata: { store_name: storeName }
      })
      .eq('email', email);

    if (updateProfileError) {
      console.error('Erro ao atualizar perfil:', updateProfileError);
      return;
    }

    console.log('✅ Perfil atualizado para lojista');

    // 2. Criar entrada na tabela stores
    const { error: createStoreError } = await supabase
      .from('stores')
      .insert({
        owner_id: profile.id,
        store_name: storeName,
        phone: profile.phone,
        status: 'pending',
      });

    if (createStoreError) {
      console.error('Erro ao criar loja:', createStoreError);
      return;
    }

    console.log('✅ Loja criada com status pending');

    // 3. Verificar as mudanças
    console.log('\n🔍 Verificando correções...');

    const { data: updatedProfile, error: checkProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (checkProfileError) {
      console.error('Erro ao verificar perfil atualizado:', checkProfileError);
    } else {
      console.log('✅ Perfil corrigido:');
      console.log('   Role:', updatedProfile.role);
      console.log('   Status:', updatedProfile.status);
      console.log('   Metadata:', updatedProfile.metadata);
    }

    const { data: store, error: checkStoreError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', profile.id)
      .single();

    if (checkStoreError) {
      console.error('Erro ao verificar loja:', checkStoreError);
    } else {
      console.log('✅ Loja criada:');
      console.log('   Store Name:', store.store_name);
      console.log('   Status:', store.status);
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('');
    console.log('O usuário cicerakroth@gmail.com agora está corretamente configurado como LOJISTA:');
    console.log('- Role: lojista');
    console.log('- Status: pending (aguardando aprovação)');
    console.log('- Loja criada: Loja Cicera');
    console.log('- Status da loja: pending');
    console.log('');
    console.log('O usuário precisará ser aprovado por um administrador para ter acesso completo.');

  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

fixUserRole();