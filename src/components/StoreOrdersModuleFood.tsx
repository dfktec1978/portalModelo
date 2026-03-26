'use client'

import { useState, useEffect, useRef } from 'react'
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
  received:         { label: 'Recebido',        color: 'bg-indigo-100 text-indigo-800',  emoji: '📥', slaMinutes: 20 },
  pending:          { label: 'Pendente',        color: 'bg-yellow-100 text-yellow-800',  emoji: '⏳', slaMinutes: 5  },
  confirmed:        { label: 'Confirmado',      color: 'bg-blue-100 text-blue-800',      emoji: '✅', slaMinutes: 20 },
  preparing:        { label: 'Preparando',      color: 'bg-orange-100 text-orange-800',  emoji: '🍳', slaMinutes: 30 },
  ready:            { label: 'Pronto',          color: 'bg-teal-100 text-teal-800',      emoji: '🛎️', slaMinutes: 10 },
  out_for_delivery: { label: 'Saiu p/ Entrega', color: 'bg-purple-100 text-purple-800',  emoji: '🛵', slaMinutes: 45 },
  delivered:        { label: 'Entregue',        color: 'bg-green-100 text-green-800',    emoji: '📦', slaMinutes: null },
  cancelled:        { label: 'Cancelado',       color: 'bg-red-100 text-red-800',        emoji: '❌', slaMinutes: null },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:          ['pending', 'confirmed', 'cancelled'],
  confirmed:        ['confirmed', 'preparing', 'cancelled'],
  preparing:        ['preparing', 'ready', 'cancelled'],
  ready:            ['ready', 'out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['out_for_delivery', 'delivered', 'cancelled'],
  delivered:        ['delivered'],
  cancelled:        ['cancelled'],
}

const KANBAN_COLUMNS = ['received', 'preparing', 'ready', 'out_for_delivery']

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

const formatElapsed = (dateString: string, nowMs: number) => {
  const diffMs = nowMs - new Date(dateString).getTime()
  const totalMinutes = Math.floor(diffMs / 60000)
  if (totalMinutes < 60) return `${totalMinutes}min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h${m > 0 ? ` ${m}min` : ''}`
}

