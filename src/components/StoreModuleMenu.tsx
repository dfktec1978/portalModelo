"use client";
import React, { useEffect, useState } from "react";

type Props = { storeSlug: string };

export default function StoreModuleMenu({ storeSlug }: Props) {
  const [items, setItems] = useState<Array<any>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/cardapio?store=${storeSlug}`);
        const j = await res.json();
        if (!mounted) return;
        setItems(j.items || []);
      } catch (e) {
        setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, [storeSlug]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cardápio</h3>
        <button className="px-3 py-1 bg-green-600 text-white rounded">Adicionar</button>
      </div>

      {items.length === 0 ? (
        <div className="p-4 border rounded bg-white text-gray-900">Nenhum item no cardápio ainda.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it: any) => (
            <li key={it.id} className="border rounded p-3 flex justify-between bg-white text-gray-900">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-gray-600">{it.description}</div>
              </div>
              <div className="text-right">R$ {it.price}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
