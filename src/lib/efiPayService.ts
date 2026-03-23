/**
 * Serviço Efí Pay — integração Pix e Boleto por credenciais do lojista.
 *
 * Cada lojista tem sua própria conta Efí Pay. O portal usa as credenciais
 * cadastradas pelo lojista para gerar cobranças. O dinheiro vai direto para
 * a conta do lojista (Sicoob, Sicredi ou qualquer banco vinculado ao Efí).
 *
 * API Pix:  pix.api.efipay.com.br   (requer mTLS com certificado .p12)
 * API REST: cobrancas.api.efipay.com.br (OAuth2 sem certificado — boleto/cartão)
 */

import https from 'node:https'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const EFI_PIX_HOST = {
  production: 'pix.api.efipay.com.br',
  sandbox:    'pix-h.api.efipay.com.br',
} as const

const EFI_COBRANCAS_HOST = {
  production: 'cobrancas.api.efipay.com.br',
  sandbox:    'sandbox.efipay.com.br',
} as const

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type EfiCredentials = {
  clientId:       string
  clientSecret:   string
  certificateB64: string   // base64 do .p12 (obrigatório para Pix)
  sandbox:        boolean
}

export type EfiPixCharge = {
  txid:         string
  pixCopyPaste: string
  qrCodeImage:  string
  expiresAt:    string
  locId:        number
}

export type EfiBoletoCharge = {
  chargeId: number
  barcode:  string
  link:     string
  pdf:      string
  expiresAt: string
}

export type EfiBoletoCustomer = {
  name:   string
  cpf?:   string   // CPF ou CNPJ é obrigatório no boleto
  cnpj?:  string
  email?: string
  phone?: string
}

// ---------------------------------------------------------------------------
// Helper HTTPS com suporte a mTLS (node:https.Agent com pfx)
// ---------------------------------------------------------------------------

function makeAgent(certB64: string): https.Agent {
  return new https.Agent({
    pfx:        Buffer.from(certB64, 'base64'),
    passphrase: '',  // certificados Efí Pay não têm senha
  })
}

