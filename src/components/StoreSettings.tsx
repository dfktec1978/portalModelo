"use client";
import React from "react";

export default function StoreSettings({ storeSlug }: { storeSlug?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Configurações</h2>
      <div className="text-sm text-gray-600">Ajustes gerais da loja {storeSlug ?? '(nenhuma selecionada)'} — dados de contato, horário, taxas (placeholder).</div>
    </div>
  );
}
