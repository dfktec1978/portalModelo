const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStores() {
  console.log('🔍 Verificando lojas no banco...\n');
  
  const { data: stores, error } = await supabase
    .from('stores')
    .select(`
      id,
      store_name,
      owner_id,
      status,
      created_at,
      profiles!owner_id (
        email,
        display_name,
        role
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar lojas:', error);
    return;
  }
  
  if (!stores || stores.length === 0) {
    console.log('⚠️ Nenhuma loja encontrada no banco');
    return;
  }
  
  console.log(`✅ Total de lojas: ${stores.length}\n`);
  
  const pending = stores.filter(s => s.status === 'pending');
  const approved = stores.filter(s => s.status === 'approved');
  const blocked = stores.filter(s => s.status === 'blocked');
  
  console.log(`📊 Status das lojas:`);
  console.log(`   ⏳ Pendentes: ${pending.length}`);
  console.log(`   ✅ Aprovadas: ${approved.length}`);
  console.log(`   🚫 Bloqueadas: ${blocked.length}\n`);
  
  console.log('📋 Lista completa:\n');
  
  stores.forEach((store, index) => {
    console.log(`${index + 1}. ${store.store_name || '(Sem nome)'}`);
    console.log(`   ID: ${store.id}`);
    console.log(`   Status: ${store.status || 'NULL'}`);
    console.log(`   Owner: ${store.profiles?.email || 'N/A'} (${store.profiles?.display_name || 'N/A'})`);
    console.log(`   Role: ${store.profiles?.role || 'N/A'}`);
    console.log(`   Criado: ${store.created_at}`);
    console.log('');
  });
}

checkStores().then(() => {
  console.log('✅ Verificação concluída');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
