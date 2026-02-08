const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProductColumns() {
  console.log('🔧 Adicionando colunas à tabela products...\n');

  const sql = `
    -- Adicionar colunas extras à tabela products
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;

    -- Verificar colunas criadas
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name IN ('sizes', 'colors', 'stock')
    ORDER BY column_name;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao adicionar colunas:', error.message);
      console.log('\n⚠️  Execute manualmente no Supabase SQL Editor:');
      console.log('\n' + sql);
      process.exit(1);
    }

    console.log('✅ Colunas adicionadas com sucesso!');
    console.log('\nColunas criadas:');
    if (data && Array.isArray(data)) {
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n📝 Próximos passos:');
    console.log('1. Descomente o código em ProductFormModal.tsx');
    console.log('2. Adicione sizes, colors, stock no SELECT de StoreModuleProducts.tsx');
    console.log('3. Teste criando um produto com tamanhos/cores/estoque\n');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    console.log('\n⚠️  Execute manualmente no Supabase SQL Editor:');
    console.log('\n' + sql);
    process.exit(1);
  }
}

addProductColumns();
