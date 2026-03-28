"use client"

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { getReadableTextColor, getTheme, getThemeSemanticTokens, PORTAL_THEMES, ThemeColor } from '@/lib/themes'
import PizzaSelectionModal from '@/components/PizzaSelectionModal'
import CheckoutFlow from '@/components/CheckoutFlow'

type Store = {
  id: string
  store_name: string
  slug: string
  category: string | null
  plan: string | null
  photo_limit: number | null
  theme_color: string
  logo_url: string | null
  description: string | null
  specialty: string | null
  phone: string | null
  address: string | null
  email: string | null
  facebook_url: string | null
  instagram_url: string | null
  business_hours: string | null
  landing_description: string | null
  landing_photo_urls: string[] | null
  city: string | null
  state: string | null
  status: string
  delivery_fee: number | null
  min_order_delivery: number | null
  delivery_options: any | null
  payment_options: any | null
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

function resolveThemeId(themeColor?: string | null): ThemeColor {
  if (themeColor && themeColor in PORTAL_THEMES) {
    return themeColor as ThemeColor
  }
  return 'azul'
}

function IconCategory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M3.75 7.5h6.5v6.5h-6.5z" />
      <path d="M13.75 7.5h6.5v3.25h-6.5z" />
      <path d="M13.75 13.75h6.5v6.5h-6.5z" />
      <path d="M3.75 17h6.5" />
    </svg>
  )
}

function IconLocation() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M12 20s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="9" r="2.25" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.75v4.75l3 1.75" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.25" />
      <path d="m5 7 7 5 7-5" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M19.2 4.8A9.8 9.8 0 0 0 3.6 16.2L2 22l6-1.6a9.8 9.8 0 0 0 4 .8h0a9.8 9.8 0 0 0 7.2-16.4Zm-7.2 14.7a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3.6.9 1-3.5-.2-.4a8.1 8.1 0 1 1 7.2 4.3Zm4.4-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1-.7.8-.9 1-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.8c-.1-.3 0-.4.1-.6l.4-.5.2-.4a.6.6 0 0 0 0-.5c-.1-.1-.6-1.4-.9-1.9-.2-.5-.5-.4-.6-.4h-.5a1 1 0 0 0-.8.4 3.1 3.1 0 0 0-1 2.2c0 1.3.9 2.5 1 2.7.1.2 2 3 4.9 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.2-.5-.3Z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M13.4 21v-7.4h2.5l.4-3h-2.9V8.7c0-.9.3-1.5 1.6-1.5h1.5V4.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.9v2.3H8v3h2.6V21h2.8Z" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="m14.5 5.5-6 6 6 6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="m9.5 5.5 6 6-6 6" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 11 7.5-4.2" />
      <path d="m8.2 13 7.5 4.2" />
    </svg>
  )
}

function normalizeDeliveryOptions(raw: any): { retirada: boolean; envio: boolean; condicional: boolean } {
  if (Array.isArray(raw)) return { retirada: raw.includes('retirada'), envio: raw.includes('envio'), condicional: raw.includes('condicional') }
  if (raw && typeof raw === 'object') return { retirada: !!raw.retirada, envio: !!raw.envio, condicional: !!raw.condicional }
  return { retirada: true, envio: false, condicional: false }
}

