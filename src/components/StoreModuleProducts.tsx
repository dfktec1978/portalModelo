"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductFormModal from "./ProductFormModal";
import InfoBanner from "@/components/InfoBanner";

type Props = { store: any };

export default function StoreModuleProducts({ store }: Props) {
  const [products, setProducts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [storeCategory, setStoreCategory] = useState<string | null>(null);

  useEffect(() => {
    if (store?.id) {
      loadProducts();
      setStoreCategory(store?.category || 'varejo');
    }
  }, [store?.id]);

  async function loadProducts() {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, store_id, name, description, price, category, images, sizes, colors, stock, has_variants, active, delivery_option, created_at, updated_at')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      const list = (data || []).map((p: any) => ({
        ...p,
        images: (() => {
          if (!p?.images) return [] as string[];
          if (Array.isArray(p.images)) return p.images as string[];
          try { return JSON.parse(p.images); } catch { return []; }
        })(),
        sizes: (() => {
          if (!p?.sizes) return [] as string[];
          if (Array.isArray(p.sizes)) return p.sizes as string[];
          try { return JSON.parse(p.sizes); } catch { return []; }
        })(),
        colors: (() => {
          if (!p?.colors) return [] as string[];
          if (Array.isArray(p.colors)) return p.colors as string[];
          try { return JSON.parse(p.colors); } catch { return []; }
        })()
      }));
      setProducts(list);
    } catch (e) {
      console.warn('failed load products', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Tem certeza?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await loadProducts();
    } catch (e) {
      alert('Erro ao deletar: ' + String(e));
    }
  }

  function openAddModal() {
    setEditingProduct(null);
    setIsModalOpen(true);
  }

  function openEditModal(product: any) {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSave() {
    await loadProducts();
  }

  return (
    <div>
      {products.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Dicas para cadastrar produtos"
          message="Use fotos de boa qualidade, descrições claras e preços atualizados. Organize por categorias e mantenha o estoque sempre atualizado para evitar vendas de produtos indisponíveis."
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
        <button onClick={openAddModal} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Adicionar</button>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        storeId={store?.id || ''}
        storeCategory={storeCategory || undefined}
        productId={editingProduct?.id || null}
        initialData={editingProduct}
      />

      {loading ? (
        <div className="p-4 text-gray-700">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="p-4 border rounded bg-white text-gray-900">Nenhum produto cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="border rounded p-4 bg-white text-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {p?.images && p.images.length > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded object-cover border" />
                )}
                <div className="truncate">
                  <div className="font-medium truncate" title={p.name}>{p.name}</div>
                </div>
              </div>
              <div className="text-right mr-4 shrink-0">
                <div className="font-semibold">R$ {Number(p.price || 0).toFixed(2)}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditModal(p)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Editar</button>
                <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Deletar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

