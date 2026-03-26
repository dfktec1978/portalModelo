"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductVariantsManager from "./ProductVariantsManager";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  storeId: string;
  storeCategory?: string;
  productId?: string | null;
  initialData?: any;
}

export default function ProductFormModal({ isOpen, onClose, onSave, storeId, storeCategory, productId, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');
  const normalizedStoreCategory = (storeCategory || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const isFoodStore = normalizedStoreCategory === 'alimentacao' || normalizedStoreCategory === 'food';
  const isRetailStore = normalizedStoreCategory === 'varejo' || normalizedStoreCategory === 'retail';
  const mustUseVariants = isRetailStore;
  const categoryContextLabel = isFoodStore ? 'Alimentação' : isRetailStore ? 'Varejo' : 'Não identificado';
  const categoryContextBadgeClass = isFoodStore
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isRetailStore
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  // Campos básicos
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [criticalStock, setCriticalStock] = useState("");
  
  // Rastrear valor inicial de critical_stock para mostrar "Atualmente: X"
  const initialCriticalStock = initialData?.critical_stock ?? null;
  const initialStock = initialData?.stock ?? null;
  const initialPrice = initialData?.price ?? null;
  const initialName = initialData?.name ?? null;
  const initialCategory = initialData?.category ?? null;
  
  // Imagens
  const [images, setImages] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);

  // Campos específicos de varejo
  const [sizesInput, setSizesInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorsInput, setColorsInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [sizeGroup, setSizeGroup] = useState<string>("roupas");

  // Sistema de variantes
  const [useVariants, setUseVariants] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [touched, setTouched] = useState({
    name: false,
    price: false,
    category: false,
    stock: false,
    criticalStock: false,
  });

  // Adicionais disponíveis e selecionados
  const [availableAdditionals, setAvailableAdditionals] = useState<any[]>([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);

  // Categorias personalizadas
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  // Sistema de tamanhos de pizza
  const [pizzaSizes, setPizzaSizes] = useState<Array<{
    size_name: string;
    price: string;
    max_flavors: number;
    slices: string;
  }>>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [hasDraftAvailable, setHasDraftAvailable] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const draftKey = `product-form-draft:${storeId || 'no-store'}:${productId || 'new'}`;

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(draftKey);
    setHasDraftAvailable(false);
  };

  const normalizeKey = (value: string) => value.trim().toLowerCase();
  const parseDecimal = (value: string) => {
    const normalized = value.replace(',', '.').trim();
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const nameInvalid = !name.trim();
  const categoryInvalid = !category;
  const priceInvalid = category !== 'Pizza' && (!!price && ((parseDecimal(price) ?? 0) <= 0));
  const stockInvalid = !useVariants && stock !== '' && ((parseInt(stock, 10) < 0) || Number.isNaN(parseInt(stock, 10)));
  const criticalStockInvalid = !isRetailStore && criticalStock !== '' && ((parseInt(criticalStock, 10) < 0) || Number.isNaN(parseInt(criticalStock, 10)));
  const showNameInvalid = touched.name && nameInvalid;
  const showCategoryInvalid = touched.category && categoryInvalid;
  const showPriceInvalid = touched.price && priceInvalid;
  const showStockInvalid = touched.stock && stockInvalid;
  const showCriticalStockInvalid = touched.criticalStock && criticalStockInvalid;
  const steps = [
    { id: 0, label: 'Básico' },
    { id: 1, label: 'Configurações' },
    { id: 2, label: 'Conteúdo' },
    { id: 3, label: 'Revisão' },
  ];

  // Buscar adicionais e categorias da loja
  useEffect(() => {
    const loadAdditionals = async () => {
      try {
        // Buscar todos os adicionais da loja
        const { data: additionalsData, error: addError } = await supabase
          .from('additionals')
          .select('*')
          .eq('store_id', storeId)
          .order('name');

        if (addError) throw addError;
        setAvailableAdditionals(additionalsData || []);

        // Buscar categorias personalizadas da loja
        const { data: categoriesData, error: catError } = await supabase
          .from('product_categories')
          .select('*')
          .eq('store_id', storeId)
          .order('name');

        if (catError) throw catError;
        setCustomCategories(categoriesData || []);

        // Se estiver editando, buscar adicionais vinculados ao produto
        if (productId) {
          const { data: linkedData, error: linkError } = await supabase
            .from('product_additionals')
            .select('additional_id')
            .eq('product_id', productId);

          if (linkError) throw linkError;

          // Buscar tamanhos de pizza se for categoria Pizza
          const { data: sizesData, error: sizesError } = await supabase
            .from('pizza_sizes')
            .select('*')
            .eq('product_id', productId)
            .order('max_flavors');

          if (sizesError) throw sizesError;
          if (sizesData && sizesData.length > 0) {
            setPizzaSizes(sizesData.map(s => ({
              size_name: s.size_name,
              price: s.price.toString(),
              max_flavors: s.max_flavors,
              slices: s.slices?.toString() || ''
            })));
          }
          const linkedIds = linkedData?.map(item => item.additional_id) || [];
          setSelectedAdditionals(linkedIds);
        }
      } catch (err) {
        console.error('Erro ao carregar adicionais:', err);
      }
    };

    if (isOpen && storeId) {
      loadAdditionals();
    }
  }, [isOpen, storeId, productId]);

  // Carregar dados iniciais ao editar
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setPrice(String(initialData.price || ""));
      setCategory(initialData.category || "");
      setDescription(initialData.description || "");
      setStock(String(initialData.stock || ""));
      setCriticalStock(initialData.critical_stock === null || initialData.critical_stock === undefined ? "" : String(initialData.critical_stock));
      setUseVariants(mustUseVariants ? true : (initialData.has_variants || false));
      setSizeGroup(initialData.size_group || "roupas");
      
      // Parse images
      const imgs = (() => {
        if (!initialData.images) return [];
        if (Array.isArray(initialData.images)) return initialData.images;
        try { return JSON.parse(initialData.images); } catch { return []; }
      })();
      setImages(imgs);

      // Parse sizes/colors se existirem
      if (initialData.sizes) {
        const s = typeof initialData.sizes === 'string' ? JSON.parse(initialData.sizes) : initialData.sizes;
        setSizes(Array.isArray(s) ? s : []);
      }
      if (initialData.colors) {
        const c = typeof initialData.colors === 'string' ? JSON.parse(initialData.colors) : initialData.colors;
        setColors(Array.isArray(c) ? c : []);
      }
    } else {
      // Limpar formulário
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setStock("");
      setCriticalStock("");
      setImages([]);
      setSizes([]);
      setColors([]);
      setSizesInput("");
      setColorsInput("");
      setUseVariants(mustUseVariants);
      setVariants([]);
      setSelectedAdditionals([]);
      setPizzaSizes([]);
      setSizeGroup("roupas");
    }
    setTouched({ name: false, price: false, category: false, stock: false, criticalStock: false });
    setActiveStep(0);
  }, [initialData, isOpen, mustUseVariants]);

  const goToNextStep = () => {
    if (activeStep === 0) {
      setTouched({ name: true, price: true, category: true, stock: true, criticalStock: true });
      if (nameInvalid || categoryInvalid || priceInvalid || stockInvalid || criticalStockInvalid) return;
    }
    setIsTransitioning(true);
    setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
    setTimeout(() => setIsTransitioning(false), 50);
  };

  const goToPreviousStep = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      setHasDraftAvailable(Boolean(raw));
    } catch {
      setHasDraftAvailable(false);
    }
  }, [isOpen, draftKey]);

  useEffect(() => {
    if (!isOpen || saving || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      const draftPayload = {
        name,
        price,
        category,
        description,
        stock,
        criticalStock,
        images,
        sizes,
        colors,
        sizeGroup,
        useVariants,
        variants,
        selectedAdditionals,
        pizzaSizes,
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    isOpen,
    saving,
    draftKey,
    name,
    price,
    category,
    description,
    stock,
    criticalStock,
    images,
    sizes,
    colors,
    sizeGroup,
    useVariants,
    variants,
    selectedAdditionals,
    pizzaSizes,
  ]);

  const toggleAdditional = (additionalId: string) => {
    setSelectedAdditionals(prev => 
      prev.includes(additionalId)
        ? prev.filter(id => id !== additionalId)
        : [...prev, additionalId]
    );
  };

  const addPizzaSize = () => {
    setPizzaSizes(prev => [...prev, { size_name: '', price: '', max_flavors: 2, slices: '' }]);
  };

  const removePizzaSize = (index: number) => {
    setPizzaSizes(prev => prev.filter((_, i) => i !== index));
  };

  const updatePizzaSize = (index: number, field: string, value: any) => {
    setPizzaSizes(prev => prev.map((size, i) => 
      i === index ? { ...size, [field]: value } : size
    ));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError("Máximo de 5 imagens permitido");
      return;
    }
    setUploadQueue(files);
  };

  const uploadImages = async () => {
    if (uploadQueue.length === 0) return;
    
    if (!storeId) {
      setError("❌ Erro: storeId não definido. Recarregue a página.");
      return;
    }
    
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of uploadQueue) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ownerId", storeId);
        
        const res = await fetch("/api/upload-product-image", { method: "POST", body: formData });
        const json = await res.json();
        
        if (!res.ok || json.error) {
          console.error("Erro no upload:", { status: res.status, error: json.error, storeId });
          throw new Error(json.error || `Falha no upload (${res.status})`);
        }
        
        if (json.data?.publicUrl) {
          uploaded.push(json.data.publicUrl);
        }
      }
      
      setImages(prev => [...prev, ...uploaded]);
      setUploadQueue([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    setImages(prev => {
      const clone = [...prev];
      const current = clone[index];
      clone[index] = clone[nextIndex];
      clone[nextIndex] = current;
      return clone;
    });
  };

  const setAsCover = (index: number) => {
    if (index <= 0) return;
    setImages(prev => {
      const clone = [...prev];
      const [picked] = clone.splice(index, 1);
      clone.unshift(picked);
      return clone;
    });
  };

  const addSize = () => {
    const trimmed = sizesInput.trim();
    const exists = sizes.some((s) => normalizeKey(s) === normalizeKey(trimmed));
    if (trimmed && !exists) {
      setSizes(prev => [...prev, trimmed]);
      setSizesInput("");
    }
  };

  const removeSize = (size: string) => {
    setSizes(prev => prev.filter(s => s !== size));
  };

  const addColor = () => {
    const trimmed = colorsInput.trim();
    const exists = colors.some((c) => normalizeKey(c) === normalizeKey(trimmed));
    if (trimmed && !exists) {
      setColors(prev => [...prev, trimmed]);
      setColorsInput("");
    }
  };

  const removeColor = (color: string) => {
    setColors(prev => prev.filter(c => c !== color));
  };

  const applyDraftData = (draft: any) => {
    setName(draft.name || "");
    setPrice(draft.price || "");
    setCategory(draft.category || "");
    setDescription(draft.description || "");
    setStock(draft.stock || "");
    setCriticalStock(draft.criticalStock || "");
    setImages(Array.isArray(draft.images) ? draft.images : []);
    setSizes(Array.isArray(draft.sizes) ? draft.sizes : []);
    setColors(Array.isArray(draft.colors) ? draft.colors : []);
    setSizeGroup(draft.sizeGroup || "roupas");
    setUseVariants(Boolean(draft.useVariants));
    setVariants(Array.isArray(draft.variants) ? draft.variants : []);
    setSelectedAdditionals(Array.isArray(draft.selectedAdditionals) ? draft.selectedAdditionals : []);
    setPizzaSizes(Array.isArray(draft.pizzaSizes) ? draft.pizzaSizes : []);
    setHasDraftAvailable(false);
  };

  const restoreDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      applyDraftData(parsed);
      setSuccess('Rascunho recuperado com sucesso.');
      setTimeout(() => setSuccess(''), 2200);
    } catch {
      setError('Não foi possível recuperar o rascunho salvo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Blindagem: qualquer submit fora da última etapa deve apenas avançar o fluxo.
    if (activeStep < steps.length - 1) {
      goToNextStep();
      return;
    }
    
    // Validar nome
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    // Validar preço (exceto para Pizza, que usa preço dos tamanhos)
    if (category !== 'Pizza' && !price) {
      setError("Preço é obrigatório");
      return;
    }

    if (category !== 'Pizza') {
      const parsedPrice = parseDecimal(price);
      if (parsedPrice === null || parsedPrice <= 0) {
        setError("Informe um preço válido maior que zero");
        return;
      }
    }

    if (!useVariants && stock) {
      const parsedStock = parseInt(stock, 10);
      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        setError("Estoque deve ser um número inteiro maior ou igual a zero");
        return;
      }
    }

    if (criticalStockInvalid) {
      setError("Estoque crítico deve ser um número inteiro maior ou igual a zero");
      return;
    }

    // Validar tamanhos se for Pizza
    if (category === 'Pizza' && pizzaSizes.length === 0) {
      setError("⚠️ Pizzas precisam ter pelo menos UM tamanho cadastrado! Clique em 'Adicionar Tamanho' na seção abaixo.");
      // Scroll para a seção de tamanhos
      setTimeout(() => {
        const element = document.querySelector('[data-pizza-sizes]');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // Validar campos dos tamanhos de pizza
    if (category === 'Pizza' && pizzaSizes.length > 0) {
      const invalidSizes = pizzaSizes.filter(s => !s.size_name.trim() || !s.price || s.max_flavors < 1 || Number(s.price) <= 0);
      if (invalidSizes.length > 0) {
        setError("⚠️ Todos os tamanhos devem ter nome, preço e número de sabores preenchidos!");
        return;
      }

      const duplicatePizzaSizes = new Set<string>();
      for (const size of pizzaSizes) {
        const key = normalizeKey(size.size_name);
        if (duplicatePizzaSizes.has(key)) {
          setError("⚠️ Existem tamanhos de pizza duplicados. Use nomes únicos para cada tamanho.");
          return;
        }
        duplicatePizzaSizes.add(key);
      }
    }

    // Validar variantes se ativo
    if (useVariants && variants.length === 0) {
      setError("Adicione pelo menos uma variante ou desative o sistema de variantes");
      return;
    }

    if (useVariants) {
      const invalidVariants = variants.filter(v => !v.size || !v.color || !v.sku);
      if (invalidVariants.length > 0) {
        setError("Todas as variantes devem ter tamanho, cor e SKU preenchidos");
        return;
      }

      const seenSku = new Set<string>();
      const seenColorSize = new Set<string>();
      for (const v of variants) {
        const skuKey = normalizeKey(String(v.sku || ''));
        if (seenSku.has(skuKey)) {
          setError("Há SKUs duplicados nas variantes. Ajuste antes de salvar.");
          return;
        }
        seenSku.add(skuKey);

        const pairKey = `${normalizeKey(String(v.color || ''))}::${normalizeKey(String(v.size || ''))}`;
        if (seenColorSize.has(pairKey)) {
          setError("Há combinações de cor+tamanho duplicadas nas variantes.");
          return;
        }
        seenColorSize.add(pairKey);
      }
    }

    if (uploadQueue.length > 0) {
      setError("Você selecionou imagens, mas ainda não concluiu o upload. Clique em 'Fazer upload' antes de salvar.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        store_id: storeId,
        name: name.trim(),
        price: category === 'Pizza' ? 0 : (parseDecimal(price) || 0), // Pizza usa preço dos tamanhos
        category: category || null,
        description: description || "",
        images: JSON.stringify(images),
        stock: useVariants ? null : (stock ? parseInt(stock) : null), // estoque global apenas se não usar variantes
        critical_stock: isRetailStore ? null : (criticalStock ? parseInt(criticalStock, 10) : null),
        has_variants: useVariants,
        size_group: useVariants ? sizeGroup : null, // Define qual grupo de tamanhos usar
        active: true,
      };

      // Campos legados (apenas se NÃO usar variantes)
      if (isRetailStore && !useVariants) {
        payload.sizes = sizes.length > 0 ? JSON.stringify(sizes) : null;
        payload.colors = colors.length > 0 ? JSON.stringify(colors) : null;
      }

      let savedProductId = productId;
      const payloadWithoutCritical = { ...payload };
      delete payloadWithoutCritical.critical_stock;

      if (productId) {
        // Atualizar produto
        const updateAttempt = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId);

        if (updateAttempt.error && /column .*critical_stock|schema cache/i.test(String(updateAttempt.error.message || ''))) {
          const fallbackUpdate = await supabase
            .from('products')
            .update(payloadWithoutCritical)
            .eq('id', productId);
          if (fallbackUpdate.error) throw new Error(fallbackUpdate.error.message);
        } else if (updateAttempt.error) {
          throw new Error(updateAttempt.error.message);
        }
      } else {
        // Criar produto
        const insertAttempt = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();

        if (insertAttempt.error && /column .*critical_stock|schema cache/i.test(String(insertAttempt.error.message || ''))) {
          const fallbackInsert = await supabase
            .from('products')
            .insert(payloadWithoutCritical)
            .select()
            .single();
          if (fallbackInsert.error) throw new Error(fallbackInsert.error.message);
          savedProductId = fallbackInsert.data.id;
        } else if (insertAttempt.error) {
          throw new Error(insertAttempt.error.message);
        } else {
          savedProductId = insertAttempt.data.id;
        }
      }

      // Salvar variantes se ativo
      if (useVariants && savedProductId) {
        await saveVariants(savedProductId);
      }

      // Salvar adicionais vinculados ao produto
      if (savedProductId) {
        await saveProductAdditionals(savedProductId);
        
        // Salvar tamanhos de pizza se categoria for Pizza
        if (category === 'Pizza') {
          await savePizzaSizes(savedProductId);
        }
      }

      clearDraft();
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  async function saveVariants(prodId: string) {
    // Deletar variantes antigas
    await supabase.from('product_variants').delete().eq('product_id', prodId);

    // Inserir novas variantes
    const variantsToInsert = variants.map(v => ({
      product_id: prodId,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stock_quantity: v.stock_quantity ?? v.stock ?? 0,
      critical_stock: Number(v.critical_stock ?? 0) > 0 ? Number(v.critical_stock) : null,
      price_adjustment: v.price_adjustment ?? v.price ?? null,
      images: Array.isArray(v.images) ? v.images : [],
      active: v.active ?? true
    }));

    if (variantsToInsert.length > 0) {
      const insertAttempt = await supabase.from('product_variants').insert(variantsToInsert);
      if (insertAttempt.error && /column .*critical_stock|schema cache/i.test(String(insertAttempt.error.message || ''))) {
        const fallbackRows = variantsToInsert.map(({ critical_stock, ...rest }) => rest);
        const fallbackInsert = await supabase.from('product_variants').insert(fallbackRows);
        if (fallbackInsert.error) throw new Error(`Erro ao salvar variantes: ${fallbackInsert.error.message}`);
      } else if (insertAttempt.error) {
        throw new Error(`Erro ao salvar variantes: ${insertAttempt.error.message}`);
      }
    }
  }

  async function saveProductAdditionals(prodId: string) {
    // Deletar vínculos antigos
    await supabase.from('product_additionals').delete().eq('product_id', prodId);

    // Inserir novos vínculos
    if (selectedAdditionals.length > 0) {
      const additionalsToInsert = selectedAdditionals.map(additionalId => ({
        product_id: prodId,
        additional_id: additionalId
      }));

      const { error } = await supabase.from('product_additionals').insert(additionalsToInsert);
      if (error) throw new Error(`Erro ao salvar adicionais: ${error.message}`);
    }
  }

  async function savePizzaSizes(prodId: string) {
    // Deletar tamanhos antigos
    await supabase.from('pizza_sizes').delete().eq('product_id', prodId);

    // Inserir novos tamanhos
    if (pizzaSizes.length > 0) {
      const sizesToInsert = pizzaSizes.map(size => ({
        product_id: prodId,
        size_name: size.size_name,
        price: parseFloat(size.price) || 0,
        max_flavors: size.max_flavors,
        slices: size.slices ? parseInt(size.slices) : null
      }));

      const { error } = await supabase.from('pizza_sizes').insert(sizesToInsert);
      if (error) throw new Error(`Erro ao salvar tamanhos: ${error.message}`);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-semibold">{productId ? 'Editar' : 'Novo'} Produto</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            // BLOQUEIO ABSOLUTO: Nenhum submit permitido fora do último step
            if (activeStep < steps.length - 1 || isTransitioning) {
              e.preventDefault();
              if (!isTransitioning) {
                goToNextStep();
              }
              return;
            }
            handleSave(e);
          }}
          onKeyDown={(e) => {
            // BLOQUEIO ABSOLUTO: Enter key não avança antes do último step
            if (e.key === 'Enter' && activeStep < steps.length - 1) {
              const tag = (e.target as HTMLElement).tagName;
              if (tag !== 'TEXTAREA') {
                e.preventDefault();
                return;
              }
            }
          }}
          className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index <= activeStep) {
                    setActiveStep(index);
                    return;
                  }
                  if (index === activeStep + 1) {
                    goToNextStep();
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  activeStep === index
                    ? 'bg-blue-600 text-white border-blue-600'
                    : activeStep > index
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {index + 1}. {step.label}
              </button>
            ))}
          </div>
          {hasDraftAvailable && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>Rascunho local encontrado para este produto.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700"
                >
                  Recuperar
                </button>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="px-3 py-1.5 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${categoryContextBadgeClass}`}>
            <span>Conjunto de categorias ativo:</span>
            <span>{categoryContextLabel}</span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded border border-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-800 p-3 rounded border border-green-200 text-sm">
              {success}
            </div>
          )}

          {activeStep === 0 && (
          <>
          {/* Grid ajustável - 1 coluna se Pizza, 2 colunas se não */}
          <div className={category === 'Pizza' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Nome <span className="text-red-500">*</span></span>
                {initialName && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 max-w-xs truncate">
                    Atual: {initialName}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                className={`w-full border rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 ${showNameInvalid ? 'border-red-300' : ''}`}
                placeholder="Nome do produto"
                required
              />
              {showNameInvalid && <p className="text-xs text-red-600 mt-1">Nome é obrigatório</p>}
            </div>

            {/* Esconder preço se for Pizza (preço vem dos tamanhos) */}
            {category !== 'Pizza' && (
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Valor (R$) <span className="text-red-500">*</span></span>
                  {initialPrice !== null && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                      Atualmente: R$ {Number(initialPrice).toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(',', '.'))}
                  onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
                  className={`w-full border rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 ${showPriceInvalid ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                  required
                />
                {showPriceInvalid && <p className="text-xs text-red-600 mt-1">Informe um valor maior que zero</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Categoria *</span>
                {initialCategory && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                    Atual: {initialCategory}
                  </span>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                className={`w-full border rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 bg-white ${showCategoryInvalid ? 'border-red-300' : ''}`}
                required
              >
                <option value="">Selecione uma categoria</option>
                {isFoodStore ? (
                  <optgroup label="📌 Categorias Padrão - Alimentação">
                    <option value="Lanches">🍔 Lanches</option>
                    <option value="Pizza">🍕 Pizza</option>
                    <option value="Porções">🍟 Porções</option>
                    <option value="Bebidas">🥤 Bebidas</option>
                    <option value="Sobremesas">🍰 Sobremesas</option>
                    <option value="Combo">🎯 Combo</option>
                  </optgroup>
                ) : (
                  <optgroup label="📌 Categorias Padrão - Varejo">
                    <option value="Roupas">👕 Roupas</option>
                    <option value="Calçados">👟 Calçados</option>
                    <option value="Acessórios">👜 Acessórios</option>
                    <option value="Esportes">⚽ Esportes</option>
                    <option value="Eletrônicos">💻 Eletrônicos</option>
                    <option value="Casa e Decoração">🏠 Casa e Decoração</option>
                    <option value="Beleza e Cuidados">💄 Beleza e Cuidados</option>
                    <option value="Livros e Papelaria">📚 Livros e Papelaria</option>
                  </optgroup>
                )}
                {customCategories.length > 0 && (
                  <optgroup label="✨ Suas Categorias">
                    {customCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Gerenciar categorias: Painel → Categorias
              </p>
              {showCategoryInvalid && <p className="text-xs text-red-600 mt-1">Selecione uma categoria</p>}
            </div>

            {!useVariants && (
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Estoque</span>
                  {initialStock !== null && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                      Atualmente: {initialStock}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, stock: true }))}
                  className={`w-full border rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 ${showStockInvalid ? 'border-red-300' : ''}`}
                  placeholder="Quantidade disponível"
                />
                {showStockInvalid && <p className="text-xs text-red-600 mt-1">Estoque inválido. Use número inteiro maior ou igual a 0</p>}
              </div>
            )}
          </div>

          {!isRetailStore && (
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Alerta de estoque (opcional)</span>
                {productId && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                    Atualmente: {initialCriticalStock || '—'}
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                value={criticalStock}
                onChange={(e) => setCriticalStock(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, criticalStock: true }))}
                className={`w-full border rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 ${showCriticalStockInvalid ? 'border-red-300' : ''}`}
                placeholder="Ex: 5"
              />
              <p className="text-xs text-gray-500 mt-1">Deixe em branco para não gerar alerta. Se informado, o painel avisa quando o estoque ficar menor ou igual ao valor.</p>
              {showCriticalStockInvalid && <p className="text-xs text-red-600 mt-1">Use um número inteiro maior ou igual a 0</p>}
            </div>
          )}
          </>
          )}

          {activeStep === 1 && (
          <>
          {isRetailStore && (
            <div className="border-t pt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useVariants}
                  onChange={(e) => setUseVariants(e.target.checked)}
                  disabled={mustUseVariants}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                <div>
                  <span className="font-medium text-gray-900">Usar sistema de variantes</span>
                  <p className="text-xs text-gray-600">
                    Controle estoque individual por tamanho e cor (obrigatório no varejo)
                  </p>
                </div>
              </label>
              
              {useVariants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Tamanho
                  </label>
                  <select
                    value={sizeGroup}
                    onChange={(e) => setSizeGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="roupas">📦 Roupas (P, M, G, GG, EG)</option>
                    <option value="calcados">👟 Calçados (33-46)</option>
                    <option value="infantil">👶 Infantil (2-16)</option>
                    <option value="lingerie">👙 Lingerie (34-50)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Depois de salvar, vá em <strong>Variações</strong> para cadastrar cores e tamanhos específicos
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sistema de Variantes */}
          {isRetailStore && useVariants && (
            <ProductVariantsManager
              productId={productId || null}
              basePrice={parseFloat(price) || 0}
              sizeGroup={sizeGroup}
              onVariantsChange={setVariants}
            />
          )}

          {/* Campos legados (tamanhos/cores simples) - apenas se NÃO usar variantes */}
          {isRetailStore && !useVariants && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamanhos</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    className="flex-1 border rounded px-3 py-2 text-gray-900 text-sm"
                    placeholder="P, M, G..."
                  />
                  <button type="button" onClick={addSize} className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {sizes.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                      {s}
                      <button type="button" onClick={() => removeSize(s)} className="text-gray-600 hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cores</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    className="flex-1 border rounded px-3 py-2 text-gray-900 text-sm"
                    placeholder="Azul, Preto..."
                  />
                  <button type="button" onClick={addColor} className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {colors.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                      {c}
                      <button type="button" onClick={() => removeColor(c)} className="text-gray-600 hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Adicionais Específicos do Produto */}
          {isFoodStore && availableAdditionals.length > 0 && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionais Disponíveis para este Produto
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Selecione quais adicionais estarão disponíveis quando o cliente escolher este produto
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {availableAdditionals.map((additional) => (
                  <label
                    key={additional.id}
                    className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAdditionals.includes(additional.id)}
                      onChange={() => toggleAdditional(additional.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="flex-1 text-sm text-gray-800">{additional.name}</span>
                    <span className="text-xs text-gray-600">R$ {additional.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                ✓ {selectedAdditionals.length} adicional(is) selecionado(s)
              </p>
            </div>
          )}

          {/* Tamanhos de Pizza */}
          {category === 'Pizza' && (
            <div data-pizza-sizes className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-lg font-bold text-red-900 flex items-center gap-2">
                    🍕 Tamanhos de Pizza <span className="text-red-600">*</span>
                  </label>
                  <p className="text-sm text-red-700 mt-1 font-medium">
                    ⚠️ IMPORTANTE: Defina os tamanhos e quantos sabores cada um permite
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPizzaSize}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold shadow-md"
                >
                  + Adicionar Tamanho
                </button>
              </div>

              {pizzaSizes.length === 0 ? (
                <div className="p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg text-sm text-yellow-900 font-medium">
                  ⚠️ <strong>ATENÇÃO:</strong> Adicione pelo menos um tamanho (ex: Pequena, Média, Grande)
                  <br />
                  <span className="text-xs">Clique no botão "Adicionar Tamanho" acima</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {pizzaSizes.map((size, index) => (
                    <div key={index} className="p-3 bg-gray-50 border rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nome do Tamanho <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={size.size_name}
                            onChange={(e) => updatePizzaSize(index, 'size_name', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-gray-900 text-sm"
                            placeholder="Ex: Pequena, Média, Grande"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Preço (R$) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={size.price}
                            onChange={(e) => updatePizzaSize(index, 'price', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-gray-900 text-sm"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Máx. de Sabores <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={size.max_flavors}
                            onChange={(e) => updatePizzaSize(index, 'max_flavors', parseInt(e.target.value))}
                            className="w-full border rounded px-2 py-1.5 text-gray-900 text-sm bg-white"
                            required
                          >
                            <option value={1}>1 sabor</option>
                            <option value={2}>2 sabores</option>
                            <option value={3}>3 sabores</option>
                            <option value={4}>4 sabores</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Fatias (opcional)
                          </label>
                          <input
                            type="number"
                            value={size.slices}
                            onChange={(e) => updatePizzaSize(index, 'slices', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-gray-900 text-sm"
                            placeholder="Ex: 4, 6, 8"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePizzaSize(index)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        🗑️ Remover tamanho
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>💡 Dica:</strong> Exemplo comum: Pequena (2 sabores), Média (3 sabores), Grande (4 sabores)
              </div>
            </div>
          )}
          </>
          )}

          {activeStep === 2 && (
          <>
          <div>
            <label className="flex text-sm font-medium text-gray-700 mb-1 items-center justify-between">
              <span>Descrição</span>
              <span className="text-xs text-gray-500">{description.length} / 1000 caracteres</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              className="w-full border rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 font-sans"
              rows={6}
              placeholder="Detalhes do produto, materiais, instruções, dimensões, cuidados, etc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Use quebras de linha para organizar o texto. Dica: adicione informações sobre tamanho, peso, materiais e benefícios.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagens (máx 5)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-600">Arraste imagens ou clique</span>
                <span className="text-xs text-gray-500">PNG, JPEG ou WebP até 5MB (máximo 5)</span>
              </label>
              
              {uploadQueue.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-700 mb-2">{uploadQueue.length} arquivo(s) selecionado(s)</p>
                  <button
                    type="button"
                    onClick={uploadImages}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {uploading ? 'Enviando...' : 'Fazer upload'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Imagem ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                    {idx === 0 && (
                      <span className="absolute left-1 top-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Capa</span>
                    )}
                    <div className="absolute left-1 bottom-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="w-5 h-5 rounded bg-black/60 text-white text-xs disabled:opacity-40"
                        title="Mover para esquerda"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === images.length - 1}
                        className="w-5 h-5 rounded bg-black/60 text-white text-xs disabled:opacity-40"
                        title="Mover para direita"
                      >
                        →
                      </button>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => setAsCover(idx)}
                          className="px-1.5 h-5 rounded bg-blue-600 text-white text-[10px]"
                          title="Definir como capa"
                        >
                          Capa
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
          )}

          {activeStep === 3 && (
          <>
          <div className="w-full rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">Resumo antes de salvar</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <span>Nome: {name || 'não informado'}</span>
              <span>Categoria: {category || 'não definida'}</span>
              <span>Imagens: {images.length}</span>
              <span>Variantes: {useVariants ? variants.length : 0}</span>
              <span>Estoque: {useVariants ? 'por variante' : (stock || '0')}</span>
              <span>Crítico: {isRetailStore ? 'por variação' : (criticalStock || 'não definido')}</span>
              <span>Adicionais: {selectedAdditionals.length}</span>
              <span>Pizza tamanhos: {category === 'Pizza' ? pizzaSizes.length : 0}</span>
            </div>
          </div>
          </>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={activeStep === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <div className="text-xs text-gray-500">Etapa {activeStep + 1} de {steps.length}</div>
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNextStep();
                }}
                disabled={isTransitioning}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransitioning ? 'Carregando...' : 'Próximo'}
              </button>
            ) : (
            <button
              type="submit"
              disabled={saving || uploading || nameInvalid || categoryInvalid || priceInvalid || stockInvalid || criticalStockInvalid}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar produto'}
            </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
