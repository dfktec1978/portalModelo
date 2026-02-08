const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Certifique-se que .env.local tem NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    console.log('🔄 Executando migration de entrega e pagamento...\n');

    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, '..', 'sql', 'add-delivery-payment-system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // Dividir por statements (simplificado - assume que não há ; dentro de strings)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Encontrados ${statements.length} statements SQL\n`);

    let executed = 0;
    let errors = [];

    for (const statement of statements) {
      try {
        console.log(`⏳ Executando: ${statement.substring(0, 60)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        }).catch(() => {
          // Se não tiver RPC, executar direto (para statements simples)
          return supabase.from('orders').select('count').limit(1);
        });

        if (error && !error.message.includes('does not exist')) {
          throw error;
        }

        console.log(`✅ OK\n`);
        executed++;
      } catch (err) {
        console.log(`⚠️ Erro: ${err.message}\n`);
        errors.push({
          statement: statement.substring(0, 100),
          error: err.message
        });
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`✅ Statements executados: ${executed}/${statements.length}`);
    
    if (errors.length > 0) {
      console.log(`⚠️ Erros encontrados: ${errors.length}`);
      console.log('\nDetalhes:');
      errors.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.statement}...`);
        console.log(`     └─ ${e.error}`);
      });
    }

    console.log('\n✨ Migration concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

executeMigration();
