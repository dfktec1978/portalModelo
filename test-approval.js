const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 URLs e Keys carregadas:');
console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`Service Role Key: ${SERVICE_ROLE_KEY?.substring(0, 20)}...`);
console.log();

async function getPendingUsers() {
  console.log('📋 Buscando usuários pendentes...');
  
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?status=eq.pending&select=id,email,name,is_lojista`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  
  const data = await response.json();
  console.log(`✅ Encontrados ${data.length} usuários pendentes:`);
  data.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name || u.email} (${u.id}) - Lojista: ${u.is_lojista}`);
  });
  
  return data;
}

async function approveUser(userId, isLojista) {
  console.log(`\n🚀 Aprovando usuário: ${userId}...`);
  
  const response = await fetch('http://localhost:3000/api/admin/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      action: 'approve',
      user_id: userId,
      approve_store: isLojista, // se for lojista, aprova também a loja
      new_role: 'user',
    }),
  });
  
  const text = await response.text();
  console.log(`Status: ${response.status}`);
  
  try {
    const data = JSON.parse(text);
    console.log(`Resposta:`, JSON.stringify(data, null, 2));
    return data;
  } catch {
    console.log(`Resposta (texto):`, text);
    return null;
  }
}

async function main() {
  try {
    const users = await getPendingUsers();
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n✨ Testando aprovação com primeiro usuário:`);
      await approveUser(firstUser.id, firstUser.is_lojista);
    } else {
      console.log('\n⚠️ Nenhum usuário pendente encontrado para testar aprovação.');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();
