import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseServer'
import externalStoreManualRatings from '@/data/externalStoreManualRatings'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DELIVERED_STATUSES = ['delivered', 'finalized', 'shipped']
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function isMissingTableError(error: any, tableName: string) {
  const code = String(error?.code || '')
  const message = String(error?.message || '')
  return (
    code === 'PGRST205' ||
    new RegExp(`could not find the table .*${tableName}`, 'i').test(message) ||
    new RegExp(`relation .*${tableName}.*does not exist`, 'i').test(message)
  )
}

function toFirstName(name: unknown) {
  const normalized = String(name || '').trim()
  if (!normalized) return 'Cliente'
  return normalized.split(/\s+/)[0] || 'Cliente'
}

async function getUser(request: NextRequest) {
  const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )
  const { data: { user } } = await client.auth.getUser()
  return user ?? null
}

async function getUserWithRole(request: NextRequest) {
  const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '')
  if (!token) return { user: null, role: null as string | null }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )

  const { data: { user } } = await client.auth.getUser()
  if (!user) return { user: null, role: null as string | null }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return { user, role: (profile as any)?.role || null }
}

// POST /api/reviews — cliente cria avaliação
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { order_id, store_id, rating, comment, is_anonymous } = body

  if (!UUID_REGEX.test(order_id ?? ''))
    return NextResponse.json({ error: 'order_id inválido' }, { status: 400 })
  if (!UUID_REGEX.test(store_id ?? ''))
    return NextResponse.json({ error: 'store_id inválido' }, { status: 400 })

  const ratingNum = Number(rating)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5)
    return NextResponse.json({ error: 'Nota deve ser entre 1 e 5' }, { status: 400 })

  const commentStr = String(comment ?? '').trim().slice(0, 100)
  if (!commentStr)
    return NextResponse.json({ error: 'Comentário é obrigatório' }, { status: 400 })

  // Verificar que o pedido pertence ao cliente e está entregue
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id, status, store_id, delivered_at, updated_at, created_at')
    .eq('id', order_id)
    .eq('store_id', store_id)
    .single()

  if (orderErr || !order)
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  if (order.customer_id !== user.id)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  if (!DELIVERED_STATUSES.includes(order.status))
    return NextResponse.json({ error: 'Pedido ainda não foi entregue' }, { status: 400 })

  const refDate = order.delivered_at || order.updated_at || order.created_at
  if (Date.now() - new Date(refDate).getTime() > THREE_DAYS_MS)
    return NextResponse.json({ error: 'Prazo para avaliação encerrado (3 dias após entrega)' }, { status: 400 })

  const { data: review, error: insertErr } = await supabaseAdmin
    .from('store_reviews')
    .insert({
      order_id,
      store_id,
      customer_id: user.id,
      rating: ratingNum,
      comment: commentStr,
      is_anonymous: Boolean(is_anonymous),
    })
    .select()
    .single()

  if (insertErr) {
    if (insertErr.code === '23505')
      return NextResponse.json({ error: 'Este pedido já foi avaliado' }, { status: 409 })
    return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 })
  }

  return NextResponse.json({ review }, { status: 201 })
}

