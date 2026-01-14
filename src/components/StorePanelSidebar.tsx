"use client";
import React, { useEffect, useState } from "react";

type Props = {
  view: string;
  setView: (v: any) => void;
  category: string;
  setCategory: (c: any) => void;
  selectedStoreSlug?: string | null;
  setSelectedStoreSlug?: (s: string) => void;
};

export default function StorePanelSidebar({ view, setView, category, setCategory, selectedStoreSlug, setSelectedStoreSlug }: Props) {
  const [stores, setStores] = useState<Array<any>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/lojas');
        if (!mounted) return;
        const j = await res.json();
        setStores(j.stores || []);
      } catch (e) {
        console.warn('failed fetch stores', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <aside className="w-64 bg-slate-800 text-white p-4 rounded shadow">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Painel</h2>
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-300">Loja</label>
        <select value={selectedStoreSlug ?? ''} onChange={(e) => setSelectedStoreSlug && setSelectedStoreSlug(e.target.value)} className="mt-1 w-full bg-slate-700 text-white border border-slate-600 rounded p-2 text-sm">
          <option value="">(Selecionar loja)</option>
          {stores.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
      <nav className="flex flex-col gap-2">
        <button className={`text-left p-2 rounded ${view === 'overview' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('overview')}>Visão Geral</button>
        <button className={`text-left p-2 rounded ${view === 'orders' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('orders')}>Pedidos</button>
        <button className={`text-left p-2 rounded ${view === 'finance' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('finance')}>Financeiro</button>

        {/* Módulos adaptativos por categoria */}
        {category === 'varejo' ? (
          <button className={`text-left p-2 rounded ${view === 'products' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('products')}>Produtos</button>
        ) : (
          <button className={`text-left p-2 rounded ${view === 'menu' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('menu')}>Cardápio</button>
        )}

        <button className={`text-left p-2 rounded ${view === 'appearance' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('appearance')}>Aparência</button>
        <button className={`text-left p-2 rounded ${view === 'settings' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('settings')}>Configurações</button>
      </nav>

      <div className="mt-6 text-slate-300 text-xs">
        <div className="mb-2">Categoria</div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full bg-slate-700 text-white border border-slate-600 rounded p-2 text-sm">
          <option value="varejo">Varejo</option>
          <option value="alimentacao">Alimentação</option>
        </select>
      </div>
    </aside>
  );
}
