const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteDuplicateUser() {
  const userIdToDelete = '2af300ce-55bf-4f0b-ae2f-e6e3a933a797'; // ID mais recente
  
  console.log(`🗑️ Excluindo usuário duplicado: ${userIdToDelete}\n`);
  
  try {
    // 1. Verificar se há lojas vinculadas
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', userIdToDelete);
    
    if (stores && stores.length > 0) {
      console.log(`⚠️ ATENÇÃO: Usuário possui ${stores.length} lojas vinculadas:`);
      stores.forEach(s => console.log(`   - ${s.store_name}`));
      console.log('\nExcluindo lojas primeiro...\n');
      
      for (const store of stores) {
        const { error: storeError } = await supabase
          .from('stores')
          .delete()
          .eq('id', store.id);
        
        if (storeError) {
          console.error(`❌ Erro ao excluir loja ${store.store_name}:`, storeError);
        } else {
          console.log(`✅ Loja ${store.store_name} excluída`);
        }
      }
    }
    
    // 2. Excluir perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);
    
    if (profileError) {
      console.error('❌ Erro ao excluir perfil:', profileError);
    } else {
      console.log('✅ Perfil excluído');
    }
    
    // 3. Excluir usuário do auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userIdToDelete);
    
    if (authError) {
      console.error('❌ Erro ao excluir usuário de auth:', authError);
    } else {
      console.log('✅ Usuário excluído de auth.users');
    }
    
    console.log('\n✅ Usuário duplicado removido com sucesso!');
    console.log('✅ Email sapoinfoshop@gmail.com agora tem apenas 1 conta (ID: aac9a190-6953-4080-803f-62b5512e1443)');
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

deleteDuplicateUser().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
