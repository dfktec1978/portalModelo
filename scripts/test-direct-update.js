const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testDirectUpdate() {
  console.log('🧪 Testando atualização direta via REST API...\n');

  const userId = 'aac9a190-6953-4080-803f-62b5512e1443'; // sapoinfoshop

  // Tentar UPDATE direto via REST API com headers especiais
  const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
  
  console.log('📡 Fazendo PATCH em:', profileUrl);
  console.log('🔑 Service key length:', supabaseServiceKey.length);

  try {
    const response = await fetch(profileUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation',
        'X-Client-Info': 'supabase-js/2.0.0'
      },
      body: JSON.stringify({
        status: 'active',
        approved_at: new Date().toISOString()
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('📄 Response:', text);

    if (response.ok) {
      console.log('\n✅ Atualização bem-sucedida!');
    } else {
      console.log('\n❌ Falhou');
    }
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }

  // Tentar também com a store
  console.log('\n🏪 Testando atualização da loja...');
  const storeUrl = `${supabaseUrl}/rest/v1/stores?owner_id=eq.${userId}`;
  
  try {
    const response = await fetch(storeUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'active',
        approved_at: new Date().toISOString()
      })
    });

    console.log('📊 Status:', response.status);
    const text = await response.text();
    console.log('📄 Response:', text);
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

testDirectUpdate();
