"use client";
import Link from "next/link";
import PageBackground from "@/components/PageBackground";

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-transparent">
    {/* Imagem de fundo fixa na área visível (igual à página inicial) */}
    <PageBackground />

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 py-8 px-4">
        {/* Sidebar */}
        <aside className="col-span-3 bg-white rounded-md shadow p-4 h-[80vh] sticky top-8">
          <h2 className="text-xl font-bold mb-4">Início</h2>
          <nav className="flex flex-col gap-2 text-sm text-gray-700">
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Início</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Estatísticas</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Vendas</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Produtos</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Chat</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Clientes</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Marketing</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Loja online</Link>
            <Link href="#" className="px-3 py-2 rounded hover:bg-gray-100">Ponto de venda</Link>
            <Link href="/configuracoes" className="px-3 py-2 rounded hover:bg-gray-100">Configurações</Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="col-span-9">
          <div className="bg-white/90 rounded-md shadow p-6 mb-6">
            <h1 className="text-2xl font-bold">Painel do lojista</h1>
            <p className="text-gray-600 mt-2">Visão geral rápida — métricas, vendas e atalhos.</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/90 rounded-md shadow p-4">Métricas 1</div>
            <div className="bg-white/90 rounded-md shadow p-4">Métricas 2</div>
            <div className="bg-white/90 rounded-md shadow p-4">Métricas 3</div>
          </div>
        </main>
      </div>
    </div>
  );
}
