const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableRLS() {
  console.log('\n🔧 Desabilitando RLS em todas as tabelas...\n');
  
  const tables = ['profiles', 'stores', 'professionals', 'classifieds'];
  
  for (const table of tables) {
    try {
      const res = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      });
      console.log(`✓ ${table}: RLS desabilitado`);
    } catch (e) {
      console.log(`⚠️  ${table}: ${e.message}`);
    }
  }
  
  console.log('\n✅ Concluído!\n');
}

disableRLS();
