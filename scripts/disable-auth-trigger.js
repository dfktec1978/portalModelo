#!/usr/bin/env node

/**
 * Script: Desabilitar trigger que está causando erro no signup
 * Executar diretamente no Supabase Admin SDK
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais não encontradas');
  process.exit(1);
}

async function disableTrigger() {
  console.log('\n🔧 Desabilitando trigger que causa erro...\n');

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Executar SQL para desabilitar trigger
    const { data, error } = await admin.rpc('exec_sql', {
      sql: `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
    });

    if (error) {
      console.log('❌ RPC não disponível, tentando com query...');
      // Se RPC não funciona, vamos apenas informar
      console.log('\n⚠️  Não conseguimos executar diretamente.');
      console.log('📝 Execute manualmente no Supabase Console:');
      console.log('   SQL Editor → New Query → Cole e execute:\n');
      console.log('   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;\n');
      return;
    }

    console.log('✅ Trigger desabilitado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n📝 Execute manualmente no Supabase Console (SQL Editor):\n');
    console.log('   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
  }
}

disableTrigger();
