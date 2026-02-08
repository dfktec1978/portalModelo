const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createStore() {
  console.log('🏪 Criando loja para sapoinfoshop@gmail.com...\n');
  
  // 1. Buscar profile
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.sapoinfoshop@gmail.com&select=id,display_name,email`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  const profiles = await profileRes.json();
  if (profiles.length === 0) {
    console.log('❌ Profile não encontrado!');
    return;
  }
  
  const profile = profiles[0];
  console.log(`✅ Profile encontrado: ${profile.id}`);
  
  // 2. Criar loja
  const storeName = (profile.display_name || 'Loja') + ' Store';
  
  const createRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stores`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        owner_id: profile.id,
        store_name: storeName,
        status: 'active',
        created_at: new Date().toISOString(),
        approved_at: new Date().toISOString()
      })
    }
  );
  
  if (!createRes.ok) {
    const error = await createRes.text();
    console.log('❌ Erro ao criar loja:', error);
    return;
  }
  
  const store = await createRes.json();
  console.log('\n✅ Loja criada com sucesso!');
  console.log(`   ID: ${store[0]?.id || 'N/A'}`);
  console.log(`   Nome: ${storeName}`);
  console.log(`   Status: active`);
  console.log(`   Owner ID: ${profile.id}`);
  
  console.log('\n🎉 Pronto! Faça reload da página do dashboard.');
}

createStore().catch(err => console.error('❌ Erro:', err.message));
