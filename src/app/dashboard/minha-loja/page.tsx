"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MinhaLojaPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
        if (!mounted) return;
        setStores((data as any) || []);
      } catch (e) {
        console.error("Erro ao carregar lojas:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Minhas Lojas</h1>

      {stores.length === 0 ? (
        <div className="p-4 bg-white/5 rounded">
          <p className="text-gray-400">Nenhuma loja encontrada para sua conta.</p>
          <Link href="/lojas/criar" className="mt-3 inline-block bg-[#FDC500] px-3 py-2 rounded">Cadastrar loja</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((s) => (
            <div key={s.id} className="p-4 bg-white/5 rounded">
              <div className="font-semibold text-lg">{s.store_name || s.name || 'Sem nome'}</div>
              <div className="text-sm text-gray-400">Status: {s.status || '—'}</div>
              <div className="mt-2">{s.description}</div>
              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/produtos?store=${s.id}`} className="px-3 py-2 bg-white/10 rounded">Gerenciar Produtos</Link>
                <Link href={`/dashboard/lojas/${s.slug || s.id}/editar`} className="px-3 py-2 bg-white/10 rounded">Editar Loja</Link>
                <a href={`/lojas/${s.slug || s.id}`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded">Visualizar página</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
