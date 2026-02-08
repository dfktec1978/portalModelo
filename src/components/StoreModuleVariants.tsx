"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
  stock_quantity: number;
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
    price_adjustment: 0,
    active: true
  });
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState("");

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
        .select("id, name, sku, has_variants, size_group, category")
        .eq("store_id", store.id)
        .order("name");
      
      if (error) {
        const msg = error?.message || "";
        if (msg.includes('size_group')) {
          // Fallback caso o SQL de grupos não tenha sido executado ainda
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("products")
            .select("id, name, sku, has_variants, category")
            .eq("store_id", store.id)
            .order("name");
          
          if (fallbackError) throw fallbackError;
          const patched = (fallbackData || []).map((p: any) => ({
            ...p,
            size_group: "roupas"
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
      price_adjustment: 0,
      active: true
    });
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(variant: ProductVariant) {
    setEditingVariant(variant);
    setForm({
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      stock_quantity: variant.stock_quantity ?? 0,
      price_adjustment: variant.price_adjustment ?? 0,
      active: variant.active
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingVariant(null);
    setError("");
  }

  function generateSKU(baseSku: string, color: string, size: string): string {
    const cleanBase = baseSku.toUpperCase().replace(/[^A-Z0-9]/g, "-").substring(0, 10);
    const cleanColor = color.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 5);
    const cleanSize = size.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return `${cleanBase}-${cleanSize}-${cleanColor}`;
  }

  async function handleSave() {
    if (!selectedProduct) return;
    
    if (!form.sku.trim() || !form.color || !form.size) {
      setError("SKU, Cor e Tamanho são obrigatórios!");
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
        price_adjustment: Number(form.price_adjustment) || 0,
        images: [],
        active: form.active
      };

      if (editingVariant) {
        // Atualizar
        const { error } = await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", editingVariant.id);
        
        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from("product_variants")
          .insert([payload]);
        
        if (error) throw error;
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
    } catch (e: any) {
      console.error("Erro ao deletar variação:", e);
      alert("Erro ao deletar: " + e.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🎨 Variações de Produtos</h2>
        <p className="text-purple-100">Gerencie cores, tamanhos e estoque por variação</p>
      </div>

      {/* Seletor de Produto */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
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

      {/* Lista de Variações */}
      {selectedProduct && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
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

          {loading ? (
            <p className="text-gray-600">Carregando...</p>
          ) : variants.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajuste Preço</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {variants.map(variant => {
                    const color = colors.find(c => c.name === variant.color);
                    return (
                      <tr key={variant.id} className="hover:bg-gray-50">
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
                          <span className={`text-sm font-medium ${variant.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                            {variant.stock_quantity}
                          </span>
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
                            onClick={() => openEditModal(variant)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Editar
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    <option key={color.id} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tamanho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <option key={size.id} value={size.name}>
                      {size.name}
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

              {/* Grid: Estoque e Ajuste de Preço */}
              <div className="grid grid-cols-2 gap-4">
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
