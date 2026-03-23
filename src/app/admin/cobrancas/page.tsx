"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type Invoice = {
  id: string;
  reference_month: string;
  due_date: string;
  amount: number;
  status: "pending" | "paid" | "expired" | "canceled";
  payment_provider: string | null;
  boleto_link: string | null;
  boleto_barcode: string | null;
  reminder_sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  stores: { id: string; slug: string; store_name: string; plan: string } | null;
  profiles: { id: string; display_name: string; email: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  expired: "Expirado",
  canceled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
  paid: "bg-green-400/20 text-green-300 border border-green-400/40",
  expired: "bg-red-400/20 text-red-300 border border-red-400/40",
  canceled: "bg-gray-400/20 text-gray-400 border border-gray-400/40",
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const [year, month, day] = d.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatMonth(d: string) {
  const [year, month] = d.slice(0, 7).split("-");
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${names[Number(month) - 1]}/${year}`;
}

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "ok" | "err" } | null>(null);

  // Resumo de contadores
  const [counts, setCounts] = useState({ pending: 0, paid: 0, expired: 0, canceled: 0 });

  const showToast = (message: string, type: "ok" | "err" = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInvoices = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const params = new URLSearchParams({ page: String(pg) });
      if (filterStatus) params.set("status", filterStatus);
      if (filterMonth) params.set("month", filterMonth);

      const res = await fetch(`/api/admin/billing?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setInvoices(json.invoices || []);
      setTotal(json.total || 0);
    } catch {
      showToast("Erro ao carregar faturas.", "err");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterMonth]);

  const fetchCounts = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    const statuses: Array<"pending" | "paid" | "expired" | "canceled"> = ["pending", "paid", "expired", "canceled"];
    const results = await Promise.all(
      statuses.map((s) =>
        fetch(`/api/admin/billing?status=${s}&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
      )
    );
    setCounts({
      pending:  results[0].total || 0,
      paid:     results[1].total || 0,
      expired:  results[2].total || 0,
      canceled: results[3].total || 0,
    });
  }, []);

  useEffect(() => {
    setPage(1);
    fetchInvoices(1);
    fetchCounts();
  }, [fetchInvoices, fetchCounts]);

  async function handleAction(id: string, action: "mark_paid" | "cancel") {
    setActionLoading(id + action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error(await res.text());
      showToast(
        action === "mark_paid" ? "Fatura marcada como paga!" : "Fatura cancelada.",
        "ok"
      );
      await fetchInvoices(page);
      await fetchCounts();
    } catch {
      showToast("Erro ao atualizar fatura.", "err");
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">💰 Cobranças Mensais</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie faturas, boletos e pagamentos dos lojistas.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm font-semibold transition-all ${
            toast.type === "ok" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Contadores por status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending", "paid", "expired", "canceled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`rounded-lg p-4 text-left transition border ${
              filterStatus === s
                ? STATUS_COLOR[s]
                : "bg-white/10 border-white/20 hover:bg-white/20"
            }`}
          >
            <p className="text-xs text-gray-400 mb-1">{STATUS_LABEL[s]}</p>
            <p className="text-2xl font-bold">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="expired">Expirado</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Mês de referência</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        {(filterStatus || filterMonth) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterMonth(""); }}
            className="text-xs text-gray-400 hover:text-white underline mt-4"
          >
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end">
          {loading ? "Carregando..." : `${total} fatura${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Carregando faturas...</div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Nenhuma fatura encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Loja / Lojista</th>
                <th className="text-left px-4 py-3">Mês Ref.</th>
                <th className="text-left px-4 py-3">Vencimento</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Lembrete</th>
                <th className="text-center px-4 py-3">Pago em</th>
                <th className="text-center px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white truncate max-w-[160px]">
                      {inv.stores?.store_name || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">
                      {inv.profiles?.display_name || inv.profiles?.email || "—"}
                    </p>
                    {inv.stores?.plan && (
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded mt-0.5 inline-block capitalize">
                        {inv.stores.plan}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{formatMonth(inv.reference_month)}</td>
                  <td className="px-4 py-3 text-gray-300">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {inv.reminder_sent_at ? formatDate(inv.reminder_sent_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {inv.paid_at ? formatDate(inv.paid_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 items-center min-w-[100px]">
                      {inv.boleto_link && (
                        <a
                          href={inv.boleto_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Ver boleto
                        </a>
                      )}
                      {inv.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(inv.id, "mark_paid")}
                            disabled={actionLoading === inv.id + "mark_paid"}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition disabled:opacity-50 w-full"
                          >
                            {actionLoading === inv.id + "mark_paid" ? "..." : "✓ Marcar pago"}
                          </button>
                          <button
                            onClick={() => handleAction(inv.id, "cancel")}
                            disabled={actionLoading === inv.id + "cancel"}
                            className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded transition disabled:opacity-50 w-full"
                          >
                            {actionLoading === inv.id + "cancel" ? "..." : "✕ Cancelar"}
                          </button>
                        </>
                      )}
                      {inv.status === "expired" && (
                        <button
                          onClick={() => handleAction(inv.id, "mark_paid")}
                          disabled={actionLoading === inv.id + "mark_paid"}
                          className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition disabled:opacity-50 w-full"
                        >
                          {actionLoading === inv.id + "mark_paid" ? "..." : "✓ Marcar pago"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchInvoices(p); }}
            disabled={page <= 1}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded disabled:opacity-40 transition"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchInvoices(p); }}
            disabled={page >= totalPages}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded disabled:opacity-40 transition"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