export default function StoreOrdersModuleFood({ store }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'custom'>('7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')
  const [nowMs, setNowMs] = useState(Date.now())
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick do relógio para SLA
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async (silent = false) => {
    if (!store?.id) return
    if (!silent || !hasLoadedOnce) setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
      if (!hasLoadedOnce) setHasLoadedOnce(true)
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err)
    } finally {
      if (!silent || !hasLoadedOnce) setLoading(false)
    }
  }

  // Realtime listener
  useEffect(() => {
    if (!store?.id) return

    setHasLoadedOnce(false)

    fetchOrders()

    // Canal Realtime
    const channel = supabase.channel(`orders-food-${store.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${store.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new as Order } : o)
          )
          setSelectedOrder(prev =>
            prev?.id === payload.new.id ? { ...prev, ...payload.new as Order } : prev
          )
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()

    realtimeRef.current = channel

    // Polling de fallback (30s)
    pollingRef.current = setInterval(() => fetchOrders(true), 30000)

    // Re-busca ao focar a janela
    const handleFocus = () => fetchOrders(true)
    window.addEventListener('focus', handleFocus)

    return () => {
      supabase.removeChannel(channel)
      if (pollingRef.current) clearInterval(pollingRef.current)
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error
      setMessage(`Status → ${STATUS_MAP[newStatus as keyof typeof STATUS_MAP]?.label || newStatus}`)
      setTimeout(() => setMessage(''), 2500)
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
      setMessage('Pagamento confirmado')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err)
      setMessage('Erro ao confirmar pagamento')
    }
  }

  // SLA: retorna minutos decorridos desde o último status relevante
  const getOrderElapsedMinutes = (order: Order) => {
    const ref = order.updated_at || order.created_at
    return Math.floor((nowMs - new Date(ref).getTime()) / 60000)
  }

  const isOverdue = (order: Order) => {
    if (['delivered', 'cancelled'].includes(order.status)) return false
    const sla = STATUS_MAP[order.status as keyof typeof STATUS_MAP]?.slaMinutes
    if (!sla) return false
    return getOrderElapsedMinutes(order) > sla
  }

  const getDateBounds = () => {
    const now = new Date()
    const start = new Date(now)

    if (dateFilter === 'today') {
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    }

    if (dateFilter === '7days') {
      start.setDate(now.getDate() - 7)
      return { start, end: now }
    }

    if (dateFilter === '30days') {
      start.setDate(now.getDate() - 30)
      return { start, end: now }
    }

    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const customStart = new Date(`${customStartDate}T00:00:00`)
      const customEnd = new Date(`${customEndDate}T23:59:59`)
      return { start: customStart, end: customEnd }
    }

    return null
  }

  const dateBounds = getDateBounds()
  const periodFilteredOrders = !dateBounds
    ? orders
    : orders.filter((order) => {
      const orderDate = new Date(order.created_at).getTime()
      return orderDate >= dateBounds.start.getTime() && orderDate <= dateBounds.end.getTime()
    })

  // Stats operacionais
  const activeOrders = periodFilteredOrders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const stats = {
    total:     periodFilteredOrders.length,
    active:    activeOrders.length,
    overdue:   activeOrders.filter(o => isOverdue(o)).length,
    delivery:  periodFilteredOrders.filter(o => o.delivery_type === 'delivery' && !['delivered', 'cancelled'].includes(o.status)).length,
    pickup:    periodFilteredOrders.filter(o => o.delivery_type === 'pickup' && !['delivered', 'cancelled'].includes(o.status)).length,
    unpaid:    periodFilteredOrders.filter(o => formatPaymentStatus(o.payment_status) !== 'Pago' && !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: periodFilteredOrders.filter(o => o.status === 'delivered').length,
    cancelled: periodFilteredOrders.filter(o => o.status === 'cancelled').length,
  }

  const filteredOrders = periodFilteredOrders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'active') return !['delivered', 'cancelled'].includes(order.status)
    if (filter === 'overdue') return isOverdue(order)
    if (filter === 'delivery') return order.delivery_type === 'delivery' && !['delivered', 'cancelled'].includes(order.status)
    if (filter === 'pickup') return order.delivery_type === 'pickup' && !['delivered', 'cancelled'].includes(order.status)
    if (filter === 'unpaid') return formatPaymentStatus(order.payment_status) !== 'Pago' && !['delivered', 'cancelled'].includes(order.status)
    return order.status === filter
  })

  if (!store) {
    return (
      <div className={`${ui.panel} p-6`}>
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar pedidos.</p>
      </div>
    )
  }

  return (
    <div className={`${ui.stack} w-full max-w-full overflow-x-hidden`}>
      {orders.length === 0 && !loading && (
        <InfoBanner
          type="tip"
          title="Aguardando pedidos"
          message="Os pedidos aparecerão aqui assim que forem feitos. Você também será notificado em tempo real!"
        />
      )}

      {/* Header */}
      <div className={`${ui.panel} px-4 py-3 flex flex-wrap items-center justify-between gap-y-2`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="bg-orange-100 rounded-xl p-2.5 text-2xl leading-none">🍽️</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Pedidos — Alimentação</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Tempo real · atualiza automaticamente</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ☰ Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ▦ Kanban
            </button>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Atualizar pedidos"
          >
            🔄
          </button>
        </div>
      </div>

      {message && (
        <div className={`${ui.message} flex items-center gap-2 ${
          message.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.includes('Erro') ? '⚠️' : '✅'} {message}
        </div>
      )}

      {/* Estatísticas operacionais */}
      <div className={ui.statsGridWide}>
        <div className={`${ui.statCard} bg-white border-orange-200 flex items-center gap-3`}>
          <span className="text-2xl font-bold text-orange-600 leading-none">{stats.active}</span>
          <div>
            <div className="text-xs font-semibold text-gray-800">Em Andamento</div>
            <div className="text-[11px] text-gray-400">pedidos ativos</div>
          </div>
        </div>
        <div className={`${ui.statCard} bg-white flex items-center gap-3 ${stats.overdue > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <span className={`text-2xl font-bold leading-none ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-300'}`}>{stats.overdue}</span>
          <div>
            <div className="text-xs font-semibold text-gray-800">Atrasados</div>
            <div className="text-[11px] text-gray-400">fora do SLA</div>
          </div>
        </div>
        <div className={`${ui.statCard} bg-white border-blue-200 flex items-center gap-3`}>
          <span className="text-2xl font-bold text-blue-600 leading-none">{stats.delivery}</span>
          <div>
            <div className="text-xs font-semibold text-gray-800">🛵 Entregas</div>
            <div className="text-[11px] text-gray-400">em andamento</div>
          </div>
        </div>
        <div className={`${ui.statCard} bg-white border-teal-200 flex items-center gap-3`}>
          <span className="text-2xl font-bold text-teal-600 leading-none">{stats.pickup}</span>
          <div>
            <div className="text-xs font-semibold text-gray-800">🏪 Retiradas</div>
            <div className="text-[11px] text-gray-400">em andamento</div>
          </div>
        </div>
        <div className={`${ui.statCard} bg-white border-yellow-200 flex items-center gap-3`}>
          <span className="text-2xl font-bold text-yellow-600 leading-none">{stats.unpaid}</span>
          <div>
            <div className="text-xs font-semibold text-gray-800">💰 A Receber</div>
            <div className="text-[11px] text-gray-400">não pagos</div>
          </div>
        </div>
        <div className={`${ui.statCard} bg-white border-green-200 flex items-center gap-3`}>
          <span className="text-2xl font-bold text-green-600 leading-none">{stats.delivered}</span>
          <div>
            <div className="text-xs font-semibold text-gray-800">✅ Entregues</div>
            <div className="text-[11px] text-gray-400">concluídos</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={ui.toolbar}>
        <span className="text-sm font-medium text-gray-600">Período:</span>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as 'today' | '7days' | '30days' | 'custom')}
          className={`${ui.selectBase} focus:ring-2 focus:ring-orange-400`}
        >
          <option value="today">Hoje</option>
          <option value="7days">Últimos 7 dias</option>
          <option value="30days">Últimos 30 dias</option>
          <option value="custom">Personalizado</option>
        </select>

        {dateFilter === 'custom' && (
          <>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className={`${ui.inputBase} text-gray-700 focus:ring-2 focus:ring-orange-400`}
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className={`${ui.inputBase} text-gray-700 focus:ring-2 focus:ring-orange-400`}
            />
          </>
        )}

        <div className={ui.sectionDivider} />
        <span className="text-sm font-medium text-gray-600">Filtrar:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`${ui.selectBase} focus:ring-2 focus:ring-orange-400`}
        >
          <option value="all">Todos ({stats.total})</option>
          <option value="active">Em Andamento ({stats.active})</option>
          {stats.overdue > 0 && <option value="overdue">⚠️ Atrasados ({stats.overdue})</option>}
          <option value="delivery">🛵 Para Entrega ({stats.delivery})</option>
          <option value="pickup">🏪 Para Retirada ({stats.pickup})</option>
          <option value="unpaid">💰 A Receber ({stats.unpaid})</option>
          <option value="delivered">📦 Entregues</option>
          <option value="cancelled">❌ Cancelados</option>
        </select>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className={`${ui.actionSecondary} hover:bg-red-50 hover:text-red-600`}
          >
            ✕ Limpar filtro
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl">🍽️</span>
          <p className="text-sm">Carregando pedidos...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ============ KANBAN ============ */
        <div className={ui.kanbanWrap}>
          <div className="inline-flex gap-3 min-w-max pr-1">
            {KANBAN_COLUMNS.map((col) => {
              const colInfo = STATUS_MAP[col as keyof typeof STATUS_MAP]
              const colOrders = col === 'received'
                ? periodFilteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed')
                : periodFilteredOrders.filter(o => o.status === col)
              return (
                <div key={col} className={ui.kanbanLane}>
                  <div className={`${ui.kanbanLaneHeader} ${colInfo.color}`}>
                    <span>{colInfo.emoji} {colInfo.label}</span>
                    <span className="bg-white bg-opacity-70 text-xs px-1.5 py-0.5 rounded-full font-bold">{colOrders.length}</span>
                  </div>
                  <div className={ui.kanbanLaneBody}>
                    {colOrders.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-10">Sem pedidos</div>
                    ) : colOrders.map((order) => {
                      const elapsed = getOrderElapsedMinutes(order)
                      const sla = colInfo.slaMinutes
                      const overdue = sla && elapsed > sla
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`${ui.kanbanCard} ${overdue ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-200'}`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="font-semibold text-sm text-gray-900 leading-tight">{order.customer_name}</span>
                            {sla && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                {overdue ? '⚠️' : '⏱️'} {formatElapsed(order.updated_at || order.created_at, nowMs)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mb-2.5">
                            {order.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'} · <span className="font-semibold text-gray-800">{formatCurrency(order.total)}</span>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {(STATUS_TRANSITIONS[order.status] || [])
                              .filter(s => s !== order.status)
                              .slice(0, 2)
                              .map((nextStatus) => {
                                const info = STATUS_MAP[nextStatus as keyof typeof STATUS_MAP]
                                if (!info) return null
                                return (
                                  <button
                                    key={nextStatus}
                                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, nextStatus) }}
                                    className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
                                  >
                                    {info.emoji} {info.label}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ============ LISTA ============ */
        filteredOrders.length === 0 ? (
          <div className={ui.emptyPanel}>
            <span className="text-4xl">📋</span>
            <p className="text-gray-500">Nenhum pedido encontrado para o período selecionado</p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-orange-600 hover:underline text-sm font-medium mt-1">
                Ver todos os pedidos
              </button>
            )}
          </div>
        ) : (
          <div className={ui.listContainer}>
            {filteredOrders.map((order) => {
              const si = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || { label: order.status, color: 'bg-gray-100 text-gray-800', emoji: 'ℹ️' }
              const overdue = isOverdue(order)
              const itemCount = Array.isArray(order.items) ? order.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0

              return (
                <div
                  key={order.id}
                  className={`${ui.orderCard} ${overdue ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900">{order.customer_name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${si.color}`}>
                          {si.emoji} {si.label}
                        </span>
                        {overdue && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            ⚠️ Atrasado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                        <span>📞 {order.customer_phone}</span>
                        <span>{order.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</span>
                        <span>💳 {formatPaymentMethod(order.payment_method)}</span>
                        <span className={formatPaymentStatus(order.payment_status) === 'Pago' ? 'text-green-600 font-medium' : 'text-orange-600'}>
                          {formatPaymentStatus(order.payment_status) === 'Pago' ? '✅ Pago' : '⏳ Pagamento pendente'}
                        </span>
                        {!['delivered', 'cancelled'].includes(order.status) && (
                          <span className="text-gray-400">⏱️ {formatElapsed(order.updated_at || order.created_at, nowMs)}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</div>
                      <div className="text-xs text-gray-400">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap items-center pt-3 border-t border-gray-100">
                    {formatPaymentStatus(order.payment_status) !== 'Pago' && order.status !== 'cancelled' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updatePaymentStatus(order.id, 'paid') }}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                      >
                        ✅ Confirmar pagamento
                      </button>
                    )}
                    {!['delivered', 'cancelled'].includes(order.status) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Mover para:</span>
                        <select
                          value={order.status}
                          onChange={(e) => { e.stopPropagation(); updateOrderStatus(order.id, e.target.value) }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                          {(STATUS_TRANSITIONS[order.status] || [order.status]).map((s) => {
                            const info = STATUS_MAP[s as keyof typeof STATUS_MAP]
                            return (
                              <option key={s} value={s}>{info?.emoji} {info?.label || s}</option>
                            )
                          })}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-medium transition-colors ml-auto"
                    >
                      Ver detalhes →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
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
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧾</span>
                  <h3 className="text-xl font-semibold text-gray-900">Detalhes do Pedido</h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
              </div>

              {(() => {
                const si = STATUS_MAP[selectedOrder.status as keyof typeof STATUS_MAP] || { label: selectedOrder.status, color: 'bg-gray-100 text-gray-800', emoji: 'ℹ️' }
                const overdue = isOverdue(selectedOrder)
                return (
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium ${si.color}`}>
                      {si.emoji} {si.label}
                    </span>
                    {overdue && (
                      <span className="px-3 py-2 rounded-lg text-sm font-bold bg-red-100 text-red-700">
                        ⚠️ Atrasado — {formatElapsed(selectedOrder.updated_at || selectedOrder.created_at, nowMs)}
                      </span>
                    )}
                  </div>
                )
              })()}

              <div className="mb-6">
                <h4 className="font-semibold mb-2">👤 Cliente</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Nome:</strong> {selectedOrder.customer_name}</div>
                  <div><strong>Telefone:</strong> {selectedOrder.customer_phone}</div>
                  {selectedOrder.customer_email && <div><strong>Email:</strong> {selectedOrder.customer_email}</div>}
                  <div><strong>Tipo:</strong> {selectedOrder.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</div>
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
                  {formatPaymentMethod(selectedOrder.payment_method)} · {formatPaymentStatus(selectedOrder.payment_status)}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">🛒 Itens do Pedido</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.quantity}x {item.name}</div>
                        {item.additionals?.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            + {item.additionals.map((a: any) => a.name).join(', ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-yellow-700 mt-1 bg-yellow-50 px-2 py-1 rounded">📝 {item.notes}</div>
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
                {formatPaymentStatus(selectedOrder.payment_status) !== 'Pago' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => { updatePaymentStatus(selectedOrder.id, 'paid'); setSelectedOrder(null) }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    ✅ Confirmar pagamento
                  </button>
                )}
                {(STATUS_TRANSITIONS[selectedOrder.status] || [])
                  .filter(s => s !== selectedOrder.status)
                  .map((nextStatus) => {
                    const info = STATUS_MAP[nextStatus as keyof typeof STATUS_MAP]
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => { updateOrderStatus(selectedOrder.id, nextStatus); setSelectedOrder(null) }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        {info?.emoji} {info?.label}
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
