const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTrigger() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM pg_trigger WHERE tgname = 'trigger_lojista_approval_email';"
    });

    if (error) {
      console.log('Erro ao verificar trigger:', error.message);
    } else {
      console.log('Trigger encontrado:', data);
    }
  } catch (err) {
    console.log('Erro:', err.message);
  }
}

checkTrigger();