const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminPolicy() {
  try {
    console.log('🔧 Corrigindo política de admin para atualização de perfis...');

    // Verificar se conseguimos fazer uma operação básica primeiro
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Erro de conexão:', testError.message);
      return;
    }

    console.log('✅ Conexão OK');

    // Tentar adicionar a política de admin
    // Como não temos acesso direto ao DDL, vamos tentar uma abordagem diferente
    // Vamos testar se o admin atual consegue atualizar um perfil

    const adminUserId = 'algum-admin-id'; // Não sabemos o ID do admin
    const testUserId = '3c55b4d6-6faa-4718-8fe0-04057fba97e2';

    console.log('🧪 Testando se admin pode atualizar perfil...');

    // Verificar qual usuário está logado (se é admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('❌ Não há usuário logado');
      return;
    }

    console.log('👤 Usuário logado:', user.id);

    // Verificar se é admin
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    console.log('🔍 Role do usuário:', profileData.role);

    if (profileData.role !== 'admin') {
      console.log('⚠️ Usuário não é admin, não pode testar atualização');
      return;
    }

    console.log('✅ Usuário é admin, testando atualização...');

    // Tentar atualizar o perfil de teste
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
    } else {
      console.log('✅ Atualização bem-sucedida!');
    }

  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

fixAdminPolicy();