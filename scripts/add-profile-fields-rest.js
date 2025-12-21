const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addProfileColumns() {
  try {
    console.log('🔄 Tentando adicionar colunas à tabela profiles...');

    // Usar RPC para executar SQL personalizado
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook text;
      `
    });

    if (error) {
      console.error('❌ Erro ao executar SQL via RPC:', error);
      console.log('💡 Tente executar o SQL manualmente no painel do Supabase');
      return;
    }

    console.log('✅ Colunas adicionadas com sucesso via RPC!');
    console.log('📝 Colunas adicionadas: profile_image, instagram, facebook');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.log('💡 Execute o SQL manualmente no SQL Editor do Supabase');
  }
}

addProfileColumns();