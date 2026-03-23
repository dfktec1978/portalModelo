# Guia de Integracao Pix Real

Data: 22/03/2026

Este projeto agora suporta cobranca Pix via backend com provider configuravel.

## O que foi implementado

- Endpoint de cobranca Pix: /api/pix/charge
- Webhook Pix para confirmacao: /api/webhooks/pix
- Fallback automatico para Pix manual quando o provider externo falha
- Persistencia em orders e tentativa de persistencia em pix_transactions

## Variaveis de ambiente

Defina no .env.local:

- PIX_PROVIDER=manual
  - Opcoes: manual, external
  - manual: gera codigo Pix estatico (fallback seguro)
  - external: usa endpoint de integracao externo

- PIX_EXTERNAL_CREATE_URL=https://seu-backend-pix/charges
  - Obrigatoria quando PIX_PROVIDER=external

- PIX_EXTERNAL_API_KEY=sua-chave-opcional
  - Enviada como Authorization: Bearer <chave>

- PIX_WEBHOOK_SECRET=segredo-do-webhook
  - Opcional, mas recomendado em producao
  - Quando definido, /api/webhooks/pix exige header x-webhook-secret

## Contrato esperado do provider externo

Request enviado para PIX_EXTERNAL_CREATE_URL:

{
  "orderId": "uuid",
  "amount": 123.45,
  "pixKey": "chave-pix-da-loja",
  "storeName": "Nome Loja",
  "customer": {
    "name": "Cliente",
    "email": "cliente@email.com"
  }
}

Response esperado (qualquer alias abaixo e aceito):

{
  "transactionId": "tx_123",
  "qrCode": "000201...",
  "qrCodeUrl": "https://.../qr.png",
  "copyPaste": "000201...",
  "expiresAt": "2026-03-22T23:59:59.000Z"
}

Campos aceitos por alias:

- transactionId ou txid
- qrCode ou qr_code
- qrCodeUrl ou qr_code_url
- copyPaste ou copy_paste ou emv
- expiresAt ou expires_at

## Contrato esperado do webhook

Endpoint local:

- POST /api/webhooks/pix

Headers:

- x-webhook-secret: <PIX_WEBHOOK_SECRET> (quando configurado)

Payload exemplo:

{
  "transactionId": "tx_123",
  "orderId": "uuid-opcional",
  "status": "paid",
  "paidAt": "2026-03-22T15:00:00.000Z",
  "amount": 123.45,
  "raw": {}
}

Status aceitos como pagamento confirmado:

- paid, approved, confirmed, recebido, concluida, concluido

Status aceitos como expirado/falha:

- expired, expirado, canceled, cancelled, falhou, failed

## Fluxo em execucao

1. Checkout cria pedido no Supabase.
2. Quando o metodo e Pix, frontend chama /api/pix/charge.
3. Backend gera cobranca no provider configurado.
4. Dados Pix sao salvos no pedido e exibidos no PixPaymentDisplay.
5. Quando o provedor confirmar, chama /api/webhooks/pix.
6. Webhook atualiza pix_transactions e orders.payment_status.

## Teste rapido

1. Deixe PIX_PROVIDER=manual e rode checkout Pix.
2. Confirme exibicao do QR/copia e cola.
3. Simule webhook:

curl -X POST http://localhost:3000/api/webhooks/pix \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: seu-segredo" \
  -d '{"transactionId":"TX_TESTE","orderId":"SEU_ORDER_ID","status":"paid"}'

4. Verifique se o pedido mudou para confirmado.
