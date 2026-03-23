/**
 * Hook para gerenciar fluxo de checkout
 * Integra: Cart → Delivery Selection → Payment Selection → Confirmação
 */

import { useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

type CheckoutStep = 'cart' | 'delivery' | 'payment' | 'pix' | 'confirmed'

type DeliveryData = {
  type: 'retirada' | 'envio' | 'condicional'
  date: Date
  address?: string
  fee: number
}

type PaymentData = {
  method: 'pix' | 'na_retirada'
  storePixKey?: string
}

type OrderData = {
  id: string
  store_id: string
  client_name: string
  client_email: string
  client_phone: string
  items: any[]
  subtotal: number
  delivery_fee: number
  total: number
  delivery_type: string
  delivery_date: string
  delivery_address?: string
  payment_method: string
  payment_status: string
  pix_qr_code?: string
  pix_qr_code_url?: string
  pix_copy_paste?: string
}

export function useCheckout() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart')
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goToDelivery = useCallback(() => {
    setCurrentStep('delivery')
    setError(null)
  }, [])

  const handleDeliverySelect = useCallback((delivery: DeliveryData) => {
    setDeliveryData(delivery)
    setCurrentStep('payment')
    setError(null)
  }, [])

  const handlePaymentSelect = useCallback((payment: PaymentData) => {
    setPaymentData(payment)
    if (payment.method === 'pix') {
      setCurrentStep('pix')
    } else {
      setCurrentStep('confirmed')
    }
    setError(null)
  }, [])

  const createOrder = useCallback(
    async (
      storeId: string,
      cartItems: any[],
      cartTotal: number,
      clientData: {
        name: string
        email: string
        phone: string
      },
      paymentOverride?: PaymentData,
      deliveryOverride?: DeliveryData,
      storeCategory?: string
    ) => {
      try {
        setLoading(true)
        setError(null)

        const effectivePayment = paymentOverride || paymentData
        const effectiveDelivery = deliveryOverride || deliveryData

        if (!effectiveDelivery || !effectivePayment) {
          throw new Error('Dados de entrega e pagamento não preenchidos')
        }

        // Calcular totais
        const subtotal = cartTotal - effectiveDelivery.fee
        const total = cartTotal

        const { data: authData } = await supabase.auth.getUser()
        const userId = authData?.user?.id || null

        const mappedDeliveryType = effectiveDelivery.type === 'retirada' ? 'pickup' : 'delivery'
        const mappedPaymentMethod = effectivePayment.method === 'na_retirada' ? 'cash' : 'pix'

        const orderCustomerSchema: any = {
          store_id: storeId,
          customer_id: userId,
          customer_name: clientData.name,
          customer_email: clientData.email,
          customer_phone: clientData.phone,
          items: cartItems,
          subtotal,
          delivery_fee: effectiveDelivery.fee,
          total,
          delivery_type: mappedDeliveryType,
          delivery_address: effectiveDelivery.address,
          payment_method: mappedPaymentMethod,
          payment_status: 'pending',
          notes: `Pedido criado em ${new Date().toLocaleString('pt-BR')}`
        }

        const orderClientSchema: any = {
          store_id: storeId,
          user_id: userId,
          client_name: clientData.name,
          client_email: clientData.email,
          client_phone: clientData.phone,
          items: cartItems,
          subtotal,
          delivery_fee: effectiveDelivery.fee,
          total,
          delivery_type: effectiveDelivery.type,
          delivery_date: effectiveDelivery.date.toISOString(),
          delivery_address: effectiveDelivery.address,
          payment_method: effectivePayment.method,
          payment_status: 'pendente',
          notes: `Pedido criado em ${new Date().toLocaleString('pt-BR')}`
        }

        const isRetail = storeCategory === 'varejo'

        const ensureStockAvailability = async () => {
          if (!isRetail) return

          for (const item of cartItems) {
            const qty = item.quantity || 1
            const productId = item.product_id || item.id
            const usesVariants = !!item.has_variants || !!item.variant?.sku || (!!item.variant?.color && !!item.variant?.size)

            if (usesVariants) {
              if (!item.variant?.sku && !(item.variant?.color && item.variant?.size)) {
                throw new Error('Selecione cor e tamanho para continuar')
              }
              const variantQuery = supabase
                .from('product_variants')
                .select('id, stock_quantity')
                .eq('product_id', productId)

              const { data: variantData, error: variantError } = await (item.variant?.sku
                ? variantQuery.eq('sku', item.variant.sku)
                : variantQuery
                    .eq('color', item.variant.color)
                    .eq('size', item.variant.size)
              ).single()

              if (variantError || !variantData) {
                throw new Error('Variação sem estoque disponível')
              }

              if ((variantData.stock_quantity || 0) < qty) {
                throw new Error('Estoque insuficiente para a variação selecionada')
              }

              continue
            }

            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('stock')
              .eq('id', productId)
              .single()

            if (productError || !productData) {
              throw new Error('Produto sem estoque disponível')
            }

            if (productData.stock === null || productData.stock === undefined) {
              continue
            }

            const currentStock = productData.stock ?? 0
            if (currentStock < qty) {
              throw new Error('Estoque insuficiente para o produto selecionado')
            }
          }
        }

        await ensureStockAvailability()

        let data: any = null
        let dbError: any = null

        const customerAttempt = await supabase
          .from('orders')
          .insert([orderCustomerSchema])
          .select()
          .single()

        data = customerAttempt.data
        dbError = customerAttempt.error

        if (dbError && dbError.code === 'PGRST204') {
          const clientAttempt = await supabase
            .from('orders')
            .insert([orderClientSchema])
            .select()
            .single()

          data = clientAttempt.data
          dbError = clientAttempt.error
        }

        if (dbError) throw dbError

        const decrementStock = async () => {
          if (!isRetail) return

          const updates = cartItems.map(async (item: any) => {
            const qty = item.quantity || 1
            const usesVariants = !!item.has_variants || !!item.variant?.sku || (!!item.variant?.color && !!item.variant?.size)

            if (usesVariants) {
              if (!item.variant?.sku && !(item.variant?.color && item.variant?.size)) {
                console.warn('Variação não selecionada para baixa de estoque')
                return
              }
              const variantQuery = supabase
                .from('product_variants')
                .select('id, stock_quantity')
                .eq('product_id', item.product_id || item.id)

              const { data: variantData, error: variantError } = await (item.variant?.sku
                ? variantQuery.eq('sku', item.variant.sku)
                : variantQuery
                    .eq('color', item.variant.color)
                    .eq('size', item.variant.size)
              ).single()

              if (variantError || !variantData) {
                console.warn('Não foi possível localizar variação para baixa de estoque:', variantError)
                return
              }

              const nextStock = Math.max(0, (variantData.stock_quantity || 0) - qty)

              const { error: updateVariantError } = await supabase
                .from('product_variants')
                .update({ stock_quantity: nextStock })
                .eq('id', variantData.id)

              if (updateVariantError) {
                console.warn('Erro ao atualizar estoque da variação:', updateVariantError)
              }

              return
            }

            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('id, stock')
              .eq('id', item.product_id || item.id)
              .single()

            if (productError || !productData) {
              console.warn('Não foi possível localizar produto para baixa de estoque:', productError)
              return
            }

            if (productData.stock === null || productData.stock === undefined) {
              return
            }

            const currentStock = productData.stock ?? 0
            const nextStock = Math.max(0, currentStock - qty)

            const { error: updateProductError } = await supabase
              .from('products')
              .update({ stock: nextStock })
              .eq('id', productData.id)

            if (updateProductError) {
              console.warn('Erro ao atualizar estoque do produto:', updateProductError)
            }
          })

          await Promise.all(updates)
        }

        await decrementStock()

        // Se Pix, gerar QR Code
        if (effectivePayment.method === 'pix' && effectivePayment.storePixKey) {
          try {
            const pixResponse = await fetch('/api/pix/charge', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.id,
                storeId,
                amount: total,
                storePixKey: effectivePayment.storePixKey,
                customerName: clientData.name,
                customerEmail: clientData.email,
              }),
            })

            if (!pixResponse.ok) {
              const errorBody = await pixResponse.text()
              throw new Error(errorBody || 'Falha ao criar cobrança Pix via API')
            }

            const pixJson = await pixResponse.json()
            const charge = pixJson?.charge

            data.pix_qr_code = charge?.pixQrCode || data.pix_qr_code
            data.pix_qr_code_url = charge?.pixQrCodeUrl || data.pix_qr_code_url
            data.pix_copy_paste = charge?.pixCopyPaste || data.pix_copy_paste
          } catch (pixApiError) {
            console.warn('Falha na API Pix, aplicando fallback manual:', pixApiError)

            const { generatePixQrCode } = await import('./pixService')
            const pixData = generatePixQrCode(
              effectivePayment.storePixKey,
              total,
              data.id
            )

            const { error: updateError } = await supabase
              .from('orders')
              .update({
                pix_qr_code: pixData.pixQrCode,
                pix_copy_paste: pixData.pixCopyPaste
              })
              .eq('id', data.id)

            if (updateError && updateError.code !== 'PGRST204') throw updateError

            data.pix_qr_code = pixData.pixQrCode
            data.pix_copy_paste = pixData.pixCopyPaste
          }
        }

        setOrderData(data)
        setCurrentStep(effectivePayment.method === 'pix' ? 'pix' : 'confirmed')

        return data
      } catch (err: any) {
        const errorMsg = err?.message || 'Erro ao criar pedido'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [deliveryData, paymentData]
  )

  const goBack = useCallback(() => {
    if (currentStep === 'payment') {
      setCurrentStep('delivery')
    } else if (currentStep === 'delivery') {
      setCurrentStep('cart')
    } else if (currentStep === 'pix') {
      setCurrentStep('payment')
    }
    setError(null)
  }, [currentStep])

  const resetCheckout = useCallback(() => {
    setCurrentStep('cart')
    setDeliveryData(null)
    setPaymentData(null)
    setOrderData(null)
    setError(null)
  }, [])

  return {
    // Estado
    currentStep,
    deliveryData,
    paymentData,
    orderData,
    loading,
    error,

    // Ações
    goToDelivery,
    handleDeliverySelect,
    handlePaymentSelect,
    createOrder,
    goBack,
    resetCheckout
  }
}
