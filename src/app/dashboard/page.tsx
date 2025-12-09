"use client";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email?: string;
  display_name?: string;
  phone?: string;
  role?: string;
  status?: string;
};

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, loading, router]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      console.error("Erro ao deslogar:", error);
      return;
    }
    router.push("/");
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003049] to-[#162f7a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/img/logos/logo.png"
              alt="Portal Modelo"
              width={40}
              height={40}
            />
            <span className="font-bold text-lg">Portal Modelo</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="bg-[#D62828] hover:bg-[#C41E1E] px-4 py-2 rounded text-sm font-semibold"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white/10 border border-white/20 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">Meu Perfil</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Nome</p>
                  <p className="font-semibold">{profile?.display_name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="font-semibold text-xs break-all">{profile?.email || user.email}</p>
                </div>
                <div>
                  <p className="text-gray-400">Telefone</p>
                  <p className="font-semibold">{profile?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tipo</p>
                  <p className="font-semibold capitalize">
                    {profile?.role === "cliente"
                      ? "Cliente"
                      : profile?.role === "logista"
                      ? "Lojista"
                      : profile?.role === "profissional"
                      ? "Profissional"
                      : "Admin"}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/editar-perfil"
                className="mt-6 w-full block text-center bg-[#FDC500] text-black font-semibold py-2 rounded hover:bg-[#E8B500]"
              >
                Editar Perfil
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3">
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
                <h1 className="text-3xl font-bold mb-2">
                  Bem-vindo, {profile?.display_name?.split(" ")[0] || "usuário"}! 👋
                </h1>
                <p className="text-white/80">
                  Você está conectado como{" "}
                  <span className="font-semibold">{user.email}</span>
                </p>
              </div>

              {/* Menu de Ações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.role === "cliente" && (
                  <>
                    <Link
                      href="/classificados/novo"
                      className="bg-[#FDC500] text-black rounded-lg p-6 hover:bg-[#E8B500] transition font-semibold"
                    >
                      <h3 className="text-lg mb-2">➕ Novo Classificado</h3>
                      <p className="text-black/70 text-sm">Publique um novo anúncio</p>
                    </Link>

                    <Link
                      href="/dashboard/meus-classificados"
                      className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
                    >
                      <h3 className="font-bold text-lg mb-2">📋 Meus Classificados</h3>
                      <p className="text-gray-400 text-sm">Gerencie seus anúncios</p>
                    </Link>
                  </>
                )}

                {profile?.role === "logista" && (
                  <>
                    <Link
                      href="/dashboard/minha-loja"
                      className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
                    >
                      <h3 className="font-bold text-lg mb-2">🏪 Minha Loja</h3>
                      <p className="text-gray-400 text-sm">Gerenciar informações</p>
                    </Link>

                    <Link
                      href="/dashboard/pedidos"
                      className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
                    >
                      <h3 className="font-bold text-lg mb-2">📦 Pedidos</h3>
                      <p className="text-gray-400 text-sm">Ver vendas recentes</p>
                    </Link>
                  </>
                )}

                {profile?.role === "profissional" && (
                  <>
                    <Link
                      href="/dashboard/meu-perfil-profissional"
                      className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
                    >
                      <h3 className="font-bold text-lg mb-2">👤 Perfil Profissional</h3>
                      <p className="text-gray-400 text-sm">Editar especialidades</p>
                    </Link>

                    <Link
                      href="/dashboard/meus-clientes"
                      className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
                    >
                      <h3 className="font-bold text-lg mb-2">👥 Meus Clientes</h3>
                      <p className="text-gray-400 text-sm">Ver histórico</p>
                    </Link>
                  </>
                )}

                {/* Common for all */}
                <Link
                  href="/noticias"
                  className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
                >
                  <h3 className="font-bold text-lg mb-2">📰 Notícias</h3>
                  <p className="text-gray-400 text-sm">Fique atualizado</p>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">📊 Estatísticas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#FDC500]">0</p>
                    <p className="text-gray-400 text-sm">Anúncios</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#FDC500]">0</p>
                    <p className="text-gray-400 text-sm">Visualizações</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#FDC500]">0</p>
                    <p className="text-gray-400 text-sm">Mensagens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#FDC500]">0</p>
                    <p className="text-gray-400 text-sm">Favoritos</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
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
