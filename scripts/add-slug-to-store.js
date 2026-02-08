require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSlugToStore() {
  const storeId = '6771ecc4-f536-43aa-b806-d11dac01e90d';
  
  const { data, error } = await supabase
    .from('stores')
    .update({
      slug: 'loja-demo-modelo'
    })
    .eq('id', storeId)
    .select();
  
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Loja atualizada com slug:', data);
  }
}

addSlugToStore().catch(console.error);
