const dotenv = require('dotenv')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Carregar .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestStore() {
  try {
    // Buscar ID do lojista915b
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'lojista915b@hotmail.com')
      .single()

    if (userError) throw userError

    console.log('👤 Lojista encontrado:', user.id)

    // Criar loja de alimentação
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: user.id,
        store_name: 'Restaurante Demo Portal',
        phone: '(11) 99999-8888',
        address: 'Rua das Flores, 456 - Centro',
        category: 'alimentacao',
        theme_color: 'vermelho',
        slug: 'restaurante-demo-portal',
        description: 'Restaurante de teste para módulos de Alimentação',
        status: 'active'
      })
      .select()
      .single()

    if (storeError) throw storeError

    console.log('🍔 Loja de Alimentação criada com sucesso!')
    console.log('📊 Dados:')
    console.log('  ID:', store.id)
    console.log('  Nome:', store.store_name)
    console.log('  Categoria:', store.category)
    console.log('  Tema:', store.theme_color)
    console.log('  Slug:', store.slug)
    console.log('')
    console.log('✅ Pronto! Agora você tem 2 lojas:')
    console.log('  • Loja Demo Modelo (varejo) - testa Produtos/Estoque')
    console.log('  • Restaurante Demo Portal (alimentacao) - testa Cardápio/Horários/Adicionais')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

createTestStore()
