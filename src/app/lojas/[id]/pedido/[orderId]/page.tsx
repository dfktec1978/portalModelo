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
  const storeId = params?.id as string
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Método</p>
                <p className="text-gray-800 font-semibold">
                  {order.payment_method === 'pix' ? '🔵 Pix' : '💵 Dinheiro na Entrega'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <p className={`font-semibold ${
                  order.status === 'confirmed' ? 'text-green-600' :
                  order.status === 'cancelled' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {statusLabel[order.status as keyof typeof statusLabel] || order.status}
                </p>
              </div>
            </div>

            {order.payment_method === 'pix' && order.pix_qr_code && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 font-medium mb-3">QR Code Pix</p>
                <div className="flex flex-col gap-3">
                  <img src={order.pix_qr_code} alt="QR Code Pix" className="w-full max-w-xs mx-auto border rounded-lg p-2 bg-gray-50" />
                  {order.pix_transaction_id && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Chave Pix (Copia e Cola):</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={order.pix_transaction_id}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                        />
                        <button
                          onClick={copyPixKey}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
                        >
                          {copied ? '✓ Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Itens do Pedido</h2>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {order.items.map((item: any, idx: number) => {
              const itemTotal = item.price * item.quantity + (item.additionals?.reduce((sum: number, ad: any) => sum + ad.price * item.quantity, 0) || 0)
              return (
                <div key={idx} className="flex justify-between items-start pb-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantidade: {item.quantity}x</p>
                    {item.variant && (
                      <p className="text-sm text-gray-600">
                        Variante: {item.variant.color || '—'} - {item.variant.size || '—'}
                      </p>
                    )}
                    {item.additionals && item.additionals.length > 0 && (
                      <p className="text-sm text-gray-600">Adicionais: {item.additionals.map((ad: any) => ad.name).join(', ')}</p>
                    )}
                  </div>
                  <p className="font-bold text-gray-800">R$ {itemTotal.toFixed(2)}</p>
                </div>
              )
            })}
          </div>

          {/* Order Total */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ {itemsTotal.toFixed(2)}</span>
            </div>
            {order.delivery_fee && order.delivery_fee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Taxa de Entrega</span>
                <span>R$ {order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
              <span>Total</span>
              <span>R$ {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            ℹ️ Próximas Etapas
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {order.payment_method === 'pix' && (
              <>
                <li>✅ 1. Faça o pagamento via Pix usando o QR code acima</li>
                <li>✅ 2. Você receberá uma confirmação quando o pagamento for processado</li>
              </>
            )}
            <li>✅ Acompanhe seu pedido no WhatsApp: {order.client_phone}</li>
            <li>✅ Você receberá um email de confirmação em {order.client_email}</li>
            <li>✅ Entre em contato se tiver dúvidas sobre seu pedido</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/lojas/${storeSlug || storeId}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-center"
          >
            ← Voltar para Loja
          </Link>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
          >
            🖨️ Imprimir Pedido
          </button>
        </div>
      </div>
    </main>
  )
}
