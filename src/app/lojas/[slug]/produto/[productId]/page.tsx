"use client"

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { getReadableTextColor, getTheme, PORTAL_THEMES, ThemeColor } from '@/lib/themes'

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
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  images: string[] | null
  category: string | null
  has_variants?: boolean
  sku?: string
  technical_description?: string
  composition?: string
  brand?: string
  model?: string
}

function resolveThemeId(themeColor?: string | null): ThemeColor {
  if (themeColor && themeColor in PORTAL_THEMES) {
    return themeColor as ThemeColor
  }
  return 'azul'
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const productId = params?.productId as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para galeria
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Estados para variantes
  const [productVariants, setProductVariants] = useState<any[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [filteredColors, setFilteredColors] = useState<string[]>([])
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!slug || !productId) return

    const fetchData = async () => {
      try {
        // Buscar loja
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!storeData) {
          router.push('/')
          return
        }

        setStore(storeData as Store)

        // Buscar produto
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('store_id', storeData.id)
          .single()

        if (!productData) {
          router.push(`/lojas/${slug}`)
          return
        }

        const processedProduct = {
          ...productData,
          images: (() => {
            if (!productData?.images) return null
            if (Array.isArray(productData.images)) return productData.images
            try { return JSON.parse(productData.images) } catch { return null }
          })()
        }

        setProduct(processedProduct as Product)

        // Se tem variantes, buscar
        if (productData.has_variants) {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .eq('active', true)
            .gt('stock_quantity', 0)

          setProductVariants(variants || [])
          
          const sizes = [...new Set((variants || []).map(v => v.size))]
          setAvailableSizes(sizes)
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, productId, router])

  // Filtrar cores quando tamanho é selecionado
  useEffect(() => {
    if (selectedSize && productVariants.length > 0) {
      const colorsForSize = [...new Set(
        productVariants
          .filter(v => v.size === selectedSize && v.stock_quantity > 0)
          .map(v => v.color)
      )]
      setFilteredColors(colorsForSize)
      
      if (selectedColor && !colorsForSize.includes(selectedColor)) {
        setSelectedColor('')
      }
    } else {
      setFilteredColors([])
      setSelectedColor('')
    }
  }, [selectedSize, productVariants, selectedColor])

  // Atualizar variante selecionada
  useEffect(() => {
    if (selectedColor && selectedSize && productVariants.length > 0) {
      const variant = productVariants.find(v => v.color === selectedColor && v.size === selectedSize)
      setSelectedVariant(variant || null)
    } else {
      setSelectedVariant(null)
    }
  }, [selectedColor, selectedSize, productVariants])

  const getMaxQuantity = useCallback(() => {
    if (!product) return null
    if (product.has_variants) {
      if (!selectedVariant) return null
      return typeof selectedVariant.stock_quantity === 'number' ? selectedVariant.stock_quantity : 0
    }
    return null
  }, [product, selectedVariant])

  const handleAddToCart = () => {
    if (product?.has_variants && !selectedVariant) {
      alert('Por favor, selecione tamanho e cor')
      return
    }

    const maxQty = getMaxQuantity()
    if (maxQty !== null && maxQty <= 0) {
      alert('Produto sem estoque')
      return
    }
    if (maxQty !== null && quantity > maxQty) {
      alert(`Quantidade máxima: ${maxQty}`)
      return
    }

    // Construir URL com o carrinho como query parameter
    const cartItem = {
      ...product,
      variant: selectedVariant ? {
        color: selectedVariant.color,
        size: selectedVariant.size,
        sku: selectedVariant.sku,
        price_adjustment: selectedVariant.price_adjustment || 0
      } : null,
      quantity,
      cartId: Date.now()
    }

    // Passar para página da loja com carrinho no sessionStorage
    sessionStorage.setItem('pending_cart_item', JSON.stringify(cartItem))
    
    // Redirecionar para loja
    router.push(`/lojas/${slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Link href={`/lojas/${slug}`} className="text-blue-600 hover:underline">Voltar para loja</Link>
        </div>
      </div>
    )
  }

  const themeConfig = getTheme(resolveThemeId(store.theme_color))
  const theme = themeConfig.colors
  const secondaryTextColor = getReadableTextColor(theme.secondary)
  const images = product.images || []
  const maxQty = getMaxQuantity()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/lojas/${slug}`} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
            ← Voltar para {store.store_name}
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-6xl">
                  📦
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'ring-2'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={selectedImageIndex === idx ? { borderColor: theme.secondary, boxShadow: `0 0 0 2px ${theme.secondary}33` } : {}}
                  >
                    <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-sm text-gray-500">Marca: {product.brand}</p>
              )}
            </div>

            <div>
              <p className="text-4xl font-bold" style={{ color: theme.primary }}>
                R$ {product.price.toFixed(2)}
                {selectedVariant && Number(selectedVariant.price_adjustment || 0) !== 0 && (
                  <span className="text-2xl ml-2 text-gray-600">
                    {Number(selectedVariant.price_adjustment || 0) > 0 ? '+' : ''}
                    R$ {Number(selectedVariant.price_adjustment || 0).toFixed(2)}
                  </span>
                )}
              </p>
            </div>

            {/* Descrição */}
            {product.description && (
              <div className="prose max-w-none">
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {/* Seletores de Variante */}
            {product.has_variants && (
              <div className="space-y-4 border-t pt-6">
                {/* Tamanho */}
                {availableSizes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Tamanho <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                            selectedSize === size
                              ? ''
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={selectedSize === size ? { borderColor: theme.secondary, backgroundColor: `${theme.secondary}14`, color: theme.secondary } : {}}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cor */}
                {selectedSize && filteredColors.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Cor <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {filteredColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                            selectedColor === color
                              ? ''
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={selectedColor === color ? { borderColor: theme.secondary, backgroundColor: `${theme.secondary}14`, color: theme.secondary } : {}}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info da Variante */}
                {selectedVariant && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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

            {/* Quantidade */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Quantidade</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold hover:bg-gray-100"
                  style={{ borderColor: theme.primary }}
                >
                  −
                </button>
                <span className="text-2xl font-bold min-w-[4rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => {
                    if (product?.has_variants && !selectedVariant) return prev
                    if (maxQty !== null && maxQty > 0) return Math.min(maxQty, prev + 1)
                    return prev + 1
                  })}
                  disabled={(product?.has_variants && !selectedVariant) || (maxQty !== null && (maxQty <= 0 || quantity >= maxQty))}
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: theme.primary }}
                >
                  +
                </button>
              </div>
              {maxQty !== null && (
                <p className="text-sm text-gray-500 mt-2">Máximo disponível: {maxQty}</p>
              )}
            </div>

            {/* Botão Adicionar */}
            <button
              onClick={handleAddToCart}
              disabled={(product?.has_variants && !selectedVariant) || (maxQty !== null && maxQty <= 0)}
              className="w-full py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.secondary, color: secondaryTextColor }}
            >
              🛒 Adicionar ao Carrinho
            </button>

            {/* Informações Técnicas */}
            {(product.technical_description || product.composition) && (
              <div className="border-t pt-6 space-y-4">
                {product.technical_description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição Técnica</h3>
                    <p className="text-sm text-gray-700">{product.technical_description}</p>
                  </div>
                )}
                {product.composition && (
                  <div>
                    <h3 className="font-semibold mb-2">Composição</h3>
                    <p className="text-sm text-gray-700">{product.composition}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
