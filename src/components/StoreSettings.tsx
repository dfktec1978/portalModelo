'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import InfoBanner from '@/components/InfoBanner'
import { getPlanConfig, getPlanDefaults, getPlanTransition, normalizeStorePlan } from '@/lib/storePlans'
import { useStorePlans } from '@/lib/useStorePlans'
import { ordersDashboardTokens as ui } from '@/components/ordersDashboardTokens'
import { getExtraDeliveryCitiesLimit, normalizeState, normalizeZipcode } from '@/lib/deliveryPolicy'

type Props = {
  store: any
  onStoreUpdatedAction?: (store: any) => void
}

type ExtraDeliveryCity = {
  id?: string
  city: string
  state: string
  zipcode: string
  delivery_fee: string
  eta_business_days: string
  active: boolean
}

export default function StoreSettings({ store, onStoreUpdatedAction }: Props) {
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
    delivery_eta_business_days: '1',
    min_order_delivery: '0',
    free_shipping_threshold: '0',
    delivery_options: {
      retirada: true,
      envio: true,
      condicional: false,
    },
    is_active: true,
    plan: 'presenca',
    plan_status: 'active'
  })
  const [deliverySettingsLoading, setDeliverySettingsLoading] = useState(false)
  const [deliverySettingsError, setDeliverySettingsError] = useState('')
  const [extraDeliveryCities, setExtraDeliveryCities] = useState<ExtraDeliveryCity[]>([])
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugMessage, setSlugMessage] = useState('')
  const { planConfigMap, plans } = useStorePlans()
  const currentPlan = normalizeStorePlan(store?.plan)
  const selectedPlan = normalizeStorePlan(form.plan)
  const selectedPlanConfig = getPlanConfig(selectedPlan, planConfigMap)
  const selectedPlanDefaults = getPlanDefaults(selectedPlan, planConfigMap)
  const planTransition = getPlanTransition(currentPlan, selectedPlan, form.plan_status, planConfigMap)
  const deliveryExtraLimit = getExtraDeliveryCitiesLimit(planTransition.plan)
  const supportsDeliverySettings = store?.category === 'alimentacao' || store?.category === 'varejo'
  const isFoodStore = store?.category === 'alimentacao'
  const canUseDeliveryCoverage = supportsDeliverySettings && deliveryExtraLimit > 0

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
        delivery_eta_business_days: '1',
        min_order_delivery: String(store.min_order_delivery ?? 0),
        free_shipping_threshold: String((store as any).free_shipping_threshold ?? 0),
        delivery_options: {
          retirada: store?.delivery_options?.retirada !== false,
          envio: store?.delivery_options?.envio !== false,
          condicional: !!store?.delivery_options?.condicional,
        },
        is_active: store.is_active !== false,
        plan: normalizeStorePlan(store.plan),
        plan_status: store.plan_status || 'active'
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

  useEffect(() => {
    if (!store?.id || !supportsDeliverySettings) {
      setExtraDeliveryCities([])
      setDeliverySettingsError('')
      return
    }

    let mounted = true
    const loadDeliverySettings = async () => {
      try {
        setDeliverySettingsLoading(true)
        setDeliverySettingsError('')

        const response = await fetch(`/api/store/delivery-settings?storeId=${encodeURIComponent(store.id)}`, {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Erro ao carregar regras de entrega')
        }

        if (!mounted) return

        const settings = payload?.settings || {}
        const baseCity = settings?.base_city || {}

        setForm((prev) => ({
          ...prev,
          city: baseCity.city || prev.city,
          state: baseCity.state || prev.state,
          zipcode: baseCity.zipcode || prev.zipcode,
          delivery_fee: String(baseCity.delivery_fee ?? prev.delivery_fee ?? 0),
          delivery_eta_business_days: String(baseCity.eta_business_days ?? 1),
          min_order_delivery: String(settings.min_order_delivery ?? prev.min_order_delivery ?? 0),
          free_shipping_threshold: String(settings.free_shipping_threshold ?? prev.free_shipping_threshold ?? 0),
          delivery_options: {
            retirada: settings?.delivery_options?.retirada !== false,
            envio: settings?.delivery_options?.envio !== false,
            condicional: !!settings?.delivery_options?.condicional,
          },
        }))

        setExtraDeliveryCities(
          ((settings.extra_cities || []) as any[]).map((item) => ({
            id: item.id,
            city: item.city || '',
            state: item.state || '',
            zipcode: item.zipcode || '',
            delivery_fee: String(item.delivery_fee ?? 0),
            eta_business_days: String(item.eta_business_days ?? 1),
            active: item.active !== false,
          })),
        )
      } catch (error: any) {
        if (mounted) {
          setDeliverySettingsError(error?.message || 'Não foi possível carregar a cobertura de entrega.')
        }
      } finally {
        if (mounted) setDeliverySettingsLoading(false)
      }
    }

    loadDeliverySettings()
    return () => { mounted = false }
  }, [store?.id, supportsDeliverySettings])

  const addExtraDeliveryCity = () => {
    if (extraDeliveryCities.length >= deliveryExtraLimit) return
    setExtraDeliveryCities((prev) => [
      ...prev,
      {
        city: '',
        state: '',
        zipcode: '',
        delivery_fee: '0',
        eta_business_days: '1',
        active: true,
      },
    ])
  }

  const updateExtraDeliveryCity = (index: number, patch: Partial<ExtraDeliveryCity>) => {
    setExtraDeliveryCities((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      return { ...item, ...patch }
    }))
  }

  const removeExtraDeliveryCity = (index: number) => {
    setExtraDeliveryCities((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

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

      const updatePayloadBase = {
        store_name: form.store_name,
        slug: normalizedSlug,
        phone: form.phone,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zipcode: form.zipcode || null,
        delivery_fee: form.delivery_fee || null,
        is_active: form.is_active
      }

      const updatePayloadWithPlan = {
        ...updatePayloadBase,
        plan: planTransition.plan,
        plan_status: planTransition.plan_status,
        product_limit: planTransition.product_limit,
        photo_limit: planTransition.photo_limit,
        priority_weight: planTransition.priority_weight
      }

      let usedLegacyFallback = false
      let { data, error } = await supabase
        .from('stores')
        .update(updatePayloadWithPlan)
        .eq('id', store.id)
        .select()

      if (error && /column .* does not exist|schema cache/i.test(String(error.message || ''))) {
        usedLegacyFallback = true
        const fallbackResult = await supabase
          .from('stores')
          .update(updatePayloadBase)
          .eq('id', store.id)
          .select()

        data = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) throw error

      let deliveryWarning = ''
      if (supportsDeliverySettings) {
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          const token = sessionData?.session?.access_token

          const extraCitiesPayload = extraDeliveryCities.map((item) => ({
            city: item.city.trim(),
            state: normalizeState(item.state),
            zipcode: normalizeZipcode(item.zipcode),
            delivery_fee: Number(item.delivery_fee || 0),
            eta_business_days: Math.max(1, Number(item.eta_business_days || 1)),
            active: item.active !== false,
          }))

          const response = await fetch('/api/store/delivery-settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              storeId: store.id,
              delivery_options: form.delivery_options,
              min_order_delivery: Number(form.min_order_delivery || 0),
              free_shipping_threshold: Number(form.free_shipping_threshold || 0),
              base_city: {
                city: form.city.trim(),
                state: normalizeState(form.state),
                zipcode: normalizeZipcode(form.zipcode),
                delivery_fee: Number(form.delivery_fee || 0),
                eta_business_days: Math.max(1, Number(form.delivery_eta_business_days || 1)),
                active: true,
              },
              extra_cities: extraCitiesPayload,
            }),
          })

          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.error || 'Erro ao salvar cobertura de entrega')
          }

          if (payload?.warning) {
            deliveryWarning = ` ${String(payload.warning)}`
          }
        } catch (deliveryError: any) {
          deliveryWarning = ` Configurações básicas salvas, mas a cobertura de entrega não foi atualizada: ${deliveryError?.message || 'erro desconhecido'}.`
        }
      }

      if (usedLegacyFallback && planTransition.type !== 'none') {
        setMessage(`Dados básicos salvos, mas seu banco ainda não possui campos de plano. Execute a migration para aplicar o plano em todo o portal.${deliveryWarning}`)
      } else if (planTransition.type === 'upgrade') {
        setMessage(`Configurações salvas com sucesso! O novo plano já foi aplicado à loja e seus dados foram mantidos.${deliveryWarning}`)
      } else if (planTransition.type === 'downgrade') {
        setMessage(`Configurações salvas com sucesso! O downgrade já foi aplicado sem perda dos dados da loja.${deliveryWarning}`)
      } else {
        setMessage(`Configurações salvas com sucesso!${deliveryWarning}`)
      }
      setTimeout(() => setMessage(''), 3000)
      
      // Atualizar o store local se necessário
      if (data && data[0]) {
        onStoreUpdatedAction?.(data[0])
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      const rawMessage = String(error?.message || '')
      if (/stores_plan_check|violates check constraint/i.test(rawMessage) && normalizeStorePlan(form.plan) === 'landingpage') {
        setMessage('Seu banco ainda não permite o plano LandingPage. Execute o SQL `sql/add-landingpage-to-plan-check.sql` no Supabase e tente novamente.')
      } else {
        setMessage(`Erro ao salvar configurações: ${rawMessage || 'erro desconhecido'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!store) {
    return (
      <div className={`${ui.panel} p-6`}>
        <p className="text-sm text-gray-600">Selecione uma loja para configurar.</p>
      </div>
    )
  }

  return (
    <div className={ui.stack}>
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
        <div className={`${ui.panel} p-6`}>
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
            {/* Seleção de Plano */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano da Loja
              </label>
              <select
                value={form.plan}
                onChange={(e) => {
                  const plan = normalizeStorePlan(e.target.value)
                  setForm({
                    ...form,
                    plan
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} ({plan.priceLabel})</option>
                ))}
              </select>
              <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                <div className="font-semibold">{selectedPlanConfig.name} • {selectedPlanConfig.priceLabel}</div>
                <div className="mt-1">Produtos permitidos: {selectedPlanDefaults.product_limit}</div>
                <div>Limite de fotos: {selectedPlanDefaults.photo_limit}</div>
                <div>Prioridade na vitrine: {selectedPlanDefaults.priority_weight}</div>
                <div>Cidades extras de entrega: {getExtraDeliveryCitiesLimit(selectedPlan)}</div>
                {planTransition.type !== 'none' && (
                  <div className="mt-2 font-medium">
                    {planTransition.type === 'upgrade'
                      ? 'Mudança detectada: upgrade com aplicação imediata no portal.'
                      : 'Mudança detectada: downgrade com aplicação imediata, sem excluir dados.'}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Escolha o plano conforme sua necessidade. Mudanças de plano podem exigir aprovação manual.
              </p>
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
        <div className={`${ui.panel} p-6`}>
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

        {/* Configurações de Entrega (Alimentação e Varejo) */}
        {supportsDeliverySettings && (
          <div className={`${ui.panel} p-6`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚚 Configurações de Entrega</h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Modalidades</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.delivery_options.retirada}
                      onChange={(e) => setForm({
                        ...form,
                        delivery_options: { ...form.delivery_options, retirada: e.target.checked },
                      })}
                      className="accent-blue-600"
                    />
                    Retirada no local
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.delivery_options.envio}
                      onChange={(e) => setForm({
                        ...form,
                        delivery_options: { ...form.delivery_options, envio: e.target.checked },
                      })}
                      className="accent-blue-600"
                    />
                    Entrega própria
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.delivery_options.condicional}
                      onChange={(e) => setForm({
                        ...form,
                        delivery_options: { ...form.delivery_options, condicional: e.target.checked },
                      })}
                      className="accent-blue-600"
                    />
                    Sob consulta
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor mínimo para entrega (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_order_delivery}
                    onChange={(e) => setForm({ ...form, min_order_delivery: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frete grátis a partir de (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.free_shipping_threshold}
                    onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {deliverySettingsError && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                  {deliverySettingsError}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Cidade base da loja</p>
                <div className="grid gap-3 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cidade base</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Ex: Modelo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                      placeholder="SC"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={form.zipcode}
                      onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                      placeholder="89160-000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Taxa base (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.delivery_fee}
                      onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                      placeholder="6.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-3 max-w-[240px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {isFoodStore ? 'Tempo estimado base (min)' : 'Prazo estimado base (dias úteis)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.delivery_eta_business_days}
                    onChange={(e) => setForm({ ...form, delivery_eta_business_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    {isFoodStore ? 'Ex.: 40, 60, 90 minutos.' : 'Ex.: 1, 2, 3 dias úteis.'}
                  </p>
                </div>
              </div>

              {!canUseDeliveryCoverage ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  Cobertura por cidades extras disponível apenas para planos Destaque (2 extras) e Premium (4 extras).
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Cidades extras de entrega</p>
                      <p className="text-xs text-gray-500">Plano atual permite até {deliveryExtraLimit} cidades extras.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addExtraDeliveryCity}
                      disabled={extraDeliveryCities.length >= deliveryExtraLimit}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      + Adicionar cidade
                    </button>
                  </div>

                  {deliverySettingsLoading ? (
                    <p className="text-sm text-gray-500">Carregando cidades...</p>
                  ) : extraDeliveryCities.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma cidade extra cadastrada.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="hidden md:grid md:grid-cols-12 gap-2 px-1 text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                        <span className="md:col-span-3">Cidade</span>
                        <span className="md:col-span-1">UF</span>
                        <span className="md:col-span-2">CEP</span>
                        <span className="md:col-span-2">Taxa (R$)</span>
                        <span className="md:col-span-2">{isFoodStore ? 'Tempo (min)' : 'Prazo (dias)'}</span>
                        <span className="md:col-span-1">Ativa</span>
                        <span className="md:col-span-1">Ação</span>
                      </div>
                      {extraDeliveryCities.map((item, index) => (
                        <div key={`${item.id || 'new'}-${index}`} className="grid gap-2 md:grid-cols-12 items-center">
                          <input
                            type="text"
                            value={item.city}
                            onChange={(e) => updateExtraDeliveryCity(index, { city: e.target.value })}
                            placeholder="Cidade"
                            className="md:col-span-3 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            maxLength={2}
                            value={item.state}
                            onChange={(e) => updateExtraDeliveryCity(index, { state: e.target.value.toUpperCase() })}
                            placeholder="UF"
                            className="md:col-span-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={item.zipcode}
                            onChange={(e) => updateExtraDeliveryCity(index, { zipcode: e.target.value })}
                            placeholder="CEP"
                            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.delivery_fee}
                            onChange={(e) => updateExtraDeliveryCity(index, { delivery_fee: e.target.value })}
                            placeholder="Taxa R$"
                            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="number"
                            min="1"
                            value={item.eta_business_days}
                            onChange={(e) => updateExtraDeliveryCity(index, { eta_business_days: e.target.value })}
                            placeholder={isFoodStore ? 'Tempo (min)' : 'Prazo (dias)'}
                            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <label className="md:col-span-1 flex items-center justify-center gap-1 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.active}
                              onChange={(e) => updateExtraDeliveryCity(index, { active: e.target.checked })}
                              className="accent-blue-600"
                            />
                            Ativa
                          </label>
                          <button
                            type="button"
                            onClick={() => removeExtraDeliveryCity(index)}
                            className="md:col-span-1 px-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status da Loja */}
        <div className={`${ui.panel} p-6`}>
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
                  delivery_eta_business_days: '1',
                  min_order_delivery: String(store.min_order_delivery ?? 0),
                  free_shipping_threshold: String((store as any).free_shipping_threshold ?? 0),
                  delivery_options: {
                    retirada: store?.delivery_options?.retirada !== false,
                    envio: store?.delivery_options?.envio !== false,
                    condicional: !!store?.delivery_options?.condicional,
                  },
                  is_active: store.is_active !== false,
                  plan: normalizeStorePlan(store.plan),
                  plan_status: store.plan_status || 'active'
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
