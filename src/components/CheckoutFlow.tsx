"use client"

import { useState, useEffect } from 'react'
import { useCheckout } from '@/lib/useCheckout'
import PixPaymentDisplay from './PixPaymentDisplay'
import CheckoutOptionsModal from './CheckoutOptionsModal'
import { supabase } from '@/lib/supabaseClient'

type CheckoutFlowProps = {
  storeId: string
  cartItems: any[]
  cartTotal: number
  onCheckoutCompleteAction?: (orderId: string) => void
  onCheckoutCancelAction?: () => void
  onUpdateCartQuantityAction?: (cartId: number, nextQty: number) => void
  onRemoveCartItemAction?: (cartId: number) => void
}

export default function CheckoutFlow({
  storeId,
  cartItems,
  cartTotal,
  onCheckoutCompleteAction,
  onCheckoutCancelAction,
  onUpdateCartQuantityAction,
  onRemoveCartItemAction
}: CheckoutFlowProps) {
  const checkout = useCheckout()
  const [storeConfig, setStoreConfig] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [pixData, setPixData] = useState<any>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [isProcessingOptions, setIsProcessingOptions] = useState(false)

  const normalizeStoreConfig = (data: any) => {
    const deliveryOptions = data?.delivery_options
    const paymentOptions = data?.payment_options

    const normalizedDelivery = Array.isArray(deliveryOptions)
      ? {
          retirada: deliveryOptions.includes('retirada'),
          envio: deliveryOptions.includes('envio'),
          condicional: deliveryOptions.includes('condicional')
        }
      : typeof deliveryOptions === 'object'
        ? {
            retirada: !!deliveryOptions.retirada,
            envio: !!deliveryOptions.envio,
            condicional: !!deliveryOptions.condicional
          }
        : { retirada: true, envio: true, condicional: true }

    const normalizedPayment = Array.isArray(paymentOptions)
      ? {
          pix: paymentOptions.includes('pix'),
          na_retirada: paymentOptions.includes('na_retirada')
        }
      : typeof paymentOptions === 'object'
        ? {
            pix: !!paymentOptions.pix,
            na_retirada: !!paymentOptions.na_retirada
          }
        : { pix: true, na_retirada: true }

    return {
      id: data?.id || storeId,
      store_name: data?.store_name || 'Loja',
      category: data?.category || 'varejo',
      delivery_options: normalizedDelivery,
      delivery_fee_envio: data?.delivery_fee_envio || 0,
      delivery_fee_condicional: data?.delivery_fee_condicional || 0,
      payment_options: normalizedPayment,
      pix_key: data?.pix_key || null,
      min_order_delivery: data?.min_order_delivery || 0,
      schedule_delivery: data?.schedule_delivery || null,
      delivery_instructions: data?.delivery_instructions || null
    }
  }

  // Carregar configurações da loja
  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()

        if (error) {
          console.warn(`Aviso ao carregar loja: ${error.message}. Usando configurações padrão.`)
          setConfigError(`Usando valores padrão: ${error.message}`)
          setStoreConfig(normalizeStoreConfig(null))
        } else if (!data) {
          console.warn('Nenhuma loja encontrada. Usando configurações padrão.')
          setConfigError('Loja não encontrada. Usando valores padrão.')
          setStoreConfig(normalizeStoreConfig(null))
        } else {
          setStoreConfig(normalizeStoreConfig(data))
          setConfigError(null)
        }
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error('Erro ao carregar configurações da loja:', errorMessage)
        setConfigError(errorMessage)
        setStoreConfig(normalizeStoreConfig(null))
      } finally {
        setLoadingConfig(false)
      }
    }

    if (storeId) fetchStoreConfig()
  }, [storeId])

  useEffect(() => {
    if (!loadingConfig) {
      setShowOptionsModal(true)
    }
  }, [loadingConfig])

  const handleOptionsConfirm = async (data: { delivery: any; payment: any; clientData: any }) => {
    if (isProcessingOptions) return
    try {
      setIsProcessingOptions(true)
      setOptionsError(null)
      const { delivery, payment, clientData: confirmedClient } = data

      setClientData(confirmedClient)

      checkout.handleDeliverySelect(delivery)

      const orderData = await checkout.createOrder(
        storeId,
        cartItems,
        cartTotal,
        confirmedClient,
        payment,
        delivery,
        storeConfig?.category
      )

      setShowOptionsModal(false)

      // Se for Pix, preparar dados de QR code
      if (payment.method === 'pix' && orderData) {
        // O hook já gerou o QR code, agora vamos preparar os dados para exibição
        setPixData({
          orderId: orderData.id,
          amount: cartTotal,
          storePixKey: payment.storePixKey,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        })
      }

      checkout.handlePaymentSelect(payment)

      if (payment.method === 'na_retirada') {
        // Se for retirada, ir direto para confirmação
        setTimeout(() => {
          if (onCheckoutCompleteAction) {
            onCheckoutCompleteAction(orderData.id)
          }
        }, 1000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err) || 'Erro ao processar pagamento'
      console.error('Erro ao processar pagamento:', errorMessage)
      setOptionsError(errorMessage)
    } finally {
      setIsProcessingOptions(false)
    }
  }

  const handlePixConfirmed = () => {
    if (onCheckoutCompleteAction && checkout.orderData?.id) {
      onCheckoutCompleteAction(checkout.orderData.id)
    }
  }

  const handleCancel = () => {
    setShowOptionsModal(false)
    checkout.resetCheckout()
    if (onCheckoutCancelAction) {
      onCheckoutCancelAction()
    }
  }

  if (loadingConfig) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações da loja...</p>
        </div>
      </div>
    )
  }

  // Se houver erro, continuar com fallback

  if (showOptionsModal) {
    return (
      <CheckoutOptionsModal
        isOpen={true}
        onCloseAction={handleCancel}
        onConfirmAction={handleOptionsConfirm}
        storeConfig={storeConfig}
        cartItems={cartItems}
        cartTotal={cartTotal}
        errorMessage={optionsError}
        isSubmitting={isProcessingOptions}
        onUpdateQuantityAction={onUpdateCartQuantityAction}
        onRemoveItemAction={onRemoveCartItemAction}
      />
    )
  }

  // Fluxo agora inicia direto na confirmação de dados

  // Estado: Seleção de Entrega/Pagamento agora é unificado no CheckoutOptionsModal

  // Estado: Exibição de QR Code Pix
  if (checkout.currentStep === 'pix' && checkout.orderData && pixData) {
    return (
      <PixPaymentDisplay
        orderId={checkout.orderData.id}
        pixQrCode={checkout.orderData.pix_qr_code || ''}
        pixQrCodeUrl={checkout.orderData.pix_qr_code || ''}
        pixCopyPaste={checkout.orderData.pix_copy_paste || ''}
        amount={cartTotal}
        storePixKey={storeConfig.pix_key}
        expiresAt={pixData.expiresAt}
        onPaymentConfirmedAction={handlePixConfirmed}
        onCancelAction={handleCancel}
      />
    )
  }

  // Estado: Confirmação
  if (checkout.currentStep === 'confirmed' && checkout.orderData) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Pedido Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Seu pedido #<strong>{checkout.orderData.id.substring(0, 8).toUpperCase()}</strong> foi criado com sucesso.
          </p>

          {checkout.deliveryData && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left space-y-2 text-sm">
              <p>
                <strong>Entrega:</strong>{' '}
                {checkout.deliveryData.type === 'retirada'
                  ? 'Retirada'
                  : checkout.deliveryData.type === 'envio'
                    ? 'Envio a Domicílio'
                    : 'Condicional (Retirar na loja)'}
              </p>
              <p>
                <strong>Data:</strong> {new Date(checkout.deliveryData.date).toLocaleDateString('pt-BR')}
              </p>
              {checkout.deliveryData.address && (
                <p>
                  <strong>Endereço:</strong> {checkout.deliveryData.address}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (onCheckoutCompleteAction && checkout.orderData?.id) {
                onCheckoutCompleteAction(checkout.orderData.id)
              }
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Voltar à Loja
          </button>
        </div>
      </div>
    )
  }

  return null
}
