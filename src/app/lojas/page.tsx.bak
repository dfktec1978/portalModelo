"use client";

import { useMemo, useState } from "react";
import StoreCard from "@/components/StoreCard";

export default function LojasPage() {
  const stores = [
    {
      id: "dkworks",
      store_name: "DKWorks Studio",
      description: "Criação de sites profissionais, marketing digital, consultoria empresarial em TI e treinamentos",
      logo: "/img/logos/dkLogo.png",
      external_url: "https://dkworksstudio.base44.app/",
      category: "Serviços",
      location: "Modelo-SC"
    },
    {
      id: "vitrine-segura",
      store_name: "Vitrine Segura",
      description: "Achadinhos Úteis - Os melhores produtos do Mercado Livre hoje",
      logo: "/img/logos/vitrineSegura.png",
      external_url: "https://vitrine-segura.vercel.app/",
      category: "Produtos",
      location: "Modelo-SC"
    }
  ];

  // Filtros (UI para uso futuro)
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const categories = useMemo(() => {
    const setc = new Set(stores.map(s => s.category).filter(Boolean));
    return Array.from(setc);
  }, []);

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const inName = (s.store_name || s.name || "").toLowerCase().includes(q);
        const inDesc = (s.description || "").toLowerCase().includes(q);
        if (!inName && !inDesc) return false;
      }
      if (category && s.category !== category) return false;
      if (location && s.location && !s.location.toLowerCase().includes(location.toLowerCase())) return false;
      return true;
    });
  }, [stores, query, category, location]);

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
          {filtered.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
