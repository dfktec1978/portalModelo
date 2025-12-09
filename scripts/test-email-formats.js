#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test() {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Testar vários formatos de email
  const emailTests = [
    'test@test.com',
    'user@gmail.com',
    'demo@hotmail.com',
    'portal@example.com',
  ];

  console.log('\n🧪 Testando diferentes formatos de email\n');

  for (const email of emailTests) {
    const { data, error } = await client.auth.signUp({
      email,
      password: 'SecurePass123!@'
    });

    if (error) {
      console.log(`❌ ${email}`);
      console.log(`   Erro: ${error.message}\n`);
    } else {
      console.log(`✅ ${email}`);
      console.log(`   User ID: ${data.user?.id}\n`);
      return data.user?.id;
    }
  }
}

test().catch(console.error);
