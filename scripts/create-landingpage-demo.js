#!/usr/bin/env node

/**
 * Script para criar loja de demonstração do plano LandingPage
 * Cria uma loja com dados realistas para showcase das funcionalidades
 * 
 * Uso: node scripts/create-landingpage-demo.js
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Configurar variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function createLandingPageDemo() {
  try {
    console.log('🚀 Iniciando criação de loja LandingPage Demo...\n')

    // Verificar se a loja já existe
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id, store_name')
      .eq('slug', 'landingpage-demo')
      .single()

    if (existingStore) {
      console.log(`⚠️  Loja 'landingpage-demo' já existe com ID: ${existingStore.id}`)
      console.log('Atualizando campos de demonstração...\n')
      await updateExistingStore(existingStore.id)
      return
    }

    // Encontrar um owner para a loja (admin ou primeiro usuário)
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminUser) {
      throw new Error('Nenhum usuário admin encontrado. Crie um admin primeiro.')
    }

    console.log(`✅ Owner encontrado: ${adminUser.email}`)

    // Dados de demonstração da loja LandingPage
    const storeData = {
      owner_id: adminUser.id,
      store_name: 'Boutique LandingPage Demo',
      slug: 'landingpage-demo',
      category: 'varejo',
      plan: 'presenca',
      theme_color: 'azul',
      status: 'active',
      phone: '(11) 98765-4321',
      address: 'Avenida Paulista, 1000 - Apt 2000 - Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      logo_url: '/img/logos/logo.png',
      description: 'Loja premium de moda, acessórios e lifestyle com seleção curada de marcas internacionais'
    }

    // Inserir a nova loja
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert([storeData])
      .select()
      .single()

    if (storeError) {
      throw new Error(`Erro ao criar loja: ${storeError.message}`)
    }

    console.log(`✅ Loja criada com sucesso!`)
    console.log(`\n📋 Detalhes da loja:`)
    console.log(`   ID: ${newStore.id}`)
    console.log(`   Nome: ${newStore.store_name}`)
    console.log(`   Slug: ${newStore.slug}`)
    console.log(`   Plano: ${newStore.plan}`)
    console.log(`   Status: ${newStore.status}`)
    console.log(`\n🌐 URL de acesso:`)
    console.log(`   http://localhost:3000/lojas/landingpage-demo`)
    console.log(`\n✨ Funcionalidades ativas:`)
    console.log(`   ✓ Layout landing page ativo na URL pública`)
    console.log(`   ✓ Loja de demonstração sem cobrança automática`)
    console.log(`   ✓ Dados básicos prontos para edição em /admin/vitrines`)
    console.log(`\n`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

async function updateExistingStore(storeId) {
  try {
    const updateData = {
      description: 'Loja premium de moda, acessórios e lifestyle com seleção curada de marcas internacionais',
      logo_url: '/img/logos/logo.png',
      plan: 'presenca',
      status: 'active'
    }

    const { data: updated, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log(`✅ Loja atualizada com sucesso!`)
    console.log(`\n🌐 URL de acesso:`)
    console.log(`   http://localhost:3000/lojas/landingpage-demo`)
    console.log(`\n`)

  } catch (error) {
    throw error
  }
}

// Executar
createLandingPageDemo()
