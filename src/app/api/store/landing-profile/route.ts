import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseServer'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type LandingProfileBody = {
  storeId?: string
  storeSlug?: string
  store_name?: string
  category?: string
  specialty?: string
  address?: string
  phone?: string
  email?: string
  facebook_url?: string
  instagram_url?: string
  business_hours?: string
  landing_description?: string
  logo_url?: string
  landing_photo_urls?: string[]
  city?: string
  state?: string
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

async function resolveStore(storeRef: string | null, storeSlug: string | null) {
  if (storeRef && UUID_REGEX.test(storeRef)) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeRef)
      .maybeSingle()
    if (data) return data
  }

  if (storeRef) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('slug', storeRef)
      .maybeSingle()
    if (data) return data
  }

  if (storeSlug) {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('slug', storeSlug)
      .maybeSingle()
    if (data) return data
  }

  return null
}

function normalizePhotoUrls(values?: string[]) {
  const list = Array.isArray(values) ? values : []
  const normalized = list
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .slice(0, 5)
  return normalized
}

function isPaidPlan(plan: unknown) {
  const normalized = String(plan || '').toLowerCase()
  return normalized === 'landingpage' || normalized === 'destaque' || normalized === 'premium'
}

function canOwnerEdit(store: any, userId: string) {
  return store?.owner_id === userId && isPaidPlan(store?.plan)
}

function getLandingPayload(store: any) {
  return {
    storeId: store.id,
    storeSlug: store.slug || store.id,
    plan: store.plan || 'presenca',
    store_name: store.store_name || '',
    category: store.category || '',
    specialty: store.specialty || '',
    address: store.address || '',
    phone: store.phone || '',
    email: store.email || '',
    facebook_url: store.facebook_url || '',
    instagram_url: store.instagram_url || '',
    business_hours: store.business_hours || '',
    landing_description: store.landing_description || store.description || '',
    logo_url: store.logo_url || store.logo || '',
    landing_photo_urls: Array.isArray(store.landing_photo_urls) ? store.landing_photo_urls : [],
    city: store.city || '',
    state: store.state || '',
  }
}

export async function GET(request: NextRequest) {
  try {
    const storeRef = request.nextUrl.searchParams.get('storeId')
    const storeSlug = request.nextUrl.searchParams.get('storeSlug')
    if (!storeRef && !storeSlug) {
      return NextResponse.json({ error: 'storeId ou storeSlug é obrigatório' }, { status: 400 })
    }

    const { user, role } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const store = await resolveStore(storeRef, storeSlug)
    if (!store) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const isAdmin = role === 'admin'
    const isOwner = canOwnerEdit(store, user.id)
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return NextResponse.json({ profile: getLandingPayload(store) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as LandingProfileBody
    const storeRef = body.storeId || null
    const storeSlug = body.storeSlug || null

    if (!storeRef && !storeSlug) {
      return NextResponse.json({ error: 'storeId ou storeSlug é obrigatório' }, { status: 400 })
    }

    const { user, role } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const store = await resolveStore(storeRef, storeSlug)
    if (!store) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

    const isAdmin = role === 'admin'
    const isOwnerLanding = canOwnerEdit(store, user.id)

    if (!isAdmin && !isOwnerLanding) {
      return NextResponse.json(
        { error: 'Somente admin ou dono de loja em plano pago pode editar este perfil' },
        { status: 403 },
      )
    }

    const updatePayload: Record<string, unknown> = {
      store_name: body.store_name || null,
      category: body.category || null,
      specialty: body.specialty || null,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      facebook_url: body.facebook_url || null,
      instagram_url: body.instagram_url || null,
      business_hours: body.business_hours || null,
      landing_description: body.landing_description || null,
      description: body.landing_description || null,
      logo_url: body.logo_url || null,
      landing_photo_urls: normalizePhotoUrls(body.landing_photo_urls),
      city: body.city || null,
      state: body.state || null,
    }

    const { data, error } = await supabaseAdmin
      .from('stores')
      .update(updatePayload)
      .eq('id', store.id)
      .select('*')
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: `${error.message}. Execute o SQL: sql/add-landing-profile-fields.sql` },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, profile: getLandingPayload(data) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
