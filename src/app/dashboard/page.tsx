"use client";
import React, { useEffect, useState } from "react";
import StorePanelSidebar from "@/components/StorePanelSidebar";
import StoreAppearance from "@/components/StoreAppearance";
import StoreModuleProducts from "@/components/StoreModuleProducts";
import StoreModuleMenu from "@/components/StoreModuleMenu";
import StoreOverview from "@/components/StoreOverview";
import StoreOrdersModule from "@/components/StoreOrdersModule";
import StoreFinanceModule from "@/components/StoreFinanceModule";
import StoreSettings from "@/components/StoreSettings";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'overview'|'orders'|'finance'|'appearance'|'settings'|'products'|'menu'>('overview');
  const [category, setCategory] = useState<'varejo'|'alimentacao'>('varejo');
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);
  const [stores, setStores] = useState<Array<any>>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Carregar lojas e auto-selecionar primeira
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/lojas');
        const j = await res.json();
        if (!mounted) return;
        const storesList = j.stores || [];
        setStores(storesList);
        
        // Auto-select primeira loja se houver
        if (storesList.length > 0 && !selectedStoreSlug) {
          const firstSlug = storesList[0].slug;
          setSelectedStoreSlug(firstSlug);
        }
      } catch (e) {
        console.warn('failed fetch stores', e);
      } finally {
  // Carregar loja selecionada
  useEffect(() => {
    let mounted = true;
    if (!selectedStoreSlug) {
      setStore(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/lojas?slug=${selectedStoreSlug}`);
        const j = await res.json();
        if (!mounted) return;
        setStore(j.store || null);
        setCategory(j.store?.category === "alimentacao" ? "alimentacao" : "varejo");
      } catch (e) {
        console.warn("failed fetch store", e);
      }
    })();
    return () => { mounted = false; };
  }, [selectedStoreSlug]);

  if (loading || dashboardLoading) {
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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        <StorePanelSidebar 
          view={view} 
          setView={setView} 
          category={category} 
          setCategory={setCategory}
          selectedStoreSlug={selectedStoreSlug}
          setSelectedStoreSlug={setSelectedStoreSlug}
        />
        <main className="flex-1 bg-white p-6 rounded shadow text-gray-900">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Painel da Loja</h1>
              {store && <p className="text-sm text-gray-600 mt-1">{store.name}</p>}
            </div>
            <div className="text-sm text-gray-600">Categoria: <strong>{category === 'varejo' ? 'Varejo' : 'Alimentação'}</strong></div>
          </header>

          {!selectedStoreSlug && (
            <div className="p-6 border border-yellow-300 bg-yellow-50 rounded text-yellow-800">
              Selecione uma loja no painel lateral para começar.
            </div>
          )}

          {selectedStoreSlug && (
            <>
              {view === 'overview' && <StoreOverview storeSlug={selectedStoreSlug} />}
              {view === 'orders' && <StoreOrdersModule storeSlug={selectedStoreSlug} />}
              {view === 'finance' && <StoreFinanceModule storeSlug={selectedStoreSlug} />}
              {view === 'appearance' && <StoreAppearance category={category} />}
              {view === 'settings' && <StoreSettings storeSlug={selectedStoreSlug} />}

              {view === 'products' && category === 'varejo' && (
                <StoreModuleProducts storeSlug={selectedStoreSlug} />
              )}

              {view === 'menu' && category === 'alimentacao' && (
                <StoreModuleMenu storeSlug={selectedStoreSlug} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
    </div>
  );
}
