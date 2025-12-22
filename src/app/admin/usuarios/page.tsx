"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email?: string;
  display_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  created_at?: string;
};

export default function AdminUsuarios() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !profileLoading && profile?.role === "admin") {
      loadUsers();
    }
  }, [loading, profileLoading, profile]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      setError("Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id);

      if (error) {
        alert("Erro ao atualizar role: " + error.message);
      } else {
        loadUsers(); // Recarregar lista
      }
    } catch (err) {
      alert("Erro ao atualizar role");
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        alert("Erro ao atualizar status: " + error.message);
      } else {
        loadUsers(); // Recarregar lista
      }
    } catch (err) {
      alert("Erro ao atualizar status");
    }
  }

  async function handleApproveUser(id: string) {
    try {

      // Primeiro, buscar informações do usuário
      const { data: userProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        alert("Erro ao buscar informações do usuário: " + fetchError.message);
        return;
      }

      if (userProfile.status !== "pending") {
        alert("Este usuário não está pendente de aprovação.");
        return;
      }

      const now = new Date().toISOString();

      // Se for lojista, também tentar aprovar a loja automaticamente
      if (userProfile.role === "lojista") {
        // Por enquanto, apenas informar que a loja precisa ser aprovada separadamente
      }

// Atualizar o status do usuário para "active" (usando cliente normal - ajustar RLS se necessário)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          status: "active",
          approved_at: now
        })
        .eq("id", id)
        .eq("status", "pending"); // Só atualizar se estiver pending

      if (updateError) {
        alert("Erro ao aprovar usuário: " + updateError.message);
        return;
      }

      alert("✅ Usuário aprovado com sucesso!");
      loadUsers(); // Recarregar lista
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
      alert("Erro ao aprovar usuário: " + (error as Error).message);
    }
  }

  if (!user) {
    return <div className="p-8">Acesse para continuar.</div>;
  }
  if (profile?.role !== "admin") {
    return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
        <p className="text-white/80">Administre contas de usuário e permissões</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-[#FDC500]">{users.length}</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === "cliente").length}</p>
          <p className="text-gray-400 text-sm">Clientes</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{users.filter(u => u.role === "lojista").length}</p>
          <p className="text-gray-400 text-sm">Lojistas</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-400">{users.filter(u => u.status === "pending").length}</p>
          <p className="text-gray-400 text-sm">Pendentes</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === "admin").length}</p>
          <p className="text-gray-400 text-sm">Admins</p>
        </div>
      </div>

      {/* Content */}
      {loadingUsers ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Carregando usuários...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((userProfile) => (
            <div key={userProfile.id} className="bg-white/10 border border-white/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">{userProfile.display_name || "Sem nome"}</h3>
                  <p className="text-gray-400 text-sm">{userProfile.email}</p>
                  <p className="text-gray-400 text-sm">{userProfile.phone || "Sem telefone"}</p>
                  <p className="text-xs text-gray-500">
                    Criado em: {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status/Approval Section */}
                  <div className="text-right">
                    {userProfile.status === "pending" ? (
                      <div className="mb-2">
                        <button
                          onClick={() => handleApproveUser(userProfile.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                        >
                          ✅ Aprovar {userProfile.role === "lojista" ? "Lojista" : "Usuário"}
                        </button>
                      </div>
                    ) : (
                      <select
                        value={userProfile.status || "active"}
                        onChange={(e) => handleStatusChange(userProfile.id, e.target.value)}
                        className="px-3 py-1 bg-gray-700 text-white rounded text-sm mb-2 block"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="banned">Banido</option>
                      </select>
                    )}
                    
                    <select
                      value={userProfile.role || "cliente"}
                      onChange={(e) => handleRoleChange(userProfile.id, e.target.value)}
                      className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="lojista">Lojista</option>
                      <option value="profissional">Profissional</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    {/* Status indicator */}
                    <div className="text-xs mt-1">
                      {userProfile.status === "pending" ? (
                        <span className="text-yellow-400">⏳ Pendente</span>
                      ) : userProfile.status === "active" ? (
                        <span className="text-green-400">✅ Ativo</span>
                      ) : userProfile.status === "inactive" ? (
                        <span className="text-gray-400">⏸️ Inativo</span>
                      ) : (
                        <span className="text-red-400">🚫 Banido</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}