#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listUsers() {
  if (!supabaseServiceKey || supabaseServiceKey.length < 50) {
    console.log('❌ Chave de serviço inválida ou não configurada');
    console.log('   Comprimento:', supabaseServiceKey?.length || 0);
    console.log('\n💡 Nota: Supabase pode estar rejeitando emails por validação.');
    console.log('   Verifique em: Settings → Auth → Email');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n📋 Listando usuários no Supabase Auth...\n');

  const { data: { users }, error } = await admin.auth.admin.listUsers();

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log(`✅ Total de usuários: ${users.length}\n`);
  
  if (users.length > 0) {
    users.slice(0, 5).forEach((u, i) => {
      console.log(`${i + 1}. Email: ${u.email}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Confirmed: ${u.email_confirmed_at ? 'SIM' : 'NÃO'}\n`);
    });
  }
}

listUsers().catch(console.error);
