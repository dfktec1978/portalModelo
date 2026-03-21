"use client"; 

import { useEffect, useMemo, useState } from "react";
import StoreCard from "@/components/StoreCard";
import { subscribeToAdminStores, type StoreDoc } from "@/lib/adminQueries";
import externalStores from "@/data/externalStores";
import { getPlanConfig, normalizeStorePlan } from "@/lib/storePlans";
import { useStorePlans } from "@/lib/useStorePlans";

export default function LojasPage() {
  const { planConfigMap } = useStorePlans();
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAdminStores((arr) => {
      const internals = (arr || []).filter((s) => (s as any).status === 'approved');

      // criar mapa por id para facilitar merge com externalStores
      const map = new Map<string, any>();
      internals.forEach((s: any) => map.set(String(s.id), { ...s, _internal: true }));

      // adicionar ou mesclar lojas externas configuradas via código
      (externalStores || []).forEach((es: any) => {
        const existing = map.get(es.id);
        if (existing) {
          // mesclar: preferir dados internos, mas garantir external_url
          map.set(es.id, { ...es, ...existing, external_url: existing.external_url || es.external_url });
        } else {
          map.set(es.id, { ...es, _externalOnly: true });
        }
      });

      setStores(Array.from(map.values()));
      setLoading(false);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // Filtros (UI para uso futuro)
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const categories = useMemo(() => {
    const setc = new Set(stores.map((s: any) => (s as any).category).filter(Boolean));
    return Array.from(setc);
  }, [stores]);

  const filtered = useMemo(() => {
    const result = (stores || []).filter((s: any) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const inName = ((s as any).storeName || (s as any).store_name || "").toLowerCase().includes(q);
        const inDesc = ((s as any).description || "").toLowerCase().includes(q);
        if (!inName && !inDesc) return false;
      }
      if (category && (s as any).category !== category) return false;
      if (location && (s as any).city && !( (s as any).city || "").toLowerCase().includes(location.toLowerCase())) return false;
      return true;
    });

    return result.sort((a: any, b: any) => {
      const aWeight = Number.isFinite(Number(a?.priority_weight))
        ? Number(a.priority_weight)
        : getPlanConfig(normalizeStorePlan(a?.plan), planConfigMap).priorityWeight;
      const bWeight = Number.isFinite(Number(b?.priority_weight))
        ? Number(b.priority_weight)
        : getPlanConfig(normalizeStorePlan(b?.plan), planConfigMap).priorityWeight;
      return bWeight - aWeight;
    });
  }, [stores, query, category, location, planConfigMap]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#003049] mb-2">A cidade que você ama, agora conectada.</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compre online e valorize o comércio local.
          </p>
        </header>

        {/* Filtros */}
        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Buscar</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome ou descrição"
                className="w-full form-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full form-select">
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Local</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cidade, bairro..."
                className="w-full form-input"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setQuery(""); setCategory(""); setLocation(""); }}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Limpar
              </button>
              <div className="text-sm text-gray-600 self-center">Resultados: {filtered.length}</div>
            </div>
          </div>
        </section>

        {/* Grid de lojas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <div key={s.id}>
              <StoreCard
                store={{
                  id: s.id,
                  store_name: s.storeName || s.store_name || s.name,
                  name: s.name,
                  slug: (s as any).slug,
                  description: s.description,
                  logo: s.logo || s.logo_url || (s as any).image,
                  external_url: (s as any).external_url,
                }}
                internalHref={!s._externalOnly ? `/lojas/${s.slug || s.id}` : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
