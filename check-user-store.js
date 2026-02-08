const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkUser(email) {
  console.log(`🔍 Verificando usuário: ${email}\n`);
  
  // 1. Buscar profile
  console.log('1️⃣ Buscando profile...');
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${email}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  
  const profiles = await profileRes.json();
  
  if (profiles.length === 0) {
    console.log('❌ Profile não encontrado!');
    return;
  }
  
  const profile = profiles[0];
  console.log('✅ Profile encontrado:');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Role: ${profile.role}`);
  console.log(`   Status: ${profile.status}`);
  console.log(`   Display Name: ${profile.display_name || 'N/A'}`);
  
  // 2. Buscar loja
  console.log('\n2️⃣ Buscando loja...');
  const storeRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stores?owner_id=eq.${profile.id}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  
  const stores = await storeRes.json();
  
  if (stores.length === 0) {
    console.log('❌ Loja NÃO ENCONTRADA!');
    console.log('\n💡 PROBLEMA: O usuário é lojista mas não tem registro na tabela stores.');
    console.log('   Solução: Criar registro na tabela stores para este usuário.');
    return;
  }
  
  const store = stores[0];
  console.log('✅ Loja encontrada:');
  console.log(`   ID: ${store.id}`);
  console.log(`   Store Name: ${store.store_name || 'N/A'}`);
  console.log(`   Status: ${store.status}`);
  console.log(`   Owner ID: ${store.owner_id}`);
  console.log(`   Phone: ${store.phone || 'N/A'}`);
  console.log(`   Address: ${store.address || 'N/A'}`);
  console.log(`   Approved At: ${store.approved_at || 'N/A'}`);
  
  console.log('\n✅ Diagnóstico completo!');
}

checkUser('sapoinfoshop@gmail.com');
