"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageBackground from "@/components/PageBackground";
import { useAuth } from "@/lib/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  function handleLogout() {
    signOut().then(() => router.push('/'));
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      <PageBackground />

      <div className="relative z-10 min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/95 border-r border-gray-200 p-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Admin Portal</h2>
            <p className="text-sm text-gray-600">Painel de gerenciamento</p>
          </div>

          <nav className="flex flex-col gap-2">
            <Link href="/admin" className="px-3 py-2 rounded hover:bg-gray-100">Visão geral</Link>
            <Link href="/admin/lojas" className="px-3 py-2 rounded hover:bg-gray-100">Lojas</Link>
            <Link href="/admin/noticias" className="px-3 py-2 rounded hover:bg-gray-100">Notícias</Link>
            <Link href="/admin/classificados" className="px-3 py-2 rounded hover:bg-gray-100">Classificados</Link>
            <Link href="/admin/usuarios" className="px-3 py-2 rounded hover:bg-gray-100">Usuários</Link>
            <Link href="/admin/logs" className="px-3 py-2 rounded hover:bg-gray-100">Logs</Link>
          </nav>

          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-700">{loading ? 'Carregando...' : user ? `Logado: ${user.email}` : 'Não autenticado'}</div>
            <div className="mt-2 flex gap-2">
              <button onClick={handleLogout} className="text-sm px-3 py-1 bg-red-500 text-white rounded">Sair</button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
