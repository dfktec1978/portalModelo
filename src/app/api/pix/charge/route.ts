import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { createPixCharge } from '@/lib/pixChargeService'
import { createEfiPixCharge, type EfiCredentials } from '@/lib/efiPayService'

type ChargePayload = {
  orderId: string
  storeId: string
  amount: number
  storePixKey: string
  storeName?: string
  customerName?: string
  customerEmail?: string
}

function isMissing(payload: ChargePayload) {
  return !payload.orderId || !payload.storeId || !payload.amount || !payload.storePixKey
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ChargePayload

    if (isMissing(payload)) {
      return NextResponse.json(
        { error: 'orderId, storeId, amount e storePixKey são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, store_id, total')
      .eq('id', payload.orderId)
      .eq('store_id', payload.storeId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado para cobrança Pix' }, { status: 404 })
    }

    // Tentar usar credenciais Efí Pay do lojista (dinheiro vai direto para a conta dele)
    let charge: {
      provider: string
      transactionId: string
      pixQrCode: string
      pixQrCodeUrl: string
      pixCopyPaste: string
      expiresAt: string
    }

    const { data: efiCreds } = await supabaseAdmin
      .from('store_payment_credentials')
      .select('efi_client_id, efi_client_secret, efi_certificate_b64, efi_sandbox')
      .eq('store_id', payload.storeId)
      .maybeSingle()

    const hasEfiCreds =
      efiCreds?.efi_client_id &&
      efiCreds?.efi_client_secret &&
      efiCreds?.efi_certificate_b64

    if (hasEfiCreds) {
      try {
        const creds: EfiCredentials = {
          clientId:       efiCreds!.efi_client_id,
          clientSecret:   efiCreds!.efi_client_secret,
          certificateB64: efiCreds!.efi_certificate_b64,
          sandbox:        efiCreds!.efi_sandbox ?? true,
        }
        const efiCharge = await createEfiPixCharge(creds, {
          orderId:      payload.orderId,
          amount:       payload.amount,
          pixKey:       payload.storePixKey,
          description:  payload.storeName ? `Pedido em ${payload.storeName}` : undefined,
        })
        charge = {
          provider:      'efi',
          transactionId: efiCharge.txid,
          pixQrCode:     efiCharge.pixCopyPaste,
          pixQrCodeUrl:  efiCharge.qrCodeImage,
          pixCopyPaste:  efiCharge.pixCopyPaste,
          expiresAt:     efiCharge.expiresAt,
        }
      } catch (efiError) {
        console.error('[pix/charge] Falha Efí Pay, usando Pix manual como fallback:', efiError)
        charge = await createPixCharge({
          orderId:      payload.orderId,
          amount:       payload.amount,
          storePixKey:  payload.storePixKey,
          storeName:    payload.storeName,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
        })
      }
    } else {
      // Sem credenciais Efí: usar Pix manual (EMV estático)
      charge = await createPixCharge({
        orderId:      payload.orderId,
        amount:       payload.amount,
        storePixKey:  payload.storePixKey,
        storeName:    payload.storeName,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
      })
    }

    const orderUpdate = {
      payment_method: 'pix',
      payment_status: 'pending',
      pix_qr_code: charge.pixQrCode,
      pix_qr_code_url: charge.pixQrCodeUrl,
      pix_copy_paste: charge.pixCopyPaste,
      payment_confirmed_at: null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update(orderUpdate)
      .eq('id', payload.orderId)

    if (updateOrderError && updateOrderError.code !== 'PGRST204') {
      return NextResponse.json(
        { error: `Falha ao atualizar pedido com cobrança Pix: ${updateOrderError.message}` },
        { status: 500 }
      )
    }

    const transactionPayload = {
      order_id: payload.orderId,
      store_id: payload.storeId,
      transaction_id: charge.transactionId,
      pix_key: payload.storePixKey,
      amount: payload.amount,
      status: 'pendente',
      qr_code: charge.pixQrCode,
      qr_code_url: charge.pixQrCodeUrl,
      copy_paste: charge.pixCopyPaste,
      expires_at: charge.expiresAt,
      updated_at: new Date().toISOString(),
    }

    const { error: transactionError } = await supabaseAdmin
      .from('pix_transactions')
      .upsert([transactionPayload], { onConflict: 'transaction_id' })

    if (transactionError && transactionError.code !== 'PGRST204') {
      console.warn('Falha ao salvar pix_transactions (seguindo sem bloquear checkout):', transactionError.message)
    }

    return NextResponse.json({
      ok: true,
      charge: {
        provider: charge.provider,
        transactionId: charge.transactionId,
        pixQrCode: charge.pixQrCode,
        pixQrCodeUrl: charge.pixQrCodeUrl,
        pixCopyPaste: charge.pixCopyPaste,
        expiresAt: charge.expiresAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao criar cobrança Pix' },
      { status: 500 }
    )
  }
}
