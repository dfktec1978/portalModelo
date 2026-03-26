"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ordersDashboardTokens as ui } from "@/components/ordersDashboardTokens";

type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
  stock_quantity: number;
  critical_stock?: number;
  price_adjustment: number;
  images: string[];
  active: boolean;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  has_variants: boolean;
  size_group: string;
  category: string;
  critical_stock?: number | null;
};

type Color = {
  id: string;
  name: string;
  hex_code: string;
};

type Size = {
  id: string;
  name: string;
  display_order: number;
};

type Props = { store: any };

export default function StoreModuleVariants({ store }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [allSizes, setAllSizes] = useState<Size[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<Size[]>([]);
  const [sizeGroup, setSizeGroup] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    color: "",
    size: "",
    stock_quantity: 0,
    critical_stock: 0,
    price_adjustment: 0,
    active: true
  });
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [variantFilter, setVariantFilter] = useState<'all' | 'active' | 'inactive' | 'critical' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'risk' | 'stock_asc' | 'stock_desc' | 'sku_asc'>('risk');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState("");
  const [editingCriticalId, setEditingCriticalId] = useState<string | null>(null);
  const [editingCriticalValue, setEditingCriticalValue] = useState("");

  const normalizeKey = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    if (store?.id) {
      loadProducts();
      loadColors();
      loadSizes();
    }
  }, [store?.id]);

  useEffect(() => {
    if (selectedProduct?.id) {
      loadVariants(selectedProduct.id);
    }
  }, [selectedProduct]);

  async function loadProducts() {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, has_variants, size_group, category, critical_stock")
        .eq("store_id", store.id)
        .order("name");
      
      if (error) {
        const msg = error?.message || "";
        if (msg.includes('size_group') || msg.includes('critical_stock')) {
          // Fallback caso o SQL de grupos não tenha sido executado ainda
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("products")
            .select("id, name, sku, has_variants, category")
            .eq("store_id", store.id)
            .order("name");
          
          if (fallbackError) throw fallbackError;
          const patched = (fallbackData || []).map((p: any) => ({
            ...p,
            size_group: "roupas",
            critical_stock: null
          }));
          setProducts(patched);
          return;
        }
        throw error;
      }
      setProducts(data || []);
    } catch (e: any) {
      console.error("Erro ao carregar produtos:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }

  async function loadVariants(productId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("color, size");
      
      if (error) throw error;
      setVariants(data || []);
    } catch (e: any) {
      console.error("Erro ao carregar variações:", e);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadColors() {
    try {
      const { data, error } = await supabase
        .from("product_colors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setColors(data || []);
    } catch (e: any) {
      console.error("Erro ao carregar cores:", e);
    }
  }

  async function loadSizes() {
    try {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      setAllSizes(data || []);
      setSizes(data || []);
    } catch (e: any) {
      console.error("Erro ao carregar tamanhos:", e);
    }
  }
  
  // Filtrar tamanhos quando produto ou grupo mudar
  useEffect(() => {
    if (selectedProduct && allSizes.length > 0) {
      const group = selectedProduct.size_group || "";
      setSizeGroup(group);
      const filtered = group ? allSizes.filter(s => (s as any).size_group === group) : [];
      setFilteredSizes(filtered);
    } else {
      setFilteredSizes([]);
    }
  }, [selectedProduct, allSizes]);

  function openAddModal() {
    if (!selectedProduct) {
      setError("Selecione um produto primeiro!");
      return;
    }

    if (filteredSizes.length === 0) {
      setError("Defina o grupo de tamanhos no produto antes de adicionar variação.");
      return;
    }
    
    setEditingVariant(null);
    const availableSizes = filteredSizes;
    setForm({
      sku: generateSKU(selectedProduct.sku || selectedProduct.name, "", ""),
      color: colors[0]?.name || "",
      size: availableSizes[0]?.name || "",
      stock_quantity: 0,
      critical_stock: 0,
      price_adjustment: 0,
      active: true
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function openEditModal(variant: ProductVariant) {
    setEditingVariant(variant);
    setForm({
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      stock_quantity: variant.stock_quantity ?? 0,
      critical_stock: variant.critical_stock ?? 0,
      price_adjustment: variant.price_adjustment ?? 0,
      active: variant.active
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingVariant(null);
    setError("");
  }

  function duplicateVariant(variant: ProductVariant) {
    if (!selectedProduct) return;
    setEditingVariant(null);
    setForm({
      sku: generateSKU(selectedProduct.sku || selectedProduct.name, variant.color, variant.size),
      color: variant.color,
      size: variant.size,
      stock_quantity: variant.stock_quantity ?? 0,
      critical_stock: variant.critical_stock ?? 0,
      price_adjustment: variant.price_adjustment ?? 0,
      active: variant.active,
    });
    setError("Revise a combinação de cor e tamanho antes de salvar a cópia.");
    setSuccess("");
    setIsModalOpen(true);
  }

  function generateSKU(baseSku: string, color: string, size: string): string {
    const cleanBase = baseSku.toUpperCase().replace(/[^A-Z0-9]/g, "-").substring(0, 10);
    const cleanColor = color.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 5);
    const cleanSize = size.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return `${cleanBase}-${cleanSize}-${cleanColor}`;
  }

  const productCriticalThreshold = useMemo(() => {
    const value = Number(selectedProduct?.critical_stock);
    if (!Number.isFinite(value) || value <= 0) return 10;
    return value;
  }, [selectedProduct?.critical_stock]);

  const duplicateComboSet = useMemo(() => {
    return new Set(
      variants
        .filter((variant) => !editingVariant || variant.id !== editingVariant.id)
        .map((variant) => `${normalizeKey(variant.color)}||${normalizeKey(variant.size)}`)
    );
  }, [variants, editingVariant]);

  function isDuplicateCombo(color: string, size: string) {
    if (!color || !size) return false;
    return duplicateComboSet.has(`${normalizeKey(color)}||${normalizeKey(size)}`);
  }

  function getVariantThreshold(variant: ProductVariant) {
    const value = Number(variant.critical_stock);
    if (Number.isFinite(value) && value > 0) return value;
    return productCriticalThreshold;
  }

  const disabledColorSet = useMemo(() => {
    const set = new Set<string>();
    if (!form.size) return set;
    colors.forEach((color) => {
      if (isDuplicateCombo(color.name, form.size)) {
        set.add(normalizeKey(color.name));
      }
    });
    return set;
  }, [colors, form.size, duplicateComboSet]);

  const disabledSizeSet = useMemo(() => {
    const set = new Set<string>();
    if (!form.color) return set;
    filteredSizes.forEach((size) => {
      if (isDuplicateCombo(form.color, size.name)) {
        set.add(normalizeKey(size.name));
      }
    });
    return set;
  }, [filteredSizes, form.color, duplicateComboSet]);

  async function saveInlineStock(variant: ProductVariant) {
    const parsed = parseInt(editingStockValue);
    if (isNaN(parsed) || parsed < 0) {
      setError('Informe um estoque válido (>= 0).');
      return;
    }
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock_quantity: parsed })
        .eq('id', variant.id);
      if (error) throw error;
      setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, stock_quantity: parsed } : v));
      setEditingStockId(null);
      setEditingStockValue('');
      setSuccess('Estoque da variação atualizado.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erro ao atualizar estoque: ' + (e?.message || 'falha desconhecida'));
    }
  }

  async function saveInlineCritical(variant: ProductVariant) {
    const parsed = editingCriticalValue.trim() === '' ? 0 : parseInt(editingCriticalValue);
    if (isNaN(parsed) || parsed < 0) {
      setError('Informe um limite crítico válido (>= 0).');
      return;
    }
    const normalized = parsed > 0 ? parsed : null;
    try {
      const updateAttempt = await supabase
        .from('product_variants')
        .update({ critical_stock: normalized })
        .eq('id', variant.id);

      if (updateAttempt.error && /column .*critical_stock|schema cache/i.test(String(updateAttempt.error.message || ''))) {
        setError('Seu banco ainda não possui a coluna de limite crítico para variações.');
        return;
      }
      if (updateAttempt.error) throw updateAttempt.error;

      setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, critical_stock: normalized ?? undefined } : v));
      setEditingCriticalId(null);
      setEditingCriticalValue('');
      setSuccess('Limite crítico da variação atualizado.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erro ao atualizar limite crítico: ' + (e?.message || 'falha desconhecida'));
    }
  }

  async function handleSave() {
    if (!selectedProduct) return;
    
    if (!form.sku.trim() || !form.color || !form.size) {
      setError("SKU, Cor e Tamanho são obrigatórios!");
      return;
    }

    const duplicateLocal = variants.some((variant) => {
      if (editingVariant && variant.id === editingVariant.id) return false;
      return normalizeKey(variant.color) === normalizeKey(form.color)
        && normalizeKey(variant.size) === normalizeKey(form.size);
    });

    if (duplicateLocal) {
      setError("Já existe uma variação com essa combinação de cor e tamanho.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        product_id: selectedProduct.id,
        sku: form.sku.toUpperCase(),
        color: form.color,
        size: form.size,
        stock_quantity: Number(form.stock_quantity) || 0,
        critical_stock: Number(form.critical_stock) > 0 ? Number(form.critical_stock) : null,
        price_adjustment: Number(form.price_adjustment) || 0,
        images: [],
        active: form.active
      };

      if (editingVariant) {
        // Atualizar
        const updateAttempt = await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", editingVariant.id);

        if (updateAttempt.error && /column .*critical_stock|schema cache/i.test(String(updateAttempt.error.message || ''))) {
          const { critical_stock, ...fallbackPayload } = payload;
          const fallbackUpdate = await supabase
            .from("product_variants")
            .update(fallbackPayload)
            .eq("id", editingVariant.id);
          if (fallbackUpdate.error) throw fallbackUpdate.error;
        } else if (updateAttempt.error) {
          throw updateAttempt.error;
        }
      } else {
        // Criar
        const insertAttempt = await supabase
          .from("product_variants")
          .insert([payload]);

        if (insertAttempt.error && /column .*critical_stock|schema cache/i.test(String(insertAttempt.error.message || ''))) {
          const { critical_stock, ...fallbackPayload } = payload;
          const fallbackInsert = await supabase
            .from("product_variants")
            .insert([fallbackPayload]);
          if (fallbackInsert.error) throw fallbackInsert.error;
        } else if (insertAttempt.error) {
          throw insertAttempt.error;
        }
      }

      // Marcar produto como tendo variações
      if (!selectedProduct.has_variants) {
        await supabase
          .from("products")
          .update({ has_variants: true })
          .eq("id", selectedProduct.id);
        
        setSelectedProduct({ ...selectedProduct, has_variants: true });
      }

      await loadVariants(selectedProduct.id);
      setSuccess(editingVariant ? "Variação atualizada com sucesso." : "Variação cadastrada com sucesso.");
      closeModal();
    } catch (e: any) {
      console.error("Erro ao salvar variação:", e);
      if (e.message.includes("duplicate")) {
        setError("⚠️ Já existe uma variação com este SKU ou Cor+Tamanho!");
      } else {
        setError("Erro ao salvar: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(variantId: string) {
    if (!confirm("Deseja realmente excluir esta variação?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);
      
      if (error) throw error;
      
      if (selectedProduct) {
        await loadVariants(selectedProduct.id);
      }
      setSuccess("Variação removida com sucesso.");
    } catch (e: any) {
      console.error("Erro ao deletar variação:", e);
      alert("Erro ao deletar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVariantActive(variant: ProductVariant) {
    try {
      const nextActive = !variant.active;
      const { error } = await supabase
        .from('product_variants')
        .update({ active: nextActive })
        .eq('id', variant.id);
      if (error) throw error;
      setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, active: nextActive } : v));
      setSuccess(nextActive ? 'Variação ativada.' : 'Variação inativada.');
      setTimeout(() => setSuccess(''), 2200);
    } catch (e: any) {
      console.error('Erro ao alterar status da variação:', e);
      setError('Erro ao alterar status da variação');
    }
  }

  // Atualizar SKU quando cor ou tamanho mudar
  useEffect(() => {
    if (!editingVariant && selectedProduct && form.color && form.size) {
      const newSKU = generateSKU(
        selectedProduct.sku || selectedProduct.name,
        form.color,
        form.size
      );
      setForm(prev => ({ ...prev, sku: newSKU }));
    }
  }, [form.color, form.size, selectedProduct, editingVariant]);

  const visibleVariants = variants
    .filter((variant) => {
      const stockValue = variant.stock_quantity ?? 0;
      const threshold = getVariantThreshold(variant);
      if (variantFilter === 'active' && !variant.active) return false;
      if (variantFilter === 'inactive' && variant.active) return false;
      if (variantFilter === 'critical' && !(stockValue > 0 && stockValue <= threshold)) return false;
      if (variantFilter === 'out' && stockValue > 0) return false;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return [variant.sku, variant.color, variant.size].some((field) => String(field || '').toLowerCase().includes(q));
    });

  const sortedVisibleVariants = [...visibleVariants].sort((a, b) => {
    const stockA = a.stock_quantity ?? 0;
    const stockB = b.stock_quantity ?? 0;

    if (sortBy === 'sku_asc') {
      return String(a.sku || '').localeCompare(String(b.sku || ''), 'pt-BR');
    }
    if (sortBy === 'stock_asc') return stockA - stockB;
    if (sortBy === 'stock_desc') return stockB - stockA;

    // risk: sem estoque > crítico > ok
    const thresholdA = getVariantThreshold(a);
    const thresholdB = getVariantThreshold(b);
    const rankA = stockA <= 0 ? 0 : stockA <= thresholdA ? 1 : 2;
    const rankB = stockB <= 0 ? 0 : stockB <= thresholdB ? 1 : 2;
    if (rankA !== rankB) return rankA - rankB;
    if (stockA !== stockB) return stockA - stockB;
    return String(a.sku || '').localeCompare(String(b.sku || ''), 'pt-BR');
  });

  const riskSummary = useMemo(() => {
    const out = sortedVisibleVariants.filter((variant) => (variant.stock_quantity ?? 0) <= 0).length;
    const critical = sortedVisibleVariants.filter((variant) => {
      const stock = variant.stock_quantity ?? 0;
      const threshold = getVariantThreshold(variant);
      return stock > 0 && stock <= threshold;
    }).length;
    return { out, critical };
  }, [sortedVisibleVariants, productCriticalThreshold]);

  const variantStats = {
    total: variants.length,
    active: variants.filter(v => v.active).length,
    inactive: variants.filter(v => !v.active).length,
    out: variants.filter(v => (v.stock_quantity ?? 0) <= 0).length,
  };

  const hasActiveView = variantFilter !== 'all' || searchTerm.trim() !== '' || sortBy !== 'risk';

  return (
    <div className={ui.stack}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🎨 Variações de Produtos</h2>
        <p className="text-purple-100">Gerencie cores, tamanhos e estoque por variação</p>
      </div>

      {/* Seletor de Produto */}
      <div className={`${ui.panel} p-4`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione um Produto
        </label>
        <select
          value={selectedProduct?.id || ""}
          onChange={(e) => {
            const prod = products.find(p => p.id === e.target.value);
            setSelectedProduct(prod || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Selecione um produto --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.has_variants ? "✓ (com variações)" : ""}
            </option>
          ))}
        </select>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Lista de Variações */}
      {selectedProduct && (
        <div className={`${ui.panel} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Variações de "{selectedProduct.name}"
            </h3>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              + Adicionar Variação
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className={`${ui.statCard} bg-purple-50 border-purple-200`}>
              <div className="text-lg font-bold text-purple-900">{variantStats.total}</div>
              <div className="text-xs text-purple-700">Total</div>
            </div>
            <div className={`${ui.statCard} bg-green-50 border-green-200`}>
              <div className="text-lg font-bold text-green-900">{variantStats.active}</div>
              <div className="text-xs text-green-700">Ativas</div>
            </div>
            <div className={`${ui.statCard} bg-gray-50 border-gray-200`}>
              <div className="text-lg font-bold text-gray-900">{variantStats.inactive}</div>
              <div className="text-xs text-gray-700">Inativas</div>
            </div>
            <div className={`${ui.statCard} bg-red-50 border-red-200`}>
              <div className="text-lg font-bold text-red-900">{variantStats.out}</div>
              <div className="text-xs text-red-700">Sem estoque</div>
            </div>
          </div>

          <div className={`${ui.toolbar} mb-4`}>
            <input
              type="text"
              placeholder="Buscar por SKU, cor ou tamanho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${ui.inputBase} min-w-[240px]`}
            />
            <div className={ui.sectionDivider} />
            <button onClick={() => setVariantFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${variantFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todas</button>
            <button onClick={() => setVariantFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${variantFilter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ativas</button>
            <button onClick={() => setVariantFilter('inactive')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${variantFilter === 'inactive' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Inativas</button>
            <button onClick={() => setVariantFilter('critical')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${variantFilter === 'critical' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Críticos</button>
            <button onClick={() => setVariantFilter('out')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${variantFilter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Sem estoque</button>
            <div className={ui.sectionDivider} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={ui.selectBase}
            >
              <option value="risk">Ordenar: risco</option>
              <option value="stock_asc">Ordenar: menor estoque</option>
              <option value="stock_desc">Ordenar: maior estoque</option>
              <option value="sku_asc">Ordenar: SKU (A-Z)</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setVariantFilter('all');
                setSortBy('risk');
              }}
              disabled={!hasActiveView}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Resetar visão
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setVariantFilter('out')}
              className={`inline-flex px-2.5 py-1 rounded-full font-medium ${variantFilter === 'out' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
            >
              Sem estoque: {riskSummary.out}
            </button>
            <button
              onClick={() => setVariantFilter('critical')}
              className={`inline-flex px-2.5 py-1 rounded-full font-medium ${variantFilter === 'critical' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
            >
              Críticos: {riskSummary.critical}
            </button>
            <button
              onClick={() => setVariantFilter('all')}
              className={`inline-flex px-2.5 py-1 rounded-full font-medium ${variantFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Exibindo: {sortedVisibleVariants.length}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Carregando...</p>
          ) : visibleVariants.length === 0 ? (
            <div className={ui.emptyPanel}>
              <p className="text-gray-500 mb-2">Nenhuma variação cadastrada</p>
              <p className="text-sm text-gray-400">Clique em "Adicionar Variação" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crítico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajuste Preço</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedVisibleVariants.map(variant => {
                    const color = colors.find(c => c.name === variant.color);
                    const threshold = getVariantThreshold(variant);
                    const stockValue = variant.stock_quantity ?? 0;
                    const isOut = stockValue <= 0;
                    const isCritical = stockValue > 0 && stockValue <= threshold;
                    return (
                      <tr key={variant.id} className={`hover:bg-gray-50 ${isOut ? 'bg-red-50' : isCritical ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{variant.sku}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border border-gray-300"
                              style={{ backgroundColor: color?.hex_code || "#ccc" }}
                            />
                            <span className="text-sm text-gray-900">{variant.color}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{variant.size}</td>
                        <td className="px-4 py-3">
                          {editingStockId === variant.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editingStockValue}
                                onChange={(e) => setEditingStockValue(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                autoFocus
                              />
                              <button onClick={() => saveInlineStock(variant)} className="text-xs px-2 py-1 bg-green-600 text-white rounded">Salvar</button>
                              <button
                                onClick={() => {
                                  setEditingStockId(null);
                                  setEditingStockValue("");
                                }}
                                className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStockId(variant.id);
                                setEditingStockValue(String(stockValue));
                                setError("");
                              }}
                              className={`text-sm font-medium px-2 py-1 rounded ${isOut ? "text-red-700 bg-red-100" : isCritical ? "text-amber-700 bg-amber-100" : "text-green-700 bg-green-100"}`}
                              title="Clique para editar estoque"
                            >
                              {stockValue}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {editingCriticalId === variant.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editingCriticalValue}
                                onChange={(e) => setEditingCriticalValue(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                placeholder={String(productCriticalThreshold)}
                                autoFocus
                              />
                              <button onClick={() => saveInlineCritical(variant)} className="text-xs px-2 py-1 bg-green-600 text-white rounded">Salvar</button>
                              <button
                                onClick={() => {
                                  setEditingCriticalId(null);
                                  setEditingCriticalValue("");
                                }}
                                className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCriticalId(variant.id);
                                setEditingCriticalValue((variant.critical_stock ?? 0) > 0 ? String(variant.critical_stock) : "");
                                setError("");
                              }}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                              title="Clique para editar limite crítico"
                            >
                              {threshold}
                            </button>
                          )}
                          <div className="mt-1">
                            {isOut ? (
                              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-100 text-red-700">Sem estoque</span>
                            ) : isCritical ? (
                              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-700">Crítico</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-100 text-green-700">OK</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {variant.price_adjustment > 0 ? `+R$ ${variant.price_adjustment.toFixed(2)}` : 
                           variant.price_adjustment < 0 ? `-R$ ${Math.abs(variant.price_adjustment).toFixed(2)}` : 
                           "R$ 0,00"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            variant.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {variant.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => toggleVariantActive(variant)}
                            className={`text-sm ${variant.active ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {variant.active ? 'Inativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => openEditModal(variant)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => duplicateVariant(variant)}
                            className="text-sm text-purple-600 hover:text-purple-800"
                          >
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleDelete(variant.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Adicionar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${ui.modalCard} shadow-xl`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingVariant ? "Editar Variação" : "Nova Variação"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione uma cor</option>
                  {colors.map(color => (
                    <option
                      key={color.id}
                      value={color.name}
                      disabled={disabledColorSet.has(normalizeKey(color.name))}
                    >
                      {color.name}{disabledColorSet.has(normalizeKey(color.name)) ? ' (já usada)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tamanho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho <span className="text-red-500">*</span>
                  {sizeGroup && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({sizeGroup === 'roupas' ? '📦 Roupas' : 
                        sizeGroup === 'calcados' ? '👟 Calçados' : 
                        sizeGroup === 'infantil' ? '👶 Infantil' : 
                        sizeGroup === 'lingerie' ? '👙 Lingerie' : sizeGroup})
                    </span>
                  )}
                </label>
                <select
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione um tamanho</option>
                  {filteredSizes.map(size => (
                    <option
                      key={size.id}
                      value={size.name}
                      disabled={disabledSizeSet.has(normalizeKey(size.name))}
                    >
                      {size.name}{disabledSizeSet.has(normalizeKey(size.name)) ? ' (já usado)' : ''}
                    </option>
                  ))}
                </select>
                {filteredSizes.length === 0 && selectedProduct && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Defina o "Grupo de Tamanhos" no produto primeiro.{' '}
                    <Link href="/dashboard?view=products" className="underline font-semibold">
                      Editar produto
                    </Link>
                  </p>
                )}
              </div>

              {form.color && form.size && isDuplicateCombo(form.color, form.size) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                  Essa combinação de cor e tamanho já existe. Escolha outra opção.
                </div>
              )}

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="PROD-M-PRETO"
                />
                <p className="text-xs text-gray-500 mt-1">Gerado automaticamente, mas pode ser editado</p>
              </div>

              {/* Grid: Estoque, Crítico e Ajuste de Preço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite Crítico
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.critical_stock}
                    onChange={(e) => setForm({ ...form, critical_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 usa limite padrão do produto no estoque.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajuste de Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price_adjustment ?? 0}
                    onChange={(e) => setForm({ ...form, price_adjustment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ex: +10 para tamanhos maiores</p>
                </div>
              </div>

              {/* Status Ativo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Variação ativa (disponível para venda)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : editingVariant ? "Atualizar" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
