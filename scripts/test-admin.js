#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabaseAdminNews() {
  console.log('🧪 Teste 1: Admin queries - news');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('news').select('*,created_by:profiles(display_name)').limit(5);
    if (error) throw error;
    console.log(`   ✓ Notícias com creator encontradas: ${data.length}`);
    if (data.length > 0) console.log(`   ✓ Primeira (criador: ${data[0].created_by?.display_name})`);
    return true;
  } catch (e) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

async function testSupabaseAdminStores() {
  console.log('\n🧪 Teste 2: Admin queries - stores');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('stores').select('*,owner_id:profiles(display_name,email)').limit(5);
    if (error) throw error;
    console.log(`   ✓ Lojas com owner encontradas: ${data.length}`);
    if (data.length > 0) console.log(`   ✓ Primeira (owner: ${data[0].owner_id?.display_name})`);
    return true;
  } catch (e) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

async function testSupabaseAdminProfessionals() {
  console.log('\n🧪 Teste 3: Admin queries - professionals');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('professionals').select('*').limit(5);
    if (error) throw error;
    console.log(`   ✓ Profissionais encontrados: ${data.length}`);
    return true;
  } catch (e) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 VALIDAÇÃO: Admin Queries                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = [
    await testSupabaseAdminNews(),
    await testSupabaseAdminStores(),
    await testSupabaseAdminProfessionals(),
  ];

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n📊 Resultado:');
  console.log(`   ${passed}/${total} testes passaram`);
  if (passed === total) {
    console.log('   ✅ ADMIN QUERIES OK!\n');
  } else {
    console.log(`   ⚠️  ${total - passed} testes falharam\n`);
  }

  process.exit(passed === total ? 0 : 1);
}

runAllTests().catch(e => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});
