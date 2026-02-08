"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import {
  subscribeToAdminStores,
  type StoreDoc,
} from "@/lib/adminQueries";
import externalStores from "@/data/externalStores";

export default function AdminLojasPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [stores, setStores] = useState<StoreDoc[]>([]);

  useEffect(() => {
    const unsub = subscribeToAdminStores((arr) => {
      const list = arr || [];

      // merge externalStores into admin list so admin can edit them
      const map = new Map<string, any>();
      list.forEach((s: any) => map.set(String(s.id), { ...s, _internal: true }));
      (externalStores || []).forEach((es: any) => {
        if (map.has(es.id)) {
          const existing = map.get(es.id);
          map.set(es.id, { ...existing, ...es });
        } else {
          map.set(es.id, { ...es, _externalOnly: true });
        }
      });

      setStores(Array.from(map.values()));
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user || profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  return (
    <div className="space-y-6">
      {/* Header / Hero */}
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Lojas</h1>
        <p className="text-white/80">Administre lojas internas e cadastros externos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-[#FDC500]">{stores.length}</p>
          <p className="text-gray-400 text-sm">Total</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{stores.filter(s => (s as any)._internal).length}</p>
          <p className="text-gray-400 text-sm">Internas</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{stores.filter(s => (s as any)._externalOnly).length}</p>
          <p className="text-gray-400 text-sm">Externa apenas</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-400">{stores.filter(s => s.status === 'pending').length}</p>
          <p className="text-gray-400 text-sm">Pendentes</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-400">{stores.filter(s => s.status === 'approved').length}</p>
          <p className="text-gray-400 text-sm">Aprovadas</p>
        </div>
      </div>

      {/* Content list */}
      <div className="grid grid-cols-1 gap-3">
        {stores.map((s) => {
          return (
            <div key={s.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <div className="font-semibold text-lg text-gray-900">{s.ownerName || s.id}</div>
                <div className="text-sm text-gray-800">Loja: <span className="font-medium text-gray-900">{(s as any).storeName || '—'}</span></div>
                <div className="text-sm text-gray-700">Email: {(s as any).ownerEmail || '—'}</div>
                <div className="text-sm text-gray-700">Telefone: {(s as any).phone || '—'}</div>
                <div className="text-sm text-gray-600 mt-1">Status: <span className="font-medium text-gray-900">{s.status || 'pending'}</span></div>
              </div>

              <div className="flex gap-2 items-center">
                {s.status === 'pending' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1 text-sm text-yellow-800">
                    <p className="font-semibold">Pendente</p>
                    <p className="text-xs text-yellow-700 mt-1">Aprovar em <a href="/admin/usuarios" className="underline font-bold">Gestão de Usuários</a></p>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-medium">✓ {(s.status === 'approved' || s.status === 'active') ? 'Aprovada' : 'Bloqueada'}</div>
                )}
                <a href={`/admin/lojas/${s.id}/editar`} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Editar</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
