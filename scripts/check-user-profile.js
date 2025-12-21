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

async function checkUserProfile() {
  const email = 'cicerakroth@gmail.com';

  console.log(`🔍 Verificando perfil do usuário: ${email}\n`);

  try {
    // Verificar na tabela profiles
    console.log('📋 Consultando tabela profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('❌ Usuário não encontrado na tabela profiles');
        return;
      }
      console.error('Erro ao consultar profiles:', profileError);
      return;
    }

    console.log('✅ Perfil encontrado:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Role:', profile.role);
    console.log('   Status:', profile.status);
    console.log('   Display Name:', profile.display_name);
    console.log('   Phone:', profile.phone);
    console.log('   Metadata:', profile.metadata);
    console.log('   Created At:', profile.created_at);
    console.log('   Updated At:', profile.updated_at);

    // Verificar se existe entrada na tabela stores
    console.log('\n🏪 Verificando tabela stores...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', profile.id)
      .single();

    if (storeError) {
      if (storeError.code === 'PGRST116') {
        console.log('❌ Nenhuma loja encontrada para este usuário');
      } else {
        console.error('Erro ao consultar stores:', storeError);
      }
    } else {
      console.log('✅ Loja encontrada:');
      console.log('   Store ID:', store.id);
      console.log('   Store Name:', store.store_name);
      console.log('   Status:', store.status);
      console.log('   Phone:', store.phone);
      console.log('   Created At:', store.created_at);
    }

    // Verificar na tabela auth.users (através de RPC ou consulta direta)
    console.log('\n🔐 Verificando dados de autenticação...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);

    if (authError) {
      console.error('Erro ao consultar auth user:', authError);
    } else {
      console.log('✅ Dados de auth encontrados:');
      console.log('   User ID:', authUser.user.id);
      console.log('   Email:', authUser.user.email);
      console.log('   Email Confirmed:', authUser.user.email_confirmed_at ? 'Sim' : 'Não');
      console.log('   Created At:', authUser.user.created_at);
      console.log('   User Metadata:', authUser.user.user_metadata);
    }

    // Análise do problema
    console.log('\n🔍 ANÁLISE DO PROBLEMA:');
    console.log('');

    if (profile.role === 'cliente') {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   O usuário foi cadastrado como CLIENTE, mas deveria ser LOJISTA');
      console.log('');
      console.log('   Possíveis causas:');
      console.log('   1. O usuário selecionou "Cliente" em vez de "Lojista" durante o cadastro');
      console.log('   2. Houve um bug na seleção do tipo de usuário');
      console.log('   3. O estado userType não foi atualizado corretamente');
      console.log('   4. O formulário foi submetido antes da seleção do tipo');

      if (!store) {
        console.log('   ✓ Confirmação: Não há loja associada (correto para cliente)');
      }
    } else if (profile.role === 'lojista') {
      console.log('✅ O usuário está corretamente cadastrado como LOJISTA');

      if (store) {
        console.log('✅ Loja associada encontrada (correto para lojista)');
      } else {
        console.log('⚠️ ALERTA: Lojista sem loja associada - isso é um problema!');
      }
    }

  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

checkUserProfile();