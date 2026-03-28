import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getPlanDefaults, normalizeStorePlan } from '@/lib/storePlans';
import { getServerPlanDefaults } from '@/lib/storePlansServer';
import externalStores from '@/data/externalStores';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMissingTableError(error: any, tableName: string) {
  const code = String(error?.code || '')
  const message = String(error?.message || '')
  return (
    code === 'PGRST205' ||
    new RegExp(`could not find the table .*${tableName}`, 'i').test(message) ||
    new RegExp(`relation .*${tableName}.*does not exist`, 'i').test(message)
  )
}

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

function isMissingColumnError(error: any, columnName: string) {
  const message = String(error?.message || '')
  return new RegExp(`could not find the '${columnName}' column`, 'i').test(message)
    || new RegExp(`column .*${columnName}.* does not exist`, 'i').test(message)
    || /schema cache/i.test(message)
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

    // Ações em lote (admin)
    if (body?.action === 'bulk_sync_plan_weights') {
      const { data: rows, error: fetchError } = await supabaseAdmin
        .from('stores')
        .select('id, plan')

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message || 'Erro ao buscar lojas' }, { status: 500 });
      }

      const stores = (rows as any[]) || [];
      let updated = 0;

      for (const store of stores) {
        const defaults = getPlanDefaults(normalizeStorePlan(store.plan));
        const { error: updateError } = await supabaseAdmin
          .from('stores')
          .update({ priority_weight: defaults.priority_weight })
          .eq('id', store.id);

        if (!updateError) updated += 1;
      }

      return NextResponse.json({ success: true, updated, total: stores.length });
    }

    if (body?.action === 'bulk_upsert_rating_overrides') {
      const overrides = Array.isArray(body?.overrides) ? body.overrides : [];
      if (overrides.length === 0) {
        return NextResponse.json({ error: 'Nenhum override informado' }, { status: 400 });
      }

      const validRows: any[] = [];
      const skipped: Array<{ store_ref: string; reason: string }> = [];
      for (const item of overrides) {
        const storeRef = String(item?.store_id || item?.store_ref || item?.slug || '').trim().toLowerCase();
        const avg = Number(item?.avg_rating_legacy);
        const count = Number(item?.total_reviews_legacy);
        const source = String(item?.source_note || 'Ajuste legado via admin').slice(0, 120);

        if (!storeRef) {
          skipped.push({ store_ref: storeRef, reason: 'store_ref vazio' });
          continue;
        }
        if (!Number.isFinite(avg) || avg < 0 || avg > 5) {
          skipped.push({ store_ref: storeRef, reason: 'nota inválida (0..5)' });
          continue;
        }
        if (!Number.isFinite(count) || count < 0) {
          skipped.push({ store_ref: storeRef, reason: 'total_reviews inválido (>=0)' });
          continue;
        }

        // Resolve referência de loja: UUID/slug interno ou id externo conhecido
        let resolvedStoreId = '';
        let resolvedStoreRef = '';
        if (UUID_REGEX.test(storeRef)) {
          resolvedStoreId = storeRef;
        } else {
          const { data: storeBySlug } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('slug', storeRef)
            .maybeSingle();

          if (storeBySlug?.id) {
            resolvedStoreId = String((storeBySlug as any).id);
          } else {
            // Loja externa conhecida: usa referência externa sem criar novo registro em stores
            const external = (externalStores || []).find((item: any) => String(item.id) === storeRef);
            if (!external) {
              skipped.push({ store_ref: storeRef, reason: 'loja não encontrada por slug' });
              continue;
            }
            resolvedStoreRef = storeRef;
          }
        }

        validRows.push({
          store_id: resolvedStoreId || null,
          store_ref: resolvedStoreRef || null,
          avg_rating_legacy: Math.round(avg * 10) / 10,
          total_reviews_legacy: Math.round(count),
          source_note: source,
          active: true,
          updated_by: userId,
        });
      }

      if (validRows.length === 0) {
        return NextResponse.json({ error: 'Nenhum override válido', skipped }, { status: 400 });
      }

      const hasExternalRefs = validRows.some((row) => row.store_ref)
      const { data: upserted, error: upsertError } = await supabaseAdmin
        .from('store_rating_overrides')
        .upsert(validRows, { onConflict: hasExternalRefs ? 'store_ref' : 'store_id' })
        .select('store_id');

      if (upsertError) {
        if (hasExternalRefs && isMissingColumnError(upsertError, 'store_ref')) {
          return NextResponse.json({
            error: 'A tabela store_rating_overrides ainda não suporta lojas externas. Execute a migration sql/alter-store-rating-overrides-support-external-ref.sql',
          }, { status: 400 });
        }
        if (isMissingTableError(upsertError, 'store_rating_overrides')) {
          return NextResponse.json({
            error: 'Tabela store_rating_overrides não encontrada. Execute a migration sql/add-store-rating-overrides.sql',
          }, { status: 400 });
        }
        return NextResponse.json({ error: upsertError.message || 'Erro ao salvar overrides' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        updated: (upserted || []).length,
        skipped,
      });
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const storeId = request.nextUrl.searchParams.get('storeId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: 'storeId é obrigatório' }, { status: 400 });
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

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, plan, status, store_name')
      .eq('id', storeId)
      .maybeSingle();

    if (storeError) {
      return NextResponse.json({ error: storeError.message || 'Erro ao buscar loja' }, { status: 500 });
    }

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('stores')
      .update({ status: 'inactive' })
      .eq('id', storeId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Erro ao excluir landing page' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      storeId,
      message: `Landing page de ${String((store as any).store_name || 'loja')} removida da vitrine.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao excluir landing page' },
      { status: 500 }
    );
  }
}
