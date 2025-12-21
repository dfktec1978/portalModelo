#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkUser() {
  if (!supabaseServiceKey) {
    console.log('❌ Chave de serviço não encontrada');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Verificando usuário sapoinfoshop@gmail.com...');

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, email, role, status, created_at')
    .eq('email', 'sapoinfoshop@gmail.com')
    .single();

  if (error) {
    console.log('Erro:', error.message);
    return;
  }

  console.log('Perfil encontrado:');
  console.log('  ID:', profile.id);
  console.log('  Email:', profile.email);
  console.log('  Role:', profile.role);
  console.log('  Status:', profile.status);
  console.log('  Criado em:', profile.created_at);

  // Verificar se tem loja
  const { data: store, error: storeError } = await admin
    .from('stores')
    .select('id, store_name, status')
    .eq('owner_id', profile.id)
    .single();

  if (storeError && storeError.code !== 'PGRST116') {
    console.log('Erro ao buscar loja:', storeError.message);
  } else if (store) {
    console.log('Loja encontrada:');
    console.log('  Store ID:', store.id);
    console.log('  Store Name:', store.store_name);
    console.log('  Store Status:', store.status);
  } else {
    console.log('Nenhuma loja encontrada para este usuário.');
  }
}

checkUser().catch(console.error);