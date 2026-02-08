'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  store: any
  onOpenVariantsAction?: () => void
}

type Product = {
  id: string
  name: string
  price: number
  stock: number | null
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
}

export default function StoreModuleStock({ store, onOpenVariantsAction }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [editVariantValue, setEditVariantValue] = useState('')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  const isRetail = store?.category === 'varejo'

  useEffect(() => {
    if (store?.id) {
      fetchProducts()
    }
  }, [store])

  const fetchProducts = async () => {
    if (!store?.id) return

    setLoading(true)
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
            .select('id, product_id, sku, color, size, stock_quantity')
            .in('product_id', productIds)

          if (variantError) throw variantError

          const productNameMap = new Map(productList.map((p: Product) => [p.id, p.name]))
          const rows: VariantRow[] = (variantData || []).map((v: any) => ({
            id: v.id,
            product_id: v.product_id,
            product_name: productNameMap.get(v.product_id) || 'Produto',
            sku: v.sku,
            color: v.color,
            size: v.size,
            stock_quantity: v.stock_quantity ?? 0
          }))

          setVariants(rows)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
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

  const quickAdjust = (productId: string, currentStock: number | null, delta: number) => {
    const safeStock = currentStock ?? 0
    handleStockUpdate(productId, Math.max(0, safeStock + delta))
  }

  const quickAdjustVariant = (variantId: string, currentStock: number | null, delta: number) => {
    const safeStock = currentStock ?? 0
    handleVariantStockUpdate(variantId, Math.max(0, safeStock + delta))
  }

  const filteredProducts = products.filter(p => {
    const stockValue = p.stock ?? 0
    if (filter === 'low') return stockValue > 0 && stockValue <= 10
    if (filter === 'out') return stockValue === 0
    return true
  })

  const filteredVariants = variants.filter(v => {
    const stockValue = v.stock_quantity ?? 0
    if (filter === 'low') return stockValue > 0 && stockValue <= 10
    if (filter === 'out') return stockValue === 0
    return true
  })

  const getVariantsByProduct = (productId: string) =>
    filteredVariants.filter(v => v.product_id === productId)

  const stats = isRetail
    ? {
        total: variants.length,
        low: variants.filter(v => (v.stock_quantity ?? 0) > 0 && (v.stock_quantity ?? 0) <= 10).length,
        out: variants.filter(v => (v.stock_quantity ?? 0) === 0).length
      }
    : {
        total: products.length,
        low: products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10).length,
        out: products.filter(p => (p.stock ?? 0) === 0).length
      }

  if (!store) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar o estoque.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-700">{isRetail ? 'Total de Variações' : 'Total de Produtos'}</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">{stats.low}</div>
          <div className="text-sm text-yellow-700">Estoque Baixo (≤10)</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-900">{stats.out}</div>
          <div className="text-sm text-red-700">Sem Estoque</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
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
          Estoque Baixo ({stats.low})
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sem Estoque ({stats.out})
        </button>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando produtos...</div>
      ) : (isRetail ? filteredVariants.length === 0 : filteredProducts.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          {filter === 'all' ? (isRetail ? 'Nenhuma variação cadastrada' : 'Nenhum produto cadastrado') : 'Nenhum produto encontrado com este filtro'}
        </div>
      ) : (
        <div className="space-y-3">
          {isRetail && filteredProducts.map((product) => {
            const productVariants = getVariantsByProduct(product.id)
            const totalVariantStock = productVariants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
            const isExpanded = expandedProductId === product.id

            return (
              <div key={product.id} className="border rounded-lg overflow-hidden">
                <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 ${
                  totalVariantStock === 0 ? 'bg-red-50 border-red-200' :
                  totalVariantStock <= 10 ? 'bg-yellow-50 border-yellow-200' :
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
                              <th className="py-2">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productVariants.map((variant) => {
                              const stockValue = variant.stock_quantity ?? 0
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
                                      <span className="font-semibold">{stockValue}</span>
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

          {!isRetail && filteredProducts.map((product) => (
            (() => {
              const stockValue = product.stock ?? 0
              return (
            <div
              key={product.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                stockValue === 0 ? 'border-red-300 bg-red-50' : 
                stockValue <= 10 ? 'border-yellow-300 bg-yellow-50' : 
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
          <li>• Produtos com estoque baixo (≤10) são destacados em amarelo</li>
          <li>• Produtos sem estoque aparecem em vermelho</li>
        </ul>
      </div>
    </div>
  )
}
