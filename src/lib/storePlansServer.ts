import { supabaseAdmin } from '@/lib/supabaseServer';
import {
  buildPlanConfigMap,
  getPlanDefaults,
  getPlanConfig,
  type StorePlan,
} from '@/lib/storePlans';

export async function fetchServerPlanConfigMap() {
  const { data, error } = await supabaseAdmin
    .from('store_plan_settings')
    .select('*');

  if (error) {
    return buildPlanConfigMap();
  }

  return buildPlanConfigMap((data as any[]) || []);
}

export async function getServerPlanDefaults(plan?: string | null) {
  const configMap = await fetchServerPlanConfigMap();
  return getPlanDefaults(plan, configMap);
}

export async function getServerPlanConfig(plan?: string | null) {
  const configMap = await fetchServerPlanConfigMap();
  return getPlanConfig(plan, configMap);
}

export async function getServerPlanList() {
  const configMap = await fetchServerPlanConfigMap();
  return (['presenca', 'destaque', 'premium'] as StorePlan[]).map((plan) => configMap[plan]);
}
