"use client";
import React from "react";

export default function StoreOverview({ storeSlug }: { storeSlug?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visão Geral</h2>
      <div className="text-sm text-gray-600">Resumo rápido da loja {storeSlug ? `(${storeSlug})` : ''} — visitantes, vendas, ações recentes (placeholder).</div>
    </div>
  );
}
