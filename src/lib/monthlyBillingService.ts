import { supabaseAdmin } from '@/lib/supabaseServer'
import { createEfiBoletoCharge } from '@/lib/efiPayService'

const PLAN_MONTHLY_PRICE: Record<string, number> = {
  presenca:    0,
  landingpage: 44.9,
  destaque:    89.9,
  premium:     129.9,
}
 
const EXCLUDED_BILLING_SLUGS = new Set(['food', 'lojademo', 'landingpage-demo'])

type BillingJobOptions = {
  dryRun?: boolean
}

type BillingStore = {
  id: string
  owner_id: string | null
  store_name: string | null
  plan: string | null
  slug: string | null
  plan_status: string | null
  billing_enabled: boolean | null
  billing_day: number | null
  billing_email: string | null
  profiles?: {
    email?: string | null
    display_name?: string | null
  } | null
}

type InvoiceRow = {
  id: string
  store_id: string
  owner_id: string | null
  amount: number
  due_date: string
  boleto_link: string | null
  boleto_pdf: string | null
  boleto_barcode: string | null
  provider_charge_id: string | null
  reminder_sent_at: string | null
  reference_month: string
  stores?: {
    slug?: string | null
    store_name?: string | null
    billing_email?: string | null
    profiles?: {
      email?: string | null
      display_name?: string | null
    } | null
  } | null
}

function firstDayOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function dueDateForMonth(baseDate: Date, day: number) {
  const year = baseDate.getUTCFullYear()
  const month = baseDate.getUTCMonth()
  return new Date(Date.UTC(year, month, day))
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getPlanMonthlyPrice(plan?: string | null) {
  return PLAN_MONTHLY_PRICE[(plan || 'presenca').toLowerCase()] ?? 0
}

function shouldBillStore(store: BillingStore) {
  const normalizedSlug = (store.slug || '').trim().toLowerCase()
  if (EXCLUDED_BILLING_SLUGS.has(normalizedSlug)) return false

  const price = getPlanMonthlyPrice(store.plan)
  const active = (store.plan_status || 'active') === 'active'
  const enabled = store.billing_enabled !== false
  return active && enabled && price > 0
}

export async function cancelExcludedTestStoreInvoices(options: BillingJobOptions = {}) {
  const dryRun = options.dryRun === true
  const excludedSlugs = Array.from(EXCLUDED_BILLING_SLUGS)

  const { data: excludedStores, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('id, slug')
    .in('slug', excludedSlugs)

  if (storeError) {
    throw new Error(`Erro ao buscar lojas excluidas: ${storeError.message}`)
  }

  const storeIds = (excludedStores || []).map((s: any) => String(s.id)).filter(Boolean)
  if (storeIds.length === 0) {
    return { excludedStoreCount: 0, canceled: 0 }
  }

  const { data: pendingRows, error: pendingError } = await supabaseAdmin
    .from('monthly_billing_invoices')
    .select('id')
    .in('store_id', storeIds)
    .eq('status', 'pending')

  if (pendingError) {
    throw new Error(`Erro ao listar cobrancas pendentes de teste: ${pendingError.message}`)
  }

  const pendingIds = (pendingRows || []).map((row: any) => String(row.id)).filter(Boolean)
  if (pendingIds.length === 0) {
    return { excludedStoreCount: storeIds.length, canceled: 0, wouldCancel: 0, dryRun }
  }

  if (dryRun) {
    return { excludedStoreCount: storeIds.length, canceled: 0, wouldCancel: pendingIds.length, dryRun }
  }

  const { error: cancelError } = await supabaseAdmin
    .from('monthly_billing_invoices')
    .update({ status: 'canceled' })
    .in('id', pendingIds)

  if (cancelError) {
    throw new Error(`Erro ao cancelar cobrancas de teste: ${cancelError.message}`)
  }

  return { excludedStoreCount: storeIds.length, canceled: pendingIds.length, wouldCancel: pendingIds.length, dryRun }
}

async function sendReminderEmail(input: {
  to: string
  ownerName?: string | null
  storeName?: string | null
  amount: number
  dueDate: string
  boletoLink?: string | null
  boletoPdf?: string | null
  barcode?: string | null
}) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.BILLING_FROM_EMAIL || 'financeiro@portalmodelo.com.br'

  if (!apiKey) {
    console.warn('[monthly-billing] RESEND_API_KEY não configurada; e-mail não enviado')
    return { sent: false, reason: 'missing_resend_key' }
  }

  const owner = input.ownerName || 'Lojista'
  const store = input.storeName || 'sua loja'

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin-bottom: 12px;">Lembrete de Mensalidade - Portal Modelo</h2>
      <p>Olá, ${owner}.</p>
      <p>A mensalidade da loja <strong>${store}</strong> vence em <strong>${input.dueDate}</strong>.</p>
      <p><strong>Valor:</strong> R$ ${input.amount.toFixed(2).replace('.', ',')}</p>
      ${input.boletoLink ? `<p><a href="${input.boletoLink}">Clique aqui para pagar o boleto</a></p>` : ''}
      ${input.boletoPdf ? `<p><a href="${input.boletoPdf}">Baixar PDF do boleto</a></p>` : ''}
      ${input.barcode ? `<p><strong>Código de barras:</strong><br/>${input.barcode}</p>` : ''}
      <p>Este lembrete foi enviado 5 dias antes do vencimento.</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: `Mensalidade Portal Modelo - vencimento ${input.dueDate}`,
      html,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Falha ao enviar e-mail: ${response.status} - ${errBody}`)
  }

  return { sent: true }
}

async function createGlobalBoleto(amount: number, orderId: string, ownerName: string, ownerEmail: string) {
  const provider = (process.env.BILLING_PROVIDER || 'efi').toLowerCase()

  if (provider !== 'efi') {
    throw new Error('BILLING_PROVIDER=inter ainda não implementado; use BILLING_PROVIDER=efi')
  }

  const clientId = process.env.EFI_BILLING_CLIENT_ID
  const clientSecret = process.env.EFI_BILLING_CLIENT_SECRET
  const sandbox = (process.env.EFI_BILLING_SANDBOX || 'true').toLowerCase() === 'true'

  if (!clientId || !clientSecret) {
    throw new Error('EFI_BILLING_CLIENT_ID/EFI_BILLING_CLIENT_SECRET não configurados')
  }

  const cpfFallback = process.env.BILLING_PAYER_CPF_FALLBACK || '11111111111'

  const boleto = await createEfiBoletoCharge(
    {
      clientId,
      clientSecret,
      certificateB64: '',
      sandbox,
    },
    {
      name: ownerName || 'Lojista Portal Modelo',
      email: ownerEmail,
      cpf: cpfFallback,
    },
    {
      orderId,
      amount,
      description: 'Mensalidade Portal Modelo',
      expirationDays: 15,
    },
  )

  return boleto
}

export async function ensureCurrentMonthInvoices(today = new Date(), options: BillingJobOptions = {}) {
  const dryRun = options.dryRun === true
  const monthRef = firstDayOfMonth(today)
  const referenceMonth = toISODate(monthRef)

  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select('id, slug, owner_id, store_name, plan, plan_status, billing_enabled, billing_day, billing_email, profiles:owner_id(email, display_name)')

  if (error) {
    throw new Error(`Erro ao carregar lojas para faturamento: ${error.message}`)
  }

  const candidates = ((stores || []) as BillingStore[]).filter(shouldBillStore)

  let created = 0
  let wouldCreate = 0
  for (const store of candidates) {
    const amount = getPlanMonthlyPrice(store.plan)
    const day = store.billing_day && store.billing_day >= 1 && store.billing_day <= 28 ? store.billing_day : 15
    const dueDate = toISODate(dueDateForMonth(today, day))

    if (dryRun) {
      wouldCreate += 1
      continue
    }

    const { error: upsertError } = await supabaseAdmin
      .from('monthly_billing_invoices')
      .upsert({
        store_id: store.id,
        owner_id: store.owner_id,
        reference_month: referenceMonth,
        amount,
        due_date: dueDate,
        payment_provider: (process.env.BILLING_PROVIDER || 'efi').toLowerCase(),
        payment_method: 'boleto',
        status: 'pending',
      }, { onConflict: 'store_id,reference_month', ignoreDuplicates: true })

    if (!upsertError) {
      created += 1
      wouldCreate += 1
    }
  }

  return { totalCandidates: candidates.length, created, wouldCreate, dryRun }
}

export async function processFiveDaysReminders(today = new Date(), options: BillingJobOptions = {}) {
  const dryRun = options.dryRun === true
  const dueTarget = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 5))
  const dueDateTarget = toISODate(dueTarget)

  const { data: invoices, error } = await supabaseAdmin
    .from('monthly_billing_invoices')
    .select('id, store_id, owner_id, amount, due_date, boleto_link, boleto_pdf, boleto_barcode, provider_charge_id, reminder_sent_at, reference_month, stores:store_id(slug, store_name, billing_email, profiles:owner_id(email, display_name))')
    .eq('status', 'pending')
    .eq('due_date', dueDateTarget)
    .is('reminder_sent_at', null)

  if (error) {
    throw new Error(`Erro ao carregar lembretes: ${error.message}`)
  }

  const rows = ((invoices || []) as InvoiceRow[]).filter((inv) => {
    const normalizedSlug = (inv.stores?.slug || '').trim().toLowerCase()
    return !EXCLUDED_BILLING_SLUGS.has(normalizedSlug)
  })

  let processed = 0
  let emailed = 0
  let failed = 0
  let simulatedEmails = 0
  let simulatedBoletos = 0

  for (const inv of rows) {
    try {
      const ownerEmail = inv.stores?.billing_email || inv.stores?.profiles?.email
      const ownerName = inv.stores?.profiles?.display_name || 'Lojista'
      const storeName = inv.stores?.store_name || 'Loja'

      if (!ownerEmail) {
        failed += 1
        continue
      }

      let boletoLink = inv.boleto_link
      let boletoPdf = inv.boleto_pdf
      let barcode = inv.boleto_barcode
      let chargeId = inv.provider_charge_id

      if (!boletoLink && !barcode) {
        if (dryRun) {
          simulatedBoletos += 1
        } else {
        const boleto = await createGlobalBoleto(
          inv.amount,
          `${inv.reference_month.replace(/-/g, '')}-${inv.store_id.substring(0, 8)}`,
          ownerName,
          ownerEmail,
        )

        boletoLink = boleto.link
        boletoPdf = boleto.pdf
        barcode = boleto.barcode
        chargeId = String(boleto.chargeId)

        await supabaseAdmin
          .from('monthly_billing_invoices')
          .update({
            boleto_link: boletoLink,
            boleto_pdf: boletoPdf,
            boleto_barcode: barcode,
            provider_charge_id: chargeId,
          })
          .eq('id', inv.id)
        }
      }

      if (dryRun) {
        simulatedEmails += 1
      } else {
        await sendReminderEmail({
          to: ownerEmail,
          ownerName,
          storeName,
          amount: inv.amount,
          dueDate: inv.due_date,
          boletoLink,
          boletoPdf,
          barcode,
        })

        await supabaseAdmin
          .from('monthly_billing_invoices')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', inv.id)

        emailed += 1
      }

      processed += 1
    } catch (err) {
      console.error('[monthly-billing] erro ao processar invoice:', inv.id, err)
      processed += 1
      failed += 1
    }
  }

  return {
    dueDateTarget,
    total: rows.length,
    processed,
    emailed,
    failed,
    simulatedEmails,
    simulatedBoletos,
    dryRun,
  }
}
