#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function run() {
  const targetEmail = 'lojista915b@hotmail.com'
  const demoSlug = 'landingpage-demo'

  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', targetEmail)
    .single()

  if (profileError || !targetProfile) {
    throw new Error(`Perfil alvo nao encontrado: ${targetEmail}`)
  }

  const { data: updatedStore, error: updateError } = await supabase
    .from('stores')
    .update({ owner_id: targetProfile.id, status: 'active' })
    .eq('slug', demoSlug)
    .select('id, slug, store_name, owner_id, status')
    .single()

  if (updateError || !updatedStore) {
    throw new Error(`Erro ao atualizar loja ${demoSlug}: ${updateError?.message || 'desconhecido'}`)
  }

  const { data: ownerStores, error: ownerStoresError } = await supabase
    .from('stores')
    .select('slug, store_name, status')
    .eq('owner_id', targetProfile.id)
    .order('store_name', { ascending: true })

  if (ownerStoresError) {
    throw new Error(`Erro ao listar lojas do usuario: ${ownerStoresError.message}`)
  }

  console.log(JSON.stringify({
    reassigned: {
      slug: updatedStore.slug,
      store_name: updatedStore.store_name,
      owner_email: targetProfile.email,
      owner_id: targetProfile.id,
      status: updatedStore.status
    },
    ownerStores
  }, null, 2))
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
