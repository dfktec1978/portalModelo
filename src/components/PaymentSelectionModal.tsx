"use client"

import { useState } from 'react'
import { X } from 'lucide-react'

type PaymentMethod = 'pix' | 'na_retirada'

type PaymentSelectionModalProps = {
  isOpen: boolean
  onCloseAction: () => void
  onSelectAction: (payment: {
    method: PaymentMethod
    storePixKey?: string
  }) => void
  storeConfig: {
    payment_options: {
      pix: boolean
      na_retirada: boolean
    }
    pix_key?: string
  }
  delivery: {
    type: 'retirada' | 'envio' | 'condicional'
    date: Date
    address?: string
  }
  total: number
}

export default function PaymentSelectionModal({
  isOpen,
  onCloseAction,
  onSelectAction,
  storeConfig,
  delivery,
  total
}: PaymentSelectionModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('pix')
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      alert('Você precisa concordar com os termos')
      return
    }

    onSelectAction({
      method: selectedPayment,
      storePixKey: storeConfig.pix_key
    })
  }

  if (!isOpen) return null

  const availablePayments = storeConfig.payment_options

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Forma de Pagamento</h2>
          <button
            onClick={onCloseAction}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Resumo do Pedido */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-xs font-semibold text-blue-900 uppercase mb-2">Resumo do Pedido</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-blue-700">
                <span>Tipo de entrega:</span>
                <span className="font-semibold">
                  {delivery.type === 'retirada' && '🏪 Retirada'}
                  {delivery.type === 'envio' && '🚚 Envio a Domicílio'}
                  {delivery.type === 'condicional' && '📦 Entrega Especial'}
                </span>
              </div>
              {delivery.type !== 'retirada' && delivery.address && (
                <div className="flex justify-between text-blue-700 text-xs">
                  <span>Endereço:</span>
                  <span className="text-right max-w-xs">{delivery.address.substring(0, 30)}...</span>
                </div>
              )}
              <div className="flex justify-between text-blue-700">
                <span>Data:</span>
                <span>{new Date(delivery.date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Opções de Pagamento */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Escolha a forma de pagamento
            </h3>

            {/* Pix */}
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
                    Receba um código QR para escanear com seu banco
                  </div>
                  {selectedPayment === 'pix' && (
                    <div className={`text-xs mt-2 p-2 rounded ${selectedPayment === 'pix' ? 'bg-white/20' : 'bg-blue-50'}`}>
                      <p className={selectedPayment === 'pix' ? 'text-white' : 'text-blue-600'}>
                        ✓ Pagamento imediato<br/>
                        ✓ Receba confirmação em segundos
                      </p>
                    </div>
                  )}
                </div>
              </label>
            )}

            {/* Pagar na Retirada/Entrega */}
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
                    💵 Pagar na {delivery.type === 'retirada' ? 'Retirada' : 'Entrega'}
                  </div>
                  <div className={`text-sm ${selectedPayment === 'na_retirada' ? 'text-gray-100' : 'text-gray-600'}`}>
                    Pague em dinheiro, débito ou crédito
                  </div>
                  {selectedPayment === 'na_retirada' && (
                    <div className={`text-xs mt-2 p-2 rounded ${selectedPayment === 'na_retirada' ? 'bg-white/20' : 'bg-amber-50'}`}>
                      <p className={selectedPayment === 'na_retirada' ? 'text-white' : 'text-amber-700'}>
                        ✓ Múltiplas formas de pagamento<br/>
                        ✓ Pague quando receber seu pedido
                      </p>
                    </div>
                  )}
                </div>
              </label>
            )}
          </div>

          {/* Aviso importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Importante:</p>
            <p className="text-sm text-amber-800">
              {selectedPayment === 'pix' 
                ? 'Você receberá um código QR. Escaneie com seu banco para confirmar o pagamento.'
                : 'Reservaremos seu pedido até a data de entrega. Pagamento necessário na entrega.'}
            </p>
          </div>

          {/* Termos */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-1 accent-blue-600"
            />
            <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
              Li e concordo com os <span className="font-semibold text-blue-600">termos de compra</span> e <span className="font-semibold text-blue-600">política de privacidade</span>
            </label>
          </div>

          {/* Resumo Final */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Valor Total</div>
            <div className="text-3xl font-bold text-blue-600">
              R$ {total.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {selectedPayment === 'pix' 
                ? 'Clique em confirmar para gerar o QR Code'
                : 'Confirme aqui, pague na ' + (delivery.type === 'retirada' ? 'retirada' : 'entrega')}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={!agreed}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
