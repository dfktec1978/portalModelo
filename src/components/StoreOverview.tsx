"use client";
import React from "react";

export default function StoreOverview({ storeSlug }: { storeSlug?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visão Geral</h2>
      <div className="grid gap-4 grid-cols-3">
        <div className="border rounded p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-gray-600">Anúncios</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-gray-600">Visualizações</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-gray-600">Mensagens</div>
        </div>
      </div>
      <div className="mt-6 text-sm text-gray-600">Resumo rápido da loja {storeSlug ? `(${storeSlug})` : ''} — visitantes, vendas, ações recentes (placeholder).</div>
    </div>
  );
}