// GET /api/reviews?store_id=xxx  — lista avaliações de uma loja
// GET /api/reviews?all_summary=true — resumo de todas as lojas (para cards)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')
  const allSummary = searchParams.get('all_summary') === 'true'

  // Resumo global para cards na vitrine
  if (allSummary) {
    let organicSummaries: Array<{ store_id: string; avg_rating: number; total_reviews: number; source: 'organic' }> = []

    // Caminho principal (otimizado): agregação no banco via RPC
    const rpcResult = await supabaseAdmin.rpc('get_store_rating_summary')
    if (!rpcResult.error) {
      organicSummaries = ((rpcResult.data || []) as any[]).map((row) => ({
        store_id: String(row.store_id),
        avg_rating: Number(row.avg_rating || 0),
        total_reviews: Number(row.total_reviews || 0),
        source: 'organic' as const,
      }))
    } else {
      // Fallback para bancos sem a função criada
      const fallback = await supabaseAdmin
        .from('store_reviews')
        .select('store_id, rating')

      if (fallback.error) return NextResponse.json({ error: 'Erro ao buscar resumo' }, { status: 500 })

      const map: Record<string, { sum: number; count: number }> = {}
      ;(fallback.data || []).forEach((r: any) => {
        if (!map[r.store_id]) map[r.store_id] = { sum: 0, count: 0 }
        map[r.store_id].sum += Number(r.rating || 0)
        map[r.store_id].count++
      })
      organicSummaries = Object.entries(map).map(([store_id, v]) => ({
        store_id,
        avg_rating: Math.round((v.sum / v.count) * 10) / 10,
        total_reviews: v.count,
        source: 'organic' as const,
      }))
    }

    // Overrides legados (opcional). Orgânico sempre tem prioridade.
    let overrideRows: any[] = []
    let overridesResult: any = await supabaseAdmin
      .from('store_rating_overrides')
      .select('store_id, store_ref, avg_rating_legacy, total_reviews_legacy, active')
      .eq('active', true)

    if (overridesResult.error && isMissingTableError(overridesResult.error, 'store_rating_overrides')) {
      overridesResult = { data: [], error: null } as any
    }

    if (overridesResult.error && /store_ref/i.test(String(overridesResult.error?.message || ''))) {
      overridesResult = await supabaseAdmin
        .from('store_rating_overrides')
        .select('store_id, avg_rating_legacy, total_reviews_legacy, active')
        .eq('active', true)
    }

    if (!overridesResult.error) {
      overrideRows = (overridesResult.data || []) as any[]
    } else if (!isMissingTableError(overridesResult.error, 'store_rating_overrides')) {
      return NextResponse.json({ error: 'Erro ao buscar overrides de avaliação' }, { status: 500 })
    }

    const organicMap = new Map(organicSummaries.map((s) => [s.store_id, s]))
    const overrideMap = new Map(
      overrideRows.map((row: any) => [
        String(row.store_ref || row.store_id),
        {
          store_id: String(row.store_ref || row.store_id),
          avg_rating: Number(row.avg_rating_legacy || 0),
          total_reviews: Number(row.total_reviews_legacy || 0),
          source: 'legacy_override' as const,
        },
      ]),
    )
    const manualOverrideMap = new Map(
      externalStoreManualRatings.map((row) => [
        String(row.store_id),
        {
          store_id: String(row.store_id),
          avg_rating: Number(row.avg_rating || 0),
          total_reviews: Number(row.total_reviews || 0),
          source: 'legacy_override' as const,
        },
      ]),
    )

    const allIds = new Set<string>([...organicMap.keys(), ...overrideMap.keys(), ...manualOverrideMap.keys()])
    const summaries = Array.from(allIds).map((store_id) => {
      const organic = organicMap.get(store_id)
      if (organic && organic.total_reviews > 0) return organic
      return overrideMap.get(store_id)
        || manualOverrideMap.get(store_id)
        || { store_id, avg_rating: 0, total_reviews: 0, source: 'organic' as const }
    })

    return NextResponse.json({ summaries })
  }

  // Avaliações de uma loja específica
  if (!storeId || !UUID_REGEX.test(storeId))
    return NextResponse.json({ error: 'store_id inválido' }, { status: 400 })

  const { user, role } = await getUserWithRole(request)
  let canSeeFullNames = false
  if (user) {
    if (role === 'admin') {
      canSeeFullNames = true
    } else {
      const { data: storeOwner } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .maybeSingle()
      canSeeFullNames = String((storeOwner as any)?.owner_id || '') === String(user.id)
    }
  }

  const { data: reviews, error } = await supabaseAdmin
    .from('store_reviews')
    .select('id, rating, comment, is_anonymous, owner_reply, replied_at, created_at, customer_id')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })

  // Buscar nomes dos clientes não-anônimos
  const nonAnonIds = (reviews || [])
    .filter((r: any) => !r.is_anonymous)
    .map((r: any) => r.customer_id)

  const nameMap: Record<string, string> = {}
  if (nonAnonIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .in('id', nonAnonIds)
    ;(profiles || []).forEach((p: any) => { nameMap[p.id] = p.display_name || 'Cliente' })
  }

  const enriched = (reviews || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    is_anonymous: r.is_anonymous,
    owner_reply: r.owner_reply,
    replied_at: r.replied_at,
    created_at: r.created_at,
    customer_name: r.is_anonymous
      ? null
      : (canSeeFullNames ? (nameMap[r.customer_id] || 'Cliente') : toFirstName(nameMap[r.customer_id] || 'Cliente')),
  }))

  const ratings = (reviews || []).map((r: any) => r.rating)
  const total = ratings.length
  let avg = total > 0 ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / total) * 10) / 10 : null

  // Se não houver avaliação orgânica, tenta fallback para override legado da loja
  if (total === 0) {
    const overrideResult = await supabaseAdmin
      .from('store_rating_overrides')
      .select('avg_rating_legacy, total_reviews_legacy, active')
      .eq('store_id', storeId)
      .eq('active', true)
      .maybeSingle()

    if (!overrideResult.error && overrideResult.data) {
      avg = Number((overrideResult.data as any).avg_rating_legacy || 0)
      return NextResponse.json({
        reviews: enriched,
        summary: { avg_rating: avg, total_reviews: Number((overrideResult.data as any).total_reviews_legacy || 0) },
      })
    }
  }

  return NextResponse.json({
    reviews: enriched,
    summary: { avg_rating: avg, total_reviews: total },
  })
}
