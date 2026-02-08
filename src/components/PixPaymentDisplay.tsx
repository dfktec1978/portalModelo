"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Copy, CheckCircle } from 'lucide-react'

type PixPaymentDisplayProps = {
  orderId: string
  pixQrCode: string
  pixQrCodeUrl: string
  pixCopyPaste: string
  amount: number
  storePixKey: string
  expiresAt: Date
  onPaymentConfirmedAction?: () => void
  onCancelAction?: () => void
}

export default function PixPaymentDisplay({
  orderId,
  pixQrCode,
  pixQrCodeUrl,
  pixCopyPaste,
  amount,
  storePixKey,
  expiresAt,
  onPaymentConfirmedAction,
  onCancelAction
}: PixPaymentDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)

  // Countdown para expiração
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const expireTime = new Date(expiresAt).getTime()
      const difference = expireTime - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft('Expirado')
        clearInterval(timer)
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white/10 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">📱 Pix</h2>
          <p className="text-blue-100">Escaneie o código QR com seu banco</p>
        </div>

        {/* Conteúdo */}
        <div className="p-8 space-y-6 text-center">
          {/* QR Code */}
          {pixQrCodeUrl && (
            <div className="bg-white p-4 rounded-lg inline-block">
              <Image
                src={pixQrCodeUrl}
                alt="QR Code Pix"
                width={280}
                height={280}
                className="w-72 h-72 object-contain"
              />
            </div>
          )}

          {/* Valor */}
          <div className="bg-white/10 rounded-lg p-4 text-white">
            <p className="text-sm text-blue-100 mb-1">Valor a pagar:</p>
            <p className="text-4xl font-bold">R$ {amount.toFixed(2)}</p>
          </div>

          {/* Copy-Paste */}
          <div className="space-y-2">
            <p className="text-sm text-blue-100">Ou copie e cole:</p>
            <div className="bg-white/10 rounded-lg p-4 break-all">
              <p className="text-xs text-white font-mono mb-3 line-clamp-3">{pixCopyPaste}</p>
              <button
                onClick={handleCopyPixKey}
                className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle size={20} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copiar Código
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-white/10 rounded-lg p-4 text-left text-white text-sm space-y-2">
            <p className="font-semibold text-blue-100">Como pagar:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-50">
              <li>Abra seu banco no celular</li>
              <li>Escolha a opção &quot;Pix&quot;</li>
              <li>Escaneie o QR Code acima</li>
              <li>Confirme o pagamento</li>
            </ol>
          </div>

          {/* Status */}
          <div className="bg-white/20 rounded-lg p-3 text-white">
            <p className="text-xs text-blue-100 mb-1">Código válido por:</p>
            <p className={`text-lg font-bold ${isExpired ? 'text-red-300' : 'text-green-300'}`}>
              {isExpired ? '❌ Expirado' : `⏱️ ${timeLeft}`}
            </p>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
            <p className="text-xs font-semibold text-amber-900 mb-1">💡 Dica:</p>
            <p className="text-sm text-amber-800">
              O pagamento é processado em segundos. Assim que confirmar, receberá uma notificação de confirmação.
            </p>
          </div>

          {/* Número do Pedido */}
          <div className="text-xs text-blue-200">
            <p>Pedido: <span className="font-mono font-semibold text-white">{orderId}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/10 p-4 flex gap-3">
          {onCancelAction && (
            <button
              onClick={onCancelAction}
              className="flex-1 bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition-colors"
            >
              Cancelar
            </button>
          )}
          {onPaymentConfirmedAction && (
            <button
              onClick={onPaymentConfirmedAction}
              className="flex-1 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              ✓ Já paguei
            </button>
          )}
        </div>
      </div>

      {/* Aviso de Suporte */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-600">
        <p>Dúvidas? Entre em contato pelo <span className="font-semibold">WhatsApp</span></p>
      </div>
    </div>
  )
}
