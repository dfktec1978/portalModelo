"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Props = {
  view: string;
  setView: (v: 'overview'|'orders'|'finance'|'appearance'|'settings'|'products'|'menu'|'profile'|'schedule'|'stock'|'additionals'|'categories'|'pizza-flavors'|'variants') => void;
  selectedStoreSlug?: string | null;
  setSelectedStoreSlug?: (s: string | null) => void;
  user?: any;
  store?: any;
};

export default function StorePanelSidebar({ view, setView, selectedStoreSlug, setSelectedStoreSlug, user, store }: Props) {
  const [stores, setStores] = useState<Array<any>>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        console.log('🔍 StorePanelSidebar: Buscando lojas para user.id:', user.id);
        const { data, error } = await supabase
          .from('stores')
          .select('id, store_name, phone, address, status')
          .eq('owner_id', user.id);
        
        if (error) {
          console.error('❌ Erro ao buscar lojas:', error);
          return;
        }
        
        console.log('📊 Lojas retornadas do banco:', data?.length || 0, data);
        
        if (!mounted) return;
        
        // Filtrar apenas lojas ativas ou pendentes
        const filteredData = (data as any[]) || [];
        const arr = filteredData
          .filter(s => s.status !== 'blocked')
          .map(s => ({
            ...s,
            name: s.store_name,
            slug: s.id
          }));
        
        console.log('✅ Lojas após filtro (não bloqueadas):', arr.length, arr);
        setStores(arr);
        
        if (arr.length === 1 && setSelectedStoreSlug) {
          console.log('🎯 Selecionando loja automaticamente:', arr[0].id);
          setSelectedStoreSlug(arr[0].id);
        }
      } catch (e) {
        console.error('💥 Erro na busca de lojas:', e);
      }
    })();
    return () => { mounted = false; };
  }, [user, setSelectedStoreSlug]);

  // Carregar perfil do usuário
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabaseClient");
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (mounted && data) setProfile(data);
      } catch (e) {
        console.warn('failed fetch profile', e);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Carregar loja selecionada
  useEffect(() => {
    if (!selectedStoreSlug) {
      setSelectedStore(null);
      return;
    }
    const store = stores.find(s => s.slug === selectedStoreSlug);
    setSelectedStore(store || null);
  }, [selectedStoreSlug, stores]);

  return (
    <aside className="w-64 flex flex-col gap-4">
      {/* Card Meu Perfil */}
      <div className="bg-slate-700 text-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Meu Perfil</h2>
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Nome</div>
            <div className="font-medium">{profile?.display_name || 'Carregando...'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">E-mail</div>
            <div className="font-medium text-xs">{user?.email || 'Carregando...'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Telefone</div>
            <div className="font-medium">{profile?.phone || '(Não informado)'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Tipo</div>
            <div className="font-medium capitalize">{profile?.role || 'Lojista'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setView('profile')}
          className="mt-4 w-full bg-[#FDC500] text-black text-center font-semibold py-2 rounded hover:bg-[#E8B500] transition"
        >
          Editar Perfil
        </button>
      </div>

      {/* Card Painel */}
      <div className="bg-slate-800 text-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Painel</h2>
        
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1">Loja</label>
          {stores.length <= 1 ? (
            <div className="w-full bg-slate-700 text-white border border-slate-600 rounded p-2 text-sm">
              {stores[0]?.name || 'Nenhuma loja vinculada'}
            </div>
          ) : (
            <select 
              value={selectedStoreSlug ?? ''} 
              onChange={(e) => setSelectedStoreSlug && setSelectedStoreSlug(e.target.value)} 
              className="w-full bg-slate-700 text-white border border-slate-600 rounded p-2 text-sm"
            >
              <option value="">(Selecionar loja)</option>
              {stores.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
            </select>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {/* Módulos Universais (sempre visíveis) */}
          <button className={`text-left p-2 rounded text-sm ${view === 'overview' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('overview')}>
            📊 Visão Geral
          </button>
          <button className={`text-left p-2 rounded text-sm ${view === 'orders' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('orders')}>
            📦 Pedidos
          </button>
          <button className={`text-left p-2 rounded text-sm ${view === 'finance' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('finance')}>
            💰 Financeiro
          </button>
          
          {/* Divisor */}
          <div className="border-t border-slate-600 my-2"></div>
          
          {/* Módulos Adaptativos por Categoria */}
          {store?.category === 'alimentacao' ? (
            <>
              <button className={`text-left p-2 rounded text-sm ${view === 'menu' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('menu')}>
                🍔 Cardápio
              </button>
              <button className={`text-left p-2 rounded text-sm ${view === 'additionals' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('additionals')}>
                ➕ Adicionais
              </button>
              <button className={`text-left p-2 rounded text-sm ${view === 'categories' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('categories')}>
                📂 Categorias
              </button>
              <button className={`text-left p-2 rounded text-sm ${view === 'pizza-flavors' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('pizza-flavors')}>
                🍕 Sabores de Pizza
              </button>
              <button className={`text-left p-2 rounded text-sm ${view === 'schedule' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('schedule')}>
                🕒 Horários
              </button>
            </>
          ) : (
            <>
              <button className={`text-left p-2 rounded text-sm ${view === 'products' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('products')}>
                📦 Produtos
              </button>
              <button className={`text-left p-2 rounded text-sm ${view === 'variants' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('variants')}>
                🎨 Variações
              </button>
              <button className={`text-left p-2 rounded text-sm ${view === 'stock' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('stock')}>
                📊 Estoque
              </button>
            </>
          )}
          
          {/* Divisor */}
          <div className="border-t border-slate-600 my-2"></div>

          {/* Módulos Universais (aparência e config) */}
          <button className={`text-left p-2 rounded text-sm ${view === 'appearance' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('appearance')}>
            🎨 Aparência
          </button>
          <button className={`text-left p-2 rounded text-sm ${view === 'settings' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-700'}`} onClick={() => setView('settings')}>
            ⚙️ Configurações
          </button>
        </nav>
      </div>

      {/* Card Logo/Visualizar */}
      {store && (
        <div className="bg-blue-700 text-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white rounded overflow-hidden flex items-center justify-center">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-blue-700 font-bold text-xs">🏪</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-sm">{store.store_name}</div>
              <div className="text-xs text-blue-200">
                {store.status === 'active' ? 'Ativa' : store.status === 'pending' ? 'Pendente' : 'Status: ' + store.status}
              </div>
            </div>
          </div>
          <Link 
            href={`/lojas/${store.slug}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white text-center font-semibold py-2 rounded hover:bg-blue-500 transition text-sm"
          >
            👁️ Visualizar Loja
          </Link>
        </div>
      )}
    </aside>
  );
}
