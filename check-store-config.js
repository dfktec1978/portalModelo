#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkStore() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Verificando loja do lojista915b...\n');

  const { data, error } = await admin
    .from('stores')
    .select('*')
    .eq('owner_id', 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63')
    .single();

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log('📊 DADOS DA LOJA:');
  console.log('─'.repeat(60));
  console.log('ID:', data.id);
  console.log('Nome:', data.store_name);
  console.log('Categoria:', data.category || '❌ NULL');
  console.log('Tema:', data.theme_color || '❌ NULL');
  console.log('Slug:', data.slug || '❌ NULL');
  console.log('Logo URL:', data.logo_url || '(não configurado)');
  console.log('Status:', data.status);
  console.log('─'.repeat(60));
  
  if (data.category && data.theme_color && data.slug) {
    console.log('\n✅ Loja configurada corretamente!');
  } else {
    console.log('\n⚠️ Alguns campos ainda precisam ser atualizados');
  }
}

checkStore();
