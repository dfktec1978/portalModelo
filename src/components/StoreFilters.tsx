"use client";
import React, { useState } from "react";

export default function StoreFilters({ onCategoryChange, onPriceChange }: { onCategoryChange?: (c: string | null) => void; onPriceChange?: (v: number | null) => void; }) {
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");

  function apply() {
    onCategoryChange && onCategoryChange(category);
    onPriceChange && onPriceChange(price ? Number(price) : null);
  }

  return (
    <div className="bg-white rounded shadow p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-[#003049]">Filtros Selecionados</h3>
      </div>

      <div>
        <label className="form-label">Busca por categoria</label>
        <select value={category || ""} onChange={(e) => setCategory(e.target.value || null)} className="form-select w-full">
          <option value="">Todas</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="infantil">Infantil</option>
        </select>
      </div>

      <div>
        <label className="form-label">Preço máximo (R$)</label>
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 100" className="form-input w-full" />
      </div>

      <div className="flex gap-2">
        <button onClick={apply} className="bg-[#003049] text-white px-3 py-1 rounded">Aplicar</button>
        <button onClick={() => { setCategory(null); setPrice(""); onCategoryChange && onCategoryChange(null); onPriceChange && onPriceChange(null); }} className="bg-gray-200 px-3 py-1 rounded">Limpar</button>
      </div>
    </div>
  );
}
