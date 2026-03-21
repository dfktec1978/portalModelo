"use client";
import React, { useState } from "react";
import { resolveStoreLimits } from "@/lib/storePlans";

type Product = { id: string; name: string; price: number; photosCount: number };

export default function StoreProductsModule({ storeSlug, store }: { storeSlug?: string; store?: any }) {
  const [products, setProducts] = useState<Product[]>([
    { id: 'p1', name: 'Camiseta Básica', price: 59.9, photosCount: 1 },
    { id: 'p2', name: 'Tênis Casual', price: 199.0, photosCount: 2 },
  ]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [photosCount, setPhotosCount] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const limits = resolveStoreLimits(store);
  const usedProducts = products.length;
  const canAddProduct = limits.product_limit > 0 && usedProducts < limits.product_limit;

  function add() {
    setError(null);
    if (!name || !price) return;

    if (limits.product_limit <= 0) {
      setError('Seu plano atual não permite cadastrar produtos. Faça upgrade para Destaque ou Premium.');
      return;
    }

    if (usedProducts >= limits.product_limit) {
      setError(`Limite atingido: ${usedProducts} de ${limits.product_limit} produtos usados.`);
      return;
    }

    const parsedPhotosCount = Math.max(1, Number(photosCount || '1'));
    if (parsedPhotosCount > limits.photo_limit) {
      setError(`Limite de fotos por produto: máximo de ${limits.photo_limit} fotos no seu plano.`);
      return;
    }

    const p: Product = { id: Date.now().toString(), name, price: Number(price), photosCount: parsedPhotosCount };
    setProducts((s) => [p, ...s]);
    setName('');
    setPrice('');
    setPhotosCount('1');
  }

  function remove(id: string) {
    setProducts((s) => s.filter(x => x.id !== id));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Produtos {storeSlug ? `(${storeSlug})` : ''}</h2>

      <div className="mb-4 p-3 rounded border bg-blue-50 border-blue-200 text-blue-900 text-sm">
        <div className="font-medium">Plano atual: {limits.plan}</div>
        <div>Produtos: {usedProducts} de {limits.product_limit} usados</div>
        <div>Fotos por produto: até {limits.photo_limit}</div>
      </div>

      {limits.product_limit <= 0 && (
        <div className="mb-4 p-3 rounded border bg-amber-50 border-amber-200 text-amber-900 text-sm">
          O Plano Presença é institucional. Para loja virtual, faça upgrade para Destaque (70) ou Premium (300).
        </div>
      )}

      {usedProducts > limits.product_limit && limits.product_limit > 0 && (
        <div className="mb-4 p-3 rounded border bg-amber-50 border-amber-200 text-amber-900 text-sm">
          Sua loja está acima do limite do plano atual ({usedProducts}/{limits.product_limit}).
          Os produtos existentes foram mantidos no banco e apenas novos cadastros ficam bloqueados.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded border bg-red-50 border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-4 gap-2">
        <input className="col-span-1 border p-2" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="col-span-1 border p-2" placeholder="Preço" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input
          type="number"
          min={1}
          max={limits.photo_limit}
          className="col-span-1 border p-2"
          placeholder="Fotos"
          value={photosCount}
          onChange={(e) => setPhotosCount(e.target.value)}
        />
        <button disabled={!canAddProduct} className="col-span-1 bg-blue-600 text-white px-4 rounded disabled:bg-gray-400" onClick={add}>Adicionar</button>
      </div>

      <div className="grid gap-3">
        {products.map(p => (
          <div key={p.id} className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">R$ {p.price.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Fotos: {p.photosCount}</div>
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
