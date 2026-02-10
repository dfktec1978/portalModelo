"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import CheckoutFlow from '@/components/CheckoutFlow'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  variant?: any
  additionals?: any[]
  notes?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params?.slug as string

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Carregar carrinho do sessionStorage ou localStorage
  useEffect(() => {
    if (!storeId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Tentar carregar do localStorage primeiro
    try {
      const savedCart = localStorage.getItem(`cart_${storeId}`)
      if (savedCart) {
        const items = JSON.parse(savedCart)
        setCartItems(items)

        // Calcular total
        const total = items.reduce((sum: number, item: CartItem) => {
          let itemTotal = item.price * item.quantity
          if (item.additionals) {
            itemTotal += item.additionals.reduce((adSum: number, ad: any) => adSum + ad.price * item.quantity, 0)
          }
          return sum + itemTotal
        }, 0)

        setCartTotal(total)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  const handleCheckoutComplete = (orderId: string) => {
    // Limpar carrinho
    if (storeId) {
      localStorage.removeItem(`cart_${storeId}`)
    }
    // Redirecionar para página de sucesso
    router.push(`/lojas/${storeId}/pedido/${orderId}`)
  }

  const handleCheckoutCancel = () => {
    // Voltar para a loja
    router.back()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    )
  }

  if (notFound || cartItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Carrinho Vazio</h2>
          <p className="text-gray-600 mb-6">Parece que seu carrinho está vazio. Adicione alguns produtos para continuar.</p>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {storeId && (
        <CheckoutFlow
          storeId={storeId}
          cartItems={cartItems}
          cartTotal={cartTotal}
          onCheckoutCompleteAction={handleCheckoutComplete}
          onCheckoutCancelAction={handleCheckoutCancel}
        />
      )}
    </div>
  )
}
