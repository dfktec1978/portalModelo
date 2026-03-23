import { generatePixQrCode } from '@/lib/pixService'

type PixChargeInput = {
  orderId: string
  amount: number
  storePixKey: string
  storeName?: string
  customerName?: string
  customerEmail?: string
}

export type PixChargeResult = {
  provider: 'manual' | 'external'
  transactionId: string
  pixQrCode: string
  pixQrCodeUrl: string
  pixCopyPaste: string
  expiresAt: string
  raw?: unknown
}

type ExternalChargeResponse = {
  transactionId?: string
  txid?: string
  qrCode?: string
  qr_code?: string
  qrCodeUrl?: string
  qr_code_url?: string
  copyPaste?: string
  copy_paste?: string
  emv?: string
  expiresAt?: string
  expires_at?: string
}

function buildManualPixCharge(input: PixChargeInput): PixChargeResult {
  const generated = generatePixQrCode(input.storePixKey, input.amount, input.orderId)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(generated.pixCopyPaste)}`

  return {
    provider: 'manual',
    transactionId: generated.transactionId,
    pixQrCode: generated.pixQrCode,
    pixQrCodeUrl: qrCodeUrl,
    pixCopyPaste: generated.pixCopyPaste,
    expiresAt: generated.expiresAt.toISOString(),
  }
}

function mapExternalResponse(data: ExternalChargeResponse, fallback: PixChargeResult): PixChargeResult {
  const transactionId = data.transactionId || data.txid || fallback.transactionId
  const pixCopyPaste = data.copyPaste || data.copy_paste || data.emv || fallback.pixCopyPaste
  const pixQrCode = data.qrCode || data.qr_code || pixCopyPaste || fallback.pixQrCode
  const pixQrCodeUrl =
    data.qrCodeUrl ||
    data.qr_code_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pixCopyPaste)}`
  const expiresAt = data.expiresAt || data.expires_at || fallback.expiresAt

  return {
    provider: 'external',
    transactionId,
    pixQrCode,
    pixQrCodeUrl,
    pixCopyPaste,
    expiresAt,
    raw: data,
  }
}

async function createExternalPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
  const endpoint = process.env.PIX_EXTERNAL_CREATE_URL
  const apiKey = process.env.PIX_EXTERNAL_API_KEY

  if (!endpoint) {
    throw new Error('PIX_EXTERNAL_CREATE_URL não configurada')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      orderId: input.orderId,
      amount: input.amount,
      pixKey: input.storePixKey,
      storeName: input.storeName,
      customer: {
        name: input.customerName,
        email: input.customerEmail,
      },
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha no provider Pix externo (${response.status}): ${body}`)
  }

  const data = (await response.json()) as ExternalChargeResponse
  const manualFallback = buildManualPixCharge(input)
  return mapExternalResponse(data, manualFallback)
}

export async function createPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
  const provider = (process.env.PIX_PROVIDER || 'manual').toLowerCase()

  if (provider === 'external') {
    try {
      return await createExternalPixCharge(input)
    } catch (error) {
      console.error('Erro no provider externo de Pix, usando fallback manual:', error)
      return buildManualPixCharge(input)
    }
  }

  return buildManualPixCharge(input)
}
