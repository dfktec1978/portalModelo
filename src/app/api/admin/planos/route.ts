import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getServerPlanList } from '@/lib/storePlansServer';
import { buildPlanConfigMap, getPlanConfigList, type PlanConfigInput } from '@/lib/storePlans';

async function validateAdmin(userId?: string | null) {
  if (!userId) return { ok: false, status: 400, error: 'userId é obrigatório' };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { ok: false, status: 500, error: error.message };
  if (!data || data.role !== 'admin') return { ok: false, status: 403, error: 'Acesso negado' };

  return { ok: true, status: 200 };
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const auth = await validateAdmin(userId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const plans = await getServerPlanList();
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar planos' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await validateAdmin(body?.userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const normalized = getPlanConfigList(buildPlanConfigMap((body?.plans || []) as PlanConfigInput[])).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price_label: plan.priceLabel,
      product_limit: plan.productLimit,
      photo_limit: plan.photoLimit,
      priority_weight: plan.priorityWeight,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('store_plan_settings')
      .upsert(normalized, { onConflict: 'id' })
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mantem as lojas existentes sincronizadas com os limites definidos no plano.
    const syncResults = await Promise.all(
      normalized.map(async (plan) => {
        const { error: syncError } = await supabaseAdmin
          .from('stores')
          .update({
            product_limit: plan.product_limit,
            photo_limit: plan.photo_limit,
            priority_weight: plan.priority_weight,
          })
          .eq('plan', plan.id);

        return {
          planId: plan.id,
          ok: !syncError,
          error: syncError?.message || null,
        };
      }),
    );

    const failedSync = syncResults.find((item) => !item.ok);
    if (failedSync) {
      return NextResponse.json(
        {
          error: `Planos salvos, mas falha ao sincronizar lojas do plano ${failedSync.planId}: ${failedSync.error}`,
          plans: data || normalized,
          syncResults,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ plans: data || normalized, syncResults });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao salvar planos' }, { status: 500 });
  }
}
