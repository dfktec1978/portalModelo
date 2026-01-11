"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { updateStore, createStore } from "@/lib/adminQueries";
import externalStores from "@/data/externalStores";

type Props = { params: { id: string } };

export default function EditStorePage({ params }: Props) {
  const id = params.id;
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('stores').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!mounted) return;
        if (data) {
          setStore(data || null);
        } else {
          // fallback to externalStores if present
          const ext = (externalStores || []).find((e: any) => String(e.id) === String(id));
          if (ext) setStore({ ...ext, _externalOnly: true } as any);
          else setStore(null);
        }
      } catch (e) {
        console.error('Erro ao carregar loja:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (store._externalOnly) {
        // create a new store record in DB
        await createStore(id, {
          storeName: store.store_name || store.storeName,
          description: store.description,
          external_url: store.external_url,
          logo: store.logo || store.logo_url || null,
          status: store.status || 'approved',
        } as any);
        alert('Loja criada no banco e atualizada');
      } else {
        await updateStore(id, {
          storeName: store.store_name || store.storeName,
          description: store.description,
          external_url: store.external_url,
          logo: store.logo || store.logo_url || null,
        } as any);
        alert('Loja atualizada');
      }
      router.push('/admin/lojas');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!store) return <div className="p-6">Loja não encontrada.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Editar Loja</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded shadow space-y-4 max-w-2xl">
        <div>
          <label className="form-label">Nome da Loja</label>
          <input value={store.store_name || ''} onChange={(e) => setStore({ ...store, store_name: e.target.value })} className="form-input" />
        </div>

        <div>
          <label className="form-label">Descrição</label>
          <textarea value={store.description || ''} onChange={(e) => setStore({ ...store, description: e.target.value })} className="form-input h-28" />
        </div>

        <div>
          <label className="form-label">URL Externa (Site)</label>
          <input value={store.external_url || ''} onChange={(e) => setStore({ ...store, external_url: e.target.value })} className="form-input" placeholder="https://" />
        </div>

        <div>
          <label className="form-label">Logo (URL)</label>
          <input value={store.logo || store.logo_url || ''} onChange={(e) => setStore({ ...store, logo: e.target.value })} className="form-input" />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" onClick={() => router.push('/admin/lojas')} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
