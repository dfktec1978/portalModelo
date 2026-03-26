/**
 * Registra (ou atualiza) o webhook Pix na Efí via API.
 * Usa as mesmas credenciais configuradas em .env.local.
 *
 * Uso:
 *   node scripts/efi-register-webhook.js
 *   node scripts/efi-register-webhook.js --check   (só consulta, não altera)
 *   node scripts/efi-register-webhook.js --remove  (remove o webhook)
 */

const https = require('https')
const path  = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const forceHml    = process.argv.includes('--hml')
const SANDBOX     = forceHml || process.env.EFI_BILLING_SANDBOX === 'true'
const CLIENT_ID   = SANDBOX
  ? (process.env.EFI_BILLING_HML_CLIENT_ID   || process.env.EFI_BILLING_CLIENT_ID)
  : process.env.EFI_BILLING_CLIENT_ID
const CLIENT_SECRET = SANDBOX
  ? (process.env.EFI_BILLING_HML_CLIENT_SECRET || process.env.EFI_BILLING_CLIENT_SECRET)
  : process.env.EFI_BILLING_CLIENT_SECRET
const CERT_B64    = SANDBOX
  ? (process.env.EFI_BILLING_HML_CERTIFICATE_B64 || process.env.EFI_BILLING_CERTIFICATE_B64)
  : process.env.EFI_BILLING_CERTIFICATE_B64
const PIX_KEY     = process.env.EFI_BILLING_PIX_KEY
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal-modelo.vercel.app'

const WEBHOOK_URL = `${SITE_URL}/api/webhooks/pix`

const PIX_HOST    = SANDBOX ? 'pix-h.api.efipay.com.br' : 'pix.api.efipay.com.br'

// ---------------------------------------------------------------------------
// Validação inicial
// ---------------------------------------------------------------------------

function validate() {
  const missing = []
  if (!CLIENT_ID)     missing.push('EFI_BILLING_CLIENT_ID')
  if (!CLIENT_SECRET) missing.push('EFI_BILLING_CLIENT_SECRET')
  if (!CERT_B64)      missing.push('EFI_BILLING_CERTIFICATE_B64')
  if (!PIX_KEY)       missing.push('EFI_BILLING_PIX_KEY')
  if (missing.length) {
    console.error('❌ Variáveis ausentes no .env.local:', missing.join(', '))
    process.exit(1)
  }
  console.log(`🌐 Ambiente  : ${SANDBOX ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO'}`)
  console.log(`🔑 Chave Pix : ${PIX_KEY}`)
  console.log(`🔗 Webhook   : ${WEBHOOK_URL}`)
  console.log(`🏠 Host Efí  : ${PIX_HOST}\n`)
}

// ---------------------------------------------------------------------------
// HTTPS helper (mTLS idêntico ao efiPayService.ts)
// ---------------------------------------------------------------------------

function makeAgent() {
  return new https.Agent({
    pfx:        Buffer.from(CERT_B64, 'base64'),
    passphrase: '',
  })
}

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(bodyStr ? { 'Content-Length': String(Buffer.byteLength(bodyStr)) } : {}),
    }

    const req = https.request(
      { hostname: PIX_HOST, port: 443, path, method, headers, agent: makeAgent() },
      (res) => {
        let raw = ''
        res.on('data', c => raw += c)
        res.on('end', () => {
          const status = res.statusCode
          let parsed
          try { parsed = JSON.parse(raw) } catch { parsed = raw }
          resolve({ status, body: parsed })
        })
      }
    )
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function getToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await request(
    'POST', '/oauth/token', null,
    { grant_type: 'client_credentials' }
  )
  // a chamada de auth usa Basic, não Bearer — fazer manualmente
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify({ grant_type: 'client_credentials' })
    const req = https.request(
      {
        hostname: PIX_HOST,
        port: 443,
        path: '/oauth/token',
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': String(Buffer.byteLength(bodyStr)),
        },
        agent: makeAgent(),
      },
      (res) => {
        let raw = ''
        res.on('data', c => raw += c)
        res.on('end', () => {
          try {
            const data = JSON.parse(raw)
            if (!data.access_token) {
              reject(new Error(`Auth falhou: ${data.error_description || data.error || raw.substring(0,200)}`))
            } else {
              resolve(data.access_token)
            }
          } catch {
            reject(new Error(`Resposta auth não-JSON: ${raw.substring(0, 300)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(bodyStr)
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Operações webhook
// ---------------------------------------------------------------------------

async function checkWebhook(token) {
  const res = await request('GET', `/v2/webhook/${PIX_KEY}`, token)
  return res
}

async function registerWebhook(token) {
  const res = await request('PUT', `/v2/webhook/${PIX_KEY}`, token, { webhookUrl: WEBHOOK_URL })
  return res
}

async function removeWebhook(token) {
  const res = await request('DELETE', `/v2/webhook/${PIX_KEY}`, token)
  return res
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  validate()

  const isCheck  = process.argv.includes('--check')
  const isRemove = process.argv.includes('--remove')

  console.log('🔐 Obtendo token de acesso...')
  let token
  try {
    token = await getToken()
    console.log('✅ Token obtido!\n')
  } catch (err) {
    console.error('❌ Falha ao obter token:', err.message)
    process.exit(1)
  }

  if (isCheck) {
    console.log('🔎 Consultando webhook atual...')
    const res = await checkWebhook(token)
    console.log(`   Status HTTP: ${res.status}`)
    console.log('   Resposta:', JSON.stringify(res.body, null, 2))
    return
  }

  if (isRemove) {
    console.log('🗑️  Removendo webhook...')
    const res = await removeWebhook(token)
    console.log(`   Status HTTP: ${res.status}`)
    if (res.status === 204 || res.status === 200) {
      console.log('✅ Webhook removido com sucesso!')
    } else {
      console.error('❌ Erro ao remover:', JSON.stringify(res.body))
    }
    return
  }

  // Registrar
  console.log('📡 Registrando webhook...')
  const res = await registerWebhook(token)
  console.log(`   Status HTTP: ${res.status}`)

  if (res.status === 204 || res.status === 200 || res.status === 201) {
    console.log('✅ Webhook registrado com sucesso!')
    console.log(`   URL ativa: ${WEBHOOK_URL}`)
  } else {
    console.error('❌ Falha no registro:', JSON.stringify(res.body, null, 2))
    if (res.status === 403) {
      console.error('\n💡 Status 403: A chave Pix pode não estar vinculada a esta aplicação.')
      console.error('   Acesse o painel Efí → API Pix → Configurar chaves e vincule a chave ao app Portal Modelo.')
    }
    process.exit(1)
  }

  // Confirmar consultando
  console.log('\n🔎 Confirmando registro...')
  const check = await checkWebhook(token)
  console.log('   Dados registrados:', JSON.stringify(check.body, null, 2))
}

main().catch(err => {
  console.error('❌ Erro inesperado:', err.message)
  process.exit(1)
})
