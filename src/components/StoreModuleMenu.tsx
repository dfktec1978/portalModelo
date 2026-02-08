"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductFormModal from "./ProductFormModal";
import InfoBanner from "@/components/InfoBanner";

type Props = { store: any };

export default function StoreModuleMenu({ store }: Props) {
  const [items, setItems] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (!store?.id) return;
    let mounted = true;
    (async () => {
      await loadItems(mounted);
    })();
    return () => { mounted = false; };
  }, [store?.id]);

  async function loadItems(mountedFlag = true) {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const list = (data || []).map((p: any) => ({
        ...p,
        images: (() => {
          if (!p?.images) return [] as string[];
          if (Array.isArray(p.images)) return p.images as string[];
          try { return JSON.parse(p.images); } catch { return []; }
        })()
      }));
      if (mountedFlag) setItems(list);
    } catch (e) {
      if (mountedFlag) setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingItem(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: any) {
    setEditingItem(item);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingItem(null);
  }

  async function handleSave() {
    await loadItems();
  }

  async function deleteItem(id: string) {
    if (!confirm('Tem certeza?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await loadItems();
    } catch (err) {
      alert('Erro ao deletar: ' + String(err));
    }
  }

  return (
    <div>
      {items.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Dicas para um cardápio atrativo"
          message="Capriche nas descrições! Detalhe ingredientes, porções e diferenciais. Fotos chamativas aumentam as vendas. Organize por categorias (Lanches, Bebidas, Sobremesas) e mantenha preços atualizados."
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cardápio</h3>
        <button onClick={openAddModal} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Adicionar</button>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        storeId={store?.id || ''}
        storeCategory="alimentacao"
        productId={editingItem?.id || null}
        initialData={editingItem}
      />

      {loading ? (
        <div className="p-4 text-gray-700">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="p-4 border rounded bg-white text-gray-900">Nenhum item no cardápio ainda.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it: any) => (
            <li key={it.id} className="border rounded p-3 flex items-center justify-between bg-white text-gray-900">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {it?.images && it.images.length > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.images[0]} alt={it.name} className="w-12 h-12 rounded object-cover border" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" title={it.name}>{it.name}</div>
                  {it.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2" title={it.description}>
                      {it.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right mr-4 shrink-0">R$ {Number(it.price || 0).toFixed(2)}</div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditModal(it)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Editar</button>
                <button onClick={() => deleteItem(it.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Deletar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
