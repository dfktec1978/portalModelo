"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import Image from "next/image";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  // Proteção: redirecionar se não estiver logado ou não for admin
  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }
    }
  }, [user, loading, profile, profileLoading, router]);

  // Mostrar loading enquanto verifica
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#003049] to-[#162f7a]">
        <div className="text-white">Verificando permissões...</div>
      </div>
    );
  }

  // Não renderizar conteúdo se não for admin
  if (!user || profile?.role !== "admin") {
    return null;
  }

  function handleLogout() {
    signOut().then(() => router.push('/'));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003049] to-[#162f7a] text-white">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white/10 border border-white/20 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">Painel Admin</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Nome</p>
                  <p className="font-semibold">{profile?.display_name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="font-semibold text-xs break-all">{profile?.email || user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tipo</p>
                  <p className="font-semibold">Administrador</p>
                </div>
              </div>

              {/* Botão Editar Perfil */}
              <Link 
                href="/admin/editar-perfil" 
                className="mt-4 block w-full bg-[#FDC500] hover:bg-[#E8B500] text-black font-semibold text-center py-2 rounded transition"
              >
                Editar Perfil
              </Link>

              {/* Administrador não precisa do Dashboard do lojista */}
            </div>

            <nav className="mt-6 space-y-2">
              <Link href="/admin" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">📊 Visão Geral</h3>
                <p className="text-gray-400 text-sm">Painel principal</p>
              </Link>
              <Link href="/admin/lojas" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">🏪 Lojas</h3>
                <p className="text-gray-400 text-sm">Gerenciar lojas</p>
              </Link>
              <Link href="/admin/planos" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">💳 Planos</h3>
                <p className="text-gray-400 text-sm">Gerenciar preços e limites</p>
              </Link>
              <Link href="/admin/noticias" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">📰 Notícias</h3>
                <p className="text-gray-400 text-sm">Gerenciar notícias</p>
              </Link>
              <Link href="/admin/profissionais" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">👥 Profissionais</h3>
                <p className="text-gray-400 text-sm">Gerenciar profissionais</p>
              </Link>
              <Link href="/admin/classificados" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">📋 Classificados</h3>
                <p className="text-gray-400 text-sm">Gerenciar anúncios</p>
              </Link>
              <Link href="/admin/usuarios" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">👤 Usuários</h3>
                <p className="text-gray-400 text-sm">Gerenciar usuários</p>
              </Link>
              <Link href="/admin/vitrines" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">🧩 Vitrines</h3>
                <p className="text-gray-400 text-sm">Planos Grátis e LandingPage</p>
              </Link>
              <Link href="/admin/cobrancas" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">💰 Cobranças</h3>
                <p className="text-gray-400 text-sm">Boletos e mensalidades</p>
              </Link>
              <Link href="/admin/configuracoes" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">⚙️ Configurações</h3>
                <p className="text-gray-400 text-sm">Configurações do sistema</p>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
