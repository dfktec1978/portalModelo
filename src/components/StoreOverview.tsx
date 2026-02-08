"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  store?: any;
};

export default function StoreOverview({ store }: Props) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    views: 0,
    loading: true,
  });

  useEffect(() => {
    if (!store?.id) return;

    let mounted = true;

    (async () => {
      try {
        // Contar produtos
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('active', true);

        // Contar pedidos (se a tabela existir)
        let orderCount = 0;
        let pendingCount = 0;
        try {
          const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id);
          
          const { count: pendingOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('status', 'pending');
          
          orderCount = totalOrders || 0;
          pendingCount = pendingOrders || 0;
        } catch (e) {
          // Tabela orders ainda não existe
          console.log('Tabela orders ainda não criada');
        }

        if (mounted) {
          setStats({
            totalProducts: productCount || 0,
            totalOrders: orderCount,
            pendingOrders: pendingCount,
            views: 0, // Implementar analytics futuramente
            loading: false,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        if (mounted) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    })();

    return () => { mounted = false; };
  }, [store?.id]);

  if (!store) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">Selecione uma loja para ver a visão geral</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">📊 Visão Geral</h2>
      
      {/* Status da Loja */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{store.store_name}</h3>
            <p className="text-sm text-gray-500">
              {store.category === 'alimentacao' ? 'Alimentação' : 'Varejo'}
            </p>
          </div>
          <div>
            {store.status === 'active' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Ativa
              </span>
            )}
            {store.status === 'pending' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Aguardando Aprovação
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        {/* Total de Produtos/Itens */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.loading ? '...' : stats.totalProducts}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {store.category === 'alimentacao' ? 'Itens no Cardápio' : 'Produtos Ativos'}
              </div>
            </div>
            <div className="text-3xl">
              {store.category === 'alimentacao' ? '🍔' : '📦'}
            </div>
          </div>
        </div>

        {/* Total de Pedidos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.loading ? '...' : stats.totalOrders}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Pedidos Totais
              </div>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        {/* Pedidos Pendentes */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.loading ? '...' : stats.pendingOrders}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Pedidos Pendentes
              </div>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Resumo</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {store.status === 'pending' && (
            <li>• Sua loja está aguardando aprovação do Portal Modelo</li>
          )}
          {store.status === 'active' && stats.totalProducts === 0 && (
            <li>• Adicione {store.category === 'alimentacao' ? 'itens ao cardápio' : 'produtos'} para começar a vender</li>
          )}
          {store.status === 'active' && stats.totalProducts > 0 && (
            <li>• Sua loja está ativa com {stats.totalProducts} {store.category === 'alimentacao' ? 'itens' : 'produtos'}</li>
          )}
          {stats.pendingOrders > 0 && (
            <li>• Você tem {stats.pendingOrders} pedido(s) aguardando confirmação</li>
          )}
          {!store.logo_url && (
            <li>• Configure a aparência da loja para adicionar sua logo</li>
          )}
        </ul>
      </div>
    </div>
  );
}
