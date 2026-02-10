"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Order = {
  id: string
  store_id: string
  total: number
  status: string
  client_name: string
  client_email: string
  client_phone: string
  delivery_type: string
  delivery_date?: string
  delivery_time?: string
  delivery_address?: string
  delivery_fee?: number
  payment_method: string
  items: any[]
  created_at: string
  pix_qr_code?: string
  pix_transaction_id?: string
  notes?: string
}

export default function PedidoPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params?.slug as string
  const orderId = params?.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [storeSlug, setStoreSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId || !orderId) return

    const fetchOrder = async () => {
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('store_id', storeId)
          .single()

        if (err) {
          console.error('Erro ao buscar pedido:', err)
          setError('Pedido não encontrado')
          setLoading(false)
          return
        }

        setOrder(data as Order)
        setLoading(false)
      } catch (err) {
        console.error('Erro:', err)
        setError('Erro ao carregar pedido')
        setLoading(false)
      }
    }

    fetchOrder()
  }, [storeId, orderId])

  useEffect(() => {
    if (!storeId) return

    const fetchStoreSlug = async () => {
      const { data } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .maybeSingle()

      if (data?.slug) {
        setStoreSlug(data.slug)
      }
    }

    fetchStoreSlug()
  }, [storeId])

  const copyPixKey = () => {
    if (order?.pix_transaction_id) {
      navigator.clipboard.writeText(order.pix_transaction_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Carregando detalhes do pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Erro ao Carregar Pedido</h1>
          <p className="text-gray-600 mb-6">{error || 'Pedido não encontrado'}</p>
          <Link
            href={`/lojas/${storeSlug || storeId}`}
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Voltar para Loja
          </Link>
        </div>
      </div>
    )
  }

  const statusLabel = {
    'pending': 'Aguardando Pagamento',
    'confirmed': 'Confirmado',
    'processing': 'Em Processamento',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  }

  const deliveryLabel = {
    'retirada': 'Retirada',
    'envio': 'Envio',
    'condicional': 'Condicional (Retirar na loja)'
  }

  const itemsTotal = order.items.reduce((sum: number, item: any) => {
    let total = item.price * item.quantity
    if (item.additionals) {
      total += item.additionals.reduce((adSum: number, ad: any) => adSum + ad.price * item.quantity, 0)
    }
    return sum + total
  }, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center border-t-8 border-green-500">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedido Recebido!</h1>
          <p className="text-gray-600 text-lg">Obrigado por sua compra</p>
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-green-700 font-bold text-lg">Pedido #{order.id}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              👤 Dados Pessoais
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">Nome</p>
                <p className="text-gray-800 font-semibold">{order.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Email</p>
                <p className="text-gray-800 font-semibold text-sm break-all">{order.client_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Telefone</p>
                <p className="text-gray-800 font-semibold">{order.client_phone}</p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📦 Entrega
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">Tipo</p>
                <p className="text-gray-800 font-semibold">{deliveryLabel[order.delivery_type as keyof typeof deliveryLabel] || order.delivery_type}</p>
              </div>
              {order.delivery_date && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Data</p>
                  <p className="text-gray-800 font-semibold">{new Date(order.delivery_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {order.delivery_time && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Horário</p>
                  <p className="text-gray-800 font-semibold">{order.delivery_time}</p>
                </div>
              )}
              {order.delivery_address && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Endereço</p>
                  <p className="text-gray-800 font-semibold text-sm">{order.delivery_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            💳 Pagamento
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 font-medium">Método</p>
              <p className="text-gray-800 font-semibold">{order.payment_method}</p>
            </div>
            {order.pix_transaction_id && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Chave/TxID</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 font-semibold break-all text-sm">{order.pix_transaction_id}</p>
                  <button
                    onClick={copyPixKey}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🧾 Itens
          </h2>
          <div className="divide-y">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500">Qtd: {item.quantity}</div>
                </div>
                <div className="text-gray-800 font-semibold">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 mt-4 border-t flex items-center justify-between">
            <span className="text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-800">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
