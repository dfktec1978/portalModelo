"use client";
import React from "react";

export default function StoreOrdersModule({ storeSlug }: { storeSlug?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pedidos</h2>
      <div className="text-sm text-gray-600">Lista de pedidos para a loja {storeSlug ?? '(nenhuma selecionada)'} — em desenvolvimento (placeholder).</div>
    </div>
  );
}
