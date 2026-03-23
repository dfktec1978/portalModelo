/**
 * /api/store/payment-config
 *
 * Gerencia credenciais Efí Pay por lojista de forma segura.
 * Credenciais (client_secret, certificado) NUNCA são retornadas ao frontend.
 *
 * GET  ?storeId=xxx  → retorna { configured, sandbox, methods } (sem segredos)
 * POST               → salva/atualiza credenciais (verifica ownership)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { supabaseAdmin }             from '@/lib/supabaseServer'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function resolveOwnedStore(storeRef: string | null, userId: string, storeSlug?: string | null) {
  if (storeRef && UUID_REGEX.test(storeRef)) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('id, owner_id, efi_configured, payment_methods_enabled')
      .eq('id', storeRef)
      .eq('owner_id', userId)
      .maybeSingle()

    if (data) return data
  }

  if (storeRef) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('id, owner_id, efi_configured, payment_methods_enabled')
      .eq('slug', storeRef)
      .eq('owner_id', userId)
      .maybeSingle()

    if (data) return data
  }

  if (storeSlug) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('id, owner_id, efi_configured, payment_methods_enabled')
      .eq('slug', storeSlug)
      .eq('owner_id', userId)
      .maybeSingle()

    if (data) return data
  }

  // Fallback seguro: se o usuário tem exatamente 1 loja, usar ela.
  const { data: ownedStores } = await supabaseAdmin
    .from('stores')
    .select('id, owner_id, efi_configured, payment_methods_enabled')
    .eq('owner_id', userId)
    .limit(2)

  if (ownedStores && ownedStores.length === 1) {
    return ownedStores[0]
  }

  return null
}

// ---------------------------------------------------------------------------
// GET — lê apenas os metadados públicos (não expõe secrets)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const storeRef = request.nextUrl.searchParams.get('storeId')
    const storeSlug = request.nextUrl.searchParams.get('storeSlug')
    if (!storeRef) {
      return NextResponse.json({ error: 'storeId obrigatório' }, { status: 400 })
    }

    // Verificar que o usuário autenticado é dono da loja
    const authHeader = request.headers.get('authorization') ?? ''
    const token      = authHeader.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar ownership via service role
    const store = await resolveOwnedStore(storeRef, user.id, storeSlug)

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 })
    }

    // Buscar se há credenciais (apenas metadados — sem expor os valores)
    const { data: creds } = await supabaseAdmin
      .from('store_payment_credentials')
      .select('efi_client_id, efi_sandbox, updated_at')
      .eq('store_id', store.id)
      .maybeSingle()

    return NextResponse.json({
      configured:   store.efi_configured ?? false,
      sandbox:      creds?.efi_sandbox   ?? true,
      clientId:     creds?.efi_client_id ? `${creds.efi_client_id.substring(0, 6)}...` : null,
      updatedAt:    creds?.updated_at    ?? null,
      methods:      store.payment_methods_enabled ?? { pix: true, boleto: false, card_debit: false },
    })
  } catch (error) {
    console.error('[payment-config GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — salva credenciais (somente service role escreve na tabela sensível)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      storeId:         string
      storeSlug?:      string
      clientId?:       string
      clientSecret?:   string
      certificateB64?: string
      sandbox?:        boolean
      methods?:        { pix?: boolean; boleto?: boolean; card_debit?: boolean }
    }

    if (!body.storeId) {
      return NextResponse.json({ error: 'storeId obrigatório' }, { status: 400 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization') ?? ''
    const token      = authHeader.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Confirmar ownership
    const store = await resolveOwnedStore(body.storeId, user.id, body.storeSlug)

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 })
    }

    // Atualizar métodos habilitados na tabela stores (dado público)
    if (body.methods) {
      await supabaseAdmin
        .from('stores')
        .update({ payment_methods_enabled: body.methods })
        .eq('id', store.id)
    }

    // Se veio credenciais, fazer upsert na tabela segura
    const hasCredentials =
      body.clientId       ||
      body.clientSecret   ||
      body.certificateB64

    if (hasCredentials || body.sandbox !== undefined) {
      // Buscar credenciais existentes para merge (não sobrescrever campos já salvos)
      const { data: existing } = await supabaseAdmin
        .from('store_payment_credentials')
        .select('efi_client_id, efi_client_secret, efi_certificate_b64, efi_sandbox')
        .eq('store_id', store.id)
        .maybeSingle()

      const upsertData: Record<string, unknown> = {
        store_id:            store.id,
        efi_client_id:       body.clientId       ?? existing?.efi_client_id,
        efi_client_secret:   body.clientSecret   ?? existing?.efi_client_secret,
        efi_certificate_b64: body.certificateB64 ?? existing?.efi_certificate_b64,
        efi_sandbox:         body.sandbox        ?? existing?.efi_sandbox ?? true,
      }

      const { error: upsertError } = await supabaseAdmin
        .from('store_payment_credentials')
        .upsert(upsertData, { onConflict: 'store_id' })

      if (upsertError) {
        console.error('[payment-config POST] upsert error:', upsertError)
        return NextResponse.json({ error: 'Erro ao salvar credenciais' }, { status: 500 })
      }

      // Atualizar flag efi_configured na tabela stores
      const isConfigured =
        !!(upsertData.efi_client_id &&
           upsertData.efi_client_secret &&
           upsertData.efi_certificate_b64)

      await supabaseAdmin
        .from('stores')
        .update({ efi_configured: isConfigured })
        .eq('id', store.id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[payment-config POST]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove credenciais (reset)
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const storeRef = request.nextUrl.searchParams.get('storeId')
    const storeSlug = request.nextUrl.searchParams.get('storeSlug')
    if (!storeRef) {
      return NextResponse.json({ error: 'storeId obrigatório' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') ?? ''
    const token      = authHeader.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const store = await resolveOwnedStore(storeRef, user.id, storeSlug)

    if (!store) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    await supabaseAdmin.from('store_payment_credentials').delete().eq('store_id', store.id)
    await supabaseAdmin.from('stores').update({ efi_configured: false }).eq('id', store.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[payment-config DELETE]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
