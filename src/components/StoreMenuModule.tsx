"use client";
import React, { useState } from "react";
import { resolveStoreLimits } from "@/lib/storePlans";

type MenuItem = { id: string; name: string; price: number; category?: string };

export default function StoreMenuModule({ storeSlug, store }: { storeSlug?: string; store?: any }) {
  const [items, setItems] = useState<MenuItem[]>([
    { id: 'm1', name: 'X-Burguer', price: 22.5, category: 'Lanches' },
    { id: 'm2', name: 'Pizza Margherita', price: 45.0, category: 'Pizzas' },
  ]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cat, setCat] = useState('Lanches');
  const [error, setError] = useState<string | null>(null);

  const limits = resolveStoreLimits(store);
  const usedItems = items.length;
  const canAddItem = limits.product_limit > 0 && usedItems < limits.product_limit;

  function add() {
    setError(null);
    if (!name || !price) return;

    if (limits.product_limit <= 0) {
      setError('Seu plano atual não permite cadastrar itens no cardápio. Faça upgrade para Destaque ou Premium.');
      return;
    }

    if (usedItems >= limits.product_limit) {
      setError(`Limite atingido: ${usedItems} de ${limits.product_limit} itens usados.`);
      return;
    }

    const it: MenuItem = { id: Date.now().toString(), name, price: Number(price), category: cat };
    setItems((s) => [it, ...s]);
    setName(''); setPrice('');
  }

  function remove(id: string) {
    setItems((s) => s.filter(x => x.id !== id));
  }

  const categories = Array.from(new Set(items.map(i => i.category || ''))).filter(Boolean);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Cardápio {storeSlug ? `(${storeSlug})` : ''}</h2>

      <div className="mb-4 p-3 rounded border bg-blue-50 border-blue-200 text-blue-900 text-sm">
        <div className="font-medium">Plano atual: {limits.plan}</div>
        <div>Itens: {usedItems} de {limits.product_limit} usados</div>
      </div>

      {usedItems > limits.product_limit && limits.product_limit > 0 && (
        <div className="mb-4 p-3 rounded border bg-amber-50 border-amber-200 text-amber-900 text-sm">
          Sua loja está acima do limite do plano atual ({usedItems}/{limits.product_limit}).
          Os itens existentes foram mantidos e apenas novos cadastros ficam bloqueados.
        </div>
      )}

      {limits.product_limit <= 0 && (
        <div className="mb-4 p-3 rounded border bg-amber-50 border-amber-200 text-amber-900 text-sm">
          O Plano Presença é institucional. Para vender com cardápio, faça upgrade para Destaque ou Premium.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded border bg-red-50 border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-4 gap-2">
        <input className="col-span-2 border p-2" placeholder="Nome do item" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="col-span-1 border p-2" placeholder="Preço" value={price} onChange={(e) => setPrice(e.target.value)} />
        <select className="col-span-1 border p-2" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>Lanches</option>
          <option>Pizzas</option>
          <option>Bebidas</option>
        </select>
      </div>
      <div className="mb-4">
        <button disabled={!canAddItem} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400" onClick={add}>Adicionar ao Cardápio</button>
      </div>

      <div className="grid gap-3">
        {categories.map(c => (
          <section key={c}>
            <h3 className="font-medium mt-4 mb-2">{c}</h3>
            <div className="grid gap-2">
              {items.filter(i => i.category === c).map(i => (
                <div key={i.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-sm text-gray-600">R$ {i.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <button className="text-sm text-red-600" onClick={() => remove(i.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
