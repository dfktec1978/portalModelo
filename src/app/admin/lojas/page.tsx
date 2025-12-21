"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import {
  subscribeToAdminStores,
  updateStoreStatus,
  type StoreDoc,
} from "@/lib/adminQueries";

export default function AdminLojasPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAdminStores((arr) => {
      setStores(arr);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user || profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  async function changeStatus(id: string, status: string) {
    if (!confirm(`Confirmar ${status} para a loja ${id}?`)) return;
    setBusy(id);
    try {
      await updateStoreStatus(id, status, user!.id);
      alert(`Loja ${status} com sucesso`);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao alterar status: ' + (e?.message || 'erro desconhecido'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Lojas</h1>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Total de lojas: {stores.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stores.map((s) => {
          return (
            <div key={s.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <div className="font-semibold text-lg">{s.ownerName || s.id}</div>
                <div className="text-sm text-gray-700">Loja: <span className="font-medium">{s.storeName || '—'}</span></div>
                <div className="text-sm text-gray-600">Email: {s.ownerEmail || '—'}</div>
                <div className="text-sm text-gray-600">Telefone: {s.phone || '—'}</div>
                <div className="text-sm text-gray-500 mt-1">Status: <span className="font-medium">{s.status || 'pending'}</span></div>
              </div>

              <div className="flex gap-2 items-center">
                {s.status !== 'approved' ? (
                  <>
                    <button aria-label={`Aprovar ${s.id}`} disabled={busy === s.id} onClick={() => changeStatus(s.id, 'approved')} className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50">
                      {busy === s.id ? 'Processando...' : 'Aprovar'}
                    </button>
                    <button aria-label={`Bloquear ${s.id}`} disabled={busy === s.id} onClick={() => changeStatus(s.id, 'blocked')} className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50">
                      {busy === s.id ? 'Processando...' : 'Bloquear'}
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-green-600 font-medium">✓ Aprovada</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
