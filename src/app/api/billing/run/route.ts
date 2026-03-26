import { NextRequest, NextResponse } from 'next/server'
import {
  cancelExcludedTestStoreInvoices,
  ensureCurrentMonthInvoices,
  processFiveDaysReminders,
} from '@/lib/monthlyBillingService'

function isAuthorized(request: NextRequest) {
  const secret = process.env.BILLING_CRON_SECRET
  // CRON_SECRET é a variável nativa do Vercel — injetada automaticamente nos cron jobs
  const vercelCronSecret = process.env.CRON_SECRET

  if (!secret && !vercelCronSecret) return false

  const headerSecret = request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null

  const validBilling = !!secret && (headerSecret === secret || bearer === secret)
  const validVercel = !!vercelCronSecret && bearer === vercelCronSecret

  return validBilling || validVercel
}

async function resolveDryRun(request: NextRequest) {
  const dryRunParam = request.nextUrl.searchParams.get('dryRun')
  if (dryRunParam) {
    const normalized = dryRunParam.toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      const body = await request.json()
      return body?.dryRun === true
    } catch {
      return false
    }
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const now = new Date()
    const dryRun = await resolveDryRun(request)

    const canceledTestInvoices = await cancelExcludedTestStoreInvoices({ dryRun })
    const ensured = await ensureCurrentMonthInvoices(now, { dryRun })
    const reminders = await processFiveDaysReminders(now, { dryRun })

    return NextResponse.json({
      ok: true,
      runAt: now.toISOString(),
      dryRun,
      canceledTestInvoices,
      ensured,
      reminders,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro no job de cobrança mensal' },
      { status: 500 },
    )
  }
}
