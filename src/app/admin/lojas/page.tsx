"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { type StoreDoc } from "@/lib/adminQueries";
import externalStores from "@/data/externalStores";
import { getPlanConfig, normalizeStorePlan } from "@/lib/storePlans";
import { useStorePlans } from "@/lib/useStorePlans";

export default function AdminLojasPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { planConfigMap } = useStorePlans();
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    let mounted = true;

    const loadStores = async () => {
      try {
        if (mounted) {
          setStoresError(null);
        }

        const response = await fetch(`/api/admin/lojas?userId=${encodeURIComponent(user.id)}`, {
          cache: 'no-store',
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Erro ao carregar lojas');
        }

        const list = (payload?.stores || []) as StoreDoc[];

        const map = new Map<string, any>();
        list.forEach((s: any) => map.set(String(s.id), { ...s, _internal: true }));
        (externalStores || []).forEach((es: any) => {
          if (map.has(es.id)) {
            const existing = map.get(es.id);
            map.set(es.id, { ...existing, ...es });
          } else {
            map.set(es.id, { ...es, _externalOnly: true });
          }
        });

        if (mounted) {
          setStores(Array.from(map.values()));
        }
      } catch (error: any) {
        if (mounted) {
          setStoresError(error?.message || 'Erro ao carregar lojas');
        }
      } finally {
        if (mounted) {
          setStoresLoading(false);
        }
      }
    };

    loadStores();
    const interval = setInterval(loadStores, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, profile?.role]);

  if (loading || profileLoading || storesLoading) return <div className="p-8">Carregando...</div>;
  if (!user || profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  return (
    <div className="space-y-6">
      {/* Header / Hero */}
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Lojas</h1>
        <p className="text-white/80">Administre lojas internas e cadastros externos</p>
      </div>

      {storesError && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Não foi possível carregar todas as lojas internas agora: {storesError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-[#FDC500]">{stores.length}</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{stores.filter(s => (s as any)._internal).length}</p>
          <p className="text-gray-400 text-sm">Internas</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{stores.filter(s => (s as any)._externalOnly).length}</p>
          <p className="text-gray-400 text-sm">Externa apenas</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-400">{stores.filter(s => s.status === 'pending').length}</p>
          <p className="text-gray-400 text-sm">Pendentes</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-400">{stores.filter(s => s.status === 'approved').length}</p>
          <p className="text-gray-400 text-sm">Aprovadas</p>
        </div>
      </div>

      {/* Content list */}
      <div className="grid grid-cols-1 gap-3">
        {stores.map((s) => {
          const normalizedPlan = normalizeStorePlan((s as any).plan);
          const planConfig = getPlanConfig(normalizedPlan, planConfigMap);
          const planStatus = (s as any).plan_status || 'active';

          return (
            <div key={s.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <div className="font-semibold text-lg text-gray-900">{s.ownerName || s.id}</div>
                <div className="text-sm text-gray-800">Loja: <span className="font-medium text-gray-900">{(s as any).storeName || '—'}</span></div>
                <div className="text-sm text-gray-700">Email: {(s as any).ownerEmail || '—'}</div>
                <div className="text-sm text-gray-700">Telefone: {(s as any).phone || '—'}</div>
                <div className="text-sm text-gray-600 mt-1">Status: <span className="font-medium text-gray-900">{s.status || 'pending'}</span></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
                    Plano ativo: {planConfig.name} • {planConfig.priceLabel}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${planStatus === 'active' ? 'bg-green-50 text-green-700 border-green-200' : planStatus === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    Plano status: {planStatus}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                {s.status === 'pending' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1 text-sm text-yellow-800">
                    <p className="font-semibold">Pendente</p>
                    <p className="text-xs text-yellow-700 mt-1">Aprovar em <a href="/admin/usuarios" className="underline font-bold">Gestão de Usuários</a></p>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-medium">✓ {(s.status === 'approved' || s.status === 'active') ? 'Aprovada' : 'Bloqueada'}</div>
                )}
                <a href={`/admin/lojas/${s.id}/editar`} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Editar</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
