"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { updateStore, createStore } from "@/lib/adminQueries";
import externalStores from "@/data/externalStores";
import { getPlanDefaults, normalizeStorePlan } from "@/lib/storePlans";
import { useStorePlans } from "@/lib/useStorePlans";

export default function EditStorePage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { planConfigMap, plans } = useStorePlans();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setStore(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('stores').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!mounted) return;
        if (data) {
          const plan = normalizeStorePlan((data as any).plan);
          const defaults = getPlanDefaults(plan, planConfigMap);
          setStore({
            ...data,
            plan,
            plan_status: (data as any).plan_status || defaults.plan_status,
            product_limit: (data as any).product_limit ?? defaults.product_limit,
            photo_limit: (data as any).photo_limit ?? defaults.photo_limit,
            priority_weight: (data as any).priority_weight ?? defaults.priority_weight,
          } as any);
        } else {
          // fallback to externalStores if present
          const ext = (externalStores || []).find((e: any) => String(e.id) === String(id));
          if (ext) {
            const defaults = getPlanDefaults('presenca', planConfigMap);
            setStore({ ...ext, ...defaults, _externalOnly: true } as any);
          }
          else setStore(null);
        }
      } catch (e: any) {
        console.error('Erro ao carregar loja:', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) {
      alert('ID da loja inválido.');
      return;
    }
    setSaving(true);
    try {
      if (store._externalOnly) {
        // create a new store record in DB
        await createStore(id, {
          storeName: store.store_name || store.storeName,
          description: store.description,
          external_url: store.external_url,
          logo: store.logo || store.logo_url || null,
          status: store.status || 'approved',
          plan: store.plan,
          plan_status: store.plan_status,
          product_limit: Number(store.product_limit ?? 0),
          photo_limit: Number(store.photo_limit ?? 0),
          priority_weight: Number(store.priority_weight ?? 1),
        } as any);
        alert('Loja criada no banco e atualizada');
      } else {
        await updateStore(id, {
          storeName: store.store_name || store.storeName,
          description: store.description,
          external_url: store.external_url,
          logo: store.logo || store.logo_url || null,
          plan: store.plan,
          plan_status: store.plan_status,
          product_limit: Number(store.product_limit ?? 0),
          photo_limit: Number(store.photo_limit ?? 0),
          priority_weight: Number(store.priority_weight ?? 1),
        } as any);
        alert('Loja atualizada');
      }
      router.push('/admin/lojas');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!store) return <div className="p-6">Loja não encontrada.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Editar Loja</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded shadow space-y-4 max-w-2xl">
        <div>
          <label className="form-label">Nome da Loja</label>
          <input value={store.store_name || ''} onChange={(e) => setStore({ ...store, store_name: e.target.value })} className="form-input" />
        </div>

        <div>
          <label className="form-label">Descrição</label>
          <textarea value={store.description || ''} onChange={(e) => setStore({ ...store, description: e.target.value })} className="form-input h-28" />
        </div>

        <div>
          <label className="form-label">URL Externa (Site)</label>
          <input value={store.external_url || ''} onChange={(e) => setStore({ ...store, external_url: e.target.value })} className="form-input" placeholder="https://" />
        </div>

        <div>
          <label className="form-label">Logo (URL)</label>
          <input value={store.logo || store.logo_url || ''} onChange={(e) => setStore({ ...store, logo: e.target.value })} className="form-input" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Plano</label>
            <select
              value={store.plan || 'presenca'}
              onChange={(e) => {
                const plan = normalizeStorePlan(e.target.value);
                const defaults = getPlanDefaults(plan, planConfigMap);
                setStore({
                  ...store,
                  plan,
                  product_limit: defaults.product_limit,
                  photo_limit: defaults.photo_limit,
                  priority_weight: defaults.priority_weight,
                  plan_status: store.plan_status || defaults.plan_status,
                });
              }}
              className="form-select"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} ({plan.priceLabel})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Status do Plano</label>
            <select
              value={store.plan_status || 'active'}
              onChange={(e) => setStore({ ...store, plan_status: e.target.value })}
              className="form-select"
            >
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="canceled">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Limite de produtos</label>
            <input
              type="number"
              min={0}
              value={store.product_limit ?? 0}
              onChange={(e) => setStore({ ...store, product_limit: Number(e.target.value || 0) })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Limite de fotos</label>
            <input
              type="number"
              min={0}
              value={store.photo_limit ?? 0}
              onChange={(e) => setStore({ ...store, photo_limit: Number(e.target.value || 0) })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Peso de prioridade</label>
            <input
              type="number"
              min={0}
              value={store.priority_weight ?? 1}
              onChange={(e) => setStore({ ...store, priority_weight: Number(e.target.value || 0) })}
              className="form-input"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" onClick={() => router.push('/admin/lojas')} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
