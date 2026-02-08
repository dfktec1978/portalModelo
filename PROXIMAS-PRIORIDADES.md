# 🚀 Próximas Prioridades - Portal Modelo

## 📋 Roadmap de Desenvolvimento

### ✅ Fase 1: Checkout Completo (CONCLUÍDO - 3/2/2026)
- [x] Botão "Adicionar ao Carrinho" unificado
- [x] Modal de seleção de entrega (retirada/envio/especial)
- [x] Modal de seleção de pagamento (Pix/Na Retirada)
- [x] Exibição de QR Code Pix (manual com pixService)
- [x] Criação de pedidos no Supabase
- [x] Página de sucesso com resumo completo
- [x] Validações em todos os steps
- [x] Alternativa WhatsApp mantida

**Tempo Estimado**: 8-10 horas
**Status**: ✅ PRONTO

---

## 🎯 Fase 2: Integração Gerencianet (CRÍTICA)
**Tempo Estimado**: 12-16 horas
**Prioridade**: 🔴 ALTA

### O que fazer:
1. **Integração de API**
   - [ ] Registrar-se no Gerencianet Developers
   - [ ] Obter credentials (client_id, client_secret)
   - [ ] Instalar SDK: `npm install gerencianet`
   - [ ] Criar função em `src/lib/gerencianetService.ts`

2. **Geração de QR Code Real**
   ```typescript
   // Antes (manual com pixService)
   const pixData = generatePixQrCode(pixKey, total, orderId)
   
   // Depois (via Gerencianet)
   const pixData = await generatePixQrCodeGerencianet(
     credenciais,
     total,
     orderId,
     clientData
   )
   // Retorna:
   // - pixQrCode (texto EMV real)
   // - pixQrCodeUrl (imagem do QR code)
   // - pixCopyPaste (texto para copiar)
   ```

3. **Webhook para Confirmação**
   - [ ] Criar endpoint: `POST /api/webhooks/gerencianet`
   - [ ] Validar assinatura do webhook
   - [ ] Atualizar status do pedido quando pagamento confirmado
   - [ ] Enviar notificação ao cliente

4. **Atualizar Banco de Dados**
   ```sql
   ALTER TABLE pix_transactions ADD COLUMN:
   - gerencianet_transaction_id UUID
   - gerencianet_status VARCHAR
   - confirmed_at TIMESTAMP
   - webhook_data JSONB
   ```

