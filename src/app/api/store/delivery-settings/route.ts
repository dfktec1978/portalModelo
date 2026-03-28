import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseServer'
import {
  dedupeDeliveryCities,
  getExtraDeliveryCitiesLimit,
  getTotalDeliveryCitiesLimit,
  normalizeCity,
  normalizeState,
  normalizeZipcode,
  normalizeStorePlanForDelivery,
  toZipDigits,
  type DeliveryCityRule,
} from '@/lib/deliveryPolicy'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type DeliverySettingsBody = {
  storeId?: string
  delivery_options?: {
    retirada?: boolean
    envio?: boolean
    condicional?: boolean
  }
  min_order_delivery?: number
  free_shipping_threshold?: number
  base_city?: {
    city?: string
    state?: string
    zipcode?: string
    delivery_fee?: number
    eta_business_days?: number
    active?: boolean
  }
  extra_cities?: DeliveryCityRule[]
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return { user: null, role: null as string | null }

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )

  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) return { user: null, role: null as string | null }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return { user, role: (profile as any)?.role || null }
}

async function resolveStore(storeRef: string | null) {
  if (!storeRef) return null

  if (UUID_REGEX.test(storeRef)) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeRef)
      .maybeSingle()
    if (data) return data
  }

  const { data } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('slug', storeRef)
    .maybeSingle()

  return data || null
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

function isMissingDeliveryCitiesTableError(error: any) {
  const code = String(error?.code || '')
  const message = String(error?.message || '')
  return (
    code === 'PGRST205' ||
    /could not find the table .*store_delivery_cities/i.test(message) ||
    /store_delivery_cities.*schema cache/i.test(message) ||
    /relation .*store_delivery_cities.*does not exist/i.test(message)
  )
}

