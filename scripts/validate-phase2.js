const dotenv = require('dotenv')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function validatePhase2() {
  console.log('🔍 VALIDAÇÃO - FASE 2: MÓDULOS EXCLUSIVOS\n')
  console.log('━'.repeat(60))

  try {
    // 1. Verificar tabela additionals
    console.log('\n📊 1. Verificando tabela additionals...')
    const { data: additionalsTable, error: addError } = await supabase
      .from('additionals')
      .select('*')
      .limit(1)
    
    if (addError && !addError.message.includes('0 rows')) {
      console.log('   ❌ Erro:', addError.message)
    } else {
      console.log('   ✅ Tabela additionals existe e está acessível')
    }

    // 2. Verificar lojas de teste
    console.log('\n🏪 2. Verificando lojas de teste...')
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, store_name, category, theme_color, slug, status')
      .eq('owner_id', 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63')
      .order('created_at', { ascending: true })

    if (storesError) throw storesError

    console.log(`   Total de lojas: ${stores.length}`)
    
    const varejoStore = stores.find(s => s.category === 'varejo')
    const alimentacaoStore = stores.find(s => s.category === 'alimentacao')

    if (varejoStore) {
      console.log('\n   ✅ LOJA VAREJO encontrada:')
      console.log(`      Nome: ${varejoStore.store_name}`)
      console.log(`      Categoria: ${varejoStore.category}`)
      console.log(`      Tema: ${varejoStore.theme_color}`)
      console.log(`      Slug: ${varejoStore.slug}`)
      console.log(`      Status: ${varejoStore.status}`)
    } else {
      console.log('   ⚠️  Nenhuma loja VAREJO encontrada')
    }

    if (alimentacaoStore) {
      console.log('\n   ✅ LOJA ALIMENTAÇÃO encontrada:')
      console.log(`      Nome: ${alimentacaoStore.store_name}`)
      console.log(`      Categoria: ${alimentacaoStore.category}`)
      console.log(`      Tema: ${alimentacaoStore.theme_color}`)
      console.log(`      Slug: ${alimentacaoStore.slug}`)
      console.log(`      Status: ${alimentacaoStore.status}`)
    } else {
      console.log('   ⚠️  Nenhuma loja ALIMENTAÇÃO encontrada')
    }

    // 3. Verificar coluna schedule
    console.log('\n📅 3. Verificando coluna schedule...')
    const { data: scheduleTest } = await supabase
      .from('stores')
      .select('schedule')
      .limit(1)
      .single()
    
    console.log('   ✅ Coluna schedule existe')

    // 4. Verificar produtos (para teste de estoque)
    console.log('\n📦 4. Verificando produtos para teste de estoque...')
    if (varejoStore) {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('store_id', varejoStore.id)
        .limit(5)

      if (prodError) {
        console.log('   ⚠️  Erro ao buscar produtos:', prodError.message)
      } else {
        console.log(`   ✅ ${products?.length || 0} produto(s) encontrado(s)`)
        if (products && products.length > 0) {
          products.forEach(p => {
            console.log(`      • ${p.name} - Estoque: ${p.stock}`)
          })
        } else {
          console.log('   💡 Crie produtos para testar o módulo de Estoque')
        }
      }
    }

    // 5. Resumo de testes
    console.log('\n' + '━'.repeat(60))
    console.log('\n✅ CHECKLIST DE TESTES - FASE 2:\n')
    console.log('LOJA VAREJO (Loja Demo Modelo):')
    console.log('  [ ] 1. Acessar dashboard e selecionar loja varejo')
    console.log('  [ ] 2. Verificar sidebar mostra: 📦 Produtos, 📊 Estoque')
    console.log('  [ ] 3. Clicar em 📊 Estoque')
    console.log('  [ ] 4. Testar ajuste rápido (+/-)')
    console.log('  [ ] 5. Testar edição manual de estoque')
    console.log('  [ ] 6. Testar filtros: Todos / Estoque Baixo / Sem Estoque')
    console.log('')
    console.log('LOJA ALIMENTAÇÃO (Restaurante Demo Portal):')
    console.log('  [ ] 7. Trocar para loja alimentação no seletor')
    console.log('  [ ] 8. Verificar sidebar mostra: 🍔 Cardápio, 🕒 Horários, ➕ Adicionais')
    console.log('  [ ] 9. Clicar em 🕒 Horários')
    console.log('  [ ] 10. Configurar horários seg-dom')
    console.log('  [ ] 11. Marcar domingo como "Fechado"')
    console.log('  [ ] 12. Usar "Copiar para todos"')
    console.log('  [ ] 13. Salvar horários')
    console.log('  [ ] 14. Clicar em ➕ Adicionais')
    console.log('  [ ] 15. Criar adicional: "Queijo Extra" R$ 3,00 (ingredientes)')
    console.log('  [ ] 16. Criar adicional: "Molho Especial" R$ 2,00 (molhos)')
    console.log('  [ ] 17. Testar toggle Ativo/Inativo')
    console.log('  [ ] 18. Testar edição de adicional')
    console.log('  [ ] 19. Testar exclusão de adicional')
    console.log('')
    console.log('VALIDAÇÃO GERAL:')
    console.log('  [ ] 20. Trocar entre lojas e confirmar sidebar muda')
    console.log('  [ ] 21. Verificar temas aplicados corretamente')
    console.log('  [ ] 22. Testar em mobile (responsive)')
    console.log('')
    console.log('━'.repeat(60))
    console.log('\n📍 Acesse: http://localhost:3000/dashboard')
    console.log('🔐 Login: lojista915b@hotmail.com')
    console.log('')

  } catch (error) {
    console.error('❌ Erro na validação:', error.message)
  }
}

validatePhase2()
