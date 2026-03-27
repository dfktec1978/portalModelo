import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getPlanDefaults, normalizeStorePlan } from '@/lib/storePlans';

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

    const newStoreData = {
      store_name: String(store_name).trim(),
      phone: phone ? String(phone).trim() : '',
      address: address ? String(address).trim() : '',
      city: city ? String(city).trim() : '',
      state: state ? String(state).trim() : '',
      description: description ? String(description).trim() : '',
      plan: 'presenca',
      status: 'active',
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