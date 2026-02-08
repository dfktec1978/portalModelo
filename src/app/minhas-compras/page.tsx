"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const FOOD_STATUS_MAP: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto",
  out_for_delivery: "Saiu para Entrega",
  delivered: "Entregue",
  cancelled: "Cancelado"
};

const FOOD_STATUS_EMOJI: Record<string, string> = {
  pending: "⏳",
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "📦",
  out_for_delivery: "🚚",
  delivered: "✅",
  cancelled: "❌"
};

const RETAIL_STATUS_MAP: Record<string, string> = {
  pending: "Pendente",
  separating: "Em Separação",
  shipped: "Entregue/Enviado",
  finalized: "Finalizado",
  cancelled: "Cancelado"
};

const RETAIL_STATUS_EMOJI: Record<string, string> = {
  pending: "⏳",
  separating: "📦",
  shipped: "🚚",
  finalized: "✅",
  cancelled: "❌"
};

const normalizeRetailStatus = (status: string) => {
  if (status in RETAIL_STATUS_MAP) return status;
  if (["confirmed", "preparing"].includes(status)) return "separating";
  if (["ready", "out_for_delivery", "delivered"].includes(status)) return "shipped";
  if (status === "cancelled") return "cancelled";
  return "pending";
};

const formatPaymentMethod = (method?: string | null) => {
  if (!method) return "Não informado";
  if (method === "pix") return "Pix";
  if (method === "cash" || method === "na_retirada") return "Pagar na entrega/retirada";
  return method;
};

export default function MinhasComprasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) {
          router.push("/login");
          return;
        }

        let data: any[] | null = null;

        const customerAttempt = await supabase
          .from("orders")
          .select("*, stores:store_id (id, store_name, slug, category)")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (customerAttempt.error && customerAttempt.error.code === 'PGRST204') {
          const legacyAttempt = await supabase
            .from("orders")
            .select("*, stores:store_id (id, store_name, slug, category)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (legacyAttempt.error) throw legacyAttempt.error;
          data = legacyAttempt.data || [];
        } else if (customerAttempt.error) {
          throw customerAttempt.error;
        } else {
          data = customerAttempt.data || [];
        }

        const list = data || [];
        const finalized = (order: any) => {
          const isRetail = order?.stores?.category === "varejo";
          const status = isRetail ? normalizeRetailStatus(order.status) : order.status;
          return isRetail ? status === "finalized" || status === "cancelled" : status === "delivered" || status === "cancelled";
        };
        list.sort((a: any, b: any) => {
          const aFinal = finalized(a);
          const bFinal = finalized(b);
          if (aFinal !== bFinal) return aFinal ? 1 : -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setOrders(list);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  const restoreStock = async (order: any) => {
    if (!order?.items) return;
    const isRetail = order?.stores?.category === "varejo";
    if (!isRetail) return;

    await Promise.all(
      order.items.map(async (item: any) => {
        const qty = item.quantity || 1;
        const productId = item.product_id || item.id;

        if (item.variant?.sku || (item.variant?.color && item.variant?.size)) {
          const variantQuery = supabase
            .from("product_variants")
            .select("id, stock_quantity")
            .eq("product_id", productId);

          const { data: variantData, error: variantError } = await (item.variant?.sku
            ? variantQuery.eq("sku", item.variant.sku)
            : variantQuery.eq("color", item.variant.color).eq("size", item.variant.size)
          ).single();

          if (variantError || !variantData) return;

          const nextStock = (variantData.stock_quantity || 0) + qty;
          await supabase
            .from("product_variants")
            .update({ stock_quantity: nextStock })
            .eq("id", variantData.id);
          return;
        }

        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("id, stock")
          .eq("id", productId)
          .single();

        if (productError || !productData) return;

        if (productData.stock === null || productData.stock === undefined) return;

        const nextStock = (productData.stock || 0) + qty;
        await supabase
          .from("products")
          .update({ stock: nextStock })
          .eq("id", productData.id);
      })
    );
  };

  const handleCancelOrder = async (order: any) => {
    if (!order?.id) return;
    const isRetail = order?.stores?.category === "varejo";
    const status = isRetail ? normalizeRetailStatus(order.status) : order.status;
    if (status !== "pending") return;

    const confirmed = window.confirm("Deseja cancelar este pedido? Essa ação não pode ser desfeita.");
    if (!confirmed) return;

    try {
      setCancellingId(order.id);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      if (updateError) throw updateError;

      await restoreStock(order);

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o))
      );
    } catch (err: any) {
      setError(err?.message || "Erro ao cancelar pedido");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Compras</h1>
        <p className="text-sm text-gray-600 mt-1">Acompanhe o status dos seus pedidos</p>

        {loading && (
          <div className="mt-6 text-gray-500">Carregando pedidos...</div>
        )}

        {error && (
          <div className="mt-6 p-3 rounded bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200 text-gray-600">
            Você ainda não possui pedidos.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const isRetail = order?.stores?.category === "varejo";
            const normalizedStatus = isRetail ? normalizeRetailStatus(order.status) : order.status;
            const statusLabel = isRetail
              ? RETAIL_STATUS_MAP[normalizedStatus] || "Pendente"
              : FOOD_STATUS_MAP[normalizedStatus] || "Pendente";
            const statusEmoji = isRetail
              ? RETAIL_STATUS_EMOJI[normalizedStatus] || "⏳"
              : FOOD_STATUS_EMOJI[normalizedStatus] || "⏳";
            const highlightGreen = ["pending", "confirmed", "preparing", "ready"].includes(normalizedStatus);
            const highlightYellow = normalizedStatus === "out_for_delivery";

            return (
              <div
                key={order.id}
                className={`rounded-lg border p-4 ${highlightGreen ? "bg-green-50 border-green-200" : highlightYellow ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {order?.stores?.store_name || "Loja"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Status: <strong>{statusEmoji} {statusLabel}</strong>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Pagamento: {formatPaymentMethod(order.payment_method)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Pedido #{String(order.id).substring(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      R$ {Number(order.total || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/lojas/${order.store_id}/pedido/${order.id}`}
                    className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Ver detalhes
                  </Link>
                  {order?.stores?.slug && (
                    <Link
                      href={`/lojas/${order.stores.slug}`}
                      className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Ver loja
                    </Link>
                  )}
                  {(() => {
                    const isRetail = order?.stores?.category === "varejo";
                    const status = isRetail ? normalizeRetailStatus(order.status) : order.status;
                    const canCancel = status === "pending";
                    if (!canCancel) return null;
                    return (
                      <button
                        onClick={() => handleCancelOrder(order)}
                        className="px-3 py-2 text-sm rounded border border-red-300 text-red-700 hover:bg-red-50"
                        disabled={cancellingId === order.id}
                      >
                        {cancellingId === order.id ? "Cancelando..." : "Cancelar pedido"}
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
