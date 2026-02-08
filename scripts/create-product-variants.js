const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProductVariantsTable() {
  console.log('🔧 Criando tabela product_variants...\n');

  const sqlPath = path.join(__dirname, '..', 'sql', 'create-product-variants.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    // Executar SQL usando fetch direto (RPC pode não estar configurado)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✅ Tabela product_variants criada com sucesso!');
    console.log('✅ Coluna has_variants adicionada em products');
    console.log('✅ Policies RLS configuradas\n');

    console.log('📋 Estrutura criada:');
    console.log('  - product_variants (id, product_id, sku, size, color, stock, price, image_url)');
    console.log('  - Constraint UNIQUE para evitar duplicatas size+color');
    console.log('  - Índices para performance');
    console.log('  - RLS habilitado\n');

  } catch (err) {
    console.error('❌ Erro ao criar tabela:', err.message);
    console.log('\n⚠️  Execute manualmente no Supabase SQL Editor:');
    console.log(`   Arquivo: sql/create-product-variants.sql\n`);
    process.exit(1);
  }
}

createProductVariantsTable();
