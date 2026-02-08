"use client";
import React, { useState } from "react";

type Product = { id: string; name: string; price: number };

export default function StoreProductsModule({ storeSlug }: { storeSlug?: string }) {
  const [products, setProducts] = useState<Product[]>([
    { id: 'p1', name: 'Camiseta Básica', price: 59.9 },
    { id: 'p2', name: 'Tênis Casual', price: 199.0 },
  ]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  function add() {
    if (!name || !price) return;
    const p: Product = { id: Date.now().toString(), name, price: Number(price) };
    setProducts((s) => [p, ...s]);
    setName('');
    setPrice('');
  }

  function remove(id: string) {
    setProducts((s) => s.filter(x => x.id !== id));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Produtos {storeSlug ? `(${storeSlug})` : ''}</h2>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <input className="col-span-1 border p-2" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="col-span-1 border p-2" placeholder="Preço" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className="col-span-1 bg-blue-600 text-white px-4 rounded" onClick={add}>Adicionar</button>
      </div>

      <div className="grid gap-3">
        {products.map(p => (
          <div key={p.id} className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">R$ {p.price.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-red-600" onClick={() => remove(p.id)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
