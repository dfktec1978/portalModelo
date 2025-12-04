"use client";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

export default function AdminIndex() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!user) return <div className="p-8">Acesse para continuar.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Painel Administrativo</h1>
      <p className="text-gray-600 mb-6">Acesse as ferramentas de gerenciamento abaixo.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        <Link href="/admin/lojas" className="block p-4 bg-white rounded shadow">Gerenciar Lojas</Link>
        <Link href="/admin/noticias" className="block p-4 bg-white rounded shadow">Gerenciar Notícias</Link>
        <Link href="/admin/classificados" className="block p-4 bg-white rounded shadow">Gerenciar Classificados</Link>
        <Link href="/admin/usuarios" className="block p-4 bg-white rounded shadow">Gerenciar Usuários</Link>
        <Link href="/admin/logs" className="block p-4 bg-white rounded shadow">Logs</Link>
      </div>
    </div>
  );
}
