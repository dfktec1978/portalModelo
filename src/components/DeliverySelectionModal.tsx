"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type DeliveryOption = 'retirada' | 'envio' | 'condicional'

type DeliverySelectionModalProps = {
  isOpen: boolean
  onCloseAction: () => void
  onSelectAction: (delivery: {
    type: DeliveryOption
    date: Date
    address?: string
    fee: number
  }) => void
  storeConfig: {
    delivery_options: {
      retirada: boolean
      envio: boolean
      condicional: boolean
    }
    delivery_fee_envio?: number
    delivery_fee_condicional?: number
    delivery_instructions?: string
    schedule_delivery?: boolean
    min_order_delivery?: number
  }
  storeHours?: {
    start: string
    end: string
  }
  cartTotal: number
}

export default function DeliverySelectionModal({
  isOpen,
  onCloseAction,
  onSelectAction,
  storeConfig,
  storeHours,
  cartTotal
}: DeliverySelectionModalProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>('retirada')
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [deliveryTime, setDeliveryTime] = useState<string>('14:00')
  const [address, setAddress] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação
    if (!deliveryDate) {
      setErrorMsg('Selecione uma data de entrega')
      return
    }

    if (selectedDelivery === 'envio' && !address) {
      setErrorMsg('Informe o endereço de entrega')
      return
    }

    if (selectedDelivery === 'envio' && cartTotal < (storeConfig.min_order_delivery || 0)) {
      setErrorMsg(`Mínimo de R$ ${(storeConfig.min_order_delivery || 0).toFixed(2)} para entrega`)
      return
    }

    // Calcular fee
    let fee = 0
    if (selectedDelivery === 'envio') {
      fee = storeConfig.delivery_fee_envio || 0
    } else if (selectedDelivery === 'condicional') {
      fee = storeConfig.delivery_fee_condicional || 0
    }

    // Combinar data e hora
    const dateTime = new Date(`${deliveryDate}T${deliveryTime}:00`)

    onSelectAction({
      type: selectedDelivery,
      date: dateTime,
      address: selectedDelivery === 'envio' ? address : undefined,
      fee
    })
  }

  if (!isOpen) return null

  const availableOptions = storeConfig.delivery_options

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Tipo de Entrega</h2>
          <button
            onClick={onCloseAction}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Opções de Entrega */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Escolha como deseja receber
            </h3>

            {/* Retirada */}
            {availableOptions.retirada && (
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

            {/* Envio */}
            {availableOptions.envio && (
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
                    +R$ {(storeConfig.delivery_fee_envio || 0).toFixed(2)} | 1 dia útil
                  </div>
                </div>
              </label>
            )}

            {/* Condicional */}
            {availableOptions.condicional && (
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
                    📦 Entrega Especial
                  </div>
                  <div className={`text-sm ${selectedDelivery === 'condicional' ? 'text-gray-100' : 'text-gray-600'}`}>
                    +R$ {(storeConfig.delivery_fee_condicional || 0).toFixed(2)} | Sob demanda
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Data de Entrega */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📅 Data de Entrega
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Horário (apenas para Retirada) */}
          {selectedDelivery === 'retirada' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🕐 Horário de Retirada
              </label>
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
          )}

          {/* Endereço (apenas para Envio) */}
          {selectedDelivery === 'envio' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📍 Endereço de Entrega
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, complemento"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          )}

          {/* Instruções da Loja */}
          {storeConfig.delivery_instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Instruções:</p>
              <p className="text-sm text-yellow-800">{storeConfig.delivery_instructions}</p>
            </div>
          )}

          {/* Mensagem de erro */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⚠️ {errorMsg}</p>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Resumo</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">R$ {cartTotal.toFixed(2)}</span>
              </div>
              {selectedDelivery !== 'retirada' && (
                <div className="flex justify-between text-gray-600">
                  <span>Taxa de entrega:</span>
                  <span>+R$ {(selectedDelivery === 'envio' ? storeConfig.delivery_fee_envio || 0 : storeConfig.delivery_fee_condicional || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-blue-600">
                  R$ {(cartTotal + (selectedDelivery === 'retirada' ? 0 : selectedDelivery === 'envio' ? storeConfig.delivery_fee_envio || 0 : storeConfig.delivery_fee_condicional || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
