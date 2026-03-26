'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import InfoBanner from '@/components/InfoBanner'
import { ordersDashboardTokens as ui } from '@/components/ordersDashboardTokens'

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

const STATUS_MAP = {
  pending:    { label: 'Pendente',         color: 'bg-yellow-100 text-yellow-800', emoji: '⏳' },
  separating: { label: 'Em Separação',     color: 'bg-purple-100 text-purple-800', emoji: '📦' },
  shipped:    { label: 'Entregue/Enviado', color: 'bg-blue-100 text-blue-800',     emoji: '🚚' },
  finalized:  { label: 'Finalizado',       color: 'bg-green-100 text-green-800',   emoji: '✅' },
  cancelled:  { label: 'Cancelado',        color: 'bg-red-100 text-red-800',       emoji: '❌' },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:    ['pending', 'separating', 'cancelled'],
  separating: ['separating', 'shipped', 'cancelled'],
  shipped:    ['shipped', 'finalized', 'cancelled'],
  finalized:  ['finalized'],
  cancelled:  ['cancelled'],
}

const normalizeStatus = (status?: string | null): string => {
  if (!status) return 'pending'
  if (status in STATUS_MAP) return status
  if (['confirmed', 'preparing'].includes(status)) return 'separating'
  if (['ready', 'out_for_delivery', 'delivered'].includes(status)) return 'shipped'
  if (status === 'cancelled') return 'cancelled'
  return 'pending'
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
  return 'Pendente'
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function StoreOrdersModuleRetail({ store }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'custom' | 'all'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')

  const getDateBounds = () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (dateFilter === 'today')   return { start: todayStart, end: null }
    if (dateFilter === '7days')   return { start: new Date(todayStart.getTime() - 6 * 86400000), end: null }
    if (dateFilter === '30days')  return { start: new Date(todayStart.getTime() - 29 * 86400000), end: null }
    if (dateFilter === 'custom') {
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
      const end   = customEndDate   ? new Date(new Date(`${customEndDate}T00:00:00`).getTime() + 86400000) : null
      return { start, end }
    }
    return { start: null, end: null }
  }

  useEffect(() => {
    if (store?.id) fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, dateFilter, customStartDate, customEndDate])

  const fetchOrders = async () => {
    if (!store?.id) return
    setLoading(true)
    try {
      const { start, end } = getDateBounds()
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
      if (start) query = query.gte('created_at', start.toISOString())
      if (end)   query = query.lt('created_at', end.toISOString())
      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId)
      const isPaid = formatPaymentStatus(currentOrder?.payment_status) === 'Pago'

      if (newStatus === 'finalized' && !isPaid) {
        setMessage('Confirme o pagamento antes de finalizar o pedido')
        setTimeout(() => setMessage(''), 3000)
        return
      }

      const restockItems = async (order: Order) => {
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
              : variantQuery.eq('color', item.variant.color).eq('size', item.variant.size)
            ).single()

            if (variantError || !variantData) return
            await supabase
              .from('product_variants')
              .update({ stock_quantity: (variantData.stock_quantity || 0) + qty })
              .eq('id', variantData.id)
            return
          }

          const { data: productData, error: productError } = await supabase
            .from('products').select('id, stock').eq('id', productId).single()
          if (productError || !productData) return
          await supabase
            .from('products')
            .update({ stock: (productData.stock ?? 0) + qty })
            .eq('id', productData.id)
        })
        await Promise.all(updates)
      }

      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error

      setMessage(`Status atualizado para: ${STATUS_MAP[newStatus as keyof typeof STATUS_MAP]?.label || newStatus}`)

      if (newStatus === 'cancelled' && currentOrder && currentOrder.status !== 'cancelled') {
        await restockItems(currentOrder)
      }

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }

      fetchOrders()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setMessage('Erro ao atualizar status')
    }
  }

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const current = orders.find(o => o.id === orderId)
      if (current?.status === 'cancelled') {
        setMessage('Pedidos cancelados não podem ser pagos')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId)
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, payment_status: newStatus } : null)
      setMessage('Pagamento confirmado')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Erro ao atualizar pagamento:', err)
      setMessage('Erro ao confirmar pagamento')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    const normalized = normalizeStatus(order.status)
    if (filter === 'active') return !['finalized', 'cancelled'].includes(normalized)
    return normalized === filter
  })

  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => normalizeStatus(o.status) === 'pending').length,
    separating: orders.filter(o => normalizeStatus(o.status) === 'separating').length,
    shipped:    orders.filter(o => normalizeStatus(o.status) === 'shipped').length,
    finalized:  orders.filter(o => normalizeStatus(o.status) === 'finalized').length,
    cancelled:  orders.filter(o => normalizeStatus(o.status) === 'cancelled').length,
  }

  if (!store) {
    return (
      <div className={`${ui.panel} p-6`}>
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar pedidos.</p>
      </div>
    )
  }

  return (
    <div className={ui.stack}>
      {orders.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Como gerenciar pedidos"
          message="Aqui você acompanha todos os pedidos em tempo real. Atualize o status conforme separa e envia. Clientes satisfeitos voltam sempre!"
        />
      )}

      {/* Header */}
      <div className={ui.headerRow}>
        <div>
          <h3 className="text-xl font-semibold mb-1">📦 Pedidos — Varejo</h3>
          <p className="text-sm text-gray-600">Gerencie os pedidos da sua loja</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          🔄 Atualizar
        </button>
      </div>

      {message && (
        <div className={`${ui.message} ${
          message.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Estatísticas */}
      <div className={ui.statsGridDefault}>
        <div className={`${ui.statCard} bg-gray-50 border-gray-200`}>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-700">Total</div>
        </div>
        <div className={`${ui.statCard} bg-yellow-50 border-yellow-200`}>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          <div className="text-sm text-yellow-700">Pendentes</div>
        </div>
        <div className={`${ui.statCard} bg-purple-50 border-purple-200`}>
          <div className="text-2xl font-bold text-purple-900">{stats.separating}</div>
          <div className="text-sm text-purple-700">Em Separação</div>
        </div>
        <div className={`${ui.statCard} bg-blue-50 border-blue-200`}>
          <div className="text-2xl font-bold text-blue-900">{stats.shipped}</div>
          <div className="text-sm text-blue-700">Enviado/Entregue</div>
        </div>
        <div className={`${ui.statCard} bg-green-50 border-green-200`}>
          <div className="text-2xl font-bold text-green-900">{stats.finalized}</div>
          <div className="text-sm text-green-700">Finalizados</div>
        </div>
      </div>

      {/* Toolbar: Período + Status */}
      <div className={ui.toolbar}>
        {/* Período */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📅 Período</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className={`${ui.selectBase} focus:ring-2 focus:ring-emerald-400`}
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="all">Todos</option>
            <option value="custom">Personalizado...</option>
          </select>
        </div>

        {/* Datas customizadas */}
        {dateFilter === 'custom' && (
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">De</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`${ui.inputBase} focus:ring-2 focus:ring-emerald-400`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Até</label>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate || undefined}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`${ui.inputBase} focus:ring-2 focus:ring-emerald-400`}
              />
            </div>
            <button
              onClick={() => { setDateFilter('all'); setCustomStartDate(''); setCustomEndDate('') }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <div className={ui.sectionDivider} />

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🏷️ Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`${ui.selectBase} focus:ring-2 focus:ring-blue-400`}
          >
            <option value="all">Todos ({stats.total})</option>
            <option value="active">Ativos ({stats.total - stats.finalized - stats.cancelled})</option>
            <option value="pending">⏳ Pendentes ({stats.pending})</option>
            <option value="separating">🧺 Em Separação ({stats.separating})</option>
            <option value="shipped">🚚 Enviado/Entregue ({stats.shipped})</option>
            <option value="finalized">✅ Finalizados ({stats.finalized})</option>
            <option value="cancelled">❌ Cancelados ({stats.cancelled})</option>
          </select>
        </div>

        {(filter !== 'all' || dateFilter !== 'all') && (
          <button
            onClick={() => { setFilter('all'); setDateFilter('all'); setCustomStartDate(''); setCustomEndDate('') }}
            className={`${ui.actionSecondary} self-end hover:bg-red-100 hover:text-red-700`}
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={ui.emptyPanel}>
          <p className="text-gray-500 mb-2">Nenhum pedido encontrado</p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-blue-600 hover:underline text-sm">
              Ver todos os pedidos
            </button>
          )}
        </div>
      ) : (
        <div className={ui.listContainer}>
          {filteredOrders.map((order) => {
            const normalized = normalizeStatus(order.status)
            const statusInfo = STATUS_MAP[normalized as keyof typeof STATUS_MAP] || { label: normalized, color: 'bg-gray-100 text-gray-800', emoji: 'ℹ️' }
            const itemCount = Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0

            return (
              <div
                key={order.id}
                className={ui.orderCard}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900">{order.customer_name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.emoji} {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-600">
                      <span>📞 {order.customer_phone}</span>
                      <span>{order.delivery_type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'}</span>
                      <span>💳 {formatPaymentMethod(order.payment_method)}</span>
                      <span>{formatPaymentStatus(order.payment_status)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</div>
                    <div className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  {formatPaymentStatus(order.payment_status) !== 'Pago' && order.status !== 'cancelled' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updatePaymentStatus(order.id, 'paid') }}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      ✅ Confirmar pagamento
                    </button>
                  )}
                  {!['finalized', 'cancelled'].includes(normalized) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Status</span>
                      <select
                        value={normalized}
                        onChange={(e) => { e.stopPropagation(); updateOrderStatus(order.id, e.target.value) }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 border rounded-lg text-sm"
                      >
                        {(STATUS_TRANSITIONS[normalized] || [normalized]).map((s) => {
                          const info = STATUS_MAP[s as keyof typeof STATUS_MAP]
                          const blocked = s === 'finalized' && formatPaymentStatus(order.payment_status) !== 'Pago'
                          return (
                            <option key={s} value={s} disabled={blocked}>
                              {info?.emoji} {info?.label}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
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
            className={ui.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalhes do Pedido</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
              </div>

              {(() => {
                const ns = normalizeStatus(selectedOrder.status)
                const si = STATUS_MAP[ns as keyof typeof STATUS_MAP] || { label: ns, color: 'bg-gray-100 text-gray-800', emoji: 'ℹ️' }
                return (
                  <div className="mb-6">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium ${si.color}`}>
                      {si.emoji} {si.label}
                    </span>
                  </div>
                )
              })()}

              <div className="mb-6">
                <h4 className="font-semibold mb-2">👤 Cliente</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Nome:</strong> {selectedOrder.customer_name}</div>
                  <div><strong>Telefone:</strong> {selectedOrder.customer_phone}</div>
                  {selectedOrder.customer_email && <div><strong>Email:</strong> {selectedOrder.customer_email}</div>}
                </div>
              </div>

              {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">📍 Endereço de Entrega</h4>
                  <div className="text-sm text-gray-700">{selectedOrder.delivery_address}</div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold mb-2">💳 Pagamento</h4>
                <div className="text-sm text-gray-700">
                  {formatPaymentMethod(selectedOrder.payment_method)} • {formatPaymentStatus(selectedOrder.payment_status)}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">🛒 Itens do Pedido</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.quantity}x {item.name}</div>
                        {item.variant && (
                          <div className="text-xs text-gray-600 mt-1">
                            Variante: {item.variant.color || '—'} — {item.variant.size || '—'}
                          </div>
                        )}
                        {item.additionals?.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            + {item.additionals.map((a: any) => a.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between"><span>Taxa de Entrega:</span><span>{formatCurrency(selectedOrder.delivery_fee)}</span></div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Desconto:</span><span>- {formatCurrency(selectedOrder.discount)}</span></div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span><span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">📝 Observações</h4>
                  <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">{selectedOrder.notes}</div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {(STATUS_TRANSITIONS[normalizeStatus(selectedOrder.status)] || [])
                  .filter(s => s !== normalizeStatus(selectedOrder.status))
                  .map((nextStatus) => {
                    const info = STATUS_MAP[nextStatus as keyof typeof STATUS_MAP]
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => { updateOrderStatus(selectedOrder.id, nextStatus); setSelectedOrder(null) }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        {info?.emoji} Marcar como {info?.label}
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
