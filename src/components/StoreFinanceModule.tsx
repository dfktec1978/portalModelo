'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ordersDashboardTokens as ui } from '@/components/ordersDashboardTokens'

type Props = {
  store: any
}

type FinanceStats = {
  totalSales: number
  totalOrders: number
  pendingPayments: number
  paidOrders: number
  averageTicket: number
  thisMonth: {
    sales: number
    orders: number
  }
  lastMonth: {
    sales: number
    orders: number
  }
}

export default function StoreFinanceModule({ store }: Props) {
  const [stats, setStats] = useState<FinanceStats>({
    totalSales: 0,
    totalOrders: 0,
    pendingPayments: 0,
    paidOrders: 0,
    averageTicket: 0,
    thisMonth: { sales: 0, orders: 0 },
    lastMonth: { sales: 0, orders: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (store?.id) {
      fetchFinanceData()
    }
  }, [store])

  const fetchFinanceData = async () => {
    if (!store?.id) return

    setLoading(true)
    try {
      // Buscar todos os pedidos da loja
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const ordersList = allOrders || []
      setOrders(ordersList)

      // Calcular estatísticas
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      const totalSales = ordersList
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const totalOrders = ordersList.filter(o => o.status !== 'cancelled').length

      const pendingPayments = ordersList
        .filter(o => o.payment_status === 'pending' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const paidOrders = ordersList.filter(o => o.payment_status === 'paid').length

      const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

      // Este mês
      const thisMonthOrders = ordersList.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate >= thisMonthStart && o.status !== 'cancelled'
      })
      const thisMonthSales = thisMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0)

      // Mês passado
      const lastMonthOrders = ordersList.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd && o.status !== 'cancelled'
      })
      const lastMonthSales = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0)

      setStats({
        totalSales,
        totalOrders,
        pendingPayments,
        paidOrders,
        averageTicket,
        thisMonth: {
          sales: thisMonthSales,
          orders: thisMonthOrders.length
        },
        lastMonth: {
          sales: lastMonthSales,
          orders: lastMonthOrders.length
        }
      })
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const salesGrowth = calculateGrowth(stats.thisMonth.sales, stats.lastMonth.sales)
  const ordersGrowth = calculateGrowth(stats.thisMonth.orders, stats.lastMonth.orders)

  if (!store) {
    return (
      <div className={`${ui.panel} p-6`}>
        <p className="text-sm text-gray-600">Selecione uma loja para ver o financeiro.</p>
      </div>
    )
  }

  return (
    <div className={ui.stack}>
      {/* Header */}
      <div className={ui.headerRow}>
        <div>
          <h3 className="text-xl font-semibold mb-1">💰 Financeiro</h3>
          <p className="text-sm text-gray-600">Resumo financeiro da sua loja</p>
        </div>
        <button
          onClick={fetchFinanceData}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando dados financeiros...</div>
      ) : (
        <>
          {/* Cards Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`${ui.statCard} p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200`}>
              <div className="text-sm text-green-700 mb-1">💵 Vendas Totais</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalSales)}</div>
              <div className="text-xs text-green-600 mt-1">{stats.totalOrders} pedidos</div>
            </div>

            <div className={`${ui.statCard} p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200`}>
              <div className="text-sm text-blue-700 mb-1">📊 Ticket Médio</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.averageTicket)}</div>
              <div className="text-xs text-blue-600 mt-1">por pedido</div>
            </div>

            <div className={`${ui.statCard} p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200`}>
              <div className="text-sm text-yellow-700 mb-1">⏳ Pagamentos Pendentes</div>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.pendingPayments)}</div>
              <div className="text-xs text-yellow-600 mt-1">a receber</div>
            </div>

            <div className={`${ui.statCard} p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200`}>
              <div className="text-sm text-purple-700 mb-1">✅ Pedidos Pagos</div>
              <div className="text-2xl font-bold text-purple-900">{stats.paidOrders}</div>
              <div className="text-xs text-purple-600 mt-1">confirmados</div>
            </div>
          </div>

          {/* Comparação Mensal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${ui.panel} p-6`}>
              <h4 className="font-semibold text-gray-900 mb-4">📅 Este Mês</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vendas:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(stats.thisMonth.sales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pedidos:</span>
                  <span className="text-lg font-bold text-gray-900">{stats.thisMonth.orders}</span>
                </div>
                {stats.lastMonth.sales > 0 && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    salesGrowth >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      salesGrowth >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {salesGrowth >= 0 ? '📈' : '📉'} {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}% vs mês anterior
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`${ui.panel} p-6`}>
              <h4 className="font-semibold text-gray-900 mb-4">📅 Mês Anterior</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vendas:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(stats.lastMonth.sales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pedidos:</span>
                  <span className="text-lg font-bold text-gray-900">{stats.lastMonth.orders}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Pedidos Pagos */}
          <div className={`${ui.panel} p-6`}>
            <h4 className="font-semibold text-gray-900 mb-4">💳 Últimos Pedidos Pagos</h4>
            {orders.filter(o => o.payment_status === 'paid').slice(0, 5).length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum pedido pago ainda</p>
            ) : (
              <div className={ui.listContainer}>
                {orders.filter(o => o.payment_status === 'paid').slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(order.total)}</div>
                      <div className="text-xs text-gray-500">{order.payment_method || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">📊 Resumo Geral</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total de Pedidos:</span>
                <div className="text-lg font-bold text-blue-900">{stats.totalOrders}</div>
              </div>
              <div>
                <span className="text-blue-700">Faturamento Total:</span>
                <div className="text-lg font-bold text-blue-900">{formatCurrency(stats.totalSales)}</div>
              </div>
              <div>
                <span className="text-blue-700">Média por Pedido:</span>
                <div className="text-lg font-bold text-blue-900">{formatCurrency(stats.averageTicket)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
