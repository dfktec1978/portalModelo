"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useStorePlans } from "@/lib/useStorePlans";
import type { StorePlan } from "@/lib/storePlans";

type EditablePlan = {
  id: StorePlan;
  name: string;
  priceLabel: string;
  productLimit: number;
  photoLimit: number;
  priorityWeight: number;
};

export default function AdminPlanosPage() {
  const { user } = useAuth();
  const { plans, loading, error, refresh } = useStorePlans();
  const [formPlans, setFormPlans] = useState<EditablePlan[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormPlans(plans.map((plan) => ({ ...plan })));
  }, [plans]);

  const updatePlan = (id: StorePlan, field: keyof EditablePlan, value: string) => {
    setFormPlans((current) => current.map((plan) => {
      if (plan.id !== id) return plan;
      if (field === 'productLimit' || field === 'photoLimit' || field === 'priorityWeight') {
        return { ...plan, [field]: Number(value || 0) };
      }
      return { ...plan, [field]: value };
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/planos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plans: formPlans }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Erro ao salvar planos');
      }

      setMessage('Planos atualizados com sucesso e aplicados ao portal.');
      await refresh();
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao salvar planos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Planos</h1>
        <p className="text-white/80">Ajuste preço, limites e prioridade dos planos aplicados no portal.</p>
      </div>

      {(error || message) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-yellow-300 bg-yellow-50 text-yellow-900' : message?.includes('sucesso') ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {formPlans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-white/20 bg-white/10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nome do plano</label>
                <input value={plan.name} onChange={(e) => updatePlan(plan.id, 'name', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Valor exibido</label>
                <input value={plan.priceLabel} onChange={(e) => updatePlan(plan.id, 'priceLabel', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white" placeholder="Ex: R$ 89,90/mês" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Limite de produtos</label>
                <input type="number" min={0} value={plan.productLimit} onChange={(e) => updatePlan(plan.id, 'productLimit', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Fotos por produto</label>
                <input type="number" min={0} value={plan.photoLimit} onChange={(e) => updatePlan(plan.id, 'photoLimit', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Peso de prioridade</label>
                <input type="number" min={0} value={plan.priorityWeight} onChange={(e) => updatePlan(plan.id, 'priorityWeight', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white" />
              </div>
              <div className="flex items-end">
                <div className="rounded-lg border border-[#FDC500]/40 bg-[#FDC500]/10 px-4 py-3 text-sm text-[#FDC500] w-full">
                  ID técnico: {plan.id}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving || loading} className="rounded-lg bg-[#FDC500] px-6 py-3 font-semibold text-black hover:bg-[#E8B500] disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar Planos'}
        </button>
        <button onClick={() => setFormPlans(plans.map((plan) => ({ ...plan })))} className="rounded-lg bg-white/10 border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/20">
          Restaurar valores carregados
        </button>
      </div>
    </div>
  );
}
