"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import StorePanelSidebar from "@/components/StorePanelSidebar";
import StoreAppearance from "@/components/StoreAppearance";
import StoreModuleProducts from "@/components/StoreModuleProducts";
import StoreModuleMenu from "@/components/StoreModuleMenu";
import StoreOverview from "@/components/StoreOverview";
import StoreOrdersModule from "@/components/StoreOrdersModule";
import StoreFinanceModule from "@/components/StoreFinanceModule";
import StoreSettings from "@/components/StoreSettings";
import StoreModuleSchedule from "@/components/StoreModuleSchedule";
import StoreModuleStock from "@/components/StoreModuleStock";
import StoreModuleAdditionals from "@/components/StoreModuleAdditionals";
import StoreModuleCategories from "@/components/StoreModuleCategories";
import StoreModulePizzaFlavors from "@/components/StoreModulePizzaFlavors";
import StoreModuleVariants from "@/components/StoreModuleVariants";
import ProfileEditorPanel from "@/components/ProfileEditorPanel";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'overview'|'orders'|'finance'|'appearance'|'settings'|'products'|'menu'|'profile'|'schedule'|'stock'|'additionals'|'categories'|'pizza-flavors'|'variants'>('overview');
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);
  const [stores, setStores] = useState<Array<any>>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [creatingStore, setCreatingStore] = useState(false);

  // Redirecionar se não autenticado ou se for admin
  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Admin deve usar apenas o painel administrativo
    if (profile?.role === "admin") {
      router.push("/admin");
      return;
    }
    
    // Regras por role
    if (profile?.role === "lojista") {
      // Lojista só pode prosseguir se estiver active ou pending
      if (
        profile?.status &&
        !["active", "pending"].includes(profile.status)
      ) {
        router.push("/");
        return;
      }
    } else if (profile?.role === "cliente") {
      // Cliente precisa estar ativo
      if (profile?.status && profile.status !== "active") {
        router.push("/");
        return;
      }
    } else {
      // Qualquer outro role volta para home
      router.push("/");
      return;
    }
  }, [loading, profileLoading, user, profile, router]);

  useEffect(() => {
    const paramView = searchParams?.get('view');
    if (!paramView) return;
    const allowedViews = ['overview','orders','finance','appearance','settings','products','menu','profile','schedule','stock','additionals','categories','pizza-flavors','variants'];
    if (allowedViews.includes(paramView)) {
      setView(paramView as any);
    }
  }, [searchParams]);

  // Carregar lojas do lojista logado
  useEffect(() => {
    let mounted = true;
    let subscription: any;

    (async () => {
      try {
        if (!user) return;
        
        // Validar que o usuário é lojista
        if (profile?.role !== 'lojista') {
          if (mounted) setDashboardLoading(false);
          return;
        }

        const { data } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id);
        if (!mounted) return;
        
        // Lojas que não estejam bloqueadas (permitir pending/active)
        const storesList = ((data as any[]) || [])
          .filter(s => s.status !== 'blocked')
          .map(s => ({
            ...s,
            name: s.store_name || s.name,
            slug: s.slug || s.id,
            logo: s.logo_url || s.logo || null
          }));
        
        setStores(storesList);
        
        if (storesList.length === 1 && !selectedStoreSlug) {
          setSelectedStoreSlug(storesList[0].slug || storesList[0].id);
        }

        // Subscrever a mudanças em tempo real (quando loja é aprovada, etc)
        subscription = supabase
          .channel(`stores-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'stores',
              filter: `owner_id=eq.${user.id}`
            },
            (payload: any) => {
              console.log('📡 Mudança detectada na loja:', payload);
              // Recarregar lojas quando houver mudança
              if (mounted) {
                setStores(prev => {
                  const updated = [...prev];
                  if (payload.eventType === 'DELETE') {
                    return updated.filter(s => s.id !== payload.old.id);
                  }
                  const idx = updated.findIndex(s => s.id === (payload.new?.id || payload.old?.id));
                  if (idx >= 0) {
                    updated[idx] = {
                      ...payload.new,
                      name: payload.new.store_name || payload.new.name,
                      slug: payload.new.slug || payload.new.id,
                      logo: payload.new.logo_url || payload.new.logo || null
                    };
                  } else if (payload.eventType === 'INSERT') {
                    updated.push({
                      ...payload.new,
                      name: payload.new.store_name || payload.new.name,
                      slug: payload.new.slug || payload.new.id,
                      logo: payload.new.logo_url || payload.new.logo || null
                    });
                  }
                  return updated;
                });
              }
            }
          )
          .subscribe();

      } catch (e) {
        console.warn('failed fetch stores', e);
      } finally {
        if (mounted) setDashboardLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [user, profile]);

  // Carregar loja selecionada
  useEffect(() => {
    let mounted = true;
    if (!selectedStoreSlug) {
      setStore(null);
      return;
    }
    (async () => {
      try {
        // Buscar loja por ID (stores não tem coluna slug)
        const { data } = await supabase
          .from('stores')
          .select('*')
          .or(`slug.eq.${selectedStoreSlug},id.eq.${selectedStoreSlug}`)
          .maybeSingle();
        
        if (!mounted) return;
        const st = (data as any) || null;
        const storeData = st ? { 
          ...st, 
          name: st.store_name || st.name, 
          slug: st.slug || st.id, 
          logo: st.logo_url || st.logo || null 
        } : null;
        setStore(storeData);
      } catch (e) {
        console.warn("failed fetch store", e);
      }
    })();
    return () => { mounted = false; };
  }, [selectedStoreSlug]);

  const createDemoStore = async () => {
    if (!user || creatingStore) return;
    setCreatingStore(true);
    try {
      const res = await fetch('/api/vincular-loja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (data.success && data.stores?.length > 0) {
        setStores(data.stores);
        setSelectedStoreSlug(data.stores[0].slug);
      }
    } catch (e) {
      console.error('Erro ao criar loja:', e);
    } finally {
      setCreatingStore(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar autenticação e role - impedir renderização se não passou na validação
  const allowedStatuses = ["active", "pending"];
  const isLojista = profile?.role === "lojista";
  const isCliente = profile?.role === "cliente";

  if (!user) {
    return null;
  }

  if (isLojista && !allowedStatuses.includes(profile?.status || "")) {
    return null;
  }

  if (isCliente && profile?.status !== "active") {
    return null;
  }

  if (dashboardLoading && isLojista) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Verificar se é lojista com status pending
  const isPendingApproval = profile?.role === "lojista" && profile?.status === "pending";

  // Dashboard do cliente (simples)
  if (isCliente) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Meu Painel</h1>
            <p className="text-gray-600 mt-1">Bem-vindo! Aqui você pode atualizar seu perfil e publicar classificados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Publicar Classificado</h2>
                <p className="text-sm text-gray-600 mt-1">Crie um novo anúncio em poucos passos.</p>
              </div>
              <Link
                href="/classificados"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-500"
              >
                📢 Ir para Classificados
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900">Editar Perfil</h2>
              <p className="text-sm text-gray-600 mt-1">Atualize seus dados pessoais.</p>
              <div className="mt-4">
                <ProfileEditorPanel user={user} store={null} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        <StorePanelSidebar 
          view={view} 
          setView={setView} 
          selectedStoreSlug={selectedStoreSlug}
          setSelectedStoreSlug={setSelectedStoreSlug}
          user={user}
          store={store}
        />
        <main className="flex-1 bg-white p-6 rounded shadow text-gray-900">
          {isPendingApproval ? (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg className="mx-auto h-24 w-24 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Cadastro em Análise
                </h1>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Seu cadastro como lojista foi enviado para aprovação. Nossa equipe está analisando seus dados e em breve você receberá um e-mail com a confirmação.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-xl mx-auto text-left">
                  <h3 className="font-semibold text-blue-900 mb-3">📋 Próximos passos:</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">✓</span>
                      <span>Aguarde o e-mail de aprovação (geralmente em até 24 horas)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">✓</span>
                      <span>Após aprovação, você terá acesso completo ao painel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">✓</span>
                      <span>Poderá cadastrar produtos, gerenciar pedidos e configurar sua loja</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <p className="text-sm text-gray-500">
                    E-mail cadastrado: <strong className="text-gray-900">{user.email}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Dúvidas? Entre em contato pelo WhatsApp: <strong className="text-green-600">(49) 98923-2307</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">
                    {store ? `Painel - ${store.name}` : 'Painel da Loja'}
                  </h1>
                  {store && (
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-sm text-gray-600">
                        <a 
                          href={`/lojas/${store.slug}`} 
                          target="_blank" 
                          className="text-blue-600 hover:underline"
                        >
                          /lojas/{store.slug}
                        </a>
                      </p>
                      {store.status === 'active' && (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Ativa
                        </span>
                      )}
                      {store.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-sm text-yellow-600">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Pendente
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView('overview')}
                    className={`px-3 py-2 rounded text-sm font-semibold border ${view === 'overview' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    Visão geral
                  </button>
                  <button
                    onClick={() => setView('profile')}
                    className={`px-3 py-2 rounded text-sm font-semibold border ${view === 'profile' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    Perfil
                  </button>
                </div>
              </header>
              <section>
                {view === 'overview' && (
                  <div className="space-y-6">
                    <StoreOverview store={store} />
                    <StoreOrdersModule store={store} />
                    <StoreFinanceModule store={store} />
                    <StoreAppearance store={store} onStoreUpdated={setStore} />
                  </div>
                )}
                {view === 'products' && (
                  <StoreModuleProducts store={store} />
                )}
                {view === 'menu' && (
                  <StoreModuleMenu store={store} />
                )}
                {view === 'profile' && (
                  <ProfileEditorPanel user={user} store={store} onStoreUpdated={setStore} />
                )}
                {view === 'orders' && (
                  <StoreOrdersModule store={store} />
                )}
                {view === 'finance' && (
                  <StoreFinanceModule store={store} />
                )}
                {view === 'appearance' && (
                  <StoreAppearance store={store} onStoreUpdated={setStore} />
                )}
                {view === 'settings' && (
                  <StoreSettings store={store} />
                )}
                {view === 'schedule' && (
                  <StoreModuleSchedule store={store} />
                )}
                {view === 'stock' && (
                  <StoreModuleStock
                    store={store}
                    onOpenVariantsAction={() => setView('variants')}
                  />
                )}
                {view === 'additionals' && (
                  <StoreModuleAdditionals store={store} />
                )}
                {view === 'categories' && (
                  <StoreModuleCategories store={store} />
                )}
                {view === 'pizza-flavors' && (
                  <StoreModulePizzaFlavors store={store} />
                )}
                {view === 'variants' && (
                  <StoreModuleVariants store={store} />
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
