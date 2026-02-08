require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserData() {
  const email = 'sapoinfoshop@gmail.com';
  
  console.log('\n🔧 CORRIGINDO DADOS DO USUÁRIO:', email);
  console.log('='.repeat(60));

  try {
    // 1. Buscar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!profile) {
      console.error('❌ Perfil não encontrado');
      return;
    }

    console.log('\n📊 Dados atuais do perfil:');
    console.log('- ID:', profile.id);
    console.log('- Email:', profile.email);
    console.log('- Role:', profile.role);
    console.log('- Status:', profile.status);
    console.log('- Accepted Terms:', profile.accepted_terms);

    // 2. Corrigir accepted_terms se necessário
    if (!profile.accepted_terms) {
      console.log('\n🔄 Atualizando accepted_terms...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          accepted_terms: true,
          terms_version: 'v1.0',
          accepted_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('❌ Erro:', updateError.message);
      } else {
        console.log('✅ accepted_terms atualizado para true');
      }
    }

    // 3. Verificar se loja existe
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', profile.id);

    console.log('\n🏪 Lojas encontradas:', stores?.length || 0);

    if (!stores || stores.length === 0) {
      console.log('\n🆕 Criando loja...');
      
      const storeName = profile.metadata?.store_name || 'Sapo Info Shop';

      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: profile.id,
          store_name: storeName,
          phone: profile.phone,
          status: 'pending',
        })
        .select()
        .single();

      if (storeError) {
        console.error('❌ Erro ao criar loja:', storeError.message);
        console.error('   Detalhes:', storeError);
      } else {
        console.log('✅ Loja criada com sucesso!');
        console.log('   - ID:', newStore.id);
        console.log('   - Nome:', newStore.store_name);
        console.log('   - Slug:', newStore.slug);
        console.log('   - Status:', newStore.status);
      }
    } else {
      console.log('✅ Loja já existe:', stores[0].store_name);
    }

    // 4. Verificação final
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERIFICAÇÃO FINAL\n');

    const { data: finalData } = await supabase
      .from('profiles')
      .select('id,email,role,status,accepted_terms,stores(id,store_name,status)')
      .eq('email', email)
      .single();

    console.log('✅ Perfil:');
    console.log('   - Role:', finalData.role, finalData.role === 'lojista' ? '✅' : '❌');
    console.log('   - Status:', finalData.status, finalData.status === 'pending' ? '✅' : '❌');
    console.log('   - Termos:', finalData.accepted_terms ? '✅' : '❌');
    
    console.log('\n✅ Lojas:');
    if (finalData.stores && finalData.stores.length > 0) {
      finalData.stores.forEach((store, idx) => {
        console.log(`   ${idx + 1}. ${store.store_name} (${store.status}) ✅`);
      });
    } else {
      console.log('   ❌ Nenhuma loja vinculada');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Login: sapoinfoshop@gmail.com / Test@123456');
    console.log('2. Acessar: http://localhost:3000/dashboard');
    console.log('3. Verificar tela "Aguardando Aprovação"');
    console.log('4. Admin aprova em: http://localhost:3000/admin/usuarios\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

fixUserData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
