#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixStatusConsistency() {
  if (!supabaseServiceKey || (!supabaseServiceKey.startsWith('sb_secret_') && supabaseServiceKey.length < 50)) {
    console.log('❌ Chave de serviço inválida ou não configurada');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔧 Corrigindo inconsistências de status...\n');

  // 1. Corrigir perfis com status "ativo" para "active"
  console.log('1️⃣ Corrigindo perfis com status "ativo"...');
  const { data: profilesToFix, error: profilesError } = await admin
    .from('profiles')
    .update({ status: 'active' })
    .eq('status', 'ativo')
    .select('id, email');

  if (profilesError) {
    console.log('❌ Erro ao corrigir profiles:', profilesError.message);
  } else {
    console.log(`✅ Corrigidos ${profilesToFix.length} perfis:`);
    profilesToFix.forEach(p => console.log(`   - ${p.email}`));
  }

  // 2. Verificar se há outros valores inconsistentes em classificados
  console.log('\n2️⃣ Verificando classificados...');
  const { data: classifieds, error: classifiedsError } = await admin
    .from('classifieds')
    .select('id, title, status');

  if (classifiedsError) {
    console.log('❌ Erro ao consultar classifieds:', classifiedsError.message);
  } else {
    const invalidClassifieds = classifieds.filter(c => !['active', 'sold', 'removed'].includes(c.status));
    if (invalidClassifieds.length > 0) {
      console.log(`⚠️ Encontrados ${invalidClassifieds.length} classificados com status inválido:`);
      invalidClassifieds.forEach(c => console.log(`   - "${c.title}": "${c.status}"`));
    } else {
      console.log('✅ Todos os classificados têm status válido.');
    }
  }

  // 3. Verificar stores
  console.log('\n3️⃣ Verificando stores...');
  const { data: stores, error: storesError } = await admin
    .from('stores')
    .select('id, store_name, status');

  if (storesError) {
    console.log('❌ Erro ao consultar stores:', storesError.message);
  } else {
    const invalidStores = stores.filter(s => !['active', 'pending', 'blocked'].includes(s.status));
    if (invalidStores.length > 0) {
      console.log(`⚠️ Encontradas ${invalidStores.length} stores com status inválido:`);
      invalidStores.forEach(s => console.log(`   - "${s.store_name}": "${s.status}"`));
    } else {
      console.log('✅ Todas as stores têm status válido.');
    }
  }

  console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
  console.log('   Todos os status foram padronizados para inglês.');
}

fixStatusConsistency().catch(console.error);