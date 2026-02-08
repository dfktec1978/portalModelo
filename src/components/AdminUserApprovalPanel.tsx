"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface PendingUser {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  status: string;
  created_at: string;
  store?: {
    id: string;
    store_name?: string;
    status: string;
  };
}

export default function AdminUserApprovalPanel() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar perfis pendentes (não apenas lojas, mas usuários com status pending)
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          display_name,
          role,
          status,
          created_at
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Para cada usuário, buscar sua loja se for lojista
      const usersWithStores = await Promise.all(
        (users || []).map(async (user) => {
          if (user.role === "lojista") {
            const { data: store } = await supabase
              .from("stores")
              .select("id, store_name, status")
              .eq("owner_id", user.id)
              .maybeSingle();
            return { ...user, store };
          }
          return { ...user, store: null };
        })
      );

      setPendingUsers(usersWithStores);
    } catch (err) {
      console.error("Erro ao carregar usuários pendentes:", err);
      setError("Falha ao carregar usuários pendentes");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, isLojista: boolean) => {
    try {
      setApproving(userId);
      setMessage(null);
      setError(null);

      // Chamar endpoint do admin
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "approve",
          approveLoja: isLojista
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao aprovar usuário");
      }

      setMessage(`✅ ${data.message || "Usuário aprovado com sucesso!"}`);

      // Remover da lista de pendentes
      setPendingUsers(prev => prev.filter(u => u.id !== userId));

      // Aguardar 2 segundos para recarregar (em caso de falha de atualização Realtime)
      setTimeout(() => {
        loadPendingUsers();
      }, 2000);

    } catch (err) {
      console.error("Erro ao aprovar:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao aprovar usuário";
      setError(errorMsg);

      // Se for erro de "schema net", mostrar instrução
      if (errorMsg.includes("schema net") || errorMsg.includes("net")) {
        setError(
          `${errorMsg}\n\n⚠️ Você precisa executar o SQL em sql/fix-approve-function.sql primeiro!`
        );
      }
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar este cadastro?")) return;

    try {
      setRejecting(userId);
      setMessage(null);
      setError(null);

      // Atualizar status para 'blocked' via RPC ou API
      const { error: err } = await supabase
        .from("profiles")
        .update({ status: "blocked" })
        .eq("id", userId);

      if (err) throw err;

      setMessage("✅ Cadastro rejeitado com sucesso");
      setPendingUsers(prev => prev.filter(u => u.id !== userId));

    } catch (err) {
      console.error("Erro ao rejeitar:", err);
      setError(err instanceof Error ? err.message : "Erro ao rejeitar cadastro");
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Aprovação de Usuários</h1>
          <p className="text-sm text-gray-600 mt-1">
            {pendingUsers.length} {pendingUsers.length === 1 ? "cadastro" : "cadastros"} aguardando aprovação
          </p>
        </div>
        <button
          onClick={loadPendingUsers}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300"
        >
          🔄 Recarregar
        </button>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded whitespace-pre-wrap">
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">✨ Nenhum cadastro pendente</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">E-mail</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Loja</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{user.display_name || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === "lojista"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {user.role === "lojista" ? "🏪 Lojista" : "👤 Cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.store?.store_name || (user.role === "lojista" ? "Não vinculada" : "-")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleApprove(user.id, user.role === "lojista")}
                        disabled={approving === user.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          approving === user.id
                            ? "bg-green-100 text-green-800 cursor-wait"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        {approving === user.id ? "⏳" : "✅"} Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={rejecting === user.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          rejecting === user.id
                            ? "bg-red-100 text-red-800 cursor-wait"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {rejecting === user.id ? "⏳" : "❌"} Rejeitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">⚠️ Pré-requisito</h3>
        <p className="text-blue-800 text-sm">
          Este painel depende do SQL em <code className="bg-blue-100 px-1 rounded">sql/fix-approve-function.sql</code> estar executado no Supabase.
          <br />
          Se receber erro "schema net does not exist", execute o SQL conforme instruções em <code className="bg-blue-100 px-1 rounded">EXECUTAR-SQL-APROVAR.md</code>
        </p>
      </div>
    </div>
  );
}
