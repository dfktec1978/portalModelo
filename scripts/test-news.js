#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabaseNews() {
  console.log('?? Teste 1: Conexão Supabase - news');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('news').select('*').limit(5);
    if (error) throw error;
    console.log(`   ? Conectado ao Supabase`);
    console.log(`   ? Notícias: ${data.length}`);
    if (data.length > 0) console.log(`   ? Primeira: "${data[0].title}"`);
    return true;
  } catch (e) {
    console.error('   ? Erro:', e.message);
    return false;
  }
}

async function testSupabaseClassifieds() {
  console.log('\n?? Teste 2: Supabase - classifieds');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('classifieds').select('*').limit(5);
    if (error) throw error;
    console.log(`   ? Conectado`);
    console.log(`   ? Classificados: ${data.length}`);
    return true;
  } catch (e) {
    console.error('   ? Erro:', e.message);
    return false;
  }
}

async function testSupabaseProfessionals() {
  console.log('\n?? Teste 3: Supabase - professionals');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('professionals').select('*').limit(5);
    if (error) throw error;
    console.log(`   ? Conectado`);
    console.log(`   ? Profissionais: ${data.length}`);
    return true;
  } catch (e) {
    console.error('   ? Erro:', e.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n+--------------------------------------------------------+');
  console.log('¦  ?? TESTES: Integridade de Dados Supabase            ¦');
  console.log('+--------------------------------------------------------+');

  const results = [
    await testSupabaseNews(),
    await testSupabaseClassifieds(),
    await testSupabaseProfessionals(),
  ];

  const passed = results.filter(r => r).length;

  console.log('\n?? Resultado: ' + passed + '/3 testes OK\n');
  process.exit(passed === 3 ? 0 : 1);
}

runAllTests().catch(e => {
  console.error('? Erro fatal:', e);
  process.exit(1);
});
