"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";

export default function AdminIndex() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user) return <div className="p-8">Acesse para continuar.</div>;
  if (profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          Bem-vindo ao Painel Administrativo! 👋
        </h1>
        <p className="text-white/80">
          Gerencie todas as funcionalidades do Portal Modelo
        </p>
      </div>

      {/* Menu de Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/lojas"
          className="bg-[#FDC500] text-black rounded-lg p-6 hover:bg-[#E8B500] transition font-semibold"
        >
          <h3 className="text-lg mb-2">🏪 Gerenciar Lojas</h3>
          <p className="text-black/70 text-sm">Adicionar, editar e remover lojas</p>
        </Link>

        <Link
          href="/admin/noticias"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2">📰 Gerenciar Notícias</h3>
          <p className="text-gray-400 text-sm">Publicar e editar notícias</p>
        </Link>

        <Link
          href="/admin/profissionais"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2">👥 Gerenciar Profissionais</h3>
          <p className="text-gray-400 text-sm">Administrar perfis profissionais</p>
        </Link>

        <Link
          href="/admin/classificados"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2">📋 Gerenciar Classificados</h3>
          <p className="text-gray-400 text-sm">Moderar anúncios</p>
        </Link>

        <Link
          href="/admin/usuarios"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2">👤 Gerenciar Usuários</h3>
          <p className="text-gray-400 text-sm">Administrar contas de usuário</p>
        </Link>

        <Link
          href="/admin/logs"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2">📊 Logs do Sistema</h3>
          <p className="text-gray-400 text-sm">Ver registros de atividades</p>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="bg-white/10 border border-white/20 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">📊 Estatísticas Gerais</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#FDC500]">0</p>
            <p className="text-gray-400 text-sm">Lojas Ativas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#FDC500]">0</p>
            <p className="text-gray-400 text-sm">Usuários</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#FDC500]">0</p>
            <p className="text-gray-400 text-sm">Classificados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#FDC500]">0</p>
            <p className="text-gray-400 text-sm">Notícias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
