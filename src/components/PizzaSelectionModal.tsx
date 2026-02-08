"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type PizzaSize = {
  id: string;
  size_name: string;
  price: number;
  max_flavors: number;
  slices: number | null;
};

type PizzaFlavor = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

type Additional = {
  id: string;
  name: string;
  price: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  storeId: string;
  onAddToCart: (item: any) => void;
};

export default function PizzaSelectionModal({ isOpen, onClose, product, storeId, onAddToCart }: Props) {
  const [sizes, setSizes] = useState<PizzaSize[]>([]);
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [loading, setLoading] = useState(true);

  // Seleções
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar tamanhos da pizza
      const { data: sizesData, error: sizesError } = await supabase
        .from('pizza_sizes')
        .select('*')
        .eq('product_id', product.id)
        .order('max_flavors');

      if (sizesError) throw sizesError;
      setSizes(sizesData || []);

      // Selecionar primeiro tamanho por padrão
      if (sizesData && sizesData.length > 0) {
        setSelectedSize(sizesData[0]);
      }

      // Buscar sabores da loja
      const { data: flavorsData, error: flavorsError } = await supabase
        .from('pizza_flavors')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .order('name');

      if (flavorsError) throw flavorsError;
      setFlavors(flavorsData || []);

      // Buscar adicionais vinculados ao produto
      const { data: additionalsData, error: addError } = await supabase
        .from('product_additionals')
        .select(`
          additional_id,
          additionals (
            id,
            name,
            price
          )
        `)
        .eq('product_id', product.id);

      if (addError) throw addError;
      const addList = additionalsData?.map(item => item.additionals).filter(Boolean).flat() || [];
      setAdditionals(addList as Additional[]);
    } catch (err) {
      console.error('Erro ao carregar dados da pizza:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlavor = (flavorId: string) => {
    if (!selectedSize) return;

    if (selectedFlavors.includes(flavorId)) {
      setSelectedFlavors(prev => prev.filter(id => id !== flavorId));
    } else {
      if (selectedFlavors.length < selectedSize.max_flavors) {
        setSelectedFlavors(prev => [...prev, flavorId]);
      } else {
        alert(`Este tamanho permite no máximo ${selectedSize.max_flavors} sabor(es)`);
      }
    }
  };

  const toggleAdditional = (additionalId: string) => {
    setSelectedAdditionals(prev =>
      prev.includes(additionalId)
        ? prev.filter(id => id !== additionalId)
        : [...prev, additionalId]
    );
  };

  const handleSizeChange = (size: PizzaSize) => {
    setSelectedSize(size);
    // Limitar sabores se o novo tamanho permitir menos
    if (selectedFlavors.length > size.max_flavors) {
      setSelectedFlavors(prev => prev.slice(0, size.max_flavors));
    }
  };

  const calculateTotal = () => {
    if (!selectedSize) return 0;

    let total = selectedSize.price;

    // Adicionar preço dos adicionais
    selectedAdditionals.forEach(addId => {
      const additional = additionals.find(a => a.id === addId);
      if (additional) {
        total += additional.price;
      }
    });

    return total * quantity;
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Selecione um tamanho');
      return;
    }

    if (selectedFlavors.length === 0) {
      alert('Selecione pelo menos 1 sabor');
      return;
    }

    const selectedFlavorNames = selectedFlavors.map(fId => {
      const flavor = flavors.find(f => f.id === fId);
      return flavor?.name || '';
    }).filter(Boolean);

    const selectedAdditionalItems = selectedAdditionals.map(aId => {
      const additional = additionals.find(a => a.id === aId);
      return additional;
    }).filter(Boolean);

    const cartItem = {
      product,
      size: selectedSize.size_name,
      flavors: selectedFlavorNames,
      additionals: selectedAdditionalItems,
      quantity,
      unitPrice: selectedSize.price,
      totalPrice: calculateTotal(),
      pizzaConfig: {
        sizeId: selectedSize.id,
        sizeName: selectedSize.size_name,
        sizePrice: selectedSize.price,
        flavorIds: selectedFlavors,
        flavorNames: selectedFlavorNames,
        additionalIds: selectedAdditionals
      }
    };

    onAddToCart(cartItem);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSize(sizes[0] || null);
    setSelectedFlavors([]);
    setSelectedAdditionals([]);
    setQuantity(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🍕 {product?.name || 'Pizza'}</h2>
            {product?.description && (
              <p className="text-sm text-white/90 mt-1">{product.description}</p>
            )}
          </div>
          <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            <div className="space-y-6">
              {/* Tamanhos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  📏 Escolha o Tamanho
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => handleSizeChange(size)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedSize?.id === size.id
                          ? 'border-red-600 bg-red-50 shadow-md'
                          : 'border-gray-200 hover:border-red-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{size.size_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Até {size.max_flavors} sabor{size.max_flavors > 1 ? 'es' : ''}
                      </div>
                      {size.slices && (
                        <div className="text-xs text-gray-500">{size.slices} fatias</div>
                      )}
                      <div className="text-lg font-bold text-red-600 mt-2">
                        R$ {size.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sabores */}
              {selectedSize && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    🍕 Escolha {selectedSize.max_flavors > 1 ? `até ${selectedSize.max_flavors} Sabores` : '1 Sabor'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedFlavors.length} de {selectedSize.max_flavors} selecionado(s)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {flavors.map((flavor) => (
                      <label
                        key={flavor.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedFlavors.includes(flavor.id)
                            ? 'border-red-600 bg-red-50 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-red-300 bg-white hover:shadow-md'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFlavors.includes(flavor.id)}
                          onChange={() => toggleFlavor(flavor.id)}
                          className="mt-1 w-4 h-4 text-red-600 rounded"
                        />
                        
                        {/* Imagem do sabor */}
                        {flavor.image_url ? (
                          <img 
                            src={flavor.image_url} 
                            alt={flavor.name}
                            className="w-16 h-16 object-cover rounded border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded border-2 border-gray-300 flex items-center justify-center text-3xl shrink-0">
                            🍕
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{flavor.name}</div>
                          {flavor.description && (
                            <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{flavor.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionais */}
              {additionals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ➕ Adicionais (Opcional)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {additionals.map((additional) => (
                      <label
                        key={additional.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedAdditionals.includes(additional.id)
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAdditionals.includes(additional.id)}
                          onChange={() => toggleAdditional(additional.id)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{additional.name}</div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          + R$ {additional.price.toFixed(2)}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantidade */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔢 Quantidade</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700"
                  >
                    −
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="text-3xl font-bold text-red-600">
              R$ {calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize || selectedFlavors.length === 0}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
          >
            {selectedFlavors.length === 0 ? '⚠️ Selecione pelo menos 1 sabor' : '🛒 Adicionar ao Carrinho'}
          </button>
        </div>
      </div>
    </div>
  );
}
