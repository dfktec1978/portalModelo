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
    <aside className="w-64 bg-white p-4 rounded shadow">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Painel</h2>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Loja</label>
        <select value={selectedStoreSlug ?? ''} onChange={(e) => setSelectedStoreSlug && setSelectedStoreSlug(e.target.value)} className="mt-1 w-full border rounded p-2">
          <option value="">(Selecionar loja)</option>
          {stores.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
      <nav className="flex flex-col gap-2">
        <button className={view === 'overview' ? 'font-semibold' : ''} onClick={() => setView('overview')}>Visão Geral</button>
        <button className={view === 'orders' ? 'font-semibold' : ''} onClick={() => setView('orders')}>Pedidos</button>
        <button className={view === 'finance' ? 'font-semibold' : ''} onClick={() => setView('finance')}>Financeiro</button>

        {/* Módulos adaptativos por categoria */}
        {category === 'varejo' ? (
          <button className={view === 'products' ? 'font-semibold' : ''} onClick={() => setView('products')}>Produtos</button>
        ) : (
          <button className={view === 'menu' ? 'font-semibold' : ''} onClick={() => setView('menu')}>Cardápio</button>
        )}

        <button className={view === 'appearance' ? 'font-semibold' : ''} onClick={() => setView('appearance')}>Aparência</button>
        <button className={view === 'settings' ? 'font-semibold' : ''} onClick={() => setView('settings')}>Configurações</button>
      </nav>

      <div className="mt-6">
        <label className="block text-sm font-medium">Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border rounded p-2">
          <option value="varejo">Varejo</option>
          <option value="alimentacao">Alimentação</option>
        </select>
      </div>
    </aside>
  );
}
