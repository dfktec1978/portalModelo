"use client";

import React from "react";
import StoreEditor from "@/components/StoreEditor";

export default function CriarLojaPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#003049] mb-4">Criar sua loja</h1>
        <p className="text-sm text-gray-600 mb-6">Preencha os dados abaixo para criar sua loja no Portal Modelo. Você poderá editar o conteúdo depois no painel.</p>
        <StoreEditor />
      </div>
    </div>
  );
}
