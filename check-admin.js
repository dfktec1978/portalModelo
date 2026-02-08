require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role,status')
    .eq('email', 'dclojainfo@gmail.com')
    .single();

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log('\n📊 Status do Admin:\n');
  console.log('Email:', data.email);
  console.log('Role:', data.role === 'admin' ? '✅ admin' : '❌ ' + data.role);
  console.log('Status:', data.status);
  console.log('\nID:', data.id);

  if (data.role !== 'admin') {
    console.log('\n⚠️ PROBLEMA: Role não é "admin"!');
    console.log('\n🔧 Vou corrigir...\n');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', data.id);

    if (updateError) {
      console.log('❌ Erro ao atualizar:', updateError.message);
    } else {
      console.log('✅ Role alterado para "admin" com sucesso!');
      console.log('\nFaça logout e login novamente.');
    }
  }
}

checkAdmin().then(() => process.exit(0));
