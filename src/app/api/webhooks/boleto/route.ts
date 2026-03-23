import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

type BoletoWebhookPayload = {
  providerChargeId?: string
  provider_charge_id?: string
  chargeId?: string
  charge_id?: string
  invoiceId?: string
  invoice_id?: string
  status?: string
  paidAt?: string
  paid_at?: string
  data?: {
    id?: string
    charge_id?: string
    status?: string
    paid_at?: string
  }
}

function getConfiguredSecret() {
  return process.env.BILLING_WEBHOOK_SECRET || process.env.PIX_WEBHOOK_SECRET || null
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = getConfiguredSecret()
  if (!configuredSecret) return true

  const headerSecret = request.headers.get('x-webhook-secret')
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null

  return headerSecret === configuredSecret || bearer === configuredSecret
}

function normalizeBillingStatus(status?: string) {
  const value = (status || '').toLowerCase().trim()

  if (['paid', 'approved', 'confirmed', 'recebido', 'liquidado', 'settled'].includes(value)) {
    return 'paid'
  }

  if (['expired', 'expirado', 'vencido'].includes(value)) {
    return 'expired'
  }

  if (['canceled', 'cancelled', 'cancelado'].includes(value)) {
    return 'canceled'
  }

  return 'pending'
}

function extractProviderChargeId(payload: BoletoWebhookPayload) {
  return (
    payload.providerChargeId ||
    payload.provider_charge_id ||
    payload.chargeId ||
    payload.charge_id ||
    payload.data?.charge_id ||
    payload.data?.id ||
    null
  )
}

function extractInvoiceId(payload: BoletoWebhookPayload) {
  return payload.invoiceId || payload.invoice_id || null
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Webhook não autorizado' }, { status: 401 })
    }

    const payload = (await request.json()) as BoletoWebhookPayload

    const providerChargeId = extractProviderChargeId(payload)
    const invoiceId = extractInvoiceId(payload)
    const normalizedStatus = normalizeBillingStatus(payload.status || payload.data?.status)
    const paidAtSource = payload.paidAt || payload.paid_at || payload.data?.paid_at || null
    const paidAt = normalizedStatus === 'paid' ? (paidAtSource || new Date().toISOString()) : null

    if (!providerChargeId && !invoiceId) {
      return NextResponse.json(
        { error: 'Payload inválido: providerChargeId/chargeId ou invoiceId é obrigatório' },
        { status: 400 },
      )
    }

    let query = supabaseAdmin
      .from('monthly_billing_invoices')
      .select('id, status, provider_charge_id, paid_at')

    if (providerChargeId) {
      query = query.eq('provider_charge_id', providerChargeId)
    } else if (invoiceId) {
      query = query.eq('id', invoiceId)
    }

    const { data: found, error: findError } = await query.maybeSingle()
    if (findError) {
      throw new Error(findError.message)
    }

    if (!found) {
      return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })
    }

    const updatePayload: Record<string, unknown> = {
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    }

    if (normalizedStatus === 'paid') {
      updatePayload.paid_at = paidAt
    }

    const { error: updateError } = await supabaseAdmin
      .from('monthly_billing_invoices')
      .update(updatePayload)
      .eq('id', found.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return NextResponse.json({
      ok: true,
      invoiceId: found.id,
      providerChargeId: providerChargeId || found.provider_charge_id || null,
      status: normalizedStatus,
      paidAt: normalizedStatus === 'paid' ? paidAt : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro no webhook de boleto' },
      { status: 500 },
    )
  }
}
