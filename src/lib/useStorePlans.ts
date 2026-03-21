"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPlanConfigMap,
  getPlanConfigList,
  PLAN_CONFIG,
  type PlanConfigInput,
} from "@/lib/storePlans";

export function useStorePlans() {
  const [planConfigMap, setPlanConfigMap] = useState(() => buildPlanConfigMap());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/store-plans", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Erro ao carregar planos");
      }

      setPlanConfigMap(buildPlanConfigMap((payload?.plans || []) as PlanConfigInput[]));
    } catch (err: any) {
      setPlanConfigMap(buildPlanConfigMap(Object.values(PLAN_CONFIG)));
      setError(err?.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const plans = useMemo(() => getPlanConfigList(planConfigMap), [planConfigMap]);

  return {
    planConfigMap,
    plans,
    loading,
    error,
    refresh: loadPlans,
  };
}
