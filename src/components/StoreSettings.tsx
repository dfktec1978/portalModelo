"use client";
import React from "react";

export default function StoreSettings({ storeSlug }: { storeSlug?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Configurações</h2>
      <div className="text-sm text-gray-600">Configurações da loja {storeSlug ?? '(nenhuma selecionada)'} — nome, horário, pagamento, integrações (placeholder).</div>
    </div>
  );
}
