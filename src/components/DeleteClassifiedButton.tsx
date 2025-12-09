"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClassified } from "@/lib/classifiedQueries";
import { useAuth } from "@/lib/AuthContext";

interface DeleteClassifiedButtonProps {
  id: string;
  onDeleteSuccess?: () => void;
  variant?: "inline" | "button" | "full";
}

export default function DeleteClassifiedButton({
  id,
  onDeleteSuccess,
  variant = "inline",
}: DeleteClassifiedButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!user) return;

    setLoading(true);
    const { error } = await deleteClassified(id, user.id);

    if (error) {
      alert("Erro ao deletar: " + error.message);
      setLoading(false);
    } else {
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        router.push("/dashboard/meus-classificados");
      }
    }
  }

  if (!showConfirm) {
    if (variant === "inline") {
      return (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-red-600 hover:text-red-800 font-semibold"
          disabled={loading}
        >
          {loading ? "Deletando..." : "Deletar"}
        </button>
      );
    }

    if (variant === "full") {
      return (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold transition"
          disabled={loading}
        >
          {loading ? "Deletando..." : "Deletar Classificado"}
        </button>
      );
    }

    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:bg-red-400"
        disabled={loading}
      >
        {loading ? "Deletando..." : "Deletar"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmar exclusão</h3>
        <p className="text-gray-600 mb-6">
          Tem certeza de que deseja deletar este classificado? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:bg-red-400"
          >
            {loading ? "Deletando..." : "Sim, Deletar"}
          </button>
        </div>
      </div>
    </div>
  );
}