### Exemplo de Implementação:
```typescript
// src/lib/gerencianetService.ts
import axios from 'axios'

const GN_API = 'https://api.gerencianet.com.br/v1'

export async function generatePixQRCode(
  amount: number,
  orderId: string,
  clientData: { name: string; email: string; phone: string }
) {
  // 1. Autenticar
  const token = await authenticate()
  
  // 2. Criar transação
  const transaction = await axios.post(`${GN_API}/charge`, {
    items: [{
      name: `Pedido #${orderId}`,
      value: Math.round(amount * 100) // Em centavos
    }],
    customer: {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone
    }
  }, { headers: { Authorization: `Bearer ${token}` } })
  
  const chargeId = transaction.data.data.charge_id
  
  // 3. Gerar Pix
  const pix = await axios.post(
    `${GN_API}/charge/${chargeId}/pix`,
    { expire_in: 3600 }, // 1 hora
    { headers: { Authorization: `Bearer ${token}` } }
  )
  
  return {
    pixQrCode: pix.data.data.qr_code,
    pixQrCodeUrl: pix.data.data.image_url,
    pixCopyPaste: pix.data.data.qr_code,
    gerencianetChargeId: chargeId,
    expiresAt: new Date(Date.now() + 3600000)
  }
}
```

### Checklist:
- [ ] Criar conta Gerencianet
- [ ] Adicionar credenciais ao `.env.local`
- [ ] Implementar gerencianetService
- [ ] Criar rota de webhook
- [ ] Testar geração de QR code real
- [ ] Testar recebimento de webhook
- [ ] Atualizar testes

---

## 💳 Fase 3: Painel de Configurações do Lojista (MÉDIA)
**Tempo Estimado**: 16-20 horas
**Prioridade**: 🟡 MÉDIA

### Funcionalidades:
1. **Dashboard Principal**
   - [ ] Resumo de vendas (hoje/semana/mês)
   - [ ] Últimos pedidos
   - [ ] Gráficos de receita
   - [ ] Status de pagamentos

2. **Gerenciamento de Pedidos**
   - [ ] Listar todos os pedidos
   - [ ] Filtrar por status/data/cliente
   - [ ] Atualizar status (pendente → confirmado → entregue)
   - [ ] Cancelar pedidos (com reembolso)
   - [ ] Exportar relatório (CSV/PDF)

3. **Configurações de Pagamento**
   - [ ] Ativar/desativar Pix
   - [ ] Ativar/desativar pagamento na retirada
   - [ ] Adicionar/editar chave Pix
   - [ ] Visualizar saldo (se integrado)

4. **Configurações de Entrega**
   - [ ] Ativar/desativar retirada
   - [ ] Ativar/desativar envio
   - [ ] Definir taxas de entrega
   - [ ] Editar horários de funcionamento
   - [ ] Definir endereço da loja

5. **Gerenciamento de Cupons**
   - [ ] Criar cupom de desconto
   - [ ] Definir % ou R$ de desconto
   - [ ] Data de validade
   - [ ] Uso máximo
   - [ ] Ver cupons usados

6. **Notificações**
   - [ ] Enviar email automático quando pagamento recebido
   - [ ] Enviar SMS para cliente (opcional)
   - [ ] Notificar quando pedido entregue
   - [ ] Customizar mensagens

---

## 📊 Fase 4: Relatórios e Analytics (BAIXA)
**Tempo Estimado**: 12-16 horas
**Prioridade**: 🟢 BAIXA

### Funcionalidades:
- [ ] Gráfico de vendas por dia/semana/mês
- [ ] Produto mais vendido
- [ ] Cliente frequente
- [ ] Forma de pagamento mais usada
- [ ] Taxa de abandono de carrinho
- [ ] Exportar relatório em PDF/Excel

---

## 🎁 Fase 5: Programa de Fidelidade (FUTURA)
**Tempo Estimado**: 20+ horas
**Prioridade**: 🔵 FUTURA

### Funcionalidades:
- [ ] Sistema de pontos por compra
- [ ] Resgate de pontos em desconto
- [ ] Níveis de cliente (Bronze/Prata/Ouro)
- [ ] Benefícios por nível
- [ ] Histórico de pontos

---

## 🔗 Fase 6: Integrações Externas (FUTURA)
**Tempo Estimado**: Variável
**Prioridade**: 🔵 FUTURA

### Possíveis Integrações:
1. **Logística**
   - Correios API
   - Transportadoras (Loggi, Jadlog, etc)
   - Tracking de pacotes

2. **E-mail**
   - SendGrid ou Mailgun
   - Templates de confirmação

3. **SMS**
   - Twilio
   - TwilioSMS
   - Notificações de entrega

4. **Redes Sociais**
   - Share no Instagram
   - Integração com Facebook Pixel
   - WhatsApp Business API

---

## 🛠 Melhorias Técnicas Gerais

### Performance
- [ ] Implementar SWR/React Query para cache
- [ ] Lazy loading de imagens
- [ ] Compressão de imagens (next/image)
- [ ] Code splitting
- [ ] Implementar CDN

### SEO
- [ ] Meta tags dinâmicas por loja
- [ ] Sitemap dinâmico
- [ ] Schema.org para produtos
- [ ] Open Graph para compartilhamento

### Segurança
- [ ] Rate limiting em APIs
- [ ] CORS configurado corretamente
- [ ] Validação em backend (não apenas frontend)
- [ ] Sanitização de inputs
- [ ] Proteção contra XSS/CSRF

### Testes
- [ ] Testes unitários para componentes
- [ ] Testes de integração para fluxo checkout
- [ ] Testes E2E com Playwright/Cypress
- [ ] Testes de performance

---

## 📅 Timeline Recomendada

| Fase | Prioridade | Tempo | Início | Fim |
|------|-----------|-------|--------|-----|
| 1. Checkout | 🔴 CRÍTICA | 8h | Concluído | Concluído ✅ |
| 2. Gerencianet | 🔴 ALTA | 14h | 4/2 | 5/2 |
| 3. Painel Lojista | 🟡 MÉDIA | 18h | 6/2 | 8/2 |
| 4. Relatórios | 🟢 BAIXA | 14h | 9/2 | 10/2 |
| 5. Fidelidade | 🔵 FUTURA | 20h | TBD | TBD |
| 6. Integrações | 🔵 FUTURA | Variável | TBD | TBD |

---

## 🎯 Objetivos de Curto Prazo

### Semana 1 (3-7 fevereiro)
- [x] ✅ Fluxo de checkout completo
- [ ] Integração Gerencianet (metade)
- [ ] Testes do checkout

### Semana 2 (10-14 fevereiro)
- [ ] Gerencianet concluído + webhook
- [ ] Painel lojista (começar)
- [ ] Deploy em staging

### Semana 3 (17-21 fevereiro)
- [ ] Painel lojista concluído
- [ ] Testes completos
- [ ] Deploy em produção

---

## 📝 Notas Importantes

1. **Gerencianet é crítica**: Sem isso, o pagamento Pix é apenas manual
2. **Painel lojista melhora UX**: Mas checkout é prioridade
3. **Testes são essenciais**: Especialmente para webhook
4. **Staging antes de produção**: Sempre validar antes
5. **Comunicação com cliente**: Informar sobre mudanças

---

## 🤝 Dependências

- Gerencianet (API): Depende de credenciais
- SendGrid/Twilio: Opcional, mas recomendado
- Playwright/Cypress: Para testes E2E

---

## 📞 Contato/Dúvidas

Qualquer dúvida sobre as próximas etapas, abra uma issue ou entre em contato com o time.

**Última Atualização**: 3 de fevereiro de 2026
**Responsável**: Tim de Desenvolvimento
