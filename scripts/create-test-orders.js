const dotenv = require('dotenv')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestOrders() {
  console.log('🛒 Criando pedidos de teste...\n')

  try {
    // Buscar lojas de teste
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, store_name, category')
      .eq('owner_id', 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63')

    if (storesError) throw storesError

    console.log(`✅ ${stores.length} loja(s) encontrada(s)\n`)

    // Criar pedidos para cada loja
    for (const store of stores) {
      console.log(`📦 Criando pedidos para: ${store.store_name} (${store.category})`)

      const orders = [
        // Pedido 1: Pendente
        {
          store_id: store.id,
          customer_name: 'João Silva',
          customer_phone: '(11) 98765-4321',
          customer_email: 'joao@example.com',
          delivery_type: 'delivery',
          delivery_address: 'Rua das Flores, 123 - Centro',
          items: [
            { product_id: '123', name: store.category === 'alimentacao' ? 'X-Burger' : 'Produto A', price: 25.00, quantity: 2 },
            { product_id: '456', name: store.category === 'alimentacao' ? 'Refrigerante' : 'Produto B', price: 5.00, quantity: 1 }
          ],
          subtotal: 55.00,
          delivery_fee: 8.00,
          discount: 0,
          total: 63.00,
          status: 'pending',
          payment_method: 'pix',
          payment_status: 'pending',
          notes: 'Sem cebola, por favor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Pedido 2: Confirmado
        {
          store_id: store.id,
          customer_name: 'Maria Santos',
          customer_phone: '(11) 91234-5678',
          customer_email: 'maria@example.com',
          delivery_type: 'pickup',
          items: [
            { product_id: '789', name: store.category === 'alimentacao' ? 'X-Tudo' : 'Produto C', price: 35.00, quantity: 1 }
          ],
          subtotal: 35.00,
          delivery_fee: 0,
          discount: 5.00,
          total: 30.00,
          status: 'confirmed',
          payment_method: 'credit_card',
          payment_status: 'paid',
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Pedido 3: Preparando
        {
          store_id: store.id,
          customer_name: 'Pedro Oliveira',
          customer_phone: '(11) 99876-5432',
          delivery_type: 'delivery',
          delivery_address: 'Av. Principal, 456 - Jardim',
          items: [
            { product_id: '101', name: store.category === 'alimentacao' ? 'Pizza Grande' : 'Produto D', price: 45.00, quantity: 1 },
            { product_id: '102', name: store.category === 'alimentacao' ? 'Suco Natural' : 'Produto E', price: 8.00, quantity: 2 }
          ],
          subtotal: 61.00,
          delivery_fee: 10.00,
          discount: 0,
          total: 71.00,
          status: 'preparing',
          payment_method: 'pix',
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Pedido 4: Pronto
        {
          store_id: store.id,
          customer_name: 'Ana Costa',
          customer_phone: '(11) 94567-8901',
          delivery_type: 'pickup',
          items: [
            { product_id: '201', name: store.category === 'alimentacao' ? 'Combo Família' : 'Kit Premium', price: 80.00, quantity: 1 }
          ],
          subtotal: 80.00,
          delivery_fee: 0,
          discount: 10.00,
          total: 70.00,
          status: 'ready',
          payment_method: 'debit_card',
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Pedido 5: Entregue
        {
          store_id: store.id,
          customer_name: 'Carlos Mendes',
          customer_phone: '(11) 93456-7890',
          delivery_type: 'delivery',
          delivery_address: 'Rua do Comércio, 789 - Vila Nova',
          items: [
            { product_id: '301', name: store.category === 'alimentacao' ? 'Marmita Executiva' : 'Produto F', price: 18.00, quantity: 3 }
          ],
          subtotal: 54.00,
          delivery_fee: 6.00,
          discount: 0,
          total: 60.00,
          status: 'delivered',
          payment_method: 'cash',
          payment_status: 'paid',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      const { data: insertedOrders, error: ordersError } = await supabase
        .from('orders')
        .insert(orders)
        .select()

      if (ordersError) {
        console.error(`   ❌ Erro ao criar pedidos:`, ordersError.message)
      } else {
        console.log(`   ✅ ${insertedOrders.length} pedidos criados com sucesso!\n`)
      }
    }

    console.log('━'.repeat(60))
    console.log('\n✅ PEDIDOS DE TESTE CRIADOS!')
    console.log('\n📊 Resumo:')
    console.log('  • 1 pedido Pendente (João Silva)')
    console.log('  • 1 pedido Confirmado (Maria Santos)')
    console.log('  • 1 pedido Preparando (Pedro Oliveira)')
    console.log('  • 1 pedido Pronto (Ana Costa)')
    console.log('  • 1 pedido Entregue (Carlos Mendes)')
    console.log('\n🧪 Teste agora:')
    console.log('  1. Acesse http://localhost:3000/dashboard')
    console.log('  2. Vá em 📦 Pedidos')
    console.log('  3. Vá em 💰 Financeiro')
    console.log('  4. Teste mudar status dos pedidos')
    console.log('')

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

createTestOrders()
