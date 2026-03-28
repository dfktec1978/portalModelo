export type StorePlan = 'presenca' | 'landingpage' | 'destaque' | 'premium';
export type PlanStatus = 'active' | 'pending' | 'canceled';

export type PlanConfig = {
  id: StorePlan;
  name: string;
  priceLabel: string;
  productLimit: number;
  photoLimit: number;
  priorityWeight: number;
};

export type PlanConfigMap = Record<StorePlan, PlanConfig>;

export const PLAN_ORDER: StorePlan[] = ['presenca', 'landingpage', 'destaque', 'premium'];

export type PlanConfigInput = Partial<PlanConfig> & {
  id?: string | null;
  price_label?: string | null;
  product_limit?: number | null;
  photo_limit?: number | null;
  priority_weight?: number | null;
};

export const PLAN_CONFIG: PlanConfigMap = {
  presenca: {
    id: 'presenca',
    name: 'Plano Presença',
    priceLabel: 'Grátis',
    productLimit: 0,
    photoLimit: 5,
    priorityWeight: 0,
  },
  landingpage: {
    id: 'landingpage',
    name: 'Plano Landing Page',
    priceLabel: 'R$ 44,90/mês',
    productLimit: 0,
    photoLimit: 10,
    priorityWeight: 1,
  },
  destaque: {
    id: 'destaque',
    name: 'Plano Destaque',
    priceLabel: 'R$ 89,90/mês',
    productLimit: 70,
    photoLimit: 5,
    priorityWeight: 2,
  },
  premium: {
    id: 'premium',
    name: 'Plano Premium',
    priceLabel: 'R$ 129,90/mês',
    productLimit: 300,
    photoLimit: 5,
    priorityWeight: 3,
  },
};

export function normalizeStorePlan(plan?: string | null): StorePlan {
  if (plan === 'destaque' || plan === 'premium' || plan === 'presenca' || plan === 'landingpage') {
    return plan;
  }
  return 'presenca';
}

export function buildPlanConfigMap(rows?: PlanConfigInput[] | null): PlanConfigMap {
  const map: PlanConfigMap = {
    presenca:     { ...PLAN_CONFIG.presenca },
    landingpage:  { ...PLAN_CONFIG.landingpage },
    destaque:     { ...PLAN_CONFIG.destaque },
    premium:      { ...PLAN_CONFIG.premium },
  };

  (rows || []).forEach((row) => {
    const id = normalizeStorePlan(row?.id);
    const current = map[id];
    map[id] = {
      ...current,
      id,
      name: row?.name ?? current.name,
      priceLabel: row?.priceLabel ?? row?.price_label ?? current.priceLabel,
      productLimit: Number.isFinite(Number(row?.productLimit ?? row?.product_limit))
        ? Number(row?.productLimit ?? row?.product_limit)
        : current.productLimit,
      photoLimit: Number.isFinite(Number(row?.photoLimit ?? row?.photo_limit))
        ? Number(row?.photoLimit ?? row?.photo_limit)
        : current.photoLimit,
      priorityWeight: Number.isFinite(Number(row?.priorityWeight ?? row?.priority_weight))
        ? Number(row?.priorityWeight ?? row?.priority_weight)
        : current.priorityWeight,
    };
  });

  return map;
}

export function getPlanConfigList(configMap: PlanConfigMap = PLAN_CONFIG) {
  return PLAN_ORDER.map((plan) => configMap[plan]);
}

export function getPlanConfig(plan?: string | null, configMap: PlanConfigMap = PLAN_CONFIG): PlanConfig {
  const normalized = normalizeStorePlan(plan);
  return configMap[normalized];
}

export function getPlanDefaults(plan?: string | null, configMap: PlanConfigMap = PLAN_CONFIG) {
  const cfg = getPlanConfig(plan, configMap);
  return {
    plan: cfg.id,
    plan_status: 'active' as PlanStatus,
    product_limit: cfg.productLimit,
    photo_limit: cfg.photoLimit,
    priority_weight: cfg.priorityWeight,
  };
}

function getPlanOrder(plan?: string | null) {
  const normalized = normalizeStorePlan(plan);
  if (normalized === 'presenca')    return 1;
  if (normalized === 'landingpage') return 2;
  if (normalized === 'destaque')    return 3;
  return 4;
}

export function getPlanTransition(
  currentPlan?: string | null,
  nextPlan?: string | null,
  currentStatus?: string | null,
  configMap: PlanConfigMap = PLAN_CONFIG,
) {
  const from = normalizeStorePlan(currentPlan);
  const to = normalizeStorePlan(nextPlan);
  const isUpgrade = getPlanOrder(to) > getPlanOrder(from);
  const defaults = getPlanDefaults(to, configMap);

  return {
    ...defaults,
    plan: to,
    // No portal atual a troca precisa refletir imediatamente em toda a experiência.
    plan_status: ((currentStatus as PlanStatus) === 'canceled' && from === to)
      ? 'canceled'
      : ('active' as PlanStatus),
    changed: from !== to,
    type: from === to ? 'none' : isUpgrade ? 'upgrade' : 'downgrade',
  };
}

export function resolveStoreLimits(store: any) {
  const cfg = getPlanConfig(store?.plan);
  return {
    plan: normalizeStorePlan(store?.plan),
    plan_status: (store?.plan_status || 'active') as PlanStatus,
    product_limit: Number.isFinite(Number(store?.product_limit))
      ? Number(store.product_limit)
      : cfg.productLimit,
    photo_limit: Number.isFinite(Number(store?.photo_limit)) && Number(store?.photo_limit) > 0
      ? Number(store.photo_limit)
      : cfg.photoLimit,
    priority_weight: Number.isFinite(Number(store?.priority_weight))
      ? Number(store.priority_weight)
      : cfg.priorityWeight,
  };
}
