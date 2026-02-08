#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function safeDelete(table) {
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.warn(`⚠️  Falha ao limpar ${table}:`, error.message || error);
    return false;
  }
  console.log(`✅ ${table} limpo`);
  return true;
}

async function main() {
  console.log('🧹 Limpando pedidos e financeiro (todas as lojas)...');

  await safeDelete('pix_transactions');
  await safeDelete('orders');

  console.log('✅ Limpeza concluída');
}

main().catch((err) => {
  console.error('❌ Erro na limpeza:', err?.message || err);
  process.exit(1);
});
