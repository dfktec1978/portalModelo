/**
 * Serviço de Pix Manual
 * 
 * Implementação simples de Pix usando a chave Pix da loja
 * Sem dependência de API externa (perfeito para MVP)
 * 
 * Para upgrade futuro: integrar com Gerencianet ou Asaas
 */

type PixPaymentData = {
  transactionId: string
  pixQrCode: string
  pixQrCodeUrl?: string
  pixCopyPaste: string
  amount: number
  expiresAt: Date
  storePixKey: string
}

/**
 * Gera QR Code Pix Manual (Pix Estático)
 * 
 * Estrutura EMV (European Mastercard Visa):
 * - ID Payload Format Indicator: 00020126
 * - Merchant Account Info: 26 (MCC + Chave)
 * - Amount: 54
 * - Transaction Currency: 5303 (986 = BRL)
 * - Country Code: 5802
 * - Merchant Name: 59
 * - CRC: 6304
 * 
 * @param pixKey - Chave Pix (CPF, CNPJ, Email ou Telefone)
 * @param amount - Valor em centavos (ex: 10050 = R$ 100.50)
 * @param orderId - ID do pedido para rastreamento
 * @returns Dados do Pix (copy-paste)
 */
export function generatePixQrCode(
  pixKey: string,
  amount: number,
  orderId: string
): Omit<PixPaymentData, 'pixQrCodeUrl'> {
  // Validar chave Pix
  if (!pixKey || pixKey.length === 0) {
    throw new Error('Chave Pix inválida')
  }

  // Converter amount de decimal para centavos se necessário
  const amountInCents = amount.toString().includes('.')
    ? Math.round(amount * 100)
    : amount

  // Gerar copy-paste (código para colar no app do banco)
  const copyPaste = generatePixCopyPaste(pixKey, amountInCents, orderId)

  // Gerar QR Code (usando biblioteca qrcode)
  // Para MVP: retornar texto que será gerado no frontend com js
  const pixQrCode = copyPaste // Por enquanto, retornar o copy-paste

  return {
    transactionId: `PIX_${orderId}_${Date.now()}`,
    pixQrCode,
    pixCopyPaste: copyPaste,
    amount: amountInCents / 100,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
    storePixKey: pixKey
  }
}

/**
 * Gera código copy-paste do Pix (brcode)
 * 
 * Estrutura:
 * - 00020126 (ID Payload Format Indicator)
 * - 2600... (Merchant Account Info)
 * - 5303986 (Currency: BRL)
 * - 5413... (Amount)
 * - 5802BR (Country: Brasil)
 * - 59... (Merchant Name)
 * - 62... (Info adicionais)
 * - 6304.... (CRC checksum)
 */
function generatePixCopyPaste(
  pixKey: string,
  amountInCents: number,
  orderId: string
): string {
  // Versão simplificada: usar biblioteca externa ou servir QR Code via API
  // Para MVP, retornar formato que Gerencianet/Asaas pode gerar

  // Componentes do EMV QR Code:
  let payload = ''

  // ID Payload Format Indicator
  payload += '00020126'

  // Merchant Account Info (Pix)
  const merchantInfo = buildMerchantInfo(pixKey)
  payload += merchantInfo

  // Currency Code: BRL
  payload += '5303986'

  // Transaction Amount (opcional para Pix dinâmico, obrigatório para estático)
  if (amountInCents > 0) {
    payload += `54${amountInCents.toString().length.toString().padStart(2, '0')}${amountInCents}`
  }

  // Country Code: BR
  payload += '5802BR'

  // Merchant Category Code (MCC): pode ser qualquer um
  payload += '9105300'

  // Reference Label (referência única)
  payload += `05${orderId.padEnd(25).substring(0, 25).length.toString().padStart(2, '0')}${orderId.padEnd(25).substring(0, 25)}`

  // Info adicionais (opcional)
  // 62 = Additional Data Field Template (txn ID, beneficiary name, etc)

  // Checksum CRC-16-CCITT (será calculado depois)
  // Por enquanto, usar biblioteca para gerar

  return payload
}

function buildMerchantInfo(pixKey: string): string {
  // MCC 0000: Tipo de chave Pix
  // MCC 0100: chave aleatória (aleatória)
  // MCC 0200: telefone
  // MCC 0300: email
  // MCC 0400: CPF
  // MCC 0500: CNPJ

  let keyType = '0100' // padrão: aleatória
  
  if (pixKey.includes('@')) {
    keyType = '0300' // email
  } else if (pixKey.match(/^\d{11}$/)) {
    keyType = '0400' // CPF
  } else if (pixKey.match(/^\d{14}$/)) {
    keyType = '0500' // CNPJ
  } else if (pixKey.startsWith('+')) {
    keyType = '0200' // telefone
  }

  const merchantInfoValue = `0014br.gov.bcb.brcode${keyType}${pixKey}`
  const length = merchantInfoValue.length.toString().padStart(2, '0')

  return `26${length}${merchantInfoValue}`
}

/**
 * Gera QR Code usando terceira parte (para futuro)
 * 
 * Opção 1: Gerencianet
 * Opção 2: Asaas
 * Opção 3: Biblioteca qrcode local
 */
export async function generatePixQrCodeViaApi(
  pixData: {
    pixKey: string
    amount: number
    orderId: string
    storeName: string
  }
): Promise<{ qrCodeUrl: string; copyPaste: string }> {
  // Exemplo com Gerencianet (requer API key)
  // return gerencianetGenerateQr(pixData)

  // Por enquanto, retornar erro
  throw new Error('API de QR Code não configurada. Use generatePixQrCode() para Pix Manual')
}

/**
 * Simula validação de pagamento Pix
 * Em produção: integrar com webhook do banco
 */
export function validatePixPayment(
  transactionId: string,
  amountReceived: number,
  amountExpected: number
): {
  valid: boolean
  message: string
} {
  if (amountReceived !== amountExpected) {
    return {
      valid: false,
      message: `Valor recebido (R$ ${(amountReceived / 100).toFixed(2)}) não corresponde ao esperado (R$ ${(amountExpected / 100).toFixed(2)})`
    }
  }

  return {
    valid: true,
    message: 'Pagamento validado'
  }
}

/**
 * Formata valor para Pix
 */
export function formatPixAmount(amount: number): string {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Gera QR Code como imagem (usando qrcode.toDataURL)
 * Deve ser executado no frontend
 */
export async function generatePixQrCodeImage(
  brcode: string
): Promise<string> {
  // Requer: import QRCode from 'qrcode'
  // return QRCode.toDataURL(brcode, { width: 300 })
  throw new Error('Use generatePixQrCodeImage() no frontend com biblioteca qrcode')
}
