"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Variant {
  id?: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment?: number;
  sku: string;
  images?: string[];
  active?: boolean;
  _isNew?: boolean;
}

interface Props {
  productId: string | null;
  basePrice: number;
  sizeGroup?: string;
  onVariantsChange?: (variants: Variant[]) => void;
}

export default function ProductVariantsManager({ productId, basePrice, sizeGroup: sizeGroupProp, onVariantsChange }: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [colorOptions, setColorOptions] = useState<Array<{ name: string; hex_code?: string }>>([]);
  const [newColorHex, setNewColorHex] = useState<Record<number, string>>({});
  const [customColorMode, setCustomColorMode] = useState<Record<number, boolean>>({});
  const [sizeGroup, setSizeGroup] = useState<string>('roupas');
  const [allSizes, setAllSizes] = useState<Array<{ name: string; size_group?: string; display_order?: number }>>([]);
  const [filteredSizes, setFilteredSizes] = useState<Array<{ name: string; size_group?: string; display_order?: number }>>([]);

  // Carregar variantes existentes ao editar produto
  useEffect(() => {
    if (productId) {
      loadVariants();
      loadProductSizeGroup();
    } else {
      setVariants([]);
    }
  }, [productId]);

  useEffect(() => {
    if (sizeGroupProp) {
      setSizeGroup(sizeGroupProp);
    }
  }, [sizeGroupProp]);

  useEffect(() => {
    loadColorOptions();
    loadSizes();
  }, []);

  // Notificar componente pai sobre mudanças
  useEffect(() => {
    onVariantsChange?.(variants);
  }, [variants, onVariantsChange]);

  async function loadVariants() {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size, color');
      
      if (error) throw error;
      setVariants(data || []);
    } catch (e) {
      console.error('Erro ao carregar variantes:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadColorOptions() {
    try {
      const { data, error } = await supabase
        .from('product_colors')
        .select('name, hex_code')
        .order('name');

      if (error) throw error;
      setColorOptions(data || []);
    } catch (e) {
      console.warn('Erro ao carregar cores:', e);
      setColorOptions([]);
    }
  }

  async function loadProductSizeGroup() {
    if (!productId) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('size_group')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!sizeGroupProp) {
        setSizeGroup(data?.size_group || 'roupas');
      }
    } catch (e) {
      console.warn('Erro ao carregar size_group:', e);
      if (!sizeGroupProp) {
        setSizeGroup('roupas');
      }
    }
  }

  async function loadSizes() {
    try {
      const { data, error } = await supabase
        .from('product_sizes')
        .select('name, size_group, display_order')
        .order('display_order')
        .order('name');

      if (error) throw error;
      setAllSizes(data || []);
    } catch (e) {
      console.warn('Erro ao carregar tamanhos:', e);
      setAllSizes([]);
    }
  }

  useEffect(() => {
    if (allSizes.length === 0) {
      setFilteredSizes([]);
      return;
    }
    const filtered = allSizes.filter((s) => (s as any).size_group === sizeGroup);
    setFilteredSizes(filtered.length > 0 ? filtered : allSizes);
  }, [allSizes, sizeGroup]);

  const isColorNew = (colorName: string) => {
    const name = colorName.trim().toLowerCase();
    if (!name) return false;
    return !colorOptions.some((opt) => opt.name.trim().toLowerCase() === name);
  };

  const saveColorOption = async (colorName: string, hexCode?: string) => {
    const name = colorName.trim();
    if (!name) return;

    if (!isColorNew(name)) return;

    try {
      const { error } = await supabase
        .from('product_colors')
        .insert({ name, hex_code: hexCode || null });

      if (error) throw error;

      setColorOptions((prev) => [...prev, { name, hex_code: hexCode }].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      console.warn('Erro ao salvar nova cor:', e);
    }
  };

  const deleteColorOption = async (colorName: string) => {
    const name = colorName.trim();
    if (!name) return;

    const confirmed = window.confirm(`Remover a cor "${name}" do catálogo?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('product_colors')
        .delete()
        .eq('name', name);

      if (error) throw error;

      setColorOptions((prev) => prev.filter((opt) => opt.name !== name));
    } catch (e) {
      console.warn('Erro ao remover cor:', e);
    }
  };

  function addVariant() {
    const newVariant: Variant = {
      size: '',
      color: '',
      stock_quantity: 0,
      sku: `SKU-${Date.now()}`,
      active: true,
      _isNew: true
    };
    setVariants(prev => [...prev, newVariant]);
  }

  function updateVariant(index: number, field: keyof Variant, value: any) {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  }

  function removeVariant(index: number) {
    setVariants(prev => prev.filter((_, i) => i !== index));
  }

  function generateSKU(size: string, color: string) {
    const s = size.trim().toUpperCase().replace(/\s+/g, '');
    const c = color.trim().toUpperCase().slice(0, 3).replace(/\s+/g, '');
    return `${s}-${c}-${Date.now().toString().slice(-6)}`;
  }

  function autoGenerateSKU(index: number) {
    const variant = variants[index];
    if (variant.size && variant.color) {
      const sku = generateSKU(variant.size, variant.color);
      updateVariant(index, 'sku', sku);
    }
  }

  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <datalist id="product-color-options">
        {colorOptions.map((opt) => (
          <option key={opt.name} value={opt.name} />
        ))}
      </datalist>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Variantes do Produto</h3>
          <p className="text-xs text-gray-600 mt-1">
            Gerencie tamanhos e cores com estoque individual. Total: {totalStock} unidades
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Variante
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando variantes...</div>
      ) : variants.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-2">Nenhuma variante cadastrada</p>
          <p className="text-xs text-gray-400">Clique em "Adicionar Variante" para começar</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {variants.map((variant, index) => (
            <div key={variant.id || index} className="bg-white border rounded-lg p-3 grid grid-cols-12 gap-2 items-center">
              {(() => {
                const normalizedColor = (variant.color || '').trim().toLowerCase();
                const hasColorOption = colorOptions.some(
                  (opt) => opt.name.trim().toLowerCase() === normalizedColor
                );
                const showCustomColor = customColorMode[index] || (!!variant.color && !hasColorOption);

                return (
                  <>
              {/* Tamanho */}
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-1">Tamanho</label>
                <select
                  value={variant.size}
                  onChange={(e) => {
                    updateVariant(index, 'size', e.target.value);
                    autoGenerateSKU(index);
                  }}
                  className="w-full border rounded px-2 py-1 text-sm text-gray-900 bg-white"
                >
                  <option value="">Selecione um tamanho</option>
                  {variant.size && !filteredSizes.some((s) => s.name === variant.size) && (
                    <option value={variant.size}>{variant.size}</option>
                  )}
                  {filteredSizes.map((size) => (
                    <option key={size.name} value={size.name}>{size.name}</option>
                  ))}
                </select>
              </div>

              {/* Cor */}
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-1">Cor</label>
                <div className="flex items-center gap-2">
                  <select
                    value={showCustomColor ? '__custom__' : variant.color}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '__custom__') {
                        setCustomColorMode((prev) => ({ ...prev, [index]: true }));
                        if (hasColorOption) updateVariant(index, 'color', '');
                        return;
                      }
                      setCustomColorMode((prev) => ({ ...prev, [index]: false }));
                      updateVariant(index, 'color', value);
                      autoGenerateSKU(index);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm text-gray-900 bg-white"
                  >
                    <option value="">Selecione uma cor</option>
                    {variant.color && !hasColorOption && !showCustomColor && (
                      <option value={variant.color}>{variant.color}</option>
                    )}
                    {colorOptions.map((opt) => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                    <option value="__custom__">Outra cor...</option>
                  </select>
                  {hasColorOption && (
                    <button
                      type="button"
                      onClick={() => deleteColorOption(variant.color)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Remover cor do catálogo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {showCustomColor && (
                  <input
                    type="text"
                    value={variant.color}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    onBlur={() => autoGenerateSKU(index)}
                    className="w-full border rounded px-2 py-1 text-sm text-gray-900 mt-2"
                    placeholder="Digite o nome da cor"
                  />
                )}

                {isColorNew(variant.color) && (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex[index] || '#e5e7eb'}
                      onChange={(e) => setNewColorHex(prev => ({ ...prev, [index]: e.target.value }))}
                      className="h-6 w-10 border border-gray-300 rounded"
                      title="Escolha o hex da cor"
                    />
                    <button
                      type="button"
                      onClick={() => saveColorOption(variant.color, newColorHex[index])}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + Salvar cor
                    </button>
                  </div>
                )}
              </div>

              {/* Estoque */}
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-1">Estoque</label>
                <input
                  type="number"
                  min="0"
                  value={variant.stock_quantity}
                  onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                  className="w-full border rounded px-2 py-1 text-sm text-gray-900"
                />
              </div>

              {/* Ajuste de Preço (opcional) */}
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-1">
                  Ajuste R$ <span className="text-gray-400">(+/-)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.price_adjustment || ''}
                  onChange={(e) => updateVariant(index, 'price_adjustment', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full border rounded px-2 py-1 text-sm text-gray-900"
                  placeholder="0.00"
                />
              </div>

              {/* SKU */}
              <div className="col-span-3">
                <label className="text-xs text-gray-600 block mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm text-gray-900 font-mono"
                  placeholder="AUTO"
                />
              </div>

              {/* Botão Remover */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Remover variante"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <strong>💡 Dica:</strong> O SKU é gerado automaticamente ao preencher tamanho e cor. 
          Use "Ajuste R$" para adicionar (+) ou subtrair (-) do preço base. Exemplo: +5.00 ou -3.00
        </div>
      )}
    </div>
  );
}
