"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminIndex() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [pendingStores, setPendingStores] = useState(0);
  const [pendingProfiles, setPendingProfiles] = useState(0);

  useEffect(() => {
    async function loadPendingCounts() {
      // Buscar lojas pendentes
      const { count: storesCount, error: storesError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      console.log('🔍 Lojas pendentes count:', storesCount, 'error:', storesError);
      
      if (!storesError && storesCount !== null) {
        setPendingStores(storesCount);
      }

      // Buscar perfis de lojistas pendentes
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'lojista')
        .eq('status', 'pending');
      
      console.log('🔍 Perfis de lojistas pendentes count:', profilesCount, 'error:', profilesError);
      
      if (!profilesError && profilesCount !== null) {
        setPendingProfiles(profilesCount);
      }
    }
    if (user) loadPendingCounts();
  }, [user]);

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user) return <div className="p-8">Acesse para continuar.</div>;
  if (profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  return (
    <div className="space-y-6">
      {/* Notificação de Perfis de Lojistas Pendentes */}
      {pendingProfiles > 0 && (
        <div className="bg-orange-500 text-white rounded-lg p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">👤 Lojistas Aguardando Aprovação</h3>
            <p className="text-white/90">
              {pendingProfiles} {pendingProfiles === 1 ? 'pessoa está' : 'pessoas estão'} aguardando aprovação para se tornar lojista.
            </p>
          </div>
          <Link
            href="/admin/usuarios"
            className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Ver Usuários
          </Link>
        </div>
      )}

      {/* Notificação de Lojas Pendentes */}
      {pendingStores > 0 && (
        <div className="bg-yellow-500 text-black rounded-lg p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">🏪 Lojas Aguardando Aprovação</h3>
            <p className="text-black/80">
              {pendingStores} {pendingStores === 1 ? 'loja está' : 'lojas estão'} aguardando aprovação para publicação.
            </p>
          </div>
          <Link
            href="/admin/lojas"
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Ver Lojas
          </Link>
        </div>
      )}

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
          className="bg-[#FDC500] text-black rounded-lg p-6 hover:bg-[#E8B500] transition font-semibold shadow-lg"
        >
          <h3 className="text-lg mb-2 font-bold text-black">🏪 Gerenciar Lojas</h3>
          <p className="text-black/80 text-sm font-medium">Adicionar, editar e remover lojas</p>
        </Link>

        <Link
          href="/admin/planos"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">💳 Gerenciar Planos</h3>
          <p className="text-gray-300 text-sm">Ajustar preços, limites e prioridade</p>
        </Link>

        <Link
          href="/admin/cobrancas"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">💰 Cobranças Mensais</h3>
          <p className="text-gray-300 text-sm">Boletos, pendências e pagamentos dos lojistas</p>
        </Link>

        <Link
          href="/admin/vitrines"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">🧩 Vitrines Grátis/Landing</h3>
          <p className="text-gray-300 text-sm">Gerencie campos institucionais dos planos Grátis e LandingPage</p>
        </Link>

        <Link
          href="/admin/noticias"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">📰 Gerenciar Notícias</h3>
          <p className="text-gray-300 text-sm">Publicar e editar notícias</p>
        </Link>

        <Link
          href="/admin/profissionais"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">👥 Gerenciar Profissionais</h3>
          <p className="text-gray-300 text-sm">Administrar perfis profissionais</p>
        </Link>

        <Link
          href="/admin/classificados"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">📋 Gerenciar Classificados</h3>
          <p className="text-gray-300 text-sm">Moderar anúncios</p>
        </Link>

        <Link
          href="/admin/usuarios"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">👤 Gerenciar Usuários</h3>
          <p className="text-gray-300 text-sm">Administrar contas de usuário</p>
        </Link>

        <Link
          href="/admin/configuracoes"
          className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-6 transition"
        >
          <h3 className="font-bold text-lg mb-2 text-white">⚙️ Configurações</h3>
          <p className="text-gray-300 text-sm">Configurações do sistema</p>
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
