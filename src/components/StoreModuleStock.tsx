'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ordersDashboardTokens as ui } from '@/components/ordersDashboardTokens'

type Props = {
  store: any
  onOpenVariantsAction?: () => void
}

type Product = {
  id: string
  name: string
  price: number
  stock: number | null
  critical_stock?: number | null
  category: string
  image_url?: string
}

type VariantRow = {
  id: string
  product_id: string
  product_name: string
  sku: string
  color: string
  size: string
  stock_quantity: number | null
  critical_stock?: number | null
}

export default function StoreModuleStock({ store, onOpenVariantsAction }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [editVariantValue, setEditVariantValue] = useState('')
  const [editingCriticalVariantId, setEditingCriticalVariantId] = useState<string | null>(null)
  const [editCriticalVariantValue, setEditCriticalVariantValue] = useState('')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'name_asc'>('stock_asc')

  const isRetail = store?.category === 'varejo'
  const getCriticalThreshold = (product?: Product) => {
    const raw = product?.critical_stock
    const value = raw == null ? NaN : Number(raw)
    if (!Number.isFinite(value) || value <= 0) return 10
    return value
  }

  const getVariantCriticalThreshold = (variant: VariantRow, _product?: Product) => {
    const variantValue = Number(variant.critical_stock)
    if (Number.isFinite(variantValue) && variantValue > 0) return variantValue
    return 10
  }

  useEffect(() => {
    if (store?.id) {
      fetchProducts()
    }
  }, [store])

  const fetchProducts = async () => {
    if (!store?.id) return

    setLoading(true)
    setLoadError('')
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('stock', { ascending: true })

      if (error) throw error

      const productList = data || []
      setProducts(productList)

      if (isRetail) {
        const productIds = productList.map((p: Product) => p.id)
        if (productIds.length === 0) {
          setVariants([])
        } else {
          const { data: variantData, error: variantError } = await supabase
            .from('product_variants')
            .select('id, product_id, sku, color, size, stock_quantity, critical_stock')
            .in('product_id', productIds)

          let normalizedVariants = variantData
          if (variantError && /column .*critical_stock|schema cache/i.test(String(variantError.message || ''))) {
            const fallback = await supabase
              .from('product_variants')
              .select('id, product_id, sku, color, size, stock_quantity')
              .in('product_id', productIds)
            if (fallback.error) throw fallback.error
            normalizedVariants = (fallback.data || []).map((v: any) => ({ ...v, critical_stock: null }))
          } else if (variantError) {
            throw variantError
          }

          const productNameMap = new Map(productList.map((p: Product) => [p.id, p.name]))
          const rows: VariantRow[] = (normalizedVariants || []).map((v: any) => ({
            id: v.id,
            product_id: v.product_id,
            product_name: productNameMap.get(v.product_id) || 'Produto',
            sku: v.sku,
            color: v.color,
            size: v.size,
            stock_quantity: v.stock_quantity ?? 0,
            critical_stock: v.critical_stock ?? null,
          }))

          setVariants(rows)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setLoadError('Nao foi possivel carregar o estoque agora. Verifique sua conexao e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleStockUpdate = async (productId: string, newStock: number) => {
    if (newStock < 0) {
      setMessage('Estoque não pode ser negativo')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)

      if (error) throw error

      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
      )

      setMessage('Estoque atualizado com sucesso!')
      setEditingId(null)
      setEditValue('')
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error)
      setMessage('Erro ao atualizar estoque')
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditValue((product.stock ?? 0).toString())
  }

  const startEditVariant = (variant: VariantRow) => {
    setEditingVariantId(variant.id)
    setEditVariantValue((variant.stock_quantity ?? 0).toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const cancelEditVariant = () => {
    setEditingVariantId(null)
    setEditVariantValue('')
  }

  const saveEdit = (productId: string) => {
    const newStock = parseInt(editValue)
    if (!isNaN(newStock)) {
      handleStockUpdate(productId, newStock)
    }
  }

  const [editingCriticalProductId, setEditingCriticalProductId] = useState<string | null>(null)
  const [editCriticalProductValue, setEditCriticalProductValue] = useState('')

  const startEditCriticalProduct = (product: Product) => {
    setEditingCriticalProductId(product.id)
    setEditCriticalProductValue(Number(product.critical_stock) > 0 ? String(product.critical_stock) : '')
  }

  const cancelEditCriticalProduct = () => {
    setEditingCriticalProductId(null)
    setEditCriticalProductValue('')
  }

  const handleCriticalStockUpdate = async (productId: string, newLimit: number) => {
    if (newLimit < 0) {
      setMessage('Limite crítico não pode ser negativo')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const normalizedLimit = newLimit > 0 ? newLimit : null
    try {
      const updateAttempt = await supabase
        .from('products')
        .update({ critical_stock: normalizedLimit })
        .eq('id', productId)

      if (updateAttempt.error && /column .*critical_stock|schema cache/i.test(String(updateAttempt.error.message || ''))) {
        setMessage('Seu banco ainda não possui a coluna de limite crítico para produtos.')
        setTimeout(() => setMessage(''), 3200)
        return
      }
      if (updateAttempt.error) throw updateAttempt.error

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, critical_stock: normalizedLimit } : p))
      setMessage('Limite crítico do produto atualizado com sucesso!')
      setEditingCriticalProductId(null)
      setEditCriticalProductValue('')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar limite crítico do produto:', error)
      setMessage('Erro ao atualizar limite crítico do produto')
    }
  }

  const saveEditCriticalProduct = (productId: string) => {
    const parsed = editCriticalProductValue.trim() === '' ? 0 : parseInt(editCriticalProductValue)
    if (!isNaN(parsed)) {
      handleCriticalStockUpdate(productId, parsed)
    }
  }

  const handleVariantStockUpdate = async (variantId: string, newStock: number) => {
    if (newStock < 0) {
      setMessage('Estoque não pode ser negativo')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', variantId)

      if (error) throw error

      setVariants(prev =>
        prev.map(v => v.id === variantId ? { ...v, stock_quantity: newStock } : v)
      )

      setMessage('Estoque da variação atualizado com sucesso!')
      setEditingVariantId(null)
      setEditVariantValue('')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar estoque da variação:', error)
      setMessage('Erro ao atualizar estoque da variação')
    }
  }

  const saveEditVariant = (variantId: string) => {
    const newStock = parseInt(editVariantValue)
    if (!isNaN(newStock)) {
      handleVariantStockUpdate(variantId, newStock)
    }
  }

  const startEditCriticalVariant = (variant: VariantRow) => {
    setEditingCriticalVariantId(variant.id)
    setEditCriticalVariantValue(Number(variant.critical_stock) > 0 ? String(variant.critical_stock) : '')
  }

  const cancelEditCriticalVariant = () => {
    setEditingCriticalVariantId(null)
    setEditCriticalVariantValue('')
  }

  const handleVariantCriticalStockUpdate = async (variantId: string, newLimit: number) => {
    if (newLimit < 0) {
      setMessage('Limite crítico da variação não pode ser negativo')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const normalizedLimit = newLimit > 0 ? newLimit : null
    try {
      const updateAttempt = await supabase
        .from('product_variants')
        .update({ critical_stock: normalizedLimit })
        .eq('id', variantId)

      if (updateAttempt.error && /column .*critical_stock|schema cache/i.test(String(updateAttempt.error.message || ''))) {
        setMessage('Seu banco ainda não possui a coluna de limite crítico para variações.')
        setTimeout(() => setMessage(''), 3200)
        return
      }
      if (updateAttempt.error) throw updateAttempt.error

      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, critical_stock: normalizedLimit } : v))
      setMessage('Limite crítico da variação atualizado com sucesso!')
      setEditingCriticalVariantId(null)
      setEditCriticalVariantValue('')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar limite crítico da variação:', error)
      setMessage('Erro ao atualizar limite crítico da variação')
    }
  }

  const saveEditCriticalVariant = (variantId: string) => {
    const parsed = editCriticalVariantValue.trim() === '' ? 0 : parseInt(editCriticalVariantValue)
    if (!isNaN(parsed)) {
      handleVariantCriticalStockUpdate(variantId, parsed)
    }
  }

  const quickAdjust = (productId: string, currentStock: number | null, delta: number) => {
    const safeStock = currentStock ?? 0
    handleStockUpdate(productId, Math.max(0, safeStock + delta))
  }

  const quickAdjustVariant = (variantId: string, currentStock: number | null, delta: number) => {
    const safeStock = currentStock ?? 0
    handleVariantStockUpdate(variantId, Math.max(0, safeStock + delta))
  }

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  const filteredProducts = products.filter(p => {
    const stockValue = p.stock ?? 0
    const criticalThreshold = getCriticalThreshold(p)
    const hasTrackedStock = p.stock !== null
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = !q || `${p.name} ${p.category}`.toLowerCase().includes(q)
    if (!matchesSearch) return false
    if (filter === 'low') return hasTrackedStock && stockValue > 0 && stockValue <= criticalThreshold
    if (filter === 'out') return stockValue === 0
    return true
  })

  const filteredVariants = variants.filter(v => {
    const stockValue = v.stock_quantity ?? 0
    const parentProduct = productById.get(v.product_id)
    const criticalThreshold = getVariantCriticalThreshold(v, parentProduct)
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = !q || `${v.product_name} ${v.sku} ${v.color} ${v.size}`.toLowerCase().includes(q)
    if (!matchesSearch) return false
    if (filter === 'low') return stockValue > 0 && stockValue <= criticalThreshold
    if (filter === 'out') return stockValue === 0
    return true
  })

  const variantsByProductId = useMemo(() => {
    const map = new Map<string, VariantRow[]>()
    for (const variant of filteredVariants) {
      const list = map.get(variant.product_id)
      if (list) {
        list.push(variant)
      } else {
        map.set(variant.product_id, [variant])
      }
    }
    return map
  }, [filteredVariants])

  const getVariantsByProduct = (productId: string) => variantsByProductId.get(productId) || []

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'pt-BR')
    const stockA = a.stock ?? 0
    const stockB = b.stock ?? 0
    if (sortBy === 'stock_desc') return stockB - stockA
    return stockA - stockB
  })

  const sortedRetailProducts = [...products]
    .filter((p) => {
      const q = searchTerm.trim().toLowerCase()
      const matchesSearch = !q || `${p.name} ${p.category}`.toLowerCase().includes(q)
      if (!matchesSearch) return false
      const rows = variantsByProductId.get(p.id) || []
      if (filter === 'all') return rows.length > 0
      return rows.length > 0
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'pt-BR')
      const stockA = (variantsByProductId.get(a.id) || []).reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
      const stockB = (variantsByProductId.get(b.id) || []).reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
      if (sortBy === 'stock_desc') return stockB - stockA
      return stockA - stockB
    })

  const stats = isRetail
    ? {
        total: variants.length,
        low: variants.filter(v => {
          const parentProduct = productById.get(v.product_id)
          const criticalThreshold = getVariantCriticalThreshold(v, parentProduct)
          return (v.stock_quantity ?? 0) > 0 && (v.stock_quantity ?? 0) <= criticalThreshold
        }).length,
        out: variants.filter(v => (v.stock_quantity ?? 0) === 0).length
      }
    : {
        total: products.length,
        low: products.filter(p => {
          if (p.stock === null) return false
          const criticalThreshold = getCriticalThreshold(p)
          return (p.stock ?? 0) > 0 && (p.stock ?? 0) <= criticalThreshold
        }).length,
        out: products.filter(p => (p.stock ?? 0) === 0).length
      }

  if (!store) {
    return (
      <div className={`${ui.panel} p-6`}>
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar o estoque.</p>
      </div>
    )
  }

  return (
    <div className={`${ui.panel} p-6 space-y-6`}>
      <div className={ui.headerRow}>
        <div>
          <h3 className="text-xl font-semibold mb-1">📊 Gestão de Estoque</h3>
          <p className="text-sm text-gray-600">Controle o estoque dos seus produtos</p>
        </div>
        <div className="flex items-center gap-2">
          {isRetail && (
            <button
              onClick={onOpenVariantsAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Variações
            </button>
          )}
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {message}
        </div>
      )}

      {loadError && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm">{loadError}</span>
          <button
            onClick={fetchProducts}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${ui.statCard} bg-blue-50 border-blue-200`}>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-700">{isRetail ? 'Total de Variações' : 'Total de Produtos'}</div>
        </div>
        <div className={`${ui.statCard} bg-yellow-50 border-yellow-200`}>
          <div className="text-2xl font-bold text-yellow-900">{stats.low}</div>
          <div className="text-sm text-yellow-700">Estoque Baixo (limite configurado)</div>
        </div>
        <div className={`${ui.statCard} bg-red-50 border-red-200`}>
          <div className="text-2xl font-bold text-red-900">{stats.out}</div>
          <div className="text-sm text-red-700">Sem Estoque</div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`${ui.toolbar} mb-0`}>
        <input
          type="text"
          placeholder={isRetail ? 'Buscar por produto/SKU/cor/tamanho...' : 'Buscar por produto ou categoria...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${ui.inputBase} min-w-[260px]`}
        />
        <div className={ui.sectionDivider} />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({stats.total})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'low' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Estoque Crítico ({stats.low})
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sem Estoque ({stats.out})
        </button>
        <div className={ui.sectionDivider} />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className={ui.selectBase}
        >
          <option value="stock_asc">Ordenar: menor estoque</option>
          <option value="stock_desc">Ordenar: maior estoque</option>
          <option value="name_asc">Ordenar: nome (A-Z)</option>
        </select>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando produtos...</div>
      ) : (isRetail ? filteredVariants.length === 0 : filteredProducts.length === 0) ? (
        <div className={ui.emptyPanel}>
          {filter === 'all' ? (isRetail ? 'Nenhuma variação cadastrada' : 'Nenhum produto cadastrado') : 'Nenhum produto encontrado com este filtro'}
        </div>
      ) : (
        <div className={ui.listContainer}>
          {isRetail && sortedRetailProducts.map((product) => {
            const productVariants = getVariantsByProduct(product.id)
            const totalVariantStock = productVariants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
            const lowVariantCount = productVariants.filter((v) => {
              const stockValue = v.stock_quantity ?? 0
              const threshold = getVariantCriticalThreshold(v, product)
              return stockValue > 0 && stockValue <= threshold
            }).length
            const outVariantCount = productVariants.filter((v) => (v.stock_quantity ?? 0) === 0).length
            const isCritical = lowVariantCount > 0
            const isExpanded = expandedProductId === product.id

            return (
              <div key={product.id} className="border rounded-lg overflow-hidden">
                <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 ${
                  totalVariantStock === 0 ? 'bg-red-50 border-red-200' :
                  isCritical ? 'bg-orange-50 border-orange-300' :
                  'bg-white'
                }`}>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {product.category} • R$ {product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total em estoque: {totalVariantStock}
                    </p>
                    {outVariantCount > 0 && (
                      <p className="text-xs text-red-700 mt-1 font-medium">
                        ❌ {outVariantCount} variação(ões) sem estoque
                      </p>
                    )}
                    {isCritical && (
                      <p className="text-xs text-orange-700 mt-1 font-medium">
                        ⚠️ {lowVariantCount} variação(ões) em estoque crítico
                      </p>
                    )}
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                        Limite crítico via variação
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                    className="px-4 py-2 rounded-lg font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    {isExpanded ? 'Fechar Variações' : 'Variações'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white">
                    {productVariants.length === 0 ? (
                      <div className="text-sm text-gray-500">Nenhuma variação cadastrada.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b">
                              <th className="py-2">SKU</th>
                              <th className="py-2">Cor</th>
                              <th className="py-2">Tamanho</th>
                              <th className="py-2">Estoque</th>
                              <th className="py-2">Limite Crítico</th>
                              <th className="py-2">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productVariants.map((variant) => {
                              const stockValue = variant.stock_quantity ?? 0
                              const threshold = getVariantCriticalThreshold(variant, product)
                              const isVariantCritical = stockValue > 0 && stockValue <= threshold
                              return (
                                <tr key={variant.id} className="border-b last:border-b-0">
                                  <td className="py-2 pr-2">{variant.sku}</td>
                                  <td className="py-2 pr-2">{variant.color}</td>
                                  <td className="py-2 pr-2">{variant.size}</td>
                                  <td className="py-2 pr-2">
                                    {editingVariantId === variant.id ? (
                                      <input
                                        type="number"
                                        value={editVariantValue}
                                        onChange={(e) => setEditVariantValue(e.target.value)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                        min="0"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className={`font-semibold ${isVariantCritical ? 'text-orange-600' : ''}`}>{stockValue}</span>
                                        {isVariantCritical && (
                                          <span className="text-[11px] text-orange-700">critico {threshold}</span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2 pr-2">
                                    {editingCriticalVariantId === variant.id ? (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 whitespace-nowrap">
                                          Atual: {variant.critical_stock || 10}
                                        </span>
                                        <input
                                          type="number"
                                          value={editCriticalVariantValue}
                                          onChange={(e) => setEditCriticalVariantValue(e.target.value)}
                                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                                          min="0"
                                          placeholder="Padrao"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => saveEditCriticalVariant(variant.id)}
                                          className="px-2 py-1 bg-green-600 text-white rounded"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={cancelEditCriticalVariant}
                                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startEditCriticalVariant(variant)}
                                        className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                                        title="Editar limite crítico da variação"
                                      >
                                        {(variant.critical_stock ?? 0) > 0 ? variant.critical_stock : 10}
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-2">
                                    {editingVariantId === variant.id ? (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => saveEditVariant(variant.id)}
                                          className="px-2 py-1 bg-green-600 text-white rounded"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={cancelEditVariant}
                                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => quickAdjustVariant(variant.id, variant.stock_quantity, -1)}
                                          className="w-7 h-7 bg-gray-200 text-gray-700 rounded font-bold"
                                          disabled={stockValue === 0}
                                        >
                                          −
                                        </button>
                                        <button
                                          onClick={() => quickAdjustVariant(variant.id, variant.stock_quantity, 1)}
                                          className="w-7 h-7 bg-gray-200 text-gray-700 rounded font-bold"
                                        >
                                          +
                                        </button>
                                        <button
                                          onClick={() => startEditVariant(variant)}
                                          className="px-2 py-1 bg-blue-600 text-white rounded"
                                        >
                                          Editar
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {!isRetail && sortedProducts.map((product) => (
            (() => {
              const stockValue = product.stock ?? 0
              const criticalThreshold = getCriticalThreshold(product)
              const hasTrackedStock = product.stock !== null
              const isCritical = hasTrackedStock && stockValue > 0 && stockValue <= criticalThreshold
              return (
            <div
              key={product.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                stockValue === 0 ? 'border-red-300 bg-red-50' : 
                isCritical ? 'border-orange-300 bg-orange-50' : 
                'border-gray-200'
              }`}
            >
              {/* Imagem do Produto */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>

              {/* Info do Produto */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                <p className="text-sm text-gray-600">
                  {product.category} • R$ {product.price.toFixed(2)}
                </p>
                {!hasTrackedStock && (
                  <p className="mt-1 inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700">
                    Sem controle de estoque
                  </p>
                )}
                {isCritical && (
                  <p className="text-xs text-orange-700 mt-1 font-medium">
                    ⚠️ Estoque crítico (limite: {criticalThreshold})
                  </p>
                )}
                <div className="mt-2">
                  {editingCriticalProductId === product.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 whitespace-nowrap">
                        Atualmente: {product.critical_stock || '—'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={editCriticalProductValue}
                        onChange={(e) => setEditCriticalProductValue(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Padrao 10"
                      />
                      <button
                        onClick={() => saveEditCriticalProduct(product.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={cancelEditCriticalProduct}
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditCriticalProduct(product)}
                      className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      Limite crítico: {criticalThreshold}
                    </button>
                  )}
                </div>
              </div>

              {/* Controle de Estoque */}
              <div className="flex items-center gap-3">
                {editingId === product.id ? (
                  <>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(product.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => quickAdjust(product.id, product.stock, -1)}
                      className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
                      disabled={stockValue === 0}
                    >
                      −
                    </button>
                    <div
                      onClick={() => startEdit(product)}
                      className="w-16 text-center font-bold text-lg cursor-pointer hover:bg-white px-2 py-1 rounded"
                      title="Clique para editar"
                    >
                      {stockValue}
                    </div>
                    <button
                      onClick={() => quickAdjust(product.id, product.stock, 1)}
                      className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => startEdit(product)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                  </>
                )}
              </div>
            </div>
              )
            })()
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Dicas</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use os botões + e − para ajustes rápidos</li>
          <li>• Clique no número do estoque para edição manual</li>
          <li>• Regra híbrida: variação usa limite próprio quando definido; senão herda do produto</li>
          <li>• Produtos sem estoque aparecem em vermelho</li>
        </ul>
      </div>
    </div>
  )
}
