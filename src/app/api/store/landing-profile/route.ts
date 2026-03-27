import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getServerPlanDefaults } from '@/lib/storePlansServer'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type LandingProfileBody = {
  storeId?: string
  storeSlug?: string
  theme_color?: string
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

const STORE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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

function normalizePhotoUrls(values?: string[], maxPhotos = 5) {
  const list = Array.isArray(values) ? values : []
  const normalized = list
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .slice(0, maxPhotos)
  return normalized
}

function normalizeStoreSlug(value: unknown) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  if (!normalized) return null
  if (!STORE_SLUG_REGEX.test(normalized)) return null
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
    storeSlug: store.slug || '',
    plan: store.plan || 'presenca',
    photo_limit: Number.isFinite(Number(store.photo_limit)) ? Number(store.photo_limit) : 5,
    theme_color: store.theme_color || 'azul',
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

    const planDefaults = await getServerPlanDefaults(store?.plan)
    const resolvedPhotoLimit = Number.isFinite(Number(store?.photo_limit)) && Number(store.photo_limit) > 0
      ? Number(store.photo_limit)
      : Number(planDefaults?.photo_limit || 5)

    return NextResponse.json({ profile: getLandingPayload({ ...store, photo_limit: resolvedPhotoLimit }) })
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

    const planDefaults = await getServerPlanDefaults(store?.plan)
    const maxPhotos = Math.max(
      1,
      Number.isFinite(Number(store?.photo_limit)) && Number(store?.photo_limit) > 0
        ? Number(store.photo_limit)
        : Number(planDefaults?.photo_limit || 5),
    )
    const normalizedSlug = normalizeStoreSlug(body.storeSlug)

    if (body.storeSlug && !normalizedSlug) {
      return NextResponse.json(
        { error: 'Endereço da loja inválido. Use apenas letras minúsculas, números e hífens.' },
        { status: 400 },
      )
    }

    if (normalizedSlug && normalizedSlug !== store.slug) {
      const { data: slugConflict } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('slug', normalizedSlug)
        .neq('id', store.id)
        .maybeSingle()

      if (slugConflict) {
        return NextResponse.json(
          { error: 'Este endereço da loja já está em uso. Escolha outro.' },
          { status: 409 },
        )
      }
    }

    const updatePayload: Record<string, unknown> = {
      store_name: body.store_name || null,
      slug: normalizedSlug || null,
      theme_color: body.theme_color || null,
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
      landing_photo_urls: normalizePhotoUrls(body.landing_photo_urls, maxPhotos),
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
