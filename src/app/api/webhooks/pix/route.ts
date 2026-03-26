import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

type PixWebhookPayload = {
  transactionId?: string
  txid?: string
  orderId?: string
  status?: string
  paidAt?: string
  amount?: number
  raw?: unknown
}

function normalizeStatus(status?: string) {
  const value = (status || '').toLowerCase()
  if (['paid', 'approved', 'confirmed', 'recebido', 'concluida', 'concluido'].includes(value)) {
    return {
      transactionStatus: 'recebido',
      orderStatus: 'confirmed',
      paid: true,
    }
  }

  if (['expired', 'expirado', 'canceled', 'cancelled', 'falhou', 'failed'].includes(value)) {
    return {
      transactionStatus: 'expirado',
      orderStatus: 'failed',
      paid: false,
    }
  }

  return {
    transactionStatus: 'pendente',
    orderStatus: 'pending',
    paid: false,
  }
}

async function updateOrderStatus(orderId: string, normalizedOrderStatus: string, paidAt: string | null) {
  const withEnglish = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: normalizedOrderStatus,
      payment_confirmed_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (!withEnglish.error || withEnglish.error.code === 'PGRST204') return

  const ptStatus = normalizedOrderStatus === 'confirmed' ? 'confirmado' : normalizedOrderStatus === 'failed' ? 'falhou' : 'pendente'
  const withPortuguese = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: ptStatus,
      payment_confirmed_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (withPortuguese.error && withPortuguese.error.code !== 'PGRST204') {
    throw new Error(withPortuguese.error.message)
  }
}

function normalizeBillingStatusFromPix(status?: string) {
  const value = (status || '').toLowerCase()
  if (['paid', 'approved', 'confirmed', 'recebido', 'concluida', 'concluido'].includes(value)) {
    return 'paid'
  }
  if (['expired', 'expirado'].includes(value)) {
    return 'expired'
  }
  if (['canceled', 'cancelled', 'cancelado'].includes(value)) {
    return 'canceled'
  }
  return 'pending'
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.PIX_WEBHOOK_SECRET
    if (configuredSecret) {
      const receivedSecret = request.headers.get('x-webhook-secret')
      if (!receivedSecret || receivedSecret !== configuredSecret) {
        return NextResponse.json({ error: 'Webhook não autorizado' }, { status: 401 })
      }
    }

    const payload = (await request.json()) as PixWebhookPayload
    const transactionId = payload.transactionId || payload.txid

    if (!transactionId && !payload.orderId) {
      return NextResponse.json(
        { error: 'Payload inválido: transactionId/txid ou orderId é obrigatório' },
        { status: 400 }
      )
    }

    const normalized = normalizeStatus(payload.status)
    const paidAt = normalized.paid ? payload.paidAt || new Date().toISOString() : null

    if (transactionId) {
      const billingStatus = normalizeBillingStatusFromPix(payload.status)
      const billingUpdate: Record<string, unknown> = {
        status: billingStatus,
        updated_at: new Date().toISOString(),
      }

      if (billingStatus === 'paid') {
        billingUpdate.paid_at = paidAt
      }

      const { data: updatedInvoice, error: billingError } = await supabaseAdmin
        .from('monthly_billing_invoices')
        .update(billingUpdate)
        .eq('provider_charge_id', transactionId)
        .select('id')
        .maybeSingle()

      if (billingError && billingError.code !== 'PGRST116') {
        throw new Error(billingError.message)
      }

      if (updatedInvoice?.id) {
        return NextResponse.json({
          ok: true,
          invoiceId: updatedInvoice.id,
          transactionId,
          status: billingStatus,
        })
      }
    }

    let orderId = payload.orderId || null

    if (transactionId) {
      const txUpdate = await supabaseAdmin
        .from('pix_transactions')
        .update({
          status: normalized.transactionStatus,
          received_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId)
        .select('order_id')
        .maybeSingle()

      if (!orderId) {
        orderId = txUpdate.data?.order_id || null
      }
    }

    if (orderId) {
      await updateOrderStatus(orderId, normalized.orderStatus, paidAt)
    }

    return NextResponse.json({ ok: true, orderId, transactionId: transactionId || null })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro no webhook Pix' }, { status: 500 })
  }
}

// A Efí faz um GET na URL para validar a existência do endpoint antes de registrar o webhook.
// Deve retornar 200 OK.
export async function GET() {
  return NextResponse.json({ ok: true })
}
