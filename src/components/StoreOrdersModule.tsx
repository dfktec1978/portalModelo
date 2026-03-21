'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import InfoBanner from '@/components/InfoBanner'

type Props = {
  store: any
}

type Order = {
  id: string
  store_id: string
  customer_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string | null
  delivery_type: 'delivery' | 'pickup'
  items: any[]
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  status: string
  payment_method: string | null
  payment_status: string
  notes: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  ready_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
}

const FOOD_STATUS_MAP = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', emoji: '⏳' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', emoji: '✅' },
  preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-800', emoji: '👨‍🍳' },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-800', emoji: '📦' },
  out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-indigo-100 text-indigo-800', emoji: '🚚' },
  delivered: { label: 'Entregue', color: 'bg-gray-100 text-gray-800', emoji: '✅' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', emoji: '❌' }
}

const FOOD_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
}

const RETAIL_STATUS_MAP = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', emoji: '⏳' },
  separating: { label: 'Em Separação', color: 'bg-purple-100 text-purple-800', emoji: '📦' },
  shipped: { label: 'Entregue/Enviado', color: 'bg-blue-100 text-blue-800', emoji: '🚚' },
  finalized: { label: 'Finalizado', color: 'bg-green-100 text-green-800', emoji: '✅' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', emoji: '❌' }
}

const RETAIL_STATUS_TRANSITIONS = {
  pending: ['separating', 'cancelled'],
  separating: ['shipped', 'cancelled'],
  shipped: ['finalized', 'cancelled'],
  finalized: [],
  cancelled: []
}

const formatPaymentMethod = (method?: string | null) => {
  if (!method) return 'Não informado'
  if (method === 'pix') return 'Pix'
  if (method === 'cash' || method === 'na_retirada') return 'Pagar na entrega/retirada'
  return method
}

const formatPaymentStatus = (status?: string | null) => {
  if (!status) return 'Pendente'
  if (status === 'paid' || status === 'pago') return 'Pago'
  if (status === 'pending' || status === 'pendente') return 'Pendente'
  return status
}

export default function StoreOrdersModule({ store }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')

  const isRetail = store?.category === 'varejo'
  const STATUS_MAP = isRetail ? RETAIL_STATUS_MAP : FOOD_STATUS_MAP
  const STATUS_TRANSITIONS = isRetail ? RETAIL_STATUS_TRANSITIONS : FOOD_STATUS_TRANSITIONS

  const normalizeStatus = (status?: string | null) => {
    if (!status) return 'pending'
    if (!isRetail) return status
    if (status in RETAIL_STATUS_MAP) return status
    if (['confirmed', 'preparing'].includes(status)) return 'separating'
    if (['ready', 'out_for_delivery', 'delivered'].includes(status)) return 'shipped'
    if (status === 'cancelled') return 'cancelled'
    return 'pending'
  }

  const getStatusInfo = (status?: string | null) => {
    const normalized = normalizeStatus(status)
    return STATUS_MAP[normalized as keyof typeof STATUS_MAP] || {
      label: normalized,
      color: 'bg-gray-100 text-gray-800',
      emoji: 'ℹ️'
    }
  }

  const getAllowedTransitions = (status?: string | null) => {
    const normalized = normalizeStatus(status)
    const transitions = STATUS_TRANSITIONS[normalized as keyof typeof STATUS_TRANSITIONS] || []
    return [normalized, ...transitions].filter((v, i, arr) => arr.indexOf(v) === i)
  }

  useEffect(() => {
    if (store?.id) {
      fetchOrders()
    }
  }, [store])

  const fetchOrders = async () => {
    if (!store?.id) return

    setLoading(true)
    try {
      const { data, error} = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId)
      const currentPaymentStatus = currentOrder?.payment_status
      const isPaid = formatPaymentStatus(currentPaymentStatus) === 'Pago'

      if (isRetail && newStatus === 'finalized' && !isPaid) {
        setMessage('Confirme o pagamento antes de finalizar o pedido')
        setTimeout(() => setMessage(''), 3000)
        return
      }

      const restockItems = async (order: Order) => {
        if (!store || store.category !== 'varejo') return

        const updates = order.items.map(async (item: any) => {
          const qty = item.quantity || 1
          const productId = item.product_id || item.id

          if (item.variant?.sku || (item.variant?.color && item.variant?.size)) {
            const variantQuery = supabase
              .from('product_variants')
              .select('id, stock_quantity')
              .eq('product_id', productId)

            const { data: variantData, error: variantError } = await (item.variant?.sku
              ? variantQuery.eq('sku', item.variant.sku)
              : variantQuery
                  .eq('color', item.variant.color)
                  .eq('size', item.variant.size)
            ).single()

            if (variantError || !variantData) {
              console.warn('Não foi possível localizar variação para reposição:', variantError)
              return
            }

            const nextStock = (variantData.stock_quantity || 0) + qty
            const { error: updateVariantError } = await supabase
              .from('product_variants')
              .update({ stock_quantity: nextStock })
              .eq('id', variantData.id)

            if (updateVariantError) {
              console.warn('Erro ao repor estoque da variação:', updateVariantError)
            }
            return
          }

          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, stock')
            .eq('id', productId)
            .single()

          if (productError || !productData) {
            console.warn('Não foi possível localizar produto para reposição:', productError)
            return
          }

          const currentStock = productData.stock ?? 0
          const nextStock = currentStock + qty
          const { error: updateProductError } = await supabase
            .from('products')
            .update({ stock: nextStock })
            .eq('id', productData.id)

          if (updateProductError) {
            console.warn('Erro ao repor estoque do produto:', updateProductError)
          }
        })

        await Promise.all(updates)
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      const statusLabel = STATUS_MAP[newStatus as keyof typeof STATUS_MAP]?.label || newStatus
      setMessage(`Status atualizado para: ${statusLabel}`)

      if (newStatus === 'cancelled' && currentOrder && currentOrder.status !== 'cancelled') {
        await restockItems(currentOrder)
      }

      fetchOrders()
      
      // Atualizar ordem selecionada se for a mesma
      if (selectedOrder?.id === orderId) {
        const updated = orders.find(o => o.id === orderId)
        if (updated) {
          setSelectedOrder({ ...updated, status: newStatus })
        }
      }

      setTimeout(() => setMessage(''), 3000)

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setMessage('Erro ao atualizar status')
    }
  }

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId)
      if (currentOrder?.status === 'cancelled') {
        setMessage('Pedidos cancelados não podem ser pagos')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o)))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newStatus })
      }
      setMessage('Pagamento confirmado')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error)
      setMessage('Erro ao confirmar pagamento')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    const normalized = normalizeStatus(order.status)
    if (filter === 'active') {
      return isRetail
        ? !['finalized', 'cancelled'].includes(normalized)
        : !['delivered', 'cancelled'].includes(normalized)
    }
    return normalized === filter
  })

  const stats = isRetail
    ? {
        total: orders.length,
        pending: orders.filter(o => normalizeStatus(o.status) === 'pending').length,
        separating: orders.filter(o => normalizeStatus(o.status) === 'separating').length,
        shipped: orders.filter(o => normalizeStatus(o.status) === 'shipped').length,
        finalized: orders.filter(o => normalizeStatus(o.status) === 'finalized').length,
        cancelled: orders.filter(o => normalizeStatus(o.status) === 'cancelled').length
      }
    : {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!store) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar pedidos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Como gerenciar pedidos"
          message="Aqui você acompanha todos os pedidos em tempo real. Confirme rapidamente, atualize o status conforme prepara e entrega. Clientes satisfeitos voltam sempre!"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-1">📦 Pedidos</h3>
          <p className="text-sm text-gray-600">Gerencie os pedidos da sua loja</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-700">Total</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          <div className="text-sm text-yellow-700">Pendentes</div>
        </div>
        {isRetail ? (
          <>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{stats.separating}</div>
              <div className="text-sm text-purple-700">Em Separação</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.shipped}</div>
              <div className="text-sm text-blue-700">Entregue/Enviado</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.finalized}</div>
              <div className="text-sm text-green-700">Finalizados</div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{stats.preparing}</div>
              <div className="text-sm text-purple-700">Em Preparo</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.ready}</div>
              <div className="text-sm text-green-700">Prontos</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.delivered}</div>
              <div className="text-sm text-blue-700">Entregues</div>
            </div>
          </>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ativos ({stats.total - (isRetail ? (stats.finalized + stats.cancelled) : (stats.delivered + stats.cancelled))})
        </button>
        {isRetail ? (
          <>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendentes ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('separating')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'separating' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Em Separação ({stats.separating})
            </button>
            <button
              onClick={() => setFilter('shipped')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'shipped' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entregue/Enviado ({stats.shipped})
            </button>
            <button
              onClick={() => setFilter('finalized')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'finalized' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Finalizados ({stats.finalized})
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendentes ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ready' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prontos ({stats.ready})
            </button>
          </>
        )}
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancelados ({stats.cancelled})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">Nenhum pedido encontrado</p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-blue-600 hover:underline text-sm"
            >
              Ver todos os pedidos
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const normalizedStatus = normalizeStatus(order.status)
            const statusInfo = STATUS_MAP[normalizedStatus as keyof typeof STATUS_MAP] || {
              label: normalizedStatus,
              color: 'bg-gray-100 text-gray-800',
              emoji: 'ℹ️'
            }
            const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900">
                        {order.customer_name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.emoji} {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        📞 {order.customer_phone} • {order.delivery_type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'} • 💳 {formatPaymentMethod(order.payment_method)} • {formatPaymentStatus(order.payment_status)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex gap-2 flex-wrap items-center">
                  {formatPaymentStatus(order.payment_status) !== 'Pago' && order.status !== 'cancelled' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updatePaymentStatus(order.id, 'paid')
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      ✅ Confirmar pagamento
                    </button>
                  )}
                  {(!isRetail || !['finalized', 'cancelled'].includes(normalizedStatus)) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Status do pedido</span>
                      <select
                        value={normalizedStatus}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateOrderStatus(order.id, e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 border rounded-lg text-sm"
                      >
                        {getAllowedTransitions(normalizedStatus).map((status) => {
                          const isFinalizedBlocked = isRetail && status === 'finalized' && formatPaymentStatus(order.payment_status) !== 'Pago'
                          const optionStatusInfo = getStatusInfo(status)
                          return (
                            <option key={status} value={status} disabled={isFinalizedBlocked}>
                              {optionStatusInfo.emoji} {optionStatusInfo.label}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOrder(order)
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    👁️ Detalhes
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalhes do Pedido</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Status */}
              <div className="mb-6">
                {(() => {
                  const normalizedSelectedStatus = normalizeStatus(selectedOrder.status)
                  const selectedStatusInfo = STATUS_MAP[normalizedSelectedStatus as keyof typeof STATUS_MAP] || {
                    label: normalizedSelectedStatus,
                    color: 'bg-gray-100 text-gray-800',
                    emoji: 'ℹ️'
                  }
                  return (
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium ${selectedStatusInfo.color}`}>
                      {selectedStatusInfo.emoji} {selectedStatusInfo.label}
                    </span>
                  )
                })()}
              </div>

              {/* Cliente */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">👤 Cliente</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Nome:</strong> {selectedOrder.customer_name}</div>
                  <div><strong>Telefone:</strong> {selectedOrder.customer_phone}</div>
                  {selectedOrder.customer_email && (
                    <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                  )}
                </div>
              </div>

              {/* Endereço (se delivery) */}
              {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">📍 Endereço de Entrega</h4>
                  <div className="text-sm text-gray-700">
                    {selectedOrder.delivery_address}
                  </div>
                </div>
              )}

              {/* Pagamento */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">💳 Pagamento</h4>
                <div className="text-sm text-gray-700">
                  {formatPaymentMethod(selectedOrder.payment_method)} • {formatPaymentStatus(selectedOrder.payment_status)}
                </div>
              </div>

              {/* Itens */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">🛒 Itens do Pedido</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.quantity}x {item.name}</div>
                        {item.variant && (
                          <div className="text-xs text-gray-600 mt-1">
                            Variante: {item.variant.color || '—'} - {item.variant.size || '—'}
                          </div>
                        )}
                        {item.additionals && item.additionals.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            + {item.additionals.map((a: any) => a.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valores */}
              <div className="mb-6 border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Entrega:</span>
                      <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>- {formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">📝 Observações</h4>
                  <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 flex-wrap">
                {getAllowedTransitions(selectedOrder.status)
                  .filter((status) => status !== normalizeStatus(selectedOrder.status))
                  .map((nextStatus) => {
                  const nextStatusInfo = getStatusInfo(nextStatus)
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, nextStatus)
                        setSelectedOrder(null)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {nextStatusInfo.emoji} Marcar como {nextStatusInfo.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
