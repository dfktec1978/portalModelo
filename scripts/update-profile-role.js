const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProfileRole() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'lojista', status: 'pending' })
    .eq('id', '2af300ce-55bf-4f0b-ae2f-e6e3a933a797')
    .select();
  
  if (error) {
    console.error('❌ Erro:', error);
  } else {
    console.log('✅ Perfil atualizado para lojista:', data);
  }
}

updateProfileRole();
