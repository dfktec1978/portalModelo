"use client"

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type DeliveryOption = 'retirada' | 'envio' | 'condicional'

type PaymentMethod = 'pix' | 'na_retirada'

type CheckoutOptionsModalProps = {
  isOpen: boolean
  onCloseAction: () => void
  onConfirmAction: (data: {
    delivery: {
      type: DeliveryOption
      date: Date
      address?: string
      fee: number
    }
    payment: {
      method: PaymentMethod
      storePixKey?: string
    }
    clientData: {
      name: string
      email: string
      phone: string
    }
  }) => Promise<void> | void
  storeConfig: {
    delivery_options: {
      retirada: boolean
      envio: boolean
      condicional: boolean
    }
    delivery_fee_envio?: number
    delivery_fee_condicional?: number
    min_order_delivery?: number
    payment_options: {
      pix: boolean
      na_retirada: boolean
    }
    pix_key?: string
    delivery_instructions?: string
  }
  cartItems: any[]
  cartTotal: number
  errorMessage?: string | null
  isSubmitting?: boolean
  onUpdateQuantityAction?: (cartId: number, nextQty: number) => void
  onRemoveItemAction?: (cartId: number) => void
}

export default function CheckoutOptionsModal({
  isOpen,
  onCloseAction,
  onConfirmAction,
  storeConfig,
  cartItems,
  cartTotal,
  errorMessage,
  isSubmitting = false,
  onUpdateQuantityAction,
  onRemoveItemAction
}: CheckoutOptionsModalProps) {
  const availableDelivery = storeConfig.delivery_options
  const availablePayments = storeConfig.payment_options

  const initialDelivery = useMemo<DeliveryOption>(() => {
    if (availableDelivery.retirada) return 'retirada'
    if (availableDelivery.envio) return 'envio'
    return 'condicional'
  }, [availableDelivery])

  const initialPayment = useMemo<PaymentMethod>(() => {
    if (availablePayments.pix) return 'pix'
    return 'na_retirada'
  }, [availablePayments])

  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>(initialDelivery)
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [deliveryTime, setDeliveryTime] = useState<string>('14:00')
  const [address, setAddress] = useState<string>('')
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(initialPayment)
  const [agreed, setAgreed] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [clientData, setClientData] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [loadingClient, setLoadingClient] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoadingClient(true)
        setErrorMsg('')

        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
          setErrorMsg('Erro ao carregar dados. Faça login novamente.')
          setLoadingClient(false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, email, phone, address, number, neighborhood, city, state, zipcode, complement')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setClientData({
            name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          })
        } else if (profile) {
          setClientData({
            name: profile.display_name || user.email?.split('@')[0] || 'Usuário',
            email: profile.email || user.email || '',
            phone: profile.phone || ''
          })
          if (profile.address) {
            setAddress((prev) => {
              if (prev) return prev
              const parts = [
                profile.address,
                profile.number ? `nº ${profile.number}` : null,
                profile.neighborhood ? profile.neighborhood : null,
                profile.city ? profile.city : null,
                profile.state ? profile.state : null,
                profile.zipcode ? `CEP ${profile.zipcode}` : null,
                profile.complement ? profile.complement : null
              ].filter(Boolean)
              return parts.join(', ')
            })
          }
        }
      } catch {
        setErrorMsg('Erro ao carregar dados do usuário.')
      } finally {
        setLoadingClient(false)
      }
    }

    loadUserData()
  }, [])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!clientData || !clientData.name.trim() || !clientData.email.trim() || !clientData.phone.trim()) {
      setErrorMsg('Complete seus dados para continuar')
      return
    }

    if (!deliveryDate) {
      setErrorMsg('Selecione uma data de entrega')
      return
    }

    if (selectedDelivery === 'envio' && cartTotal < (storeConfig.min_order_delivery || 0)) {
      setErrorMsg(`Mínimo de R$ ${(storeConfig.min_order_delivery || 0).toFixed(2)} para entrega`)
      return
    }

    if (!agreed) {
      setErrorMsg('Você precisa concordar com os termos')
      return
    }

    let fee = 0
    if (selectedDelivery === 'envio') {
      fee = storeConfig.delivery_fee_envio || 0
    } else if (selectedDelivery === 'condicional') {
      fee = storeConfig.delivery_fee_condicional || 0
    }

    const dateTime = new Date(`${deliveryDate}T${deliveryTime}:00`)

    await onConfirmAction({
      delivery: {
        type: selectedDelivery,
        date: dateTime,
        address: selectedDelivery === 'envio' ? address : undefined,
        fee
      },
      payment: {
        method: selectedPayment,
        storePixKey: storeConfig.pix_key
      },
      clientData
    })
  }

  const calcItemTotal = (item: any) => {
    if (item.pizzaConfig) {
      return item.totalPrice || 0
    }
    const additionalsTotal = item.additionals?.reduce((s: number, a: any) => s + (a.price || 0), 0) || 0
    return (item.price + additionalsTotal) * item.quantity
  }

  const getItemMaxQty = (item: any) => {
    const variantStock = typeof item.variant?.stock_quantity === 'number' ? item.variant.stock_quantity : null
    const productStock = typeof item.stock_quantity === 'number' ? item.stock_quantity : null
    return variantStock ?? productStock
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Revisar e Finalizar Compra</h2>
          <button
            onClick={onCloseAction}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Confirme Seus Dados</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {loadingClient ? (
                <div className="text-sm text-gray-600">Carregando seus dados...</div>
              ) : clientData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Nome</div>
                    <div className="font-medium text-gray-900">{clientData.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{clientData.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Telefone</div>
                    <div className="font-medium text-gray-900">{clientData.phone || '—'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600">Não foi possível carregar seus dados.</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Resumo do Pedido</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-2 text-sm">
                {cartItems.map((item, idx) => (
                  <div key={item.cartId || idx} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">Qtd: {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantityAction?.(item.cartId, Math.max(1, item.quantity - 1))}
                        className="px-2 py-1 border rounded text-sm"
                        disabled={!onUpdateQuantityAction}
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxQty = getItemMaxQty(item)
                          if (typeof maxQty === 'number' && item.quantity >= maxQty) return
                          onUpdateQuantityAction?.(item.cartId, item.quantity + 1)
                        }}
                        className="px-2 py-1 border rounded text-sm"
                        disabled={!onUpdateQuantityAction || (typeof getItemMaxQty(item) === 'number' && item.quantity >= getItemMaxQty(item))}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItemAction?.(item.cartId)}
                        className="px-2 py-1 text-red-600 text-xs"
                        disabled={!onRemoveItemAction}
                      >
                        Remover
                      </button>
                    </div>
                    <span className="text-sm font-semibold">R$ {calcItemTotal(item).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-blue-600">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Entrega</h3>

            {availableDelivery.retirada && (
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                style={{
                  borderColor: selectedDelivery === 'retirada' ? '#003049' : '#e5e7eb',
                  backgroundColor: selectedDelivery === 'retirada' ? '#003049' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value="retirada"
                  checked={selectedDelivery === 'retirada'}
                  onChange={(e) => setSelectedDelivery(e.target.value as DeliveryOption)}
                  className="w-4 h-4 mt-1 cursor-pointer accent-blue-600"
                />
                <div>
                  <div className={`font-semibold ${selectedDelivery === 'retirada' ? 'text-white' : 'text-gray-900'}`}>
                    🏪 Retirada na Loja
                  </div>
                  <div className={`text-sm ${selectedDelivery === 'retirada' ? 'text-gray-100' : 'text-gray-600'}`}>
                    Sem taxa de entrega
                  </div>
                </div>
              </label>
            )}

            {availableDelivery.envio && (
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                style={{
                  borderColor: selectedDelivery === 'envio' ? '#003049' : '#e5e7eb',
                  backgroundColor: selectedDelivery === 'envio' ? '#003049' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value="envio"
                  checked={selectedDelivery === 'envio'}
                  onChange={(e) => setSelectedDelivery(e.target.value as DeliveryOption)}
                  className="w-4 h-4 mt-1 cursor-pointer accent-blue-600"
                />
                <div>
                  <div className={`font-semibold ${selectedDelivery === 'envio' ? 'text-white' : 'text-gray-900'}`}>
                    🚚 Envio a Domicílio
                  </div>
                  <div className={`text-sm ${selectedDelivery === 'envio' ? 'text-gray-100' : 'text-gray-600'}`}>
                    +R$ {(storeConfig.delivery_fee_envio || 0).toFixed(2)}
                  </div>
                </div>
              </label>
            )}

            {availableDelivery.condicional && (
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                style={{
                  borderColor: selectedDelivery === 'condicional' ? '#003049' : '#e5e7eb',
                  backgroundColor: selectedDelivery === 'condicional' ? '#003049' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value="condicional"
                  checked={selectedDelivery === 'condicional'}
                  onChange={(e) => setSelectedDelivery(e.target.value as DeliveryOption)}
                  className="w-4 h-4 mt-1 cursor-pointer accent-blue-600"
                />
                <div>
                  <div className={`font-semibold ${selectedDelivery === 'condicional' ? 'text-white' : 'text-gray-900'}`}>
                    📦 Condicional (Retirar na loja)
                  </div>
                  <div className={`text-sm ${selectedDelivery === 'condicional' ? 'text-gray-100' : 'text-gray-600'}`}>
                    +R$ {(storeConfig.delivery_fee_condicional || 0).toFixed(2)}
                  </div>
                </div>
              </label>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Data</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">🕐 Horário</label>
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDelivery === 'envio' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">📍 Endereço (opcional)</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro, complemento"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            )}

            {storeConfig.delivery_instructions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Instruções:</p>
                <p className="text-sm text-yellow-800">{storeConfig.delivery_instructions}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Forma de Pagamento</h3>

            {availablePayments.pix && (
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                style={{
                  borderColor: selectedPayment === 'pix' ? '#003049' : '#e5e7eb',
                  backgroundColor: selectedPayment === 'pix' ? '#003049' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value="pix"
                  checked={selectedPayment === 'pix'}
                  onChange={(e) => setSelectedPayment(e.target.value as PaymentMethod)}
                  className="w-4 h-4 mt-1 cursor-pointer accent-blue-600"
                />
                <div>
                  <div className={`font-semibold ${selectedPayment === 'pix' ? 'text-white' : 'text-gray-900'}`}>
                    📱 Pix Instantâneo
                  </div>
                  <div className={`text-sm ${selectedPayment === 'pix' ? 'text-gray-100' : 'text-gray-600'}`}>
                    Receba um código QR para escanear
                  </div>
                </div>
              </label>
            )}

            {availablePayments.na_retirada && (
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all"
                style={{
                  borderColor: selectedPayment === 'na_retirada' ? '#003049' : '#e5e7eb',
                  backgroundColor: selectedPayment === 'na_retirada' ? '#003049' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value="na_retirada"
                  checked={selectedPayment === 'na_retirada'}
                  onChange={(e) => setSelectedPayment(e.target.value as PaymentMethod)}
                  className="w-4 h-4 mt-1 cursor-pointer accent-blue-600"
                />
                <div>
                  <div className={`font-semibold ${selectedPayment === 'na_retirada' ? 'text-white' : 'text-gray-900'}`}>
                    💵 Pagar na {selectedDelivery === 'retirada' ? 'Retirada' : 'Entrega'}
                  </div>
                  <div className={`text-sm ${selectedPayment === 'na_retirada' ? 'text-gray-100' : 'text-gray-600'}`}>
                    Pague quando receber
                  </div>
                </div>
              </label>
            )}

            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-1 accent-blue-600"
              />
              <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                Li e concordo com os termos de compra e política de privacidade
              </label>
            </div>
          </div>

          {(errorMsg || errorMessage) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⚠️ {errorMsg || errorMessage}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              disabled={isSubmitting}
            >
              Continuar comprando
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
