import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getPlanDefaults, normalizeStorePlan } from '@/lib/storePlans';
import { getServerPlanDefaults } from '@/lib/storePlansServer';

function slugifyStoreName(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60) || 'loja';
}

async function buildUniqueStoreSlug(preferredSlug: unknown, storeNameFallback: unknown) {
  const baseSlug = slugifyStoreName(preferredSlug || storeNameFallback);

  const { data: existing } = await supabaseAdmin
    .from('stores')
    .select('slug')
    .ilike('slug', `${baseSlug}%`);

  const used = new Set(((existing as any[]) || []).map((item) => String(item.slug || '').trim()).filter(Boolean));
  if (!used.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (used.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }

  return `${baseSlug}-${counter}`;
}

function normalizeStoreCategory(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return 'varejo';
  return raw; // armazena a categoria amigável diretamente (ex: "Restaurante")
}

function normalizeStore(row: any, ownerProfile?: any) {
  const plan = normalizeStorePlan(row?.plan);
  const defaults = getPlanDefaults(plan);
  const ownerId = row.owner_id || row.ownerUid || row.user_id || null;

  return {
    id: row.id,
    storeName: row.store_name || row.name,
    store_name: row.store_name || row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    city: row.city,
    state: row.state,
    logo: row.logo,
    logo_url: row.logo_url,
    external_url: row.external_url,
    ownerUid: ownerId,
    ownerEmail: ownerProfile?.email,
    ownerName: ownerProfile?.display_name,
    phone: row.phone || ownerProfile?.phone,
    address: row.address,
    status: row.status || row.store_status || 'pending',
    plan,
    plan_status: row.plan_status || defaults.plan_status,
    product_limit: row.product_limit ?? defaults.product_limit,
    photo_limit: row.photo_limit ?? defaults.photo_limit,
    priority_weight: row.priority_weight ?? defaults.priority_weight,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

async function fetchAllStores() {
  const first = await supabaseAdmin
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (!first.error) return first;

  // fallback para schemas que não possuem created_at
  return supabaseAdmin
    .from('stores')
    .select('*');
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (requesterError) {
      return NextResponse.json({ error: requesterError.message }, { status: 500 });
    }

    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data, error } = await fetchAllStores();

    if (error) {
      return NextResponse.json({ error: error.message || 'Erro ao buscar lojas' }, { status: 500 });
    }

    const rows = (data as any[]) || [];
    const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id || row.ownerUid || row.user_id).filter(Boolean)));

    let profileMap = new Map<string, any>();
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, display_name, phone')
        .in('id', ownerIds);

      profileMap = new Map(((profiles as any[]) || []).map((profile) => [String(profile.id), profile]));
    }

    const stores = rows.map((row) => {
      const ownerId = row.owner_id || row.ownerUid || row.user_id;
      return normalizeStore(row, profileMap.get(String(ownerId)));
    });

    return NextResponse.json({ stores });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao buscar lojas do admin' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (requesterError) {
      return NextResponse.json({ error: requesterError.message }, { status: 500 });
    }

    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { store_name, phone, address, city, state, description } = body;

    if (!store_name) {
      return NextResponse.json({ error: 'store_name é obrigatório' }, { status: 400 });
    }

    // Obter defaults do plano Presença
    const defaults = getPlanDefaults('presenca');
    const slug = await buildUniqueStoreSlug(body.slug, store_name);

    const newStoreData = {
      store_name: String(store_name).trim(),
      slug,
      phone: phone ? String(phone).trim() : '',
      address: address ? String(address).trim() : '',
      city: city ? String(city).trim() : '',
      state: state ? String(state).trim() : '',
      description: description ? String(description).trim() : '',
      email: body.email ? String(body.email).trim() : '',
      facebook_url: body.facebook_url ? String(body.facebook_url).trim() : '',
      instagram_url: body.instagram_url ? String(body.instagram_url).trim() : '',
      category: normalizeStoreCategory(body.category),
      theme_color: body.theme_color ? String(body.theme_color).trim() : 'azul',
      plan: 'presenca',
      status: 'approved',
      plan_status: defaults.plan_status,
      product_limit: defaults.product_limit,
      photo_limit: defaults.photo_limit,
      priority_weight: defaults.priority_weight,
    };

    const { data: newStore, error: insertError } = await supabaseAdmin
      .from('stores')
      .insert([newStoreData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message || 'Erro ao criar loja' }, { status: 500 });
    }

    const normalized = normalizeStore(newStore);

    return NextResponse.json({ store: normalized, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao criar loja' },
      { status: 500 }
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId e obrigatorio' }, { status: 400 });
    }

    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (requesterError) {
      return NextResponse.json({ error: requesterError.message }, { status: 500 });
    }
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, logo_url, landing_photo_urls } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId e obrigatorio' }, { status: 400 });
    }

    const { data: storeRow, error: storeFetchError } = await supabaseAdmin
      .from('stores')
      .select('id, plan')
      .eq('id', storeId)
      .maybeSingle();

    if (storeFetchError) {
      return NextResponse.json({ error: storeFetchError.message || 'Erro ao buscar loja' }, { status: 500 });
    }
    if (!storeRow) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const planDefaults = await getServerPlanDefaults((storeRow as any).plan);
    const maxPhotos = Math.max(
      1,
      Number.isFinite(Number((storeRow as any).photo_limit)) && Number((storeRow as any).photo_limit) > 0
        ? Number((storeRow as any).photo_limit)
        : Number(planDefaults?.photo_limit || 5)
    );

    const updateData: Record<string, unknown> = {};
    if (logo_url) updateData.logo_url = String(logo_url).trim();
    if (Array.isArray(landing_photo_urls)) {
      updateData.landing_photo_urls = landing_photo_urls.filter(Boolean).slice(0, maxPhotos);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Erro ao atualizar loja' }, { status: 500 });
    }

    return NextResponse.json({ store: normalizeStore(updated), success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao atualizar loja' },
      { status: 500 }
    );
  }
}
