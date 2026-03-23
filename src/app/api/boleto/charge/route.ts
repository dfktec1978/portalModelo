/**
 * POST /api/boleto/charge
 *
 * Gera um boleto bancário usando as credenciais Efí Pay do lojista.
 * O boleto é emitido em nome da conta Efí Pay do próprio lojista.
 *
 * REQUISITO: CPF ou CNPJ do cliente (obrigação do Banco Central para boletos)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabaseServer'
import { createEfiBoletoCharge }     from '@/lib/efiPayService'

type BoletoPayload = {
  orderId:    string
  storeId:    string
  amount:     number
  storeName?: string
  customer: {
    name:   string
    cpf?:   string
    cnpj?:  string
    email?: string
    phone?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as BoletoPayload

    if (!payload.orderId || !payload.storeId || !payload.amount || !payload.customer?.name) {
      return NextResponse.json(
        { error: 'orderId, storeId, amount e customer.name são obrigatórios' },
        { status: 400 },
      )
    }

    if (!payload.customer.cpf && !payload.customer.cnpj) {
      return NextResponse.json(
        { error: 'CPF ou CNPJ do cliente é obrigatório para boleto bancário' },
        { status: 400 },
      )
    }

    // Verificar pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, store_id, total')
      .eq('id', payload.orderId)
      .eq('store_id', payload.storeId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Buscar credenciais Efí Pay do lojista
    const { data: efiCreds } = await supabaseAdmin
      .from('store_payment_credentials')
      .select('efi_client_id, efi_client_secret, efi_certificate_b64, efi_sandbox')
      .eq('store_id', payload.storeId)
      .maybeSingle()

    if (!efiCreds?.efi_client_id || !efiCreds?.efi_client_secret) {
      return NextResponse.json(
        { error: 'Loja não possui credenciais Efí Pay configuradas. Cadastre no painel > Pagamentos.' },
        { status: 422 },
      )
    }

    const boleto = await createEfiBoletoCharge(
      {
        clientId:       efiCreds.efi_client_id,
        clientSecret:   efiCreds.efi_client_secret,
        certificateB64: efiCreds.efi_certificate_b64 ?? '',
        sandbox:        efiCreds.efi_sandbox ?? true,
      },
      payload.customer,
      {
        orderId:     payload.orderId,
        amount:      payload.amount,
        description: payload.storeName ? `Pedido em ${payload.storeName}` : 'Pedido Portal Modelo',
      },
    )

    // Atualizar pedido com dados do boleto
    await supabaseAdmin
      .from('orders')
      .update({
        payment_method:        'boleto',
        payment_status:        'pending',
        boleto_barcode:        boleto.barcode,
        boleto_link:           boleto.link,
        boleto_pdf:            boleto.pdf,
        boleto_expires_at:     boleto.expiresAt,
        boleto_charge_id:      String(boleto.chargeId),
        updated_at:            new Date().toISOString(),
      })
      .eq('id', payload.orderId)

    return NextResponse.json({
      ok:     true,
      boleto: {
        chargeId:  boleto.chargeId,
        barcode:   boleto.barcode,
        link:      boleto.link,
        pdf:       boleto.pdf,
        expiresAt: boleto.expiresAt,
      },
    })
  } catch (error: any) {
    console.error('[boleto/charge]', error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao gerar boleto' },
      { status: 500 },
    )
  }
}
