'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import InfoBanner from '@/components/InfoBanner'

type Props = {
  store: any
}

export default function StoreSettings({ store }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    store_name: '',
    slug: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    delivery_fee: '',
    is_active: true
  })
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugMessage, setSlugMessage] = useState('')

  useEffect(() => {
    if (store) {
      setForm({
        store_name: store.store_name || '',
        slug: store.slug || '',
        phone: store.phone || '',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        zipcode: store.zipcode || '',
        delivery_fee: store.delivery_fee || '',
        is_active: store.is_active !== false
      })
      setSlugStatus('idle')
      setSlugMessage('')
    }
  }, [store])

  const normalizeSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const isSlugValid = (value: string) => {
    if (!value) return false
    if (value.length < 3) return false
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  }

  useEffect(() => {
    if (!store?.id) return

    const currentSlug = store.slug || ''
    const normalized = normalizeSlug(form.slug || '')

    if (!normalized) {
      setSlugStatus('invalid')
      setSlugMessage('Informe um endereço válido')
      return
    }

    if (!isSlugValid(normalized)) {
      setSlugStatus('invalid')
      setSlugMessage('Use apenas letras minúsculas, números e hífens (mín. 3 caracteres)')
      return
    }

    if (normalized === currentSlug) {
      setSlugStatus('available')
      setSlugMessage('Endereço atual da sua loja')
      return
    }

    setSlugStatus('checking')
    setSlugMessage('Verificando disponibilidade...')

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', normalized)
          .maybeSingle()

        if (error) throw error

        if (data && data.id && data.id !== store.id) {
          setSlugStatus('taken')
          setSlugMessage('Este endereço já está em uso')
        } else {
          setSlugStatus('available')
          setSlugMessage('Endereço disponível')
        }
      } catch (err) {
        console.error('Erro ao verificar slug:', err)
        setSlugStatus('invalid')
        setSlugMessage('Não foi possível verificar o endereço')
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [form.slug, store?.id, store?.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const normalizedSlug = normalizeSlug(form.slug || '')

      if (!isSlugValid(normalizedSlug)) {
        setMessage('Endereço da loja inválido. Use apenas letras minúsculas, números e hífens (mín. 3 caracteres).')
        setLoading(false)
        return
      }

      if (slugStatus === 'checking') {
        setMessage('Aguarde a verificação do endereço da loja.')
        setLoading(false)
        return
      }

      if (slugStatus === 'taken') {
        setMessage('Este endereço já está em uso. Escolha outro.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .update({
          store_name: form.store_name,
          slug: normalizedSlug,
          phone: form.phone,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          zipcode: form.zipcode || null,
          delivery_fee: form.delivery_fee || null,
          is_active: form.is_active
        })
        .eq('id', store.id)
        .select()

      if (error) throw error

      setMessage('Configurações salvas com sucesso!')
      setTimeout(() => setMessage(''), 3000)
      
      // Atualizar o store local se necessário
      if (data && data[0]) {
        // Opcional: callback para atualizar estado pai
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      setMessage('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  if (!store) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Selecione uma loja para configurar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">⚙️ Configurações da Loja</h2>
        <p className="text-sm text-gray-600 mt-1">Gerencie informações e configurações da sua loja</p>
      </div>

      <InfoBanner
        type="info"
        title="Mantenha seus dados atualizados"
        message="Informações corretas de contato e endereço aumentam a confiança dos clientes. Use a opção de desativar temporariamente se precisar fechar por alguns dias (férias, reforma, etc)."
      />

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('sucesso') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Informações Básicas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Loja *
              </label>
              <input
                type="text"
                required
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Pizza da Vovó"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço da Loja *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/lojas/</span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="nomeloja"
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                URL: https://www.portalmodelo.tech/lojas/{normalizeSlug(form.slug || '') || 'nomeloja'}
              </div>
              {slugMessage && (
                <div className={`mt-1 text-xs ${
                  slugStatus === 'available'
                    ? 'text-green-600'
                    : slugStatus === 'checking'
                      ? 'text-blue-600'
                      : 'text-red-600'
                }`}>
                  {slugMessage}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Use apenas letras minúsculas, números e hífens.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone/WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Endereço</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rua, número, complemento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: São Paulo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado (UF)
              </label>
              <input
                type="text"
                maxLength={2}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={form.zipcode}
                onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Entrega (apenas Alimentação) */}
        {store.category === 'alimentacao' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚚 Configurações de Entrega</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.delivery_fee}
                onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 5.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para taxa variável ou grátis
              </p>
            </div>
          </div>
        )}

        {/* Status da Loja */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Status da Loja</h3>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {form.is_active ? 'Loja Ativa' : 'Loja Desativada'}
              </div>
              <div className="text-xs text-gray-500">
                {form.is_active 
                  ? 'Sua loja está visível e aceitando pedidos' 
                  : 'Sua loja está temporariamente desativada'}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (store) {
                setForm({
                  store_name: store.store_name || '',
                  slug: store.slug || '',
                  phone: store.phone || '',
                  address: store.address || '',
                  city: store.city || '',
                  state: store.state || '',
                  zipcode: store.zipcode || '',
                  delivery_fee: store.delivery_fee || '',
                  is_active: store.is_active !== false
                })
                setSlugStatus('idle')
                setSlugMessage('')
              }
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
