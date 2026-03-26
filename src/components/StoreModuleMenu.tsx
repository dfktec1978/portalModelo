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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!store?.id) return;
    let mounted = true;
    (async () => { await loadItems(mounted); })();
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
        .order('category', { ascending: true })
        .order('name', { ascending: true });
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

  async function toggleAvailable(id: string, currentActive: boolean) {
    setTogglingId(id);
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setItems(prev => prev.map(it => it.id === id ? { ...it, active: !currentActive } : it));
    } catch {
      alert('Erro ao atualizar disponibilidade');
    } finally {
      setTogglingId(null);
    }
  }

  function openAddModal() { setEditingItem(null); setIsModalOpen(true); }
  function openEditModal(item: any) { setEditingItem(item); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setEditingItem(null); }
  async function handleSave() { await loadItems(); }

  async function deleteItem(id: string) {
    if (!confirm('Tem certeza que deseja remover este item?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await loadItems();
    } catch (err) {
      alert('Erro ao deletar: ' + String(err));
    }
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  // Filtro e agrupamento por categoria
  const filtered = items.filter(it =>
    !searchTerm || it.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filtered.reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const availableCount = items.filter(it => it.active !== false).length;

  return (
    <div className="space-y-4">
      {items.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Dicas para um cardápio atrativo"
          message="Capriche nas descrições! Detalhe ingredientes, porções e diferenciais. Fotos chamativas aumentam as vendas. Organize por categorias (Lanches, Bebidas, Sobremesas) e mantenha preços atualizados."
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🍽️ Cardápio</h3>
          {items.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {availableCount} disponíveis · {items.length - availableCount} indisponíveis
            </p>
          )}
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          + Adicionar item
        </button>
      </div>

      {/* Barra de busca */}
      {items.length > 4 && (
        <input
          type="text"
          placeholder="🔍 Buscar item no cardápio..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        storeId={store?.id || ''}
        storeCategory={store?.category || 'alimentacao'}
        productId={editingItem?.id || null}
        initialData={editingItem}
      />

      {loading ? (
        <div className="py-8 text-center text-gray-500">Carregando cardápio...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center border rounded-lg bg-white text-gray-500">
          {searchTerm ? 'Nenhum item encontrado para a busca.' : 'Nenhum item no cardápio ainda.'}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => {
            const isCollapsed = collapsedCategories.has(category);
            const availableInCat = (catItems as any[]).filter(it => it.active !== false).length;
            return (
              <div key={category}>
                {/* Cabeçalho da categoria */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-2"
                >
                  <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    {category}
                    <span className="ml-2 font-normal text-gray-400">
                      {availableInCat}/{(catItems as any[]).length}
                    </span>
                  </span>
                  <span className="text-gray-400 text-xs">{isCollapsed ? '▶' : '▼'}</span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-2">
                    {(catItems as any[]).map((it: any) => {
                      const isAvailable = it.active !== false;
                      const isToggling = togglingId === it.id;
                      return (
                        <div
                          key={it.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition-opacity ${
                            isAvailable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {it.images && it.images.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.images[0]} alt={it.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xl text-gray-300">🍽️</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm text-gray-900 truncate ${!isAvailable ? 'line-through text-gray-400' : ''}`} title={it.name}>
                                {it.name}
                              </span>
                              {!isAvailable && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Indisponível</span>
                              )}
                            </div>
                            {it.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{it.description}</p>
                            )}
                            <p className="text-sm font-bold text-green-700 mt-0.5">R$ {Number(it.price || 0).toFixed(2)}</p>
                          </div>

                          {/* Toggle disponibilidade */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => toggleAvailable(it.id, isAvailable)}
                              title={isAvailable ? 'Marcar como indisponível' : 'Marcar como disponível'}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                              } ${isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => openEditModal(it)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteItem(it.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
