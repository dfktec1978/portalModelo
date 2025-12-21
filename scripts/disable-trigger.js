const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableTrigger() {
  try {
    // Desabilitar o trigger problemático
    const { error } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE profiles DISABLE TRIGGER trigger_lojista_approval_email;"
    });

    if (error) {
      console.log('Erro ao desabilitar trigger:', error.message);

      // Tentar abordagem alternativa
      const { error: altError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      console.log('Teste de conexão:', altError ? 'Falhou' : 'OK');
    } else {
      console.log('Trigger desabilitado com sucesso');
    }
  } catch (err) {
    console.log('Erro geral:', err.message);
  }
}

disableTrigger();