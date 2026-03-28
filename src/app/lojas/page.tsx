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

export default function LojasPage() {
  const { planConfigMap } = useStorePlans();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsMap, setRatingsMap] = useState<Record<string, { avg_rating: number; total_reviews: number }>>({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/lojas");
        const payload = await res.json();
        if (!active) return;

        const rawDbStores: any[] = (payload?.stores || []).map((s: any) => ({
          ...s,
          _internal: true,
        }));

        const dbStores = rawDbStores.filter((store: any) => {
          return !(externalStores || []).some((external: any) => {
            const sameSlug = normalizeLoose(store.slug) === normalizeLoose(external.id)
            const sameName = normalizeLoose(store.store_name || store.storeName || store.name) === normalizeLoose(external.store_name)
            const sameUrl = normalizeUrlLoose(store.external_url) && normalizeUrlLoose(store.external_url) === normalizeUrlLoose(external.external_url)
            return sameSlug || sameName || sameUrl
          })
        })

        // Mantém externas oficiais por código e adiciona internas que não são clones delas
        const map = new Map<string, any>();
        dbStores.forEach((s) => map.set(String(s.id), s));

        (externalStores || []).forEach((es: any) => {
          const existing = map.get(String(es.id))
            || Array.from(map.values()).find((item: any) => String(item.slug || '').trim().toLowerCase() === String(es.id).trim().toLowerCase())
            || Array.from(map.values()).find((item: any) => String(item.store_name || item.storeName || '').trim().toLowerCase() === String(es.store_name || '').trim().toLowerCase());
          if (existing) {
            map.delete(String(existing.id));
            map.set(String(existing.id), {
              ...existing,
              ...es,
              id: existing.id,
              slug: existing.slug || es.id,
              store_name: es.store_name || existing.store_name || existing.storeName,
              storeName: es.store_name || existing.storeName || existing.store_name,
              description: es.description || existing.description,
              logo: es.logo || existing.logo || existing.logo_url,
              logo_url: es.logo || existing.logo_url || existing.logo,
              external_url: es.external_url || existing.external_url,
              _internal: true,
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
  // Buscar ratings uma vez ao montar (sem polling — não mudam com frequência)
  useEffect(() => {
    let active = true;
    fetch('/api/reviews?all_summary=true')
      .then(r => r.json())
      .then((payload: any) => {
        if (!active) return;
        const map: Record<string, { avg_rating: number; total_reviews: number }> = {};
        (payload?.summaries || []).forEach((s: any) => { map[s.store_id] = s; });
        setRatingsMap(map);
      })
      .catch(() => {/* silencioso — cards sem rating caso falhe */});
    return () => { active = false; };
  }, []);

  // Filtros
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

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

      const summary = ratingsMap[String(s.id)];
      const avgRating = Number(summary?.avg_rating || 0);
      const hasReviews = Number(summary?.total_reviews || 0) > 0;
      if (ratingFilter === "with_reviews" && !hasReviews) return false;
      if (ratingFilter === "4_plus" && avgRating < 4) return false;
      if (ratingFilter === "3_plus" && avgRating < 3) return false;
      if (ratingFilter === "5_only" && avgRating < 5) return false;

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

      // 1) Ordenação principal: peso de prioridade
      if (bWeight !== aWeight) return bWeight - aWeight;

      // 2) Ordenação secundária: nota média da loja
      const aRating = Number(ratingsMap[String(a?.id)]?.avg_rating || 0);
      const bRating = Number(ratingsMap[String(b?.id)]?.avg_rating || 0);
      if (bRating !== aRating) return bRating - aRating;

      // 3) Critério de desempate: quantidade de avaliações
      const aCount = Number(ratingsMap[String(a?.id)]?.total_reviews || 0);
      const bCount = Number(ratingsMap[String(b?.id)]?.total_reviews || 0);
      if (bCount !== aCount) return bCount - aCount;

      // 4) Último desempate estável: nome da loja
      const aName = String(a?.storeName || a?.store_name || a?.name || '').toLowerCase();
      const bName = String(b?.storeName || b?.store_name || b?.name || '').toLowerCase();
      return aName.localeCompare(bName, 'pt-BR');
    });
  }, [stores, query, category, ratingFilter, ratingsMap, planConfigMap]);

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
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)_minmax(220px,0.8fr)_auto] gap-3 items-end">
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

            <div>
              <label className="text-sm text-gray-600 block mb-1">Nota</label>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="w-full form-select">
                <option value="">Todas</option>
                <option value="with_reviews">Com avaliações</option>
                <option value="4_plus">4 estrelas ou mais</option>
                <option value="3_plus">3 estrelas ou mais</option>
                <option value="5_only">5 estrelas</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setQuery(""); setCategory(""); setRatingFilter(""); }}
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
            <div key={s.id} className="h-full">
              <StoreCard
                store={{
                  id: s.id,
                  store_name: s.storeName || s.store_name || s.name,
                  name: s.name,
                  slug: (s as any).slug,
                  description: s.description,
                  logo: s.logo || s.logo_url || (s as any).image,
                  external_url: (s as any).external_url,
                  average_rating: ratingsMap[s.id]?.avg_rating ?? null,
                  review_count: ratingsMap[s.id]?.total_reviews ?? 0,
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
