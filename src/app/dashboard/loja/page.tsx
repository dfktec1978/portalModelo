"use client";
import React, { useState } from "react";
import StorePanelSidebar from "@/components/StorePanelSidebar";
import StoreAppearance from "@/components/StoreAppearance";
import StoreProductsModule from "@/components/StoreProductsModule";
import StoreMenuModule from "@/components/StoreMenuModule";
import StoreOverview from "@/components/StoreOverview";
import StoreOrdersModule from "@/components/StoreOrdersModule";
import StoreFinanceModule from "@/components/StoreFinanceModule";
import StoreSettings from "@/components/StoreSettings";

export default function LojaDashboardPage() {
  const [view, setView] = useState<'overview'|'orders'|'finance'|'appearance'|'settings'|'products'|'menu'|'profile'|'schedule'|'stock'|'additionals'|'categories'|'pizza-flavors'|'variants'>('overview');
  const [category, setCategory] = useState<'varejo'|'alimentacao'>('varejo');
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        <StorePanelSidebar view={view} setView={setView} category={category} setCategory={setCategory} />
        <main className="flex-1 bg-white p-6 rounded shadow">
          <header className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Painel da Loja</h1>
            <div>Categoria: <strong>{category === 'varejo' ? 'Varejo' : 'Alimentação'}</strong></div>
          </header>

          {view === 'overview' && <StoreOverview storeSlug={selectedStoreSlug ?? undefined} />}
          {view === 'orders' && <StoreOrdersModule storeSlug={selectedStoreSlug ?? undefined} />}
          {view === 'finance' && <StoreFinanceModule storeSlug={selectedStoreSlug ?? undefined} />}
          {view === 'appearance' && <StoreAppearance category={category} />}
          {view === 'settings' && <StoreSettings storeSlug={selectedStoreSlug ?? undefined} />}

          {view === 'products' && category === 'varejo' && (
            <StoreProductsModule storeSlug={selectedStoreSlug ?? undefined} />
          )}

          {view === 'menu' && category === 'alimentacao' && (
            <StoreMenuModule storeSlug={selectedStoreSlug ?? undefined} />
          )}
        </main>
      </div>
    </div>
  );
}
