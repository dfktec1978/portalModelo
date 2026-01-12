"use client";
import React from "react";

export default function StoreFinanceModule({ storeSlug }: { storeSlug?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Financeiro</h2>
      <div className="text-sm text-gray-600">Relatórios financeiros e saldo da loja {storeSlug ?? '(nenhuma selecionada)'} — placeholder.</div>
    </div>
  );
}