export async function GET(request: NextRequest) {
  try {
    const storeRef = request.nextUrl.searchParams.get('storeId') || request.nextUrl.searchParams.get('storeSlug')
    if (!storeRef) {
      return NextResponse.json({ error: 'storeId ou storeSlug é obrigatório' }, { status: 400 })
    }

    const store = await resolveStore(storeRef)
    if (!store) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const plan = normalizeStorePlanForDelivery(store.plan)

    const { data: cityRows, error: cityError } = await supabaseAdmin
      .from('store_delivery_cities')
      .select('*')
      .eq('store_id', store.id)
      .order('is_base_city', { ascending: false })
      .order('city', { ascending: true })

    if (cityError && cityError.code !== 'PGRST116' && !isMissingDeliveryCitiesTableError(cityError)) {
      return NextResponse.json({ error: cityError.message }, { status: 500 })
    }

    const rows = (cityRows || []) as any[]
    const deliveryTableMissing = !!cityError && isMissingDeliveryCitiesTableError(cityError)
    const baseRow = rows.find((row) => row.is_base_city)
    const baseCity = {
      city: normalizeCity(baseRow?.city || store.city || ''),
      state: normalizeState(baseRow?.state || store.state || ''),
      zipcode: normalizeZipcode(baseRow?.zipcode || store.zipcode || ''),
      delivery_fee: toNumber(baseRow?.delivery_fee, toNumber((store as any).delivery_fee_envio ?? store.delivery_fee, 0)),
      eta_business_days: Math.max(1, toNumber(baseRow?.eta_business_days, 1)),
      active: baseRow ? baseRow.active !== false : true,
    }

    const extraCities = rows
      .filter((row) => !row.is_base_city)
      .map((row) => ({
        id: row.id,
        city: normalizeCity(row.city),
        state: normalizeState(row.state),
        zipcode: normalizeZipcode(row.zipcode),
        delivery_fee: toNumber(row.delivery_fee, 0),
        eta_business_days: Math.max(1, toNumber(row.eta_business_days, 1)),
        active: row.active !== false,
      }))

    return NextResponse.json({
      settings: {
        store_id: store.id,
        plan,
        delivery_options: {
          retirada: !!store?.delivery_options?.retirada || store?.delivery_options?.retirada === undefined,
          envio: !!store?.delivery_options?.envio,
          condicional: !!store?.delivery_options?.condicional,
        },
        min_order_delivery: toNumber(store.min_order_delivery, 0),
        free_shipping_threshold: toNumber((store as any).free_shipping_threshold, 0),
        base_city: baseCity,
        extra_cities: extraCities,
        limits: {
          extra_allowed: getExtraDeliveryCitiesLimit(plan),
          total_allowed: getTotalDeliveryCitiesLimit(plan),
        },
        migration_required: deliveryTableMissing,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as DeliverySettingsBody
    const storeRef = body.storeId || null
    if (!storeRef) {
      return NextResponse.json({ error: 'storeId é obrigatório' }, { status: 400 })
    }

    const { user, role } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const store = await resolveStore(storeRef)
    if (!store) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const isAdmin = role === 'admin'
    const isOwner = String(store.owner_id || '') === String(user.id)
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const plan = normalizeStorePlanForDelivery(store.plan)
    const extraLimit = getExtraDeliveryCitiesLimit(plan)

    const rawExtras = Array.isArray(body.extra_cities) ? body.extra_cities : []
    const dedupedExtras = dedupeDeliveryCities(rawExtras).filter((item) => !item.is_base_city)

    if (dedupedExtras.length > extraLimit) {
      return NextResponse.json(
        { error: `Plano ${plan} permite no máximo ${extraLimit} cidades extras.` },
        { status: 400 },
      )
    }

    const normalizedBaseCity = {
      city: normalizeCity(body.base_city?.city || store.city || ''),
      state: normalizeState(body.base_city?.state || store.state || ''),
      zipcode: normalizeZipcode(body.base_city?.zipcode || store.zipcode || ''),
      delivery_fee: toNumber(body.base_city?.delivery_fee, toNumber((store as any).delivery_fee_envio ?? store.delivery_fee, 0)),
      eta_business_days: Math.max(1, toNumber(body.base_city?.eta_business_days, 1)),
      active: body.base_city?.active !== false,
    }

    if (!normalizedBaseCity.city || !normalizedBaseCity.state) {
      return NextResponse.json(
        { error: 'Cidade base da loja é obrigatória para configurar entrega por cobertura.' },
        { status: 400 },
      )
    }

    const baseKey = `${normalizeCity(normalizedBaseCity.city).toLowerCase()}|${normalizedBaseCity.state.toLowerCase()}|${toZipDigits(normalizedBaseCity.zipcode)}`
    const duplicatedBase = dedupedExtras.find((item) => {
      const key = `${normalizeCity(item.city).toLowerCase()}|${normalizeState(item.state).toLowerCase()}|${toZipDigits(item.zipcode)}`
      return key === baseKey
    })

    if (duplicatedBase) {
      return NextResponse.json(
        { error: 'A cidade base não pode ser cadastrada novamente na lista de cidades extras.' },
        { status: 400 },
      )
    }

    const updateStorePayload: Record<string, unknown> = {
      delivery_options: {
        retirada: body.delivery_options?.retirada !== false,
        envio: body.delivery_options?.envio !== false,
        condicional: !!body.delivery_options?.condicional,
      },
      min_order_delivery: Math.max(0, toNumber(body.min_order_delivery, 0)),
      delivery_fee_envio: Math.max(0, toNumber(normalizedBaseCity.delivery_fee, 0)),
      delivery_fee: Math.max(0, toNumber(normalizedBaseCity.delivery_fee, 0)),
      city: normalizedBaseCity.city,
      state: normalizedBaseCity.state,
      zipcode: normalizedBaseCity.zipcode || null,
    }

    // Coluna nova opcional em bancos já migrados.
    if ((body as any).free_shipping_threshold !== undefined) {
      updateStorePayload.free_shipping_threshold = Math.max(0, toNumber(body.free_shipping_threshold, 0))
    }

    // Fallback progressivo: remove colunas que podem não existir em bancos não migrados.
    const LEGACY_SCHEMA_PATTERN = /column .* does not exist|schema cache|could not find the .* column/i

    const OPTIONAL_COLUMNS: Array<keyof typeof updateStorePayload> = [
      'free_shipping_threshold',
      'delivery_fee_envio',
      'delivery_options',
      'min_order_delivery',
    ]

    let updateError: any = null
    let currentPayload = { ...updateStorePayload }

    for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt++) {
      const result = await supabaseAdmin
        .from('stores')
        .update(currentPayload)
        .eq('id', store.id)
      updateError = result.error

      if (!updateError) break

      const msg = String(updateError.message || '')
      if (!LEGACY_SCHEMA_PATTERN.test(msg)) break // erro real, não de schema

      if (attempt < OPTIONAL_COLUMNS.length) {
        // Remove a próxima coluna opcional e tenta de novo
        currentPayload = { ...currentPayload }
        delete (currentPayload as any)[OPTIONAL_COLUMNS[attempt]]
      }
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Substitui cobertura completa para manter consistência.
    const { error: deleteError } = await supabaseAdmin
      .from('store_delivery_cities')
      .delete()
      .eq('store_id', store.id)

    if (deleteError) {
      if (isMissingDeliveryCitiesTableError(deleteError)) {
        return NextResponse.json({
          ok: true,
          warning: 'Tabela store_delivery_cities ainda não existe neste banco. Execute a migration sql/add-delivery-city-coverage.sql para habilitar cidades extras.',
          migration_required: true,
        })
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const rowsToInsert = [
      {
        store_id: store.id,
        city: normalizedBaseCity.city,
        state: normalizedBaseCity.state,
        zipcode: normalizedBaseCity.zipcode || null,
        delivery_fee: Math.max(0, toNumber(normalizedBaseCity.delivery_fee, 0)),
        eta_business_days: Math.max(1, toNumber(normalizedBaseCity.eta_business_days, 1)),
        is_base_city: true,
        active: normalizedBaseCity.active !== false,
      },
      ...dedupedExtras.map((item) => ({
        store_id: store.id,
        city: normalizeCity(item.city),
        state: normalizeState(item.state),
        zipcode: normalizeZipcode(item.zipcode) || null,
        delivery_fee: Math.max(0, toNumber(item.delivery_fee, 0)),
        eta_business_days: Math.max(1, toNumber(item.eta_business_days, 1)),
        is_base_city: false,
        active: item.active !== false,
      })),
    ]

    const { error: insertError } = await supabaseAdmin
      .from('store_delivery_cities')
      .insert(rowsToInsert)

    if (insertError) {
      if (isMissingDeliveryCitiesTableError(insertError)) {
        return NextResponse.json({
          ok: true,
          warning: 'Tabela store_delivery_cities ainda não existe neste banco. Execute a migration sql/add-delivery-city-coverage.sql para habilitar cidades extras.',
          migration_required: true,
        })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
