"use client";
import React, { useMemo, useState } from "react";
import StoreFilters from "@/components/StoreFilters";
import StoreProductCard from "@/components/StoreProductCard";

type Product = {
  id: string;
  title: string;
  price: string;
  image: string;
  badges?: string[];
};

const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", title: "Camiseta Básica Masculina", price: "R$ 29,90", image: "/img/sample1.jpg", badges: ["Novo"] },
  { id: "2", title: "Shorts Verão", price: "R$ 39,90", image: "/img/sample2.jpg" },
  { id: "3", title: "Regata Slim", price: "R$ 19,90", image: "/img/sample3.jpg" },
  { id: "4", title: "Camisa Polo", price: "R$ 49,90", image: "/img/sample4.jpg" },
  { id: "5", title: "Bermuda Cotton", price: "R$ 59,90", image: "/img/sample5.jpg" },
  { id: "6", title: "Camiseta Estampada", price: "R$ 34,90", image: "/img/sample6.jpg" },
  { id: "7", title: "Calça Jeans", price: "R$ 89,90", image: "/img/sample7.jpg" },
  { id: "8", title: "Jaqueta Leve", price: "R$ 129,90", image: "/img/sample8.jpg" },
];

export default function LojaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);

  const products = useMemo(() => {
    return SAMPLE_PRODUCTS.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (category && !p.title.toLowerCase().includes(category.toLowerCase())) return false;
      if (priceMax) {
        const numeric = Number(String(p.price).replace(/\D/g, "")) / 100;
        if (numeric > priceMax) return false;
      }
      return true;
    });
  }, [query, category, priceMax]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#003049]">Loja</h1>
          <div className="w-1/3">
            <input placeholder="Faça uma pesquisa..." value={query} onChange={(e) => setQuery(e.target.value)} className="form-input w-full" />
          </div>
        </div>
      </header>

      <div className="flex gap-6">
        <aside className="w-72">
          <StoreFilters
            onCategoryChange={(c) => setCategory(c)}
            onPriceChange={(v) => setPriceMax(v)}
          />
        </aside>

        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Exibindo {products.length} produtos</div>
            <div className="text-sm text-gray-600">Ordenar: <select className="form-select"><option>Mais relevantes</option><option>Menor preço</option></select></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <StoreProductCard key={p.id} product={p} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
