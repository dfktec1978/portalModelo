require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'OK' : 'FALTANDO');
console.log('Service Key:', supabaseServiceKey ? 'OK' : 'FALTANDO');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltam variáveis de ambiente!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateStore() {
  const lojistaId = 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63';
  
  // Verificar se já existe loja
  const { data: existingStores } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', lojistaId);
  
  console.log('Lojas existentes:', existingStores);
  
  if (!existingStores || existingStores.length === 0) {
    console.log('Criando loja para o lojista...');
    
    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          id: 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63',
          name: 'Loja Demo Modelo',
          slug: 'loja-demo-modelo',
          category: 'varejo',
          owner_id: lojistaId,
          status: 'approved',
          store_name: 'Loja Demo Modelo',
          description: 'Loja demonstrativa do Portal Modelo',
          phone: '(49) 99999-9999',
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('Erro ao criar loja:', error);
    } else {
      console.log('Loja criada com sucesso:', data);
    }
  } else {
    console.log('Lojista já possui loja(s) vinculada(s)');
  }
}

checkAndCreateStore().catch(console.error);
