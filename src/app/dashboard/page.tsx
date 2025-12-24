"use client";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

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
    <div>
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo, {profile?.display_name?.split(" ")[0] || "usuário"}! 👋
          </h1>
          <p className="text-white/80">
            Você está conectado como <span className="font-semibold">{user.email}</span>
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

          {profile?.role === "lojista" && (
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

          {profile?.role === "admin" && (
            <>
              <Link
                href="/admin"
                className="bg-[#FDC500] text-black rounded-lg p-6 hover:bg-[#E8B500] transition font-semibold"
              >
                <h3 className="text-lg mb-2">⚙️ Painel Administrativo</h3>
                <p className="text-black/70 text-sm">Gerenciar o sistema</p>
              </Link>

              <Link
                href="/admin/lojas"
                className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
              >
                <h3 className="font-bold text-lg mb-2">🏪 Gerenciar Lojas</h3>
                <p className="text-gray-400 text-sm">Administração de lojas</p>
              </Link>

              <Link
                href="/admin/noticias"
                className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
              >
                <h3 className="font-bold text-lg mb-2">📰 Gerenciar Notícias</h3>
                <p className="text-gray-400 text-sm">Publicar conteúdo</p>
              </Link>

              <Link
                href="/admin/usuarios"
                className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
              >
                <h3 className="font-bold text-lg mb-2">👤 Gerenciar Usuários</h3>
                <p className="text-gray-400 text-sm">Administração de contas</p>
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
    </div>
  );
}
