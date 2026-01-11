"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { subscribeToProductsByStore, type ProductDoc, deleteProduct } from "@/lib/productQueries";

export default function DashboardProdutosPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm || !window.confirm) {
      // fallback UI confirmation
      const ok = confirm('Confirma exclusão do produto?');
      if (!ok) return;
    } else {
      if (!window.confirm('Confirma exclusão do produto?')) return;
    }
    try {
      setDeletingId(id);
      const { data, error } = await deleteProduct(id);
      if (error) {
        console.error('Erro ao deletar produto:', error);
        alert('Erro ao deletar produto: ' + (error.message || String(error)));
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao deletar produto');
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('stores').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
        if (!mounted) return;
        const list = (data as any) || [];
        setStores(list);

        // determine selected store: from query param or first
        const param = searchParams?.get?.('store') || null;
        if (param && list.find((x: any) => x.id === param)) {
          setSelectedStoreId(param);
        } else if (list.length > 0) {
          setSelectedStoreId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user, searchParams]);

  useEffect(() => {
    if (!selectedStoreId) return;
    const unsub = subscribeToProductsByStore(selectedStoreId, (rows) => setProducts(rows));
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [selectedStoreId]);

  if (!user) return <div className="p-6">Faça login para acessar seus produtos.</div>;
  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Meus Produtos</h1>
        <p className="text-white/80">Gerencie os produtos da sua loja</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div />
        {stores.length > 1 && (
          <div>
            <label className="text-sm text-gray-300 mr-2">Loja:</label>
            <select
              value={selectedStoreId || ''}
              onChange={(e) => {
                const id = e.target.value;
                // change query param so URL reflects selection
                const url = new URL(window.location.href);
                url.searchParams.set('store', id);
                router.replace(url.pathname + url.search);
                setSelectedStoreId(id);
              }}
              className="form-select bg-white/5 text-white px-2 py-1 rounded"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.store_name || s.name || s.id}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-[#FDC500]">{products.length}</p>
          <p className="text-gray-400 text-sm">Produtos</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{store ? 1 : 0}</p>
          <p className="text-gray-400 text-sm">Loja ativa</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{store ? (products.length) : 0}</p>
          <p className="text-gray-400 text-sm">Itens cadastrados</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div />
        <Link href="/dashboard/produtos/novo" className="px-3 py-2 bg-green-600 text-white rounded">Novo Produto</Link>
      </div>

      {!store ? (
        <div className="p-4 bg-white/5 rounded">Nenhuma loja encontrada para sua conta. Crie uma loja primeiro.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{p.title || 'Sem título'}</div>
                <div className="text-sm text-gray-600">{p.description ? p.description.substring(0, 120) : '—'}</div>
              </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/produtos/${p.id}/editar`} className="px-3 py-1 bg-blue-600 text-white rounded">Editar</Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      {deletingId === p.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
