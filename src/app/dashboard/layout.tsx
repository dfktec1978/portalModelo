"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    (async () => {
      try {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle?.();
        const profileData = (p as any) || null;
        if (mounted) setProfile(profileData);

        // Only fetch store if the profile is a lojista
        if (profileData?.role === "lojista") {
          const { data: stores } = await supabase.from("stores").select("*").eq("owner_id", user.id);
          if (mounted) setStore((stores && (stores as any)[0]) || null);
        }
      } catch (e) {
        console.error("Erro ao carregar perfil/loja:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading || (!user && !profile)) {
    return <div className="p-6">Carregando...</div>;
  }

  // Allow all authenticated profiles to access the dashboard.

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003049] to-[#162f7a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1">
            <div className="bg-white/10 border border-white/20 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">Meu Perfil</h3>
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
                  <p className="text-gray-400">Telefone</p>
                  <p className="font-semibold">{profile?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tipo</p>
                  <p className="font-semibold capitalize">{profile?.role || "—"}</p>
                </div>
              </div>

              <a
                href="/dashboard/editar-perfil"
                className="mt-6 w-full block text-center bg-[#FDC500] text-black font-semibold py-2 rounded hover:bg-[#E8B500]"
              >
                Editar Perfil
              </a>
            </div>

            <div className="mt-6 space-y-2">
              <a href="/dashboard" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">Visão geral</h3>
                <p className="text-gray-400 text-sm">Painel principal</p>
              </a>
              <a href="/dashboard/produtos" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">Produtos</h3>
                <p className="text-gray-400 text-sm">Gerenciar produtos</p>
              </a>
              <a href="/dashboard/pedidos" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">Pedidos</h3>
                <p className="text-gray-400 text-sm">Ver vendas</p>
              </a>
              <a href="/dashboard/configuracoes" className="block bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg p-4 transition">
                <h3 className="font-bold text-lg mb-2">Configurações</h3>
                <p className="text-gray-400 text-sm">Ajustes da conta</p>
              </a>
            </div>

            {store && (
              <div className="mt-6 text-sm text-gray-400">
                <div className="font-semibold">Loja:</div>
                <div className="flex items-center gap-3 mt-2">
                  <a href={`/lojas/${store.id}`} className="w-16 h-16 bg-white/5 rounded overflow-hidden flex-shrink-0 block" target="_blank" rel="noreferrer">
                    <img
                      src={store.logo_url || store.image || store.cover || '/img/logos/logo.png'}
                      alt={store.store_name || store.name || 'Loja'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </a>
                  <div>
                    <a href={`/lojas/${store.id}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">{store.store_name || store.name || "Sem nome"}</a>
                    <div className="text-xs text-gray-400">Status: {store.status || "--"}</div>
                    <div className="text-xs text-gray-400">{store.city ? `${store.city} — ${store.state || ''}` : ''}</div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <main className="md:col-span-3 bg-white/5 p-6 rounded-lg">{children}</main>
        </div>
      </div>
    </div>
  );
}
