"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import StorePanelSidebar from "@/components/StorePanelSidebar";
import StoreAppearance from "@/components/StoreAppearance";
import StoreProductsModule from "@/components/StoreProductsModule";
import StoreMenuModule from "@/components/StoreMenuModule";
import StoreOverview from "@/components/StoreOverview";
import StoreOrdersModule from "@/components/StoreOrdersModule";
import StoreFinanceModule from "@/components/StoreFinanceModule";
import StoreSettings from "@/components/StoreSettings";
import StoreLandingProfileSettings from "@/components/StoreLandingProfileSettings";

import StorePaymentSettings from "@/components/StorePaymentSettings";
export default function LojaDashboardPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'overview'|'orders'|'finance'|'appearance'|'settings'|'payments'|'products'|'menu'|'profile'|'schedule'|'stock'|'additionals'|'categories'|'pizza-flavors'|'variants'|'landing-profile'>('overview');
  const [category, setCategory] = useState<'varejo'|'alimentacao'>('varejo');
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  useEffect(() => {
    if (!selectedStoreSlug) {
      setSelectedStore(null);
      return;
    }
    if (!user?.id) {
      setSelectedStore(null);
      return;
    }

    let mounted = true;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedStoreSlug);
    (async () => {
      try {
        const { data, error } = isUuid
          ? await supabase
              .from('stores')
              .select('*')
              .eq('id', selectedStoreSlug)
              .eq('owner_id', user.id)
              .maybeSingle()
          : await supabase
              .from('stores')
              .select('*')
              .eq('slug', selectedStoreSlug)
              .eq('owner_id', user.id)
              .maybeSingle();

        if (error) throw error;
        if (!mounted) return;
        setSelectedStore(data || null);
        if (data?.category === 'varejo' || data?.category === 'alimentacao') {
          setCategory(data.category);
        }
      } catch (err) {
        console.error('Erro ao carregar loja selecionada:', err);
        if (mounted) setSelectedStore(null);
      }
    })();

    return () => { mounted = false; };
  }, [selectedStoreSlug, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        <StorePanelSidebar
          view={view}
          setView={setView}
          category={category}
          setCategory={setCategory}
          selectedStoreSlug={selectedStoreSlug}
          setSelectedStoreSlug={setSelectedStoreSlug}
          user={user}
          store={selectedStore}
        />
        <main className="flex-1 bg-white p-6 rounded shadow">
          <header className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Painel da Loja</h1>
            <div>Categoria: <strong>{category === 'varejo' ? 'Varejo' : 'Alimentação'}</strong></div>
          </header>

          {view === 'overview' && <StoreOverview store={selectedStore} />}
          {view === 'orders' && <StoreOrdersModule store={selectedStore} />}
          {view === 'finance' && <StoreFinanceModule store={selectedStore} />}
          {view === 'appearance' && <StoreAppearance store={selectedStore} />}
          {view === 'settings' && (
            <StoreSettings
              store={selectedStore}
              onStoreUpdated={(updatedStore) => {
                setSelectedStore(updatedStore);
                if (updatedStore?.category === 'varejo' || updatedStore?.category === 'alimentacao') {
                  setCategory(updatedStore.category);
                }
              }}
            />
          )}

          {view === 'products' && category === 'varejo' && (
            <StoreProductsModule storeSlug={selectedStore?.slug || selectedStore?.id} store={selectedStore} />
          )}

          {view === 'menu' && category === 'alimentacao' && (
            <StoreMenuModule storeSlug={selectedStore?.slug || selectedStore?.id} store={selectedStore} />
          )}

          {view === 'payments' && <StorePaymentSettings store={selectedStore} />}
          {view === 'landing-profile' && ['landingpage', 'destaque', 'premium'].includes(String(selectedStore?.plan || '').toLowerCase()) && <StoreLandingProfileSettings store={selectedStore} />}
        </main>
      </div>
    </div>
  );
}