function normalizePaymentOptions(raw: any): { pix: boolean; na_entrega: boolean; na_retirada: boolean; cartao: boolean } {
  if (Array.isArray(raw)) return { pix: raw.includes('pix'), na_entrega: raw.includes('na_entrega'), na_retirada: raw.includes('na_retirada'), cartao: raw.includes('cartao') }
  if (raw && typeof raw === 'object') return { pix: !!raw.pix, na_entrega: !!raw.na_entrega, na_retirada: !!raw.na_retirada, cartao: !!raw.cartao }
  return { pix: true, na_entrega: false, na_retirada: false, cartao: false }
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
  const [shareProduct, setShareProduct] = useState<Product | null>(null)
  const [shareFeedback, setShareFeedback] = useState('')
  
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
  const [activeShowcasePhotoIndex, setActiveShowcasePhotoIndex] = useState(0)
  const [hoveredShowcasePhotoIndex, setHoveredShowcasePhotoIndex] = useState<number | null>(null)

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
        // Buscar loja por slug e, se nao encontrar, tentar por id (retrocompatibilidade)
        let storeData: any = null
        let storeError: any = null

        const bySlug = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .in('status', ['active', 'approved'])
          .maybeSingle()

        storeData = bySlug.data
        storeError = bySlug.error

        if (!storeData) {
          const byId = await supabase
            .from('stores')
            .select('*')
            .eq('id', slug)
            .in('status', ['active', 'approved'])
            .maybeSingle()

          storeData = byId.data
          storeError = byId.error
        }

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

  const makeExternalUrl = (value?: string | null, prefix?: string) => {
    const raw = String(value || '').trim()
    if (!raw) return null
    if (/^https?:\/\//i.test(raw)) return raw
    if (!prefix) return raw
    return `${prefix}${raw.replace(/^@/, '')}`
  }

  const isSharePlan = ['destaque', 'premium'].includes(String(store?.plan || '').toLowerCase())
  const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const buildProductLink = (product: Product) => {
    if (typeof window === 'undefined') return ''
    const storeSlug = store?.slug || slug
    return `${window.location.origin}/lojas/${storeSlug}/produto/${product.id}`
  }

  const shareViaWhatsApp = (product: Product) => {
    const link = buildProductLink(product)
    if (!link) return
    const text = `Confira ${product.name} da loja ${store?.store_name || ''}\n\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setShareProduct(null)
  }

  const shareNatively = async (product: Product) => {
    const link = buildProductLink(product)
    if (!link || !supportsNativeShare) return

    try {
      await navigator.share({
        title: product.name,
        text: `Confira ${product.name} da loja ${store?.store_name || ''}`,
        url: link,
      })
      setShareProduct(null)
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        setShareFeedback('Não foi possível abrir o compartilhamento nativo.')
        setTimeout(() => setShareFeedback(''), 2400)
      }
    }
  }

  const shareViaFacebook = (product: Product) => {
    const link = buildProductLink(product)
    if (!link) return
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank', 'noopener,noreferrer')
    setShareProduct(null)
  }

  const copyShareLink = async (product: Product) => {
    const link = buildProductLink(product)
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setShareFeedback('Link do produto copiado!')
    } catch {
      setShareFeedback('Não foi possível copiar o link.')
    }
    setShareProduct(null)
    setTimeout(() => setShareFeedback(''), 2400)
  }

  const isShowcasePlan = ['presenca', 'landingpage'].includes(String(store?.plan || '').toLowerCase())
  const isPresencePlan = String(store?.plan || '').toLowerCase() === 'presenca'
  const showcaseDescription = store?.landing_description || store?.description || ''
  const showcasePhotoLimit = Number.isFinite(Number(store?.photo_limit)) && Number(store?.photo_limit) > 0
    ? Math.max(1, Math.floor(Number(store.photo_limit)))
    : String(store?.plan || '').toLowerCase() === 'landingpage'
      ? 10
      : 5
  const showcasePhotos = Array.isArray(store?.landing_photo_urls)
    ? store.landing_photo_urls.filter(Boolean).slice(0, showcasePhotoLimit)
    : []
  const showcasePhotoSlots = Array.from(
    { length: Math.max(1, Math.min(showcasePhotoLimit, Math.max(showcasePhotos.length, 1))) },
    (_, index) => showcasePhotos[index] || null,
  )
  const currentShowcasePhoto = showcasePhotos[activeShowcasePhotoIndex] || showcasePhotos[0] || null
  const hasMultipleShowcasePhotos = showcasePhotos.length > 1
  const whatsappUrl = store?.phone
    ? `https://wa.me/55${store.phone.replace(/\D/g, '')}`
    : null
  const instagramUrl = makeExternalUrl(store?.instagram_url, 'https://instagram.com/')
  const facebookUrl = makeExternalUrl(store?.facebook_url, 'https://facebook.com/')
  const shouldRenderCatalog = products.length > 0 && !isPresencePlan

  useEffect(() => {
    if (showcasePhotos.length === 0) {
      setActiveShowcasePhotoIndex(0)
      return
    }

    if (activeShowcasePhotoIndex > showcasePhotos.length - 1) {
      setActiveShowcasePhotoIndex(0)
    }
  }, [activeShowcasePhotoIndex, showcasePhotos.length])

  const showPreviousShowcasePhoto = () => {
    if (!hasMultipleShowcasePhotos) return
    setActiveShowcasePhotoIndex((current) => (current - 1 + showcasePhotos.length) % showcasePhotos.length)
  }

  const showNextShowcasePhoto = () => {
    if (!hasMultipleShowcasePhotos) return
    setActiveShowcasePhotoIndex((current) => (current + 1) % showcasePhotos.length)
  }

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

  const themeConfig = getTheme(resolveThemeId(store.theme_color))
  const theme = themeConfig.colors
  const themeTokens = getThemeSemanticTokens(themeConfig)
  const secondaryTextColor = getReadableTextColor(theme.secondary)
  const isAlimentacao = store.category === 'alimentacao'
  const maxQty = getMaxQuantity()

  // Dados reais para o banner operacional
  const delivOpts = normalizeDeliveryOptions(store.delivery_options)
  const payOpts = normalizePaymentOptions(store.payment_options)
  const minOrder = store.min_order_delivery
  const paymentLabel = [
    payOpts.pix ? 'Pix' : null,
    payOpts.na_entrega ? 'Na entrega' : null,
    payOpts.na_retirada ? 'Na retirada' : null,
    payOpts.cartao ? 'Cartão' : null,
  ].filter(Boolean).join(', ') || 'Consulte'
  const deliveryLabel = [
    delivOpts.envio && store.delivery_fee !== null ? `Entrega R$ ${store.delivery_fee.toFixed(2)}` : delivOpts.envio ? 'Entrega disponível' : null,
    delivOpts.retirada ? 'Retirada disponível' : null,
  ].filter(Boolean).join(' · ') || 'Consulte as opções'

  return (
    <div className="min-h-screen bg-gray-50">
      <header 
        className="text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {store.logo_url && (
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-lg shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image 
                  src={store.logo_url} 
                  alt={store.store_name}
                  width={96}
                  height={96}
                  className="object-contain p-2"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{store.store_name}</h1>
                {isShowcasePlan && (
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur"
                    style={{
                      border: `1px solid ${theme.accent}`,
                      backgroundColor: `${theme.primary}CC`,
                      boxShadow: `0 10px 30px ${theme.primary}40`,
                    }}
                  >
                    {String(store.plan || '').toLowerCase() === 'landingpage' ? 'Plano LandingPage' : 'Plano Grátis'}
                  </span>
                )}
              </div>
              {store.specialty && (
                <p className="text-white/80 text-sm md:text-base mb-2">{store.specialty}</p>
              )}
              {showcaseDescription && (
                <p className="text-white/90 mb-3 max-w-4xl">{showcaseDescription}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                {whatsappUrl && (
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <IconWhatsApp />
                    WhatsApp
                  </a>
                )}
                {(store.city || store.state) && (
                  <span className="inline-flex items-center gap-2 whitespace-nowrap bg-white/20 px-4 py-2 rounded-lg">
                    <IconLocation />
                    {[store.city, store.state].filter(Boolean).join(' - ')}
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
      <main className={`max-w-6xl mx-auto flex flex-col px-4 py-8 ${cart.length > 0 && shouldRenderCatalog ? 'pb-28 md:pb-8' : ''}`}>
        {isAlimentacao && shouldRenderCatalog && (
          <section className="order-1 mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Atendimento</p>
              <p className="mt-1 text-sm font-semibold text-emerald-950">Pedido imediato</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Entrega / Retirada</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 leading-tight">{deliveryLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pagamento</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{paymentLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pedido mínimo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {minOrder && minOrder > 0 ? `R$ ${minOrder.toFixed(2)}` : 'Sem mínimo'}
              </p>
            </div>
          </section>
        )}

        {isShowcasePlan && (
          <section className={`mb-12 space-y-4 md:space-y-5 ${isAlimentacao && shouldRenderCatalog ? 'order-3' : 'order-1'}`}>
            <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-xl lg:grid-cols-[1.45fr_0.62fr]">
              <div className="border-b border-slate-200/80 p-3 md:p-4 lg:border-b-0 lg:border-r">
                <div className="rounded-[20px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-inner ring-1 ring-slate-200/70">
                  <div className="relative aspect-[4/2.6] overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-sm">
                    {currentShowcasePhoto ? (
                      <Image
                        src={currentShowcasePhoto}
                        alt={`${store.store_name} - visualização principal`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-3xl font-light leading-tight text-slate-500 md:text-4xl">
                        Visualização da foto
                      </div>
                    )}

                    {hasMultipleShowcasePhotos && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousShowcasePhoto}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-black/55"
                          aria-label="Foto anterior"
                        >
                          <IconChevronLeft />
                        </button>
                        <button
                          type="button"
                          onClick={showNextShowcasePhoto}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-black/55"
                          aria-label="Próxima foto"
                        >
                          <IconChevronRight />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
                    {showcasePhotoSlots.map((photo, index) => {
                      const isActive = photo ? index === activeShowcasePhotoIndex : index === 0 && !currentShowcasePhoto
                      const isHovered = hoveredShowcasePhotoIndex === index
                      return (
                        <button
                          key={`showcase-slot-${index}`}
                          type="button"
                          onClick={() => photo && setActiveShowcasePhotoIndex(index)}
                          onMouseEnter={() => photo && setHoveredShowcasePhotoIndex(index)}
                          onMouseLeave={() => setHoveredShowcasePhotoIndex(null)}
                          disabled={!photo}
                          className={`overflow-hidden rounded-2xl border text-left transition ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-md'
                              : photo
                                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                          }`}
                          style={
                            isActive
                              ? {
                                  borderColor: theme.accent,
                                  boxShadow: `0 0 0 2px ${theme.accent}, 0 10px 25px rgba(15, 23, 42, 0.18)`,
                                }
                              : isHovered && photo
                                ? {
                                    borderColor: theme.secondary,
                                    boxShadow: `0 0 0 1px ${theme.secondary}, 0 8px 20px ${theme.secondary}22`,
                                  }
                                : undefined
                          }
                        >
                          <div className="relative aspect-[1.15/1] border-b border-current/10 bg-slate-100">
                            {photo ? (
                              <Image
                                src={photo}
                                alt={`${store.store_name} - miniatura ${index + 1}`}
                                fill
                                className={`object-cover transition ${isActive ? 'opacity-90' : 'opacity-100'}`}
                                sizes="(max-width: 768px) 33vw, 12vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[11px] font-medium text-slate-400">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div className="px-2.5 py-2">
                            <span className="block text-xs font-semibold">Foto {index + 1}</span>
                            <span className="mt-0.5 block text-[10px] opacity-80">{index === 0 ? 'Capa' : photo ? 'Galeria' : 'Vazia'}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <aside className="bg-gradient-to-b from-white to-slate-50 p-4 md:p-5">
                <div className="space-y-5 lg:sticky lg:top-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Sobre</h2>
                    <p className="mt-1.5 text-[13px] leading-6 text-slate-700 whitespace-pre-line md:text-sm">
                      {showcaseDescription || 'Descrição institucional não adicionada.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 md:text-lg">Informações</h3>
                    <div className="mt-3 space-y-3.5">
                      {store.category && (
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <IconCategory />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</p>
                            <p className="mt-1 text-[13px] font-medium text-slate-900 md:text-sm">{store.category}</p>
                          </div>
                        </div>
                      )}
                      {(store.address || store.city || store.state) && (
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <IconLocation />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Localização</p>
                            {store.address && <p className="mt-1 text-[13px] font-medium text-slate-900 md:text-sm">{store.address}</p>}
                            {(store.city || store.state) && (
                              <p className="mt-1 text-[13px] text-slate-600 md:text-sm">{[store.city, store.state].filter(Boolean).join(' - ')}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {store.business_hours && (
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <IconClock />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Horário</p>
                            <p className="mt-1 whitespace-pre-line text-[13px] text-slate-700 md:text-sm">{store.business_hours}</p>
                          </div>
                        </div>
                      )}
                      {store.email && (
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            <IconMail />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Contato</p>
                            <a href={`mailto:${store.email}`} className="mt-1 block break-all text-[13px] font-medium text-slate-900 hover:text-slate-700 md:text-sm">
                              {store.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex flex-col gap-2.5">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center gap-3 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/16">
                          <IconWhatsApp />
                        </span>
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
                        style={{
                          borderColor: theme.secondary,
                          color: theme.primary,
                          background: `linear-gradient(180deg, #ffffff 0%, ${theme.accent}18 100%)`,
                          boxShadow: `0 10px 24px ${theme.secondary}20`,
                        }}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${theme.secondary}20` }}>
                          <IconInstagram />
                        </span>
                        <span>Instagram</span>
                      </a>
                    )}
                    {facebookUrl && (
                      <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                          boxShadow: `0 12px 28px ${theme.primary}2B`,
                        }}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/16">
                          <IconFacebook />
                        </span>
                        <span>Facebook</span>
                      </a>
                    )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}

        <section className={`mb-8 ${isAlimentacao ? 'order-2' : 'order-2'}`}>
        {shouldRenderCatalog ? (
          <>
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
                      ? ''
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: themeTokens.buttonPrimaryBg, color: themeTokens.buttonPrimaryText } : {}}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              isAlimentacao ? (
                /* Card compacto horizontal para cardápio */
                <div
                  key={product.id}
                  className="flex flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail quadrado */}
                  <div className="relative w-28 min-w-[112px] self-stretch bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-gray-300">🍽️</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-2.5 gap-0.5 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>
                    )}
                    <div className="mt-auto pt-1.5 space-y-1.5">
                      {product.category === 'Pizza' ? (
                        <span className="block text-xs text-gray-500 italic">Escolha tamanho e sabores</span>
                      ) : (
                        <span className="block text-base font-bold" style={{ color: theme.primary }}>
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                      <div className="flex flex-col gap-1.5">
                        {isSharePlan && (
                          <button
                            onClick={() => setShareProduct(product)}
                            className="inline-flex w-full items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <IconShare />
                            Compartilhar
                          </button>
                        )}
                        <button
                          onClick={() => openProductModal(product)}
                          className="inline-flex w-full items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: theme.secondary, color: secondaryTextColor }}
                        >
                          {product.category === 'Pizza' ? '🍕 Montar' : product.has_variants ? 'Personalizar' : '+ Adicionar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Card vertical padrão para varejo */
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">📦</div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      {product.category === 'Pizza' ? (
                        <p className="text-sm text-gray-600 italic">
                          Clique para escolher tamanho e sabores.
                        </p>
                      ) : (
                        <>
                          <span className="text-2xl font-bold" style={{ color: theme.primary }}>
                            R$ {product.price.toFixed(2)}
                          </span>
                          {product.stock_quantity !== null && (
                            <span className="text-sm text-gray-500">
                              {product.stock_quantity > 0 ? `${product.stock_quantity} disponível` : 'Esgotado'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => openProductModal(product)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: theme.secondary, color: secondaryTextColor }}
                    >
                      🛒 {product.category === 'Pizza' ? 'Montar pizza' : product.has_variants ? 'Personalizar pedido' : 'Adicionar ao Carrinho'}
                    </button>
                    {isSharePlan && (
                      <button
                        onClick={() => setShareProduct(product)}
                        className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <IconShare />
                        Compartilhar produto
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
          </>
        ) : isShowcasePlan ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Página institucional ativa</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Esta vitrine foi configurada para apresentar a empresa, seus canais de contato e sua galeria de fotos.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">
              {isAlimentacao
                ? 'Nenhum item no cardápio no momento.'
                : 'Nenhum produto disponível no momento.'}
            </p>
          </div>
        )}
        </section>

        {/* CTA da Sacola */}
        {cart.length > 0 && shouldRenderCatalog && (
          <>
            <button
              onClick={() => setShowCheckout(true)}
              className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl bg-green-600 px-5 py-4 text-white shadow-2xl transition-colors hover:bg-green-700 md:hidden"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <div className="text-left">
                  <div className="font-bold">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</div>
                  <div className="text-sm text-white/85">R$ {cartTotal.toFixed(2)}</div>
                </div>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">Ver sacola</span>
            </button>

            <button
              onClick={() => setShowCheckout(true)}
              className="fixed bottom-6 right-6 hidden items-center gap-3 rounded-full bg-green-600 px-6 py-4 text-white shadow-lg transition-colors hover:bg-green-700 md:flex"
            >
              <span className="text-2xl">🛒</span>
              <div className="text-left">
                <div className="font-bold">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</div>
                <div className="text-sm">R$ {cartTotal.toFixed(2)}</div>
              </div>
            </button>
          </>
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

      {/* Modal de Compartilhamento de Produto */}
      {shareProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900">Compartilhar produto</h3>
            <p className="mt-1 text-sm text-gray-600">{shareProduct.name}</p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {supportsNativeShare && (
                <button
                  type="button"
                  onClick={() => shareNatively(shareProduct)}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 sm:col-span-2"
                >
                  Compartilhar nativo (recomendado no celular)
                </button>
              )}
              <button
                type="button"
                onClick={() => shareViaWhatsApp(shareProduct)}
                className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => shareViaFacebook(shareProduct)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={() => copyShareLink(shareProduct)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Copiar link
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShareProduct(null)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {shareFeedback && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {shareFeedback}
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
