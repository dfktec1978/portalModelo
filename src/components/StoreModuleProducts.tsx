"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductFormModal from "./ProductFormModal";
import InfoBanner from "@/components/InfoBanner";
import { ordersDashboardTokens as ui } from "@/components/ordersDashboardTokens";

type Props = { store: any };

export default function StoreModuleProducts({ store }: Props) {
  const [products, setProducts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'inactive' | 'out_of_stock' | 'with_variants'>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc' | 'price_desc' | 'price_asc'>('updated_desc');
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (store?.id) {
      loadProducts();
    }
  }, [store?.id]);

  async function loadProducts() {
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

  function duplicateProduct(product: any) {
    const draftCopy = {
      ...product,
      id: null,
      name: `${product.name} (Cópia)`,
      active: false,
      created_at: undefined,
      updated_at: undefined,
    };
    setEditingProduct(draftCopy);
    setIsModalOpen(true);
    setMessage('Cópia carregada no formulário. Revise e clique em salvar para criar o novo produto.');
    setTimeout(() => setMessage(''), 3500);
  }

  async function toggleAvailable(id: string, currentActive: boolean) {
    setTogglingId(id);
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(it => it.id === id ? { ...it, active: !currentActive } : it));
    } catch {
      alert('Erro ao atualizar disponibilidade');
    } finally {
      setTogglingId(null);
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

  function toggleCategory(cat: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const filtered = products
    .filter((p) => {
      const matchesSearch = !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (quickFilter === 'active') return p.active !== false;
      if (quickFilter === 'inactive') return p.active === false;
      if (quickFilter === 'out_of_stock') return !p.has_variants && (p.stock ?? 0) <= 0;
      if (quickFilter === 'with_variants') return !!p.has_variants;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
      if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    });

  const grouped = filtered.reduce((acc: Record<string, any[]>, product: any) => {
    const cat = product.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  const activeCount = products.filter((p) => p.active !== false).length;
  const outOfStockCount = products.filter((p) => (p.stock ?? 0) <= 0).length;
  const variantsCount = products.filter((p) => p.has_variants).length;

  return (
    <div className={ui.stack}>
      {products.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Dicas para cadastrar produtos"
          message="Use fotos de boa qualidade, descrições claras e preços atualizados. Organize por categorias e mantenha o estoque sempre atualizado para evitar vendas de produtos indisponíveis."
        />
      )}

      <div className={ui.headerRow}>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">📦 Produtos</h3>
          <p className="text-xs text-gray-500 mt-0.5">{activeCount} ativos · {products.length - activeCount} inativos</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Adicionar produto
        </button>
      </div>

      {message && (
        <div className={`${ui.message} bg-blue-50 border border-blue-200 text-blue-800`}>{message}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${ui.statCard} bg-blue-50 border-blue-200`}>
          <div className="text-2xl font-bold text-blue-900">{products.length}</div>
          <div className="text-sm text-blue-700">Total de Produtos</div>
        </div>
        <div className={`${ui.statCard} bg-green-50 border-green-200`}>
          <div className="text-2xl font-bold text-green-900">{activeCount}</div>
          <div className="text-sm text-green-700">Ativos</div>
        </div>
        <div className={`${ui.statCard} bg-yellow-50 border-yellow-200`}>
          <div className="text-2xl font-bold text-yellow-900">{outOfStockCount}</div>
          <div className="text-sm text-yellow-700">Sem Estoque</div>
        </div>
        <div className={`${ui.statCard} bg-purple-50 border-purple-200`}>
          <div className="text-2xl font-bold text-purple-900">{variantsCount}</div>
          <div className="text-sm text-purple-700">Com Variações</div>
        </div>
      </div>

      {products.length > 4 && (
        <input
          type="text"
          placeholder="🔍 Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      <div className={ui.toolbar}>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setQuickFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${quickFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos</button>
          <button onClick={() => setQuickFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${quickFilter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ativos</button>
          <button onClick={() => setQuickFilter('inactive')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${quickFilter === 'inactive' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Inativos</button>
          <button onClick={() => setQuickFilter('out_of_stock')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${quickFilter === 'out_of_stock' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Sem estoque</button>
          <button onClick={() => setQuickFilter('with_variants')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${quickFilter === 'with_variants' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Com variações</button>
        </div>
        <div className={ui.sectionDivider} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={`${ui.selectBase} text-xs`}
          >
            <option value="updated_desc">Mais recentes</option>
            <option value="name_asc">Nome (A-Z)</option>
            <option value="price_desc">Maior preço</option>
            <option value="price_asc">Menor preço</option>
          </select>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        storeId={store?.id || ''}
        storeCategory={store?.category || 'varejo'}
        productId={editingProduct?.id || null}
        initialData={editingProduct}
      />

      {loading ? (
        <div className="py-8 text-center text-gray-500">Carregando produtos...</div>
      ) : filtered.length === 0 ? (
        <div className={ui.emptyPanel}>
          {searchTerm ? 'Nenhum produto encontrado para essa busca.' : 'Nenhum produto cadastrado.'}
        </div>
      ) : (
        <div className={ui.stack}>
          {Object.entries(grouped).map(([category, catProducts]) => {
            const isCollapsed = collapsedCategories.has(category);
            const activeInCategory = (catProducts as any[]).filter((p) => p.active !== false).length;
            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-2"
                >
                  <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    {category}
                    <span className="ml-2 font-normal text-gray-400">
                      {activeInCategory}/{(catProducts as any[]).length}
                    </span>
                  </span>
                  <span className="text-gray-400 text-xs">{isCollapsed ? '▶' : '▼'}</span>
                </button>

                {!isCollapsed && (
                  <div className={ui.listContainer}>
                    {(catProducts as any[]).map((p: any) => {
                      const isActive = p.active !== false;
                      const isToggling = togglingId === p.id;
                      const stockValue = p.stock ?? 0;
                      return (
                        <div
                          key={p.id}
                          className={`rounded-xl border p-3 bg-white transition-opacity ${isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              {p?.images && p.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xl text-gray-300">📦</div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-sm text-gray-900 truncate ${!isActive ? 'line-through text-gray-400' : ''}`} title={p.name}>
                                  {p.name}
                                </span>
                                {!isActive && (
                                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Inativo</span>
                                )}
                                {p.has_variants && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Com variações</span>
                                )}
                                {stockValue <= 0 && !p.has_variants && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Sem estoque</span>
                                )}
                              </div>

                              {p.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                              )}

                              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                <span>R$ {Number(p.price || 0).toFixed(2)}</span>
                                {!p.has_variants && <span>Estoque: {stockValue}</span>}
                                <span>Crítico: {Number.isFinite(Number(p.critical_stock)) ? Number(p.critical_stock) : 10}</span>
                                <span>Atualizado: {new Date(p.updated_at || p.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => toggleAvailable(p.id, isActive)}
                                title={isActive ? 'Marcar como inativo' : 'Marcar como ativo'}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                              </button>

                              <button
                                onClick={() => duplicateProduct(p)}
                                className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Duplicar"
                              >
                                📄
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover"
                              >
                                🗑️
                              </button>
                            </div>
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

