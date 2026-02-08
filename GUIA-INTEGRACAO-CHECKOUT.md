# 🛒 Guia de Integração: Sistema de Checkout Completo

## 📋 Visão Geral

O sistema de checkout foi dividido em componentes reutilizáveis e um hook (`useCheckout`) que gerencia o fluxo.

```
Carrinho (showCart = true)
  ↓
[Botão "Ir para Checkout"]
  ↓
DeliverySelectionModal ← escolher entrega + data
  ↓
PaymentSelectionModal ← escolher forma de pagamento
  ↓
Se Pix: PixPaymentDisplay ← QR code
Se "Na Retirada": Resumo + Confirmação
  ↓
createOrder() → Salvar no banco
  ↓
Pedido confirmado
Notificar lojista (WhatsApp)
```

## 🔧 Como Integrar no LojaPublicPage

### Passo 1: Importar componentes e hook

```tsx
// No topo de src/app/lojas/[id]/page.tsx

import DeliverySelectionModal from '@/components/DeliverySelectionModal'
import PaymentSelectionModal from '@/components/PaymentSelectionModal'
import PixPaymentDisplay from '@/components/PixPaymentDisplay'
import { useCheckout } from '@/lib/useCheckout'
```

### Passo 2: Adicionar hook no componente

```tsx
export default function LojaPublicPage() {
  // ... estados existentes ...
  
  const checkout = useCheckout()
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
}
```

### Passo 3: Adicionar botão de checkout no modal do carrinho

```tsx
{/* No Modal do Carrinho - antes dos botões finais */}

{cart.length > 0 && checkout.currentStep === 'cart' && (
  <div className="border-t border-gray-200 p-4 flex gap-3">
    <button
      onClick={() => setShowCart(false)}
      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
    >
      Continuar Comprando
    </button>
    <button
      onClick={() => checkout.goToDelivery()}
      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
    >
      Ir para Checkout
    </button>
  </div>
)}
```

### Passo 4: Renderizar DeliverySelectionModal

```tsx
<DeliverySelectionModal
  isOpen={checkout.currentStep === 'delivery'}
  onClose={() => checkout.goBack()}
  onSelect={checkout.handleDeliverySelect}
  storeConfig={store ? {
    delivery_options: store.delivery_options || {
      retirada: true,
      envio: false,
      condicional: false
    },
    delivery_fee_envio: store.delivery_fee_envio || 0,
    delivery_fee_condicional: store.delivery_fee_condicional || 0,
    delivery_instructions: store.delivery_instructions,
    schedule_delivery: store.schedule_delivery || false,
    min_order_delivery: store.min_order_delivery || 0
  } : undefined}
  cartTotal={cartTotal}
/>
```

### Passo 5: Renderizar PaymentSelectionModal

```tsx
<PaymentSelectionModal
  isOpen={checkout.currentStep === 'payment'}
  onClose={() => checkout.goBack()}
  onSelect={checkout.handlePaymentSelect}
  storeConfig={store ? {
    payment_options: store.payment_options || {
      pix: true,
      na_retirada: true
    },
    pix_key: store.pix_key
  } : undefined}
  delivery={checkout.deliveryData || {
    type: 'retirada',
    date: new Date()
  }}
  total={cartTotal}
/>
```

### Passo 6: Renderizar PixPaymentDisplay

```tsx
{checkout.currentStep === 'pix' && checkout.orderData && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <PixPaymentDisplay
      orderId={checkout.orderData.id}
      pixQrCode={checkout.orderData.pix_qr_code || ''}
      pixQrCodeUrl={checkout.orderData.pix_qr_code || ''}
      pixCopyPaste={checkout.orderData.pix_copy_paste || ''}
      amount={checkout.orderData.total}
      storePixKey={store?.pix_key || ''}
      expiresAt={new Date(Date.now() + 60 * 60 * 1000)}
      onPaymentConfirmed={() => {
        // Simular confirmação (em produção: webhook)
        checkout.goToDelivery() // ou ir para página de confirmação
      }}
      onCancel={() => checkout.goBack()}
    />
  </div>
)}
```

### Passo 7: Modal de dados do cliente

Antes de criar o pedido, pedir dados:

```tsx
{checkout.currentStep === 'payment' && !checkout.orderData && (
  <ClientDataModal
    isOpen={true}
    onClose={() => checkout.goBack()}
    onConfirm={async (name, email, phone) => {
      setClientName(name)
      setClientEmail(email)
      setClientPhone(phone)
      
      try {
        await checkout.createOrder(
          store!.id,
          cart,
          cartTotal,
          { name, email, phone }
        )
      } catch (err) {
        console.error('Erro ao criar pedido:', err)
      }
    }}
  />
)}
```

## 📝 Criar ClientDataModal

```tsx
// src/components/ClientDataModal.tsx

"use client"

import { useState } from 'react'
import { X } from 'lucide-react'

type ClientDataModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, email: string, phone: string) => void
}

export default function ClientDataModal({
  isOpen,
  onClose,
  onConfirm
}: ClientDataModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Preencha todos os campos')
      return
    }

    if (!email.includes('@')) {
      setError('Email inválido')
      return
    }

    onConfirm(name, email, phone)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dados de Contato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

## 🧪 Testes

### Teste 1: Fluxo Completo (Retirada)
1. Adicionar produto ao carrinho
2. Clicar "Ir para Checkout"
3. Selecionar "Retirada"
4. Selecionar "Pagar na Retirada"
5. Preencher dados
6. Confirmar pedido

### Teste 2: Fluxo Com Envio
1. Adicionar produto ao carrinho
2. Clicar "Ir para Checkout"
3. Selecionar "Envio"
4. Preencher endereço
5. Selecionar "Pix"
6. Ver QR Code

### Teste 3: Validações
- Tentar pagar sem endereço no envio
- Tentar envio com carrinho < mínimo
- Tentar sem aceitar termos
- Dados do cliente vazios

## 📊 Status de Implementação

| Componente | Status | Notas |
|-----------|--------|-------|
| DeliverySelectionModal | ✅ | Completo |
| PaymentSelectionModal | ✅ | Completo |
| PixPaymentDisplay | ✅ | Completo |
| ClientDataModal | 📝 | Criar (template acima) |
| useCheckout hook | ✅ | Completo |
| pixService | ✅ | Manual Pix |
| Integration LojaPublicPage | 🟡 | Próximo passo |

## 🚀 Próximos Passos

1. Criar ClientDataModal (copiar código acima)
2. Integrar modais na LojaPublicPage
3. Testar fluxo completo
4. Notificar lojista via WhatsApp
5. Página de confirmação de pedido
6. Dashboard de pedidos para lojista

---

**Prioridade:** ALTA - Bloqueia checkout
**Tempo estimado:** 2-3 horas
