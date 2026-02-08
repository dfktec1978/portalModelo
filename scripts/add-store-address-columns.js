require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addStoreAddressColumns() {
  console.log('📝 Adicionando colunas de endereço à tabela stores...\n')

  const sqlPath = path.join(__dirname, '..', 'sql', 'add-store-address-columns.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Se o RPC não existir, tentar executar via REST API direto
      console.log('⚠️  RPC não disponível, execute o SQL manualmente no Supabase SQL Editor')
      console.log('\n--- SQL ---')
      console.log(sql)
      console.log('--- FIM ---\n')
      return
    }

    console.log('✅ Colunas adicionadas com sucesso!')
    console.log('   • address (TEXT)')
    console.log('   • city (TEXT)')
    console.log('   • state (TEXT)')
    console.log('   • zipcode (TEXT)')
    console.log('   • delivery_fee (DECIMAL)')
    console.log('   • is_active (BOOLEAN)')
    
  } catch (err) {
    console.error('❌ Erro:', err.message)
    console.log('\n📋 Execute este SQL manualmente no Supabase SQL Editor:\n')
    console.log(sql)
  }
}

addStoreAddressColumns()
