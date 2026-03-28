"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { type StoreDoc } from "@/lib/adminQueries";
import externalStores from "@/data/externalStores";
import { getPlanConfig, normalizeStorePlan } from "@/lib/storePlans";
import { useStorePlans } from "@/lib/useStorePlans";

function normalizeLoose(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeUrlLoose(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export default function AdminLojasPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { planConfigMap } = useStorePlans();
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkDetails, setBulkDetails] = useState<string[]>([]);
  const [overrideLines, setOverrideLines] = useState('');

  const fillLegacyTemplate = () => {
    setOverrideLines([
      'dkworks,4.8,120,Historico legado DKWorks',
      'vitrine-segura,4.7,95,Historico legado Vitrine Segura',
      'ciceranails,4.9,140,Historico legado Cicera Nails',
    ].join('\n'));
  };
  const [ratingsSummaryMap, setRatingsSummaryMap] = useState<Record<string, {
    avg_rating: number;
    total_reviews: number;
    source: 'organic' | 'legacy_override';
  }>>({});

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

        const rawList = (payload?.stores || []) as StoreDoc[];

        const list = rawList.filter((store: any) => {
          return !(externalStores || []).some((external: any) => {
            const sameSlug = normalizeLoose(store.slug) === normalizeLoose(external.id);
            const sameName = normalizeLoose(store.storeName || store.store_name || store.name) === normalizeLoose(external.store_name);
            const sameUrl = normalizeUrlLoose(store.external_url) && normalizeUrlLoose(store.external_url) === normalizeUrlLoose(external.external_url);
            return sameSlug || sameName || sameUrl;
          });
        });

        const map = new Map<string, any>();
        list.forEach((s: any) => map.set(String(s.id), { ...s, _internal: true }));
        (externalStores || []).forEach((es: any) => {
          const existing = map.get(es.id)
            || Array.from(map.values()).find((item: any) => String(item.slug || '').trim().toLowerCase() === String(es.id).trim().toLowerCase())
            || Array.from(map.values()).find((item: any) => String(item.storeName || item.store_name || '').trim().toLowerCase() === String(es.store_name || '').trim().toLowerCase());
          if (existing) {
            map.delete(String(existing.id));
            map.set(String(existing.id), {
              ...existing,
              ...es,
              id: existing.id,
              slug: existing.slug || es.id,
              storeName: es.store_name || existing.storeName || existing.store_name,
              store_name: es.store_name || existing.store_name || existing.storeName,
              description: es.description || existing.description,
              external_url: es.external_url || existing.external_url,
              _internal: true,
            });
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

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    let mounted = true;
    const loadRatings = async () => {
      try {
        const response = await fetch('/api/reviews?all_summary=true', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !mounted) return;

        const map: Record<string, {
          avg_rating: number;
          total_reviews: number;
          source: 'organic' | 'legacy_override';
        }> = {};

        (payload?.summaries || []).forEach((row: any) => {
          map[String(row.store_id)] = {
            avg_rating: Number(row.avg_rating || 0),
            total_reviews: Number(row.total_reviews || 0),
            source: row.source === 'legacy_override' ? 'legacy_override' : 'organic',
          };
        });

        if (mounted) setRatingsSummaryMap(map);
      } catch {
        // silencioso
      }
    };

    loadRatings();
    const interval = setInterval(loadRatings, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user, profile?.role]);

  if (loading || profileLoading || storesLoading) return <div className="p-8">Carregando...</div>;
  if (!user || profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  const handleSyncWeights = async () => {
    setBulkLoading(true);
    setBulkMessage(null);
    setBulkDetails([]);
    try {
      const response = await fetch(`/api/admin/lojas?userId=${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_sync_plan_weights' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Falha ao sincronizar pesos');
      setBulkMessage(`Pesos sincronizados com sucesso: ${payload.updated}/${payload.total} lojas.`);
    } catch (error: any) {
      setBulkMessage(`Erro: ${error?.message || 'falha inesperada'}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApplyOverrides = async () => {
    const lines = overrideLines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setBulkMessage('Informe ao menos uma linha de override.');
      return;
    }

    const overrides = lines.map((line) => {
      const [store_ref, avgRaw, countRaw, ...noteParts] = line.split(',').map((x) => x.trim());
      return {
        store_ref,
        avg_rating_legacy: Number(avgRaw),
        total_reviews_legacy: Number(countRaw),
        source_note: noteParts.join(',') || 'Ajuste legado via admin',
      };
    });

    setBulkLoading(true);
    setBulkMessage(null);
    setBulkDetails([]);
    try {
      const response = await fetch(`/api/admin/lojas?userId=${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_upsert_rating_overrides', overrides }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (Array.isArray(payload?.skipped) && payload.skipped.length > 0) {
          setBulkDetails(payload.skipped.map((s: any) => `${s.store_ref || '(vazio)'}: ${s.reason || 'motivo não informado'}`));
        }
        throw new Error(payload?.error || 'Falha ao aplicar overrides');
      }

      const skippedCount = Array.isArray(payload?.skipped) ? payload.skipped.length : 0;
      const skippedMsg = skippedCount > 0
        ? ` Ignoradas: ${skippedCount}.`
        : '';
      setBulkMessage(`Overrides aplicados: ${payload.updated}.${skippedMsg}`);
      if (Array.isArray(payload?.skipped) && payload.skipped.length > 0) {
        setBulkDetails(payload.skipped.map((s: any) => `${s.store_ref || '(vazio)'}: ${s.reason || 'motivo não informado'}`));
      }
      setOverrideLines('');
    } catch (error: any) {
      setBulkMessage(`Erro: ${error?.message || 'falha inesperada'}`);
    } finally {
      setBulkLoading(false);
    }
  };

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

      {/* Ações em lote */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900">Sincronização de prioridade</h2>
          <p className="text-sm text-gray-600 mt-1">Aplica em lote: Premium=3, Destaque=2, Landing Page=1, Presença=0.</p>
          <button
            type="button"
            onClick={handleSyncWeights}
            disabled={bulkLoading}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {bulkLoading ? 'Processando...' : 'Sincronizar pesos por plano'}
          </button>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900">Override legado de estrelas (lote)</h2>
          <p className="text-sm text-gray-600 mt-1">Uma linha por loja: store_ref(slug ou UUID),nota,total_reviews,observacao(opcional)</p>
          <textarea
            value={overrideLines}
            onChange={(e) => setOverrideLines(e.target.value)}
            className="mt-3 w-full border border-gray-300 rounded p-2 text-sm h-32 text-gray-900 placeholder:text-gray-400 bg-white"
            placeholder="ex: dkworks,4.8,112,Historico Instagram"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fillLegacyTemplate}
              disabled={bulkLoading}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded text-sm font-semibold disabled:opacity-50"
            >
              Preencher DKWorks/Vitrine/Cicera
            </button>
            <button
              type="button"
              onClick={handleApplyOverrides}
              disabled={bulkLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold disabled:opacity-50"
            >
              {bulkLoading ? 'Processando...' : 'Aplicar overrides'}
            </button>
          </div>
        </div>
      </div>

      {bulkMessage && (
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          {bulkMessage}
          {bulkDetails.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-700 space-y-1">
              {bulkDetails.map((detail, idx) => (
                <li key={`${detail}-${idx}`}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Content list */}
      <div className="grid grid-cols-1 gap-3">
        {stores.map((s) => {
          const normalizedPlan = normalizeStorePlan((s as any).plan);
          const planConfig = getPlanConfig(normalizedPlan, planConfigMap);
          const planStatus = (s as any).plan_status || 'active';
          const rating = ratingsSummaryMap[String(s.id)];

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
                  {rating ? (
                    <>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                        ⭐ {rating.avg_rating.toFixed(1)} ({rating.total_reviews})
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${rating.source === 'legacy_override' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {rating.source === 'legacy_override' ? 'Origem: Legado (override)' : 'Origem: Clientes da plataforma'}
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
                      Sem avaliação
                    </span>
                  )}
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
