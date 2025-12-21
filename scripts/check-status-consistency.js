#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkStatusConsistency() {
  if (!supabaseServiceKey || (!supabaseServiceKey.startsWith('sb_secret_') && supabaseServiceKey.length < 50)) {
    console.log('❌ Chave de serviço inválida ou não configurada');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Verificando consistência de status no banco de dados...\n');

  // Verificar perfis
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, email, status');

  if (profilesError) {
    console.log('❌ Erro ao consultar profiles:', profilesError.message);
    return;
  }

  // Verificar classificados
  const { data: classifieds, error: classifiedsError } = await admin
    .from('classifieds')
    .select('id, title, status');

  if (classifiedsError) {
    console.log('❌ Erro ao consultar classifieds:', classifiedsError.message);
    return;
  }

  // Verificar stores
  const { data: stores, error: storesError } = await admin
    .from('stores')
    .select('id, store_name, status');

  if (storesError) {
    console.log('❌ Erro ao consultar stores:', storesError.message);
    return;
  }

  console.log('📊 PROFILES:');
  const profileActive = profiles.filter(p => p.status === 'active').length;
  const profileAtivo = profiles.filter(p => p.status === 'ativo').length;
  const profileOther = profiles.filter(p => p.status !== 'active' && p.status !== 'ativo' && p.status !== null).length;
  console.log(`   active: ${profileActive}`);
  console.log(`   ativo: ${profileAtivo}`);
  console.log(`   outros: ${profileOther}`);

  if (profileAtivo > 0) {
    console.log('\n⚠️  PROFILES com status "ativo":');
    profiles.filter(p => p.status === 'ativo').forEach(p => {
      console.log(`   - ${p.email} (ID: ${p.id})`);
    });
  }

  console.log('\n📊 CLASSIFIEDS:');
  const classifiedActive = classifieds.filter(c => c.status === 'active').length;
  const classifiedSold = classifieds.filter(c => c.status === 'sold').length;
  const classifiedRemoved = classifieds.filter(c => c.status === 'removed').length;
  const classifiedOther = classifieds.filter(c => !['active', 'sold', 'removed'].includes(c.status)).length;
  console.log(`   active: ${classifiedActive}`);
  console.log(`   sold: ${classifiedSold}`);
  console.log(`   removed: ${classifiedRemoved}`);
  console.log(`   outros: ${classifiedOther}`);

  console.log('\n📊 STORES:');
  const storeActive = stores.filter(s => s.status === 'active').length;
  const storePending = stores.filter(s => s.status === 'pending').length;
  const storeBlocked = stores.filter(s => s.status === 'blocked').length;
  const storeOther = stores.filter(s => !['active', 'pending', 'blocked'].includes(s.status)).length;
  console.log(`   active: ${storeActive}`);
  console.log(`   pending: ${storePending}`);
  console.log(`   blocked: ${storeBlocked}`);
  console.log(`   outros: ${storeOther}`);

  // Verificar se há inconsistências
  const hasInconsistencies = profileAtivo > 0 || classifiedOther > 0 || storeOther > 0;

  if (hasInconsistencies) {
    console.log('\n🚨 INCONSISTÊNCIAS ENCONTRADAS!');
    console.log('   É necessário padronizar os valores de status.');
  } else {
    console.log('\n✅ Todos os status estão padronizados!');
  }
}

checkStatusConsistency().catch(console.error);