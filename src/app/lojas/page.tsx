"use client"; 

import { useEffect, useMemo, useState } from "react";
import StoreCard from "@/components/StoreCard";
import externalStores from "@/data/externalStores";
import { getPlanConfig, normalizeStorePlan } from "@/lib/storePlans";
import { useStorePlans } from "@/lib/useStorePlans";

const HIDDEN_DEMO_SLUGS = new Set(["food", "lojademo", "landing"]);

/** Exibe label amigável para categorias legacy do DB */
function displayCategory(raw: string): string {
  if (!raw) return "";
  if (raw === "varejo") return "Varejo";
  if (raw === "alimentacao" || raw === "alimentação") return "Alimentação";
  return raw; // já é categoria amigável (ex: "Restaurante", "Lanchonete")
}

/** Compara dois valores de categoria (case/accent insensitive) */
function categoryMatches(stored: string, filter: string): boolean {
  if (!filter) return true;
  const normalize = (s: string) =>
    s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalize(stored) === normalize(filter);
}

export default function LojasPage() {
  const { planConfigMap } = useStorePlans();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/lojas");
        const payload = await res.json();
        if (!active) return;

        const dbStores: any[] = (payload?.stores || []).map((s: any) => ({
          ...s,
          _internal: true,
        }));

        // Mescla: prioriza dados internos do DB, mantém external_url de externalStores se necessário
        const map = new Map<string, any>();
        dbStores.forEach((s) => map.set(String(s.id), s));

        (externalStores || []).forEach((es: any) => {
          const existing = map.get(String(es.id));
          if (existing) {
            map.set(String(es.id), {
              ...es,
              ...existing,
              external_url: existing.external_url || es.external_url,
            });
          } else {
            map.set(String(es.id), { ...es, _externalOnly: true });
          }
        });

        setStores(Array.from(map.values()));
      } catch {
        // Em caso de erro, mostra pelo menos as externas
        setStores((externalStores || []).map((es: any) => ({ ...es, _externalOnly: true })));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 10_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Filtros
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  // Monta lista de categorias a partir dos valores reais armazenados
  const categories = useMemo(() => {
    const raw = stores.map((s: any) => String((s as any).category || "")).filter(Boolean);
    const unique = Array.from(new Set(raw)).sort();
    return unique;
  }, [stores]);

  const filtered = useMemo(() => {
    const result = (stores || []).filter((s: any) => {
      const slug = String((s as any).slug || "").trim().toLowerCase();
      if (slug && HIDDEN_DEMO_SLUGS.has(slug)) return false;

      const q = query.trim().toLowerCase();
      if (q) {
        const inName = ((s as any).storeName || (s as any).store_name || "").toLowerCase().includes(q);
        const inDesc = ((s as any).description || "").toLowerCase().includes(q);
        if (!inName && !inDesc) return false;
      }
      if (category && !categoryMatches(String((s as any).category || ""), category)) return false;
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
  }, [stores, query, category, planConfigMap]);

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
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.8fr)_auto] gap-3 items-end">
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
                  <option key={c} value={c}>{displayCategory(c)}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setQuery(""); setCategory(""); }}
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
