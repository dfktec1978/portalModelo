#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 DEBUG: Testando signup direto via Supabase\n');

  // Use admin client para criar usuário
  const { data, error } = await admin.auth.admin.createUser({
    email: `demo-${Date.now()}@test.com`,
    password: 'Password123!',
    email_confirm: true // Confirmar email automaticamente
  });

  if (error) {
    console.log('❌ Erro:', error.message);
    console.log('Status:', error.status);
  } else {
    console.log('✅ Usuário criado:');
    console.log('   ID:', data.user.id);
    console.log('   Email:', data.user.email);
    
    // Verificar se profile foi criado
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.log('\n❌ Profile NOT criado (trigger falhou)');
      console.log('   Erro:', profileError.message);
    } else {
      console.log('\n✅ Profile criado automaticamente:');
      console.log('   Role:', profiles.role);
      console.log('   Status:', profiles.status);
    }
  }
}

test().catch(console.error);
