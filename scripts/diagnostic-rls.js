#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function diagnosticar() {
  console.log('🔍 Diagnóstico de RLS...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Teste 1: Acesso direto a professionals (sem join)
  console.log('1️⃣  Teste: SELECT * FROM professionals');
  try {
    const { data, error } = await supabase.from('professionals').select('*');
    if (error) throw error;
    console.log(`   ✓ Sucesso: ${data.length} registros\n`);
  } catch (err) {
    console.error(`   ✗ Erro: ${err.message}\n`);
  }

  // Teste 2: Acesso com seleção específica
  console.log('2️⃣  Teste: SELECT id, user_id FROM professionals');
  try {
    const { data, error } = await supabase.from('professionals').select('id, user_id');
    if (error) throw error;
    console.log(`   ✓ Sucesso: ${data.length} registros\n`);
  } catch (err) {
    console.error(`   ✗ Erro: ${err.message}\n`);
  }

  // Teste 3: Acesso a profiles (onde está o RLS)
  console.log('3️⃣  Teste: SELECT * FROM profiles');
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    console.log(`   ✓ Sucesso: ${data.length} registros\n`);
  } catch (err) {
    console.error(`   ✗ Erro: ${err.message}\n`);
  }

  // Teste 4: Join simples
  console.log('4️⃣  Teste: SELECT professionals with join profiles');
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('id, user_id, profiles:user_id(name)');
    if (error) throw error;
    console.log(`   ✓ Sucesso: ${data.length} registros\n`);
  } catch (err) {
    console.error(`   ✗ Erro: ${err.message}\n`);
  }
}

diagnosticar();
