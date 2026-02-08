"use client"

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import PizzaSelectionModal from '@/components/PizzaSelectionModal'
import CheckoutFlow from '@/components/CheckoutFlow'

type Store = {
  id: string
  store_name: string
  slug: string
  category: 'varejo' | 'alimentacao'
  theme_color: string
  logo_url: string | null
  description: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  status: string
  delivery_fee: number | null
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  images: string[] | null
  active: boolean
  stock_quantity: number | null
  category: string | null
  has_variants?: boolean
}

type Additional = {
  id: string
  name: string
  price: number
}

const THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  azul: { primary: '#003049', secondary: '#0077B6', accent: '#00B4D8' },
  vermelho: { primary: '#D62828', secondary: '#F77F00', accent: '#FCBF49' },
  verde: { primary: '#2D6A4F', secondary: '#52B788', accent: '#95D5B2' },
  roxo: { primary: '#5A189A', secondary: '#9D4EDD', accent: '#C77DFF' }
}

export default function LojaPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params as { slug?: string })?.slug as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showPizzaModal, setShowPizzaModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Estados do modal de produto
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [selectedAdditionals, setSelectedAdditionals] = useState<Additional[]>([])
  const [modalNotes, setModalNotes] = useState('')
  const [modalQuantity, setModalQuantity] = useState(1)
  
  // Estados para variantes
  const [productVariants, setProductVariants] = useState<any[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [filteredColors, setFilteredColors] = useState<string[]>([]) // Cores filtradas por tamanho
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [colorHexMap, setColorHexMap] = useState<Record<string, string>>({})

  // Carregar carrinho do localStorage quando a página monta
  useEffect(() => {
    if (!store?.id) return
    
    // Tentar carregar o carrinho salvo
    const savedCart = localStorage.getItem(`cart_${store.id}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Erro ao carregar carrinho salvo:', e)
      }
    }

    // Verificar se há item pendente da página de detalhes
    const pendingItem = sessionStorage.getItem('pending_cart_item')
    if (pendingItem) {
      try {
        const cartItem = JSON.parse(pendingItem)
        setCart(prev => [...prev, cartItem])
        sessionStorage.removeItem('pending_cart_item')
      } catch (e) {
        console.error('Erro ao processar item pendente:', e)
      }
    }
  }, [store?.id])

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (store?.id && cart.length > 0) {
      localStorage.setItem(`cart_${store.id}`, JSON.stringify(cart))
    } else if (store?.id && cart.length === 0) {
      localStorage.removeItem(`cart_${store.id}`)
    }
  }, [cart, store?.id])

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    const fetchStoreData = async () => {
      try {
        // Buscar loja por slug
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .single()

        if (storeError || !storeData) {
          setStore(null)
          setLoading(false)
          return
        }

        setStore(storeData as Store)

        // Buscar produtos ativos
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('active', true)
          .order('name')

        // Processar images e buscar estoque de variantes
        const processedProducts = await Promise.all((productsData || []).map(async (p: any) => {
          const productData = {
            ...p,
            images: (() => {
              if (!p?.images) return null
              if (Array.isArray(p.images)) return p.images
              try { return JSON.parse(p.images) } catch { return null }
            })()
          }

          // Se o produto usa variantes, calcular estoque total das variantes ativas
          if (p.has_variants) {
            const { data: variants } = await supabase
              .from('product_variants')
              .select('stock_quantity, active')
              .eq('product_id', p.id)
              .eq('active', true)
            
            const totalStock = (variants || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
            return { ...productData, stock_quantity: totalStock }
          }

          return productData
        }))

        setProducts(processedProducts as Product[])
      } catch (error) {
        console.error('Erro ao carregar loja:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStoreData()
  }, [slug])

  useEffect(() => {
    const fetchColorCatalog = async () => {
      const { data, error } = await supabase
        .from('product_colors')
        .select('name, hex_code')

      if (error) return

      const map: Record<string, string> = {}
      ;(data || []).forEach((c: any) => {
        if (c?.name && c?.hex_code) {
          map[c.name.trim().toLowerCase()] = c.hex_code
        }
      })
      setColorHexMap(map)
    }

    fetchColorCatalog()
  }, [])

  // Extrair categorias únicas dos produtos
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))] as string[]

  // Filtrar produtos por categoria e busca
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    return matchesCategory && matchesSearch
  })

  // Função para adicionar ao carrinho
  const addToCart = (product: Product, quantity: number = 1, additionals: any[] = [], notes: string = '') => {
    const cartItem = {
      ...product,
      quantity,
      additionals,
      notes,
      cartId: Date.now()
    }
    setCart([...cart, cartItem])
  }

  // Abrir modal de produto
  const openProductModal = async (product: Product) => {
    setSelectedProduct(product)
    
    // Se for pizza, abrir modal específico
    if (product.category === 'Pizza') {
      setShowPizzaModal(true)
      return
    }
    
    setShowProductModal(true)
    setModalQuantity(1)
    setSelectedAdditionals([])
    setModalNotes('')
    setSelectedColor('')
    setSelectedSize('')
    setSelectedVariant(null)
    
    // Se o produto usa variantes, buscar variantes disponíveis
    if (product.has_variants) {
      try {
        const { data: variants, error: varError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', product.id)
          .eq('active', true)
          .gt('stock_quantity', 0)
        
        if (varError) throw varError
        
        setProductVariants(variants || [])
        
        // Extrair cores e tamanhos únicos
        const colors = [...new Set((variants || []).map(v => v.color))]
        const sizes = [...new Set((variants || []).map(v => v.size))]
        
        setAvailableColors(colors)
        setAvailableSizes(sizes)
      } catch (error) {
        console.error('Erro ao buscar variantes:', error)
        setProductVariants([])
        setAvailableColors([])
        setAvailableSizes([])
      }
    }
    
    // Buscar apenas os adicionais vinculados a este produto específico
    if (store?.id && product.id) {
      try {
        const { data, error } = await supabase
          .from('product_additionals')
          .select(`
            additional_id,
            additionals (
              id,
              name,
              price
            )
          `)
          .eq('product_id', product.id)

        if (error) throw error
        
        // Extrair os adicionais da resposta do join
        const productAdditionals = data?.map((item: any) => item.additionals).filter(Boolean) || []
        setAdditionals(productAdditionals)
      } catch (error) {
        console.error('Erro ao buscar adicionais do produto:', error)
        setAdditionals([])
      }
    }
  }

  const toggleAdditional = (additional: Additional) => {
    if (selectedAdditionals.find(a => a.id === additional.id)) {
      setSelectedAdditionals(selectedAdditionals.filter(a => a.id !== additional.id))
    } else {
      setSelectedAdditionals([...selectedAdditionals, additional])
    }
  }

  // Atualizar variante selecionada quando cor e tamanho mudarem
  useEffect(() => {
    if (selectedColor && selectedSize && productVariants.length > 0) {
      const variant = productVariants.find(v => v.color === selectedColor && v.size === selectedSize)
      setSelectedVariant(variant || null)
    } else {
      setSelectedVariant(null)
    }
  }, [selectedColor, selectedSize, productVariants])

  // Filtrar cores disponíveis quando o tamanho for selecionado
  useEffect(() => {
    if (selectedSize && productVariants.length > 0) {
      const colorsForSize = [...new Set(
        productVariants
          .filter(v => v.size === selectedSize && v.stock_quantity > 0)
          .map(v => v.color)
      )]
      setFilteredColors(colorsForSize)
      
      // Resetar cor se a cor atual não estiver disponível para o novo tamanho
      if (selectedColor && !colorsForSize.includes(selectedColor)) {
        setSelectedColor('')
      }
    } else {
      setFilteredColors([])
      setSelectedColor('')
    }
  }, [selectedSize, productVariants, selectedColor])

  const calculateModalTotal = () => {
    if (!selectedProduct) return 0
    
    // Usar preço da variante se selecionada, senão usar preço do produto
    let basePrice = selectedProduct.price
    if (selectedVariant && selectedVariant.price_adjustment) {
      basePrice = basePrice + selectedVariant.price_adjustment
    }
    
    const additionalsTotal = selectedAdditionals.reduce((sum, a) => sum + a.price, 0)
    return (basePrice + additionalsTotal) * modalQuantity
  }

  const getMaxQuantity = useCallback(() => {
    if (!selectedProduct) return null
    if (selectedProduct.has_variants) {
      if (!selectedVariant) return null
      return typeof selectedVariant.stock_quantity === 'number' ? selectedVariant.stock_quantity : 0
    }
    if (selectedProduct.stock_quantity === null || selectedProduct.stock_quantity === undefined) return null
    return selectedProduct.stock_quantity
  }, [selectedProduct, selectedVariant])

  useEffect(() => {
    const limit = getMaxQuantity()
    if (limit !== null && limit > 0 && modalQuantity > limit) {
      setModalQuantity(limit)
    }
    if (limit === 0 && modalQuantity !== 1) {
      setModalQuantity(1)
    }
  }, [getMaxQuantity, modalQuantity])

  const handleAddFromModal = () => {
    if (!selectedProduct) return
    
    // Se o produto usa variantes, verificar se foi selecionada
    if (selectedProduct.has_variants && !selectedVariant) {
      alert('Por favor, selecione cor e tamanho')
      return
    }
    
    const maxQty = getMaxQuantity()
    if (maxQty !== null) {
      if (maxQty <= 0) {
        alert('Produto sem estoque disponível')
        return
      }
      if (modalQuantity > maxQty) {
        alert(`Quantidade máxima disponível: ${maxQty}`)
        return
      }
    }

    // Adicionar informações da variante ao item do carrinho
    const cartItem = {
      ...selectedProduct,
      variant: selectedVariant ? {
        color: selectedVariant.color,
        size: selectedVariant.size,
        sku: selectedVariant.sku,
        price_adjustment: selectedVariant.price_adjustment || 0,
        stock_quantity: selectedVariant.stock_quantity
      } : null,
      quantity: modalQuantity,
      additionals: selectedAdditionals,
      notes: modalNotes,
      cartId: Date.now()
    }
    
    setCart([...cart, cartItem])
    setShowProductModal(false)
    setSelectedProduct(null)
    setModalQuantity(1)
    setSelectedAdditionals([])
    setModalNotes('')
  }

  const handleAddPizzaToCart = (pizzaItem: any) => {
    const cartItem = {
      ...pizzaItem.product,
      quantity: pizzaItem.quantity,
      size: pizzaItem.size,
      flavors: pizzaItem.flavors,
      additionals: pizzaItem.additionals,
      pizzaConfig: pizzaItem.pizzaConfig,
      notes: '',
      cartId: Date.now(),
      unitPrice: pizzaItem.unitPrice,
      totalPrice: pizzaItem.totalPrice
    }
    setCart([...cart, cartItem])
    setShowPizzaModal(false)
    setSelectedProduct(null)
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setSelectedProduct(null)
    setModalQuantity(1)
    setSelectedAdditionals([])
    setModalNotes('')
  }

  // Remover do carrinho
  const removeFromCart = (cartId: number) => {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  const updateCartQuantity = (cartId: number, nextQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item

        let maxQty = item.stock_quantity
        if (item.variant?.stock_quantity !== undefined && item.variant?.stock_quantity !== null) {
          maxQty = item.variant.stock_quantity
        }

        const safeQty = typeof maxQty === 'number' ? Math.min(nextQty, maxQty) : nextQty
        if (safeQty < 1) return item

        if (item.pizzaConfig) {
          const unitPrice = item.unitPrice || 0
          return {
            ...item,
            quantity: safeQty,
            totalPrice: unitPrice * safeQty
          }
        }

        return {
          ...item,
          quantity: safeQty
        }
      })
    )
  }

  // Calcular total do carrinho
  const cartTotal = cart.reduce((sum, item) => {
    // Se for pizza, usar totalPrice calculado
    if (item.pizzaConfig) {
      return sum + (item.totalPrice || 0)
    }
    // Se não for pizza, calcular normalmente
    const additionalsTotal = item.additionals?.reduce((s: number, a: any) => s + (a.price || 0), 0) || 0
    return sum + (item.price + additionalsTotal) * item.quantity
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando loja...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚠️ Loja não encontrada</h1>
          <p className="text-gray-600 mb-4">A loja que você está procurando não existe ou está inativa.</p>
          <p className="text-xs text-gray-500 mb-6 bg-gray-100 p-3 rounded font-mono">
            URL: <span className="text-gray-700">{slug}</span>
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Voltar para home
          </Link>
        </div>
      </div>
    )
  }

  const theme = THEME_COLORS[store.theme_color] || THEME_COLORS.azul
  const isAlimentacao = store.category === 'alimentacao'
  const maxQty = getMaxQuantity()

  const getColorHex = (colorName: string) => {
    const key = colorName.trim().toLowerCase()
    if (colorHexMap[key]) return colorHexMap[key]
    const colorMap: Record<string, string> = {
      preto: '#000000',
      branca: '#ffffff',
      branco: '#ffffff',
      cinza: '#9ca3af',
      cinzaescuro: '#4b5563',
      cinzaescuroa: '#4b5563',
      amarelo: '#facc15',
      azul: '#3b82f6',
      'azul marinho': '#1e3a8a',
      vermelho: '#ef4444',
      verde: '#22c55e',
      rosa: '#ec4899',
      marrom: '#78350f',
      bege: '#f5f5dc'
    }
    return colorMap[key] || '#e5e7eb'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com tema da loja */}
      <header 
        className="text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {/* Logo */}
            {store.logo_url && (
              <div className="w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image 
                  src={store.logo_url} 
                  alt={store.store_name}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
            )}
            
            {/* Informações */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{store.store_name}</h1>
              {store.description && (
                <p className="text-white/90 mb-3">{store.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                {store.phone && (
                  <a 
                    href={`https://wa.me/55${store.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    📱 WhatsApp
                  </a>
                )}
                {store.address && (
                  <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                    📍 {store.city && store.state ? `${store.city} - ${store.state}` : 'Ver endereço'}
                  </span>
                )}
                {isAlimentacao && store.delivery_fee !== null && (
                  <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                    🚚 Entrega: R$ {store.delivery_fee.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Barra de Busca e Filtros */}
        <div className="mb-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorias */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: theme.primary } : {}}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isAlimentacao ? '🍽️ Cardápio' : '🛍️ Produtos'}
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'Nenhum produto encontrado com os filtros aplicados.'
                : isAlimentacao 
                  ? 'Nenhum item no cardápio no momento.' 
                  : 'Nenhum produto disponível no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Imagem do produto */}
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image 
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      {isAlimentacao ? '🍽️' : '📦'}
                    </div>
                  )}
                </div>

                {/* Informações do produto */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    {/* Ocultar preço para Pizza */}
                    {product.category === 'Pizza' ? (
                      <p className="text-sm text-gray-600 italic">
                        Clique em Adicionar ao Carrinho para escolher o tamanho e sabores da sua Pizza.
                      </p>
                    ) : (
                      <>
                        <span 
                          className="text-2xl font-bold"
                          style={{ color: theme.primary }}
                        >
                          R$ {product.price.toFixed(2)}
                        </span>

                        {!isAlimentacao && product.stock_quantity !== null && (
                          <span className="text-sm text-gray-500">
                            {product.stock_quantity > 0 
                              ? `${product.stock_quantity} disponível` 
                              : 'Esgotado'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Botão de ação unificado */}
                  <div>
                    <button
                      onClick={() => openProductModal(product)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: theme.secondary }}
                    >
                      🛒 Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carrinho Flutuante */}
        {cart.length > 0 && (
          <button
            onClick={() => setShowCheckout(true)}
            className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">🛒</span>
            <div className="text-left">
              <div className="font-bold">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</div>
              <div className="text-sm">R$ {cartTotal.toFixed(2)}</div>
            </div>
          </button>
        )}


        {/* Modal de Produto */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header com Imagem */}
              <div className="relative h-64 bg-gray-100">
                {selectedProduct.images?.[0] ? (
                  <Image
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-6xl">
                    🍽️
                  </div>
                )}
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Nome e Descrição */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                  {selectedProduct.description && (
                    <div className="prose prose-sm max-w-none text-gray-600">
                      {selectedProduct.description.split('\n').map((line, idx) => (
                        <p key={idx} className="mb-2 last:mb-0">{line}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-2xl font-bold mt-3" style={{ color: theme.primary }}>
                    R$ {selectedProduct.price.toFixed(2)}
                    {selectedVariant && Number(selectedVariant.price_adjustment || 0) !== 0 && (
                      <span className="text-lg ml-2">
                        {Number(selectedVariant.price_adjustment || 0) > 0 ? '+' : ''}
                        R$ {Number(selectedVariant.price_adjustment || 0).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Seletores de Variante (Tamanho primeiro, depois Cor) */}
                {selectedProduct.has_variants && (
                  <div className="space-y-4">
                    {/* Seletor de Tamanho - PRIMEIRO */}
                    {availableSizes.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">
                          Tamanho <span className="text-red-500">*</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map(size => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                selectedSize === size
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seletor de Cor - Aparece DEPOIS de selecionar tamanho */}
                    {selectedSize && filteredColors.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">
                          Cor <span className="text-red-500">*</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {filteredColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                selectedColor === color
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: getColorHex(color) }}
                                />
                                {color}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mensagem se não houver cores para o tamanho selecionado */}
                    {selectedSize && filteredColors.length === 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Não há cores disponíveis para o tamanho <strong>{selectedSize}</strong> no momento.
                        </p>
                      </div>
                    )}

                    {/* Informações da Variante Selecionada */}
                    {selectedVariant && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✓ <strong>Tamanho {selectedVariant.size} - Cor {selectedVariant.color}</strong>
                          {selectedVariant.stock_quantity > 0 && (
                            <span className="ml-2">({selectedVariant.stock_quantity} disponível)</span>
                          )}
                        </p>
                        {selectedVariant.sku && (
                          <p className="text-xs text-green-600 mt-1">SKU: {selectedVariant.sku}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Adicionais */}
                {additionals.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Adicionais</h3>
                    <div className="space-y-2">
                      {additionals.map(additional => (
                        <label
                          key={additional.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAdditionals.some(a => a.id === additional.id)}
                            onChange={() => toggleAdditional(additional)}
                            className="w-5 h-5 rounded border-gray-300"
                            style={{ accentColor: theme.primary }}
                          />
                          <span className="flex-1 font-medium">{additional.name}</span>
                          <span className="text-gray-600">+ R$ {additional.price.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}



                {/* Quantidade */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Quantidade</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold hover:bg-gray-100"
                      style={{ borderColor: theme.primary }}
                    >
                      −
                    </button>
                    <span className="text-xl font-bold min-w-[3rem] text-center">{modalQuantity}</span>
                    <button
                      onClick={() => setModalQuantity(prev => {
                        if (selectedProduct?.has_variants && !selectedVariant) return prev
                        if (maxQty !== null) {
                          if (maxQty <= 0) return prev
                          return Math.min(maxQty, prev + 1)
                        }
                        return prev + 1
                      })}
                      disabled={(selectedProduct?.has_variants && !selectedVariant) || (maxQty !== null && (maxQty <= 0 || modalQuantity >= maxQty))}
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: theme.primary }}
                    >
                      +
                    </button>
                  </div>
                  {maxQty !== null && (
                    <p className="text-xs text-gray-500 mt-2">
                      Máximo disponível: {maxQty}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer com Botão */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={handleAddFromModal}
                  disabled={(selectedProduct?.has_variants && !selectedVariant) || (maxQty !== null && maxQty <= 0)}
                  className="w-full py-4 rounded-lg text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: theme.secondary }}
                >
                  Adicionar ao Carrinho • R$ {calculateModalTotal().toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal de Seleção de Pizza */}
      <PizzaSelectionModal
        isOpen={showPizzaModal}
        onClose={() => {
          setShowPizzaModal(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        storeId={store?.id || ''}
        onAddToCart={handleAddPizzaToCart}
      />

      {/* Fluxo de Checkout */}
      {showCheckout && store?.id && (
        <CheckoutFlow
          storeId={store.id}
          cartItems={cart}
          cartTotal={cartTotal}
          onUpdateCartQuantityAction={updateCartQuantity}
          onRemoveCartItemAction={removeFromCart}
          onCheckoutCompleteAction={(orderId) => {
            // Limpar carrinho
            setCart([])
            setShowCheckout(false)
            localStorage.removeItem(`cart_${store.id}`)
            // Redirecionar para página de sucesso
            router.push(`/lojas/${store.id}/pedido/${orderId}`)
          }}
          onCheckoutCancelAction={() => {
            setShowCheckout(false)
          }}
        />
      )}

      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Loja hospedada no <strong style={{ color: theme.primary }}>Portal Modelo</strong></p>
        </div>
      </footer>
    </div>
  )
}
