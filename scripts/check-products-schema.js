const dotenv = require('dotenv')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProductsSchema() {
  console.log('🔍 Verificando estrutura da tabela products...\n')

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data && data.length > 0) {
      console.log('📊 Colunas existentes:')
      console.log(Object.keys(data[0]).join(', '))
      console.log('\n🔍 Exemplo de registro:')
      console.log(data[0])
    } else {
      console.log('⚠️  Tabela vazia, verificando schema...')
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

checkProductsSchema()
