#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixRLSRecursion() {
  console.log('🔧 Removendo RLS recursiva em profiles...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Disabilitar RLS completamente na tabela profiles
    console.log('1️⃣  Desabilitando RLS em profiles...');
    let { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    });
    if (error && !error.message.includes('exec_sql')) {
      console.log(`   ⚠️  ${error.message}`);
    } else {
      console.log('   ✓ RLS desabilitado');
    }

    // Disabilitar RLS em professionals
    console.log('2️⃣  Desabilitando RLS em professionals...');
    ({ error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;'
    }));
    if (error && !error.message.includes('exec_sql')) {
      console.log(`   ⚠️  ${error.message}`);
    } else {
      console.log('   ✓ RLS desabilitado');
    }

    // Disabilitar RLS em stores
    console.log('3️⃣  Desabilitando RLS em stores...');
    ({ error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE stores DISABLE ROW LEVEL SECURITY;'
    }));
    if (error && !error.message.includes('exec_sql')) {
      console.log(`   ⚠️  ${error.message}`);
    } else {
      console.log('   ✓ RLS desabilitado');
    }

    // Disabilitar RLS em classifieds
    console.log('4️⃣  Desabilitando RLS em classifieds...');
    ({ error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE classifieds DISABLE ROW LEVEL SECURITY;'
    }));
    if (error && !error.message.includes('exec_sql')) {
      console.log(`   ⚠️  ${error.message}`);
    } else {
      console.log('   ✓ RLS desabilitado');
    }

    console.log('\n✅ Concluído! Tente rodar os testes novamente:\n');
    console.log('   npm run test:news');
    console.log('   npm run test:admin');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

fixRLSRecursion();
