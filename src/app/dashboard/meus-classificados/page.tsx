"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { listMyClassifieds, Classified } from "@/lib/classifiedQueries";
import DeleteClassifiedButton from "@/components/DeleteClassifiedButton";

export default function MeusClassificadosPage() {
  const { user, loading: authLoading } = useAuth();
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    if (user) {
      loadMyClassifieds();
    }
  }, [user]);

  async function loadMyClassifieds() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await listMyClassifieds(user.id);

    if (error) {
      setError(error.message);
      setClassifieds([]);
    } else {
      const filtered = data?.filter((c) => {
        if (statusFilter === "todos") return true;
        return c.status === statusFilter;
      });
      setClassifieds(filtered || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMyClassifieds();
  }, [statusFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Você precisa estar logado
          </h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
              ← Voltar para dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Meus Classificados</h1>
            <p className="text-gray-600 mt-2">Gerencie seus anúncios</p>
          </div>
          <Link
            href="/classificados/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Novo Classificado
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "todos", label: "Todos" },
              { value: "active", label: "Ativos" },
              { value: "sold", label: "Vendidos" },
              { value: "removed", label: "Removidos" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  statusFilter === filter.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando classificados...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : classifieds.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              {statusFilter === "todos"
                ? "Você ainda não tem classificados"
                : `Nenhum classificado ${
                    statusFilter === "active"
                      ? "ativo"
                      : statusFilter === "sold"
                      ? "vendido"
                      : "removido"
                  }`}
            </p>
            <Link
              href="/classificados/novo"
              className="text-blue-600 hover:underline font-semibold"
            >
              Criar seu primeiro classificado →
            </Link>
          </div>
        ) : (
          <>
            {/* Count */}
            <div className="mb-6 text-gray-600">
              {classifieds.length} classificado{classifieds.length !== 1 ? "s" : ""}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Título</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Categoria</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Preço</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Criado em</th>
                    <th className="text-center px-6 py-3 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classifieds.map((classified) => (
                    <tr key={classified.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/classificados/${classified.id}`}
                          className="text-blue-600 hover:underline font-semibold max-w-xs truncate block"
                        >
                          {classified.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{classified.category}</td>
                      <td className="px-6 py-4 font-semibold">
                        {classified.price && classified.price > 0
                          ? `R$ ${classified.price.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                            classified.status === "active"
                              ? "bg-green-100 text-green-800"
                              : classified.status === "sold"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {classified.status === "active"
                            ? "Ativo"
                            : classified.status === "sold"
                            ? "Vendido"
                            : "Removido"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(classified.created_at || "").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/classificados/${classified.id}/editar`}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Editar
                          </Link>
                          <span className="text-gray-300">|</span>
                          <DeleteClassifiedButton
                            id={classified.id}
                            onDeleteSuccess={loadMyClassifieds}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
