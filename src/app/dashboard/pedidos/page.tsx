"use client";
import React from "react";

export default function DashboardPedidosPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
        <p className="text-white/80">Lista de pedidos do lojista</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-[#FDC500]">0</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">0</p>
          <p className="text-gray-400 text-sm">Pendentes</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">0</p>
          <p className="text-gray-400 text-sm">Concluídos</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-400">Lista de pedidos do lojista (esqueleto).</p>
      </div>
    </div>
  );
}
