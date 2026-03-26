"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  store?: any;
};

function checkIsOpenNow(schedule: any): boolean | null {
  if (!schedule || typeof schedule !== "object") return null;
  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const todayKey = days[new Date().getDay()];
  const day = schedule[todayKey];
  if (!day) return null;
  if (day.closed) return false;

  const now = new Date();
  const curr = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = (day.open || "00:00").split(":").map(Number);
  const [ch, cm] = (day.close || "23:59").split(":").map(Number);

  return curr >= oh * 60 + om && curr <= ch * 60 + cm;
}

export default function StoreOverview({ store }: Props) {
  const isFood = store?.category === "alimentacao";

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    todayRevenue: 0,
    separatingOrders: 0,
    shippedOrders: 0,
    finalizedToday: 0,
    cancelledToday: 0,
    loading: true,
  });

  useEffect(() => {
    if (!store?.id) return;
    let mounted = true;

    (async () => {
      try {
        const { count: productCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("store_id", store.id)
          .eq("active", true);

        let orderCount = 0;
        let pendingCount = 0;
        let activeCount = 0;
        let todayRev = 0;
        let separatingCount = 0;
        let shippedCount = 0;
        let finalizedTodayCount = 0;
        let cancelledTodayCount = 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        try {
          const { count: totalOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id);

          const { count: pendingOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("status", "pending");

          orderCount = totalOrders || 0;
          pendingCount = pendingOrders || 0;

          if (isFood) {
            const { count: activeOrders } = await supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("store_id", store.id)
              .not("status", "in", '("delivered","cancelled")');

            activeCount = activeOrders || 0;

            const { data: todayOrders } = await supabase
              .from("orders")
              .select("total")
              .eq("store_id", store.id)
              .neq("status", "cancelled")
              .gte("created_at", todayStart.toISOString());

            todayRev = (todayOrders || []).reduce(
              (sum: number, o: any) => sum + (Number(o.total) || 0),
              0
            );
          } else {
            const { count: separatingOrders } = await supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("store_id", store.id)
              .in("status", ["separating", "confirmed", "preparing"]);

            const { count: shippedOrders } = await supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("store_id", store.id)
              .in("status", ["shipped", "ready", "out_for_delivery", "delivered"]);

            const { count: finalizedTodayOrders } = await supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("store_id", store.id)
              .in("status", ["finalized", "delivered"])
              .gte("created_at", todayStart.toISOString());

            const { count: cancelledTodayOrders } = await supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("store_id", store.id)
              .eq("status", "cancelled")
              .gte("created_at", todayStart.toISOString());

            const { data: todayOrders } = await supabase
              .from("orders")
              .select("total")
              .eq("store_id", store.id)
              .neq("status", "cancelled")
              .gte("created_at", todayStart.toISOString());

            separatingCount = separatingOrders || 0;
            shippedCount = shippedOrders || 0;
            finalizedTodayCount = finalizedTodayOrders || 0;
            cancelledTodayCount = cancelledTodayOrders || 0;
            todayRev = (todayOrders || []).reduce(
              (sum: number, o: any) => sum + (Number(o.total) || 0),
              0
            );
          }
        } catch {
          // Tabela orders ainda não existe neste ambiente
        }

        if (mounted) {
          setStats({
            totalProducts: productCount || 0,
            totalOrders: orderCount,
            pendingOrders: pendingCount,
            activeOrders: activeCount,
            todayRevenue: todayRev,
            separatingOrders: separatingCount,
            shippedOrders: shippedCount,
            finalizedToday: finalizedTodayCount,
            cancelledToday: cancelledTodayCount,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
        if (mounted) setStats((prev) => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [store?.id, isFood]);

  if (!store) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">Selecione uma loja para ver a visão geral</p>
      </div>
    );
  }

  const isOpenNow = isFood ? checkIsOpenNow(store.schedule) : null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">📊 Visão Geral</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{store.store_name}</h3>
            <p className="text-sm text-gray-500">{isFood ? "Alimentação" : "Varejo"}</p>
          </div>

          <div className="flex items-center gap-3">
            {isFood && isOpenNow !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  isOpenNow ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                {isOpenNow ? "Aberto agora" : "Fechado"}
              </span>
            )}

            {store.status === "active" && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Ativa
              </span>
            )}

            {store.status === "pending" && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Aguardando Aprovação
              </span>
            )}
          </div>
        </div>
      </div>

      {isFood ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.loading ? "..." : stats.totalProducts}</div>
            <div className="text-sm text-gray-600 mt-1">🍽️ Itens no Cardápio</div>
          </div>

          <div
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              stats.activeOrders > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
            }`}
          >
            <div className={`text-2xl font-bold ${stats.activeOrders > 0 ? "text-orange-600" : "text-gray-900"}`}>
              {stats.loading ? "..." : stats.activeOrders}
            </div>
            <div className="text-sm text-gray-600 mt-1">🔥 Pedidos em Aberto</div>
          </div>

          <div
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              stats.pendingOrders > 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                stats.pendingOrders > 0 ? "text-yellow-600" : "text-gray-900"
              }`}
            >
              {stats.loading ? "..." : stats.pendingOrders}
            </div>
            <div className="text-sm text-gray-600 mt-1">⏳ Aguardando Aceite</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-700">
              {stats.loading ? "..." : `R$ ${stats.todayRevenue.toFixed(2)}`}
            </div>
            <div className="text-sm text-gray-600 mt-1">💰 Faturamento Hoje</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-gray-900">{stats.loading ? "..." : stats.totalProducts}</div>
              <div className="text-sm text-gray-600 mt-1">Produtos Ativos</div>
              <div className="text-xs text-gray-500 mt-0.5">(Catálogo)</div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">🧺</div>
              <div className="text-2xl font-bold text-purple-700">{stats.loading ? "..." : stats.separatingOrders}</div>
              <div className="text-sm text-gray-600 mt-1">Em Separação</div>
              <div className="text-xs text-gray-500 mt-0.5">(Total)</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">✈️</div>
              <div className="text-2xl font-bold text-blue-700">{stats.loading ? "..." : stats.shippedOrders}</div>
              <div className="text-sm text-gray-600 mt-1">Pronto/Entregue</div>
              <div className="text-xs text-gray-500 mt-0.5">(Total)</div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-700">{stats.loading ? "..." : stats.finalizedToday}</div>
              <div className="text-sm text-gray-600 mt-1">Finalizados</div>
              <div className="text-xs text-gray-500 mt-0.5">(Hoje)</div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-emerald-700">
                {stats.loading ? "..." : `R$ ${stats.todayRevenue.toFixed(2)}`}
              </div>
              <div className="text-sm text-gray-600 mt-1">Faturamento</div>
              <div className="text-xs text-gray-500 mt-0.5">(Hoje)</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Resumo</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {store.status === "pending" && <li>• Sua loja está aguardando aprovação do Portal Modelo</li>}

          {store.status === "active" && stats.totalProducts === 0 && (
            <li>• Adicione {isFood ? "itens ao cardápio" : "produtos"} para começar a vender</li>
          )}

          {store.status === "active" && stats.totalProducts > 0 && (
            <li>
              • Sua loja está ativa com {stats.totalProducts} {isFood ? "itens" : "produtos"}
            </li>
          )}

          {isFood && stats.pendingOrders > 0 && (
            <li>
              • ⚠️ Você tem <strong>{stats.pendingOrders}</strong> pedido(s) aguardando aceite
            </li>
          )}

          {!isFood && stats.pendingOrders > 0 && (
            <li>• Você tem {stats.pendingOrders} pedido(s) aguardando confirmação</li>
          )}

          {!isFood && stats.separatingOrders > 0 && (
            <li>• {stats.separatingOrders} pedido(s) em separação no momento</li>
          )}

          {!isFood && stats.shippedOrders > 0 && (
            <li>• {stats.shippedOrders} pedido(s) já enviados/entregues</li>
          )}

          {!isFood && stats.cancelledToday > 0 && (
            <li>• Hoje houve {stats.cancelledToday} cancelamento(s) - vale revisar o motivo</li>
          )}

          {isFood && isOpenNow === false && (
            <li>• Sua loja aparece como fechada no momento - configure Horários se necessário</li>
          )}

          {!store.logo_url && <li>• Configure a aparência da loja para adicionar sua logo</li>}
        </ul>
      </div>
    </div>
  );
}
