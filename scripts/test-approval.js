const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApproval() {
  try {
    const testUserId = '3c55b4d6-6faa-4718-8fe0-04057fba97e2';

    console.log('🧪 Testando aprovação do usuário...');

    // Primeiro, verificar o status atual
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (fetchError) {
      console.log('❌ Erro ao buscar usuário:', fetchError.message);
      return;
    }

    console.log('👤 Status atual do usuário:', userData.status, userData.role);

    if (userData.status !== 'pending') {
      console.log('⚠️ Usuário não está pendente, status atual:', userData.status);
      return;
    }

    // Tentar a atualização
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        approved_at: new Date().toISOString()
      })
      .eq('id', testUserId)
      .eq('status', 'pending');

    if (updateError) {
      console.log('❌ Erro na atualização:', updateError.message);
      console.log('🔍 Código:', updateError.code);
      console.log('📝 Detalhes:', updateError.details);
      console.log('💡 Dica:', updateError.hint);
    } else {
      console.log('✅ Atualização bem-sucedida!');

      // Verificar se foi realmente atualizado
      const { data: updatedUser, error: verifyError } = await supabase
        .from('profiles')
        .select('status, approved_at')
        .eq('id', testUserId)
        .single();

      if (verifyError) {
        console.log('❌ Erro ao verificar atualização:', verifyError.message);
      } else {
        console.log('🔍 Status após atualização:', updatedUser.status, updatedUser.approved_at);
      }
    }

  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testApproval();