"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { listProductsByOwner } from "@/lib/productQueries";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await listProductsByOwner(user.id);
      if (error) {
        setError(error.message || String(error));
        return;
      }
      if (data) setProducts(data as any[]);
    })();
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-4">Produtos</h1>
        <Link href="/dashboard/produtos/novo" className="bg-[#FDC500] px-3 py-2 rounded">Novo</Link>
      </div>

      {error ? (
        <div className="text-red-400">Erro ao listar produtos: {error}</div>
      ) : products.length === 0 ? (
        <div className="text-gray-400">Nenhum produto encontrado.</div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="p-4 bg-white/5 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.title ?? p.name ?? p.nome ?? 'Produto sem título'}</div>
                  <div className="text-sm text-gray-400">R$ {p.price}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/produtos/${p.id}/editar`} className="text-sm px-3 py-1 bg-white/10 rounded">Editar</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