function httpsRequest(
  host:    string,
  path:    string,
  method:  string,
  headers: Record<string, string>,
  body?:   string,
  agent?:  https.Agent,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const opts: https.RequestOptions = {
      hostname: host,
      port:     443,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { 'Content-Length': String(Buffer.byteLength(body)) } : {}),
      },
      ...(agent ? { agent } : {}),
    }

    const req = https.request(opts, (res) => {
      let raw = ''
      res.on('data', (chunk: string) => { raw += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw))
        } catch {
          reject(new Error(`Resposta não-JSON de ${host}${path}: ${raw.substring(0, 300)}`))
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Autenticação Pix (mTLS obrigatório pelo BACEN)
// ---------------------------------------------------------------------------

async function getPixToken(creds: EfiCredentials): Promise<string> {
  const host = creds.sandbox ? EFI_PIX_HOST.sandbox : EFI_PIX_HOST.production
  const auth  = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')
  const agent = makeAgent(creds.certificateB64)

  const data = await httpsRequest(
    host,
    '/oauth/token',
    'POST',
    {
      Authorization:  `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    JSON.stringify({ grant_type: 'client_credentials' }),
    agent,
  ) as { access_token?: string; error?: string; error_description?: string }

  if (!data.access_token) {
    throw new Error(`Falha autenticação Efí Pay Pix: ${data.error_description ?? data.error ?? 'desconhecido'}`)
  }
  return data.access_token
}

// ---------------------------------------------------------------------------
// Autenticação REST (boleto/cartão — sem mTLS)
// ---------------------------------------------------------------------------

async function getCobrancasToken(creds: EfiCredentials): Promise<string> {
  const host = creds.sandbox ? EFI_COBRANCAS_HOST.sandbox : EFI_COBRANCAS_HOST.production
  const auth  = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')

  const data = await httpsRequest(
    host,
    '/v1/authorize',
    'POST',
    {
      Authorization:  `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    JSON.stringify({ grant_type: 'client_credentials' }),
  ) as { access_token?: string; error?: string; error_description?: string }

  if (!data.access_token) {
    throw new Error(`Falha autenticação Efí Pay Cobranças: ${data.error_description ?? data.error ?? 'desconhecido'}`)
  }
  return data.access_token
}

// ---------------------------------------------------------------------------
// Pix — Cobrança Imediata (COB)
// ---------------------------------------------------------------------------

/**
 * Gera uma cobrança Pix dinâmica (COB) usando as credenciais do lojista.
 * O pagamento vai direto para a chave Pix cadastrada pelo lojista.
 */
export async function createEfiPixCharge(
  creds: EfiCredentials,
  input: {
    orderId:            string
    amount:             number
    pixKey:             string   // chave Pix do lojista (recebe o dinheiro)
    description?:       string
    expirationSeconds?: number
  },
): Promise<EfiPixCharge> {
  const host  = creds.sandbox ? EFI_PIX_HOST.sandbox : EFI_PIX_HOST.production
  const token = await getPixToken(creds)
  const agent = makeAgent(creds.certificateB64)

  // txid: alfanumérico, 26-35 chars (requisito BACEN)
  const txid   = `PM${input.orderId.replace(/-/g, '').substring(0, 28).toUpperCase()}`
  const expiry = input.expirationSeconds ?? 3600  // 1 hora

  const cobBody = JSON.stringify({
    calendario:          { expiracao: expiry },
    chave:               input.pixKey,
    valor:               { original: input.amount.toFixed(2) },
    solicitacaoPagador:  input.description ?? 'Pagamento Portal Modelo',
  })

  // PUT /v2/cob/{txid} — criação idempotente
  const cob = await httpsRequest(
    host,
    `/v2/cob/${txid}`,
    'PUT',
    {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cobBody,
    agent,
  ) as {
    loc?: { id: number }
    pixCopiaECola?: string
    status?: string
    title?: string
    detail?: string
  }

  if (!cob.loc?.id) {
    throw new Error(`Erro ao criar COB Efí Pix: ${cob.title ?? cob.detail ?? JSON.stringify(cob)}`)
  }

  // GET /v2/loc/{id}/qrcode — imagem do QR code
  const qr = await httpsRequest(
    host,
    `/v2/loc/${cob.loc.id}/qrcode`,
    'GET',
    { Authorization: `Bearer ${token}` },
    undefined,
    agent,
  ) as { qrcode?: string; imagemQrcode?: string }

  return {
    txid,
    pixCopyPaste: cob.pixCopiaECola ?? qr.qrcode ?? '',
    qrCodeImage:  qr.imagemQrcode  ?? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(cob.pixCopiaECola ?? '')}`,
    expiresAt:    new Date(Date.now() + expiry * 1000).toISOString(),
    locId:        cob.loc.id,
  }
}

// ---------------------------------------------------------------------------
// Boleto Bancário
// ---------------------------------------------------------------------------

/**
 * Gera um boleto bancário pela conta Efí Pay do lojista.
 * Requer CPF ou CNPJ do comprador (obrigação legal do Banco Central).
 */
export async function createEfiBoletoCharge(
  creds:    EfiCredentials,
  customer: EfiBoletoCustomer,
  input: {
    orderId:         string
    amount:          number
    description?:    string
    expirationDays?: number
  },
): Promise<EfiBoletoCharge> {
  if (!customer.cpf && !customer.cnpj) {
    throw new Error('CPF ou CNPJ do cliente é obrigatório para boleto')
  }

  const host   = creds.sandbox ? EFI_COBRANCAS_HOST.sandbox : EFI_COBRANCAS_HOST.production
  const token  = await getCobrancasToken(creds)
  const expiry = input.expirationDays ?? 3

  const expireDate = new Date()
  expireDate.setDate(expireDate.getDate() + expiry)
  const expireDateStr = expireDate.toISOString().split('T')[0]  // YYYY-MM-DD

  // Criar charge
  const charge = await httpsRequest(
    host,
    '/v1/charge',
    'POST',
    {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    JSON.stringify({
      items: [
        {
          name:     input.description ?? 'Pedido Portal Modelo',
          value:    Math.round(input.amount * 100),  // centavos
          amount:   1,
        },
      ],
      metadata: { custom_id: input.orderId },
    }),
  ) as { data?: { charge_id?: number }; error?: string }

  if (!charge.data?.charge_id) {
    throw new Error(`Erro ao criar charge Efí Boleto: ${charge.error ?? JSON.stringify(charge)}`)
  }

  const chargeId = charge.data.charge_id

  // Criar boleto para esse charge
  const billet = await httpsRequest(
    host,
    `/v1/charge/${chargeId}/billet`,
    'POST',
    {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    JSON.stringify({
      expire_at: expireDateStr,
      customer: {
        name:     customer.name,
        email:    customer.email,
        phone:    customer.phone,
        ...(customer.cpf  ? { cpf:  customer.cpf  } : {}),
        ...(customer.cnpj ? { cnpj: customer.cnpj } : {}),
      },
    }),
  ) as {
    data?: {
      barcode?: string
      link?:    string
      pdf?:     { charge?: string }
    }
    error?: string
  }

  if (!billet.data?.barcode) {
    throw new Error(`Erro ao criar boleto Efí: ${billet.error ?? JSON.stringify(billet)}`)
  }

  return {
    chargeId,
    barcode:   billet.data.barcode,
    link:      billet.data.link      ?? '',
    pdf:       billet.data.pdf?.charge ?? '',
    expiresAt: expireDateStr,
  }
}
