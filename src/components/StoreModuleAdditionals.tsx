'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  store: any
}

type Additional = {
  id: string
  store_id: string
  name: string
  price: number
  category: string
  available: boolean
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'ingredientes', label: '🥓 Ingredientes', emoji: '🥓' },
  { value: 'molhos', label: '🍯 Molhos', emoji: '🍯' },
  { value: 'bebidas', label: '🥤 Bebidas', emoji: '🥤' },
  { value: 'sobremesas', label: '🍰 Sobremesas', emoji: '🍰' },
  { value: 'outros', label: '➕ Outros', emoji: '➕' }
]

export default function StoreModuleAdditionals({ store }: Props) {
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Additional | null>(null)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'ingredientes',
    available: true
  })

  useEffect(() => {
    if (store?.id) {
      fetchAdditionals()
    }
  }, [store])

  const fetchAdditionals = async () => {
    if (!store?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('additionals')
        .select('*')
        .eq('store_id', store.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      setAdditionals(data || [])
    } catch (error) {
      console.error('Erro ao buscar adicionais:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.price) {
      setMessage('Preencha todos os campos obrigatórios')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      if (editing) {
        // Atualizar existente
        const { error } = await supabase
          .from('additionals')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            category: formData.category,
            available: formData.available
          })
          .eq('id', editing.id)

        if (error) throw error

        setMessage('Adicional atualizado com sucesso!')
      } else {
        // Criar novo
        const { error } = await supabase
          .from('additionals')
          .insert({
            store_id: store.id,
            name: formData.name,
            price: parseFloat(formData.price),
            category: formData.category,
            available: formData.available
          })

        if (error) throw error

        setMessage('Adicional criado com sucesso!')
      }

      resetForm()
      fetchAdditionals()
      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      console.error('Erro ao salvar adicional:', error)
      setMessage('Erro ao salvar adicional. Tente novamente.')
    }
  }

  const handleEdit = (additional: Additional) => {
    setEditing(additional)
    setFormData({
      name: additional.name,
      price: additional.price.toString(),
      category: additional.category,
      available: additional.available
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este adicional?')) return

    try {
      const { error } = await supabase
        .from('additionals')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage('Adicional excluído com sucesso!')
      fetchAdditionals()

      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao excluir adicional:', error)
      setMessage('Erro ao excluir adicional')
    }
  }

  const toggleAvailability = async (additional: Additional) => {
    try {
      const { error } = await supabase
        .from('additionals')
        .update({ available: !additional.available })
        .eq('id', additional.id)

      if (error) throw error

      setAdditionals(prev =>
        prev.map(a => a.id === additional.id ? { ...a, available: !a.available } : a)
      )
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'ingredientes', available: true })
    setEditing(null)
    setShowForm(false)
  }

  const groupedAdditionals = CATEGORIES.map(cat => ({
    ...cat,
    items: additionals.filter(a => a.category === cat.value)
  }))

  if (!store) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar adicionais.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-1">➕ Adicionais do Cardápio</h3>
          <p className="text-sm text-gray-600">Gerencie opções extras para seus produtos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Adicional'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {message}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-4">{editing ? 'Editar Adicional' : 'Novo Adicional'}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Adicional *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Queijo Extra, Bacon, Molho Especial"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Adicional (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Disponível</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {editing ? '💾 Salvar Alterações' : '➕ Adicionar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Adicionais */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando adicionais...</div>
      ) : additionals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Nenhum adicional cadastrado</p>
          <p className="text-sm">Clique em "Novo Adicional" para começar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedAdditionals.map(group => (
            group.items.length > 0 && (
              <div key={group.value}>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">{group.emoji}</span>
                  {group.label.replace(/^.+ /, '')}
                  <span className="text-sm font-normal text-gray-500">({group.items.length})</span>
                </h4>

                <div className="space-y-2">
                  {group.items.map((additional) => (
                    <div
                      key={additional.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        additional.available ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-300 bg-gray-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h5 className="font-medium text-gray-900">{additional.name}</h5>
                          {!additional.available && (
                            <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                              Indisponível
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          + R$ {additional.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAvailability(additional)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            additional.available
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                          title={additional.available ? 'Marcar como indisponível' : 'Marcar como disponível'}
                        >
                          {additional.available ? '✓ Ativo' : '✕ Inativo'}
                        </button>
                        <button
                          onClick={() => handleEdit(additional)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(additional.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Dicas</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Organize adicionais por categoria para facilitar a gestão</li>
          <li>• Use o botão "Ativo/Inativo" para desabilitar temporariamente um adicional</li>
          <li>• Os adicionais aparecerão como opções extras nos produtos do cardápio</li>
          <li>• Exemplos: Queijo Extra (+R$ 3,00), Bacon (+R$ 4,50), Molho Especial (+R$ 2,00)</li>
        </ul>
      </div>
    </div>
  )
}
