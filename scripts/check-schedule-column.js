const dotenv = require('dotenv')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkScheduleColumn() {
  console.log('🔍 Verificando coluna schedule...\n')

  try {
    // 1. Verificar estrutura da coluna
    const { data: columns, error: colError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'stores' AND column_name = 'schedule';
        `
      })
      .single()

    console.log('📊 Estrutura da coluna schedule:')
    console.log(columns)

    // 2. Tentar buscar dados atuais
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('id, store_name, schedule')
      .eq('slug', 'restaurante-demo-portal')
      .single()

    if (fetchError) {
      console.log('\n❌ Erro ao buscar loja:', fetchError)
    } else {
      console.log('\n📋 Dados atuais da loja:')
      console.log('ID:', store.id)
      console.log('Nome:', store.store_name)
      console.log('Schedule atual:', store.schedule)
    }

    // 3. Tentar fazer update de teste
    const testSchedule = {
      segunda: { open: '08:00', close: '18:00', closed: false },
      terca: { open: '08:00', close: '18:00', closed: false }
    }

    console.log('\n🧪 Tentando salvar schedule de teste...')
    const { data: updateData, error: updateError } = await supabase
      .from('stores')
      .update({ schedule: testSchedule })
      .eq('slug', 'restaurante-demo-portal')
      .select()

    if (updateError) {
      console.log('❌ Erro no update:', JSON.stringify(updateError, null, 2))
    } else {
      console.log('✅ Update bem-sucedido!')
      console.log('Dados atualizados:', updateData)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

checkScheduleColumn()
