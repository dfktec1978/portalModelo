# 🧪 Guia de Testes - Fluxo Checkout Completo

## Checklist de Testes

### ✅ Setup Inicial
- [ ] Verificar se o app está rodando: `npm run dev`
- [ ] Acessar uma loja: `/lojas/[slug]`
- [ ] Verificar se há produtos disponíveis
- [ ] Verificar se o carrinho aparece ao clicar no ícone

---

## 🛒 Teste 1: Fluxo Completo com Pix

### Preparação
1. Acessar `/lojas/[slug-loja]`
2. Selecionar pelo menos 1 produto
3. Clicar em "Adicionar ao Carrinho"

### Execução
1. **Abrir Carrinho**
   - [ ] Clique no ícone do carrinho (canto superior direito)
   - [ ] Deve aparecer um painel com os produtos
   - [ ] Deve mostrar subtotal

2. **Iniciar Checkout**
   - [ ] Clique em "💳 Finalizar Compra" (novo botão em azul)
   - [ ] Deve abrir modal com resumo do pedido
   - [ ] Deve mostrar: lista de itens, subtotal, total
   - [ ] Clique em "Continuar"

3. **Preencher Dados Pessoais**
   - [ ] Modal "Dados Pessoais" deve aparecer
   - [ ] Preencha:
     - Nome: "João Silva" ✓
     - Email: "joao@test.com" ✓
     - Telefone: "(11) 98765-4321" (deve formatar automaticamente)
   - [ ] Clique em "Continuar"

4. **Selecionar Entrega**
   - [ ] Modal "Selecione a Entrega" deve aparecer
   - [ ] Marque uma opção de entrega (Retirada / Envio / Especial)
   - [ ] Se "Envio": digite um endereço
   - [ ] Verifique se a taxa de entrega aparece
   - [ ] Verifique a data sugerida
   - [ ] Clique em "Confirmar"

5. **Selecionar Pagamento**
   - [ ] Modal "Forma de Pagamento" deve aparecer
   - [ ] Selecione "Pix"
   - [ ] Clique em checkbox "Concordo com os termos"
   - [ ] Clique em "Confirmar"

6. **Visualizar QR Code Pix**
   - [ ] Component PixPaymentDisplay deve aparecer
   - [ ] Deve mostrar:
     - [ ] QR Code (imagem)
     - [ ] Valor a pagar
     - [ ] Código copy-paste
     - [ ] Countdown de expiração
   - [ ] Teste o botão "Copiar" (deve copiar para clipboard)
   - [ ] Clique em "✓ Confirmar Pagamento"

7. **Confirmação**
   - [ ] Deve redirecionar para `/lojas/[storeId]/pedido/[orderId]`
   - [ ] Deve mostrar página de sucesso com:
     - [ ] ✅ Confirmação visual
     - [ ] Número do pedido
     - [ ] Dados pessoais
     - [ ] Resumo da entrega
     - [ ] Resumo do pagamento
     - [ ] Itens do pedido
     - [ ] Total
   - [ ] Carrinho deve estar limpo

### Verificações no Banco
```sql
-- Verificar se o pedido foi criado
SELECT * FROM orders WHERE id = '[orderId]';

-- Deve ter:
- store_id correto
- client_name, client_email, client_phone preenchidos
- items (JSON com produtos)
- delivery_type = 'retirada' ou 'envio' ou 'condicional'
- delivery_date com a data selecionada
- payment_method = 'pix'
- payment_status = 'pendente'
```

---

## 🎫 Teste 2: Fluxo com "Pagamento na Retirada"

### Preparação
1. Adicionar produto ao carrinho
2. Clicar em "💳 Finalizar Compra"

### Diferenças
- Na etapa 5 (Pagamento), selecione "💵 Na Retirada"
- Na etapa 6, NÃO deve aparecer QR Code
- Deve ir direto para confirmação
- Na página de sucesso, deve mostrar "1️⃣ Pagamento na Retirada"

---

## ❌ Teste 3: Validações

### 3.1 Dados Pessoais
- [ ] Deixe nome vazio → deve aparecer erro
- [ ] Digite email inválido (sem @) → deve aparecer erro
- [ ] Deixe telefone vazio → deve aparecer erro
- [ ] Digite telefone com menos de 10 dígitos → deve aparecer erro

### 3.2 Seleção de Entrega
- [ ] Se selecionar "Envio" sem endereço → deve aparecer erro
- [ ] Se total < min_order_delivery para envio → deve aparecer erro
- [ ] Se não selecionar data → deve aparecer erro

### 3.3 Seleção de Pagamento
- [ ] Se não marcar "Concordo com os termos" → botão deve estar desabilitado

---

## 🔄 Teste 4: Fluxo de Cancelamento

### 4.1 Cancelar em Dados Pessoais
- [ ] Clique em "Cancelar"
- [ ] Deve voltar para carrinho
- [ ] Carrinho deve estar intacto

### 4.2 Cancelar em Entrega
- [ ] Clique em "Voltar"
- [ ] Deve voltar para Dados Pessoais
- [ ] Ou clique em "Cancelar"
- [ ] Deve voltar para carrinho

### 4.3 Voltar em Pagamento
- [ ] Clique em "Voltar"
- [ ] Deve voltar para Seleção de Entrega
- [ ] Deve manter dados anteriores

---

## 📱 Teste 5: Alternativa WhatsApp

### Verificação
- [ ] Carrinho deve ter 2 botões:
  - 💳 Finalizar Compra (novo, checkout)
  - 📱 Finalizar via WhatsApp (existente)
- [ ] Clique em WhatsApp deve abrir conversa
- [ ] Deve incluir:
  - Produtos e quantidades
  - Preços individuais
  - Total

---

## 📱 Teste 6: Responsividade Mobile

### Desktop
- [ ] Modals devem ocupar ~33% da largura
- [ ] Botões visíveis
- [ ] Scroll funcional se conteúdo grande

### Tablet
- [ ] Layout deve se adaptar
- [ ] Toque deve funcionar em inputs

### Mobile (375px)
- [ ] Modals devem ser full-width com padding
- [ ] Inputs devem ter font-size >= 16px (evitar zoom)
- [ ] Botões devem ter padding adequado
- [ ] Scroll deve funcionar

---

## 🔗 Teste 7: Navegação Direta

### 7.1 Acessar Checkout Direto
```
GET /lojas/[storeId]/checkout
```
- [ ] Deve carregar carrinho do localStorage
- [ ] Se carrinho vazio → mostrar erro
- [ ] Se carrinho válido → renderizar CheckoutFlow

### 7.2 Acessar Pedido Direto
```
GET /lojas/[storeId]/pedido/[orderId]
```
- [ ] Se pedido existe → mostrar página de sucesso
- [ ] Se pedido não existe → mostrar erro "Não Encontrado"
- [ ] Se orderId inválido → mostrar erro

---

## 🔄 Teste 8: Persistência de Dados

### 8.1 localStorage
- [ ] Adicionar produto ao carrinho
- [ ] Abrir DevTools → Application → localStorage
- [ ] Deve existir: `cart_[storeId]` com JSON dos produtos
- [ ] Fechar aba e voltar → carrinho deve estar lá

### 8.2 Supabase
- [ ] Criar um pedido com sucesso
- [ ] Consultar no Supabase:
  ```sql
  SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Deve ter todos os dados corretos

---

## 🎨 Teste 9: Estilos e Temas

### 9.1 Cores
- [ ] Botões primários devem usar tema da loja
- [ ] Confirmações em verde
- [ ] Erros em vermelho
- [ ] Avisos em amarelo
- [ ] Informações em azul

### 9.2 Acessibilidade
- [ ] Todos os inputs devem ter label
- [ ] Erros devem ser claros
- [ ] Botões devem ter hover state
- [ ] Contraste adequado (WCAG AA)

---

## ⚡ Teste 10: Performance

### 10.1 Carregamento
- [ ] Abrir DevTools → Network
- [ ] Acessar `/lojas/[storeId]`
- [ ] Tempo de carregamento inicial < 2s
- [ ] Clique em produto < 500ms
- [ ] Abertura do checkout < 1s

### 10.2 Sem Erros no Console
- [ ] Abrir DevTools → Console
- [ ] Não deve haver erros vermelhos
- [ ] Alertas (amarelos) são aceitáveis

---

## 📊 Checklist Final

- [ ] Todos os 10 testes passaram
- [ ] Sem erros no console
- [ ] Sem lint errors
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Dados persistem corretamente
- [ ] Pedidos criados no Supabase
- [ ] Página de sucesso funciona
- [ ] Alternativa WhatsApp ainda funciona

---

## 🐛 Bugs Encontrados

(Registre aqui qualquer bug encontrado durante os testes)

| # | Descrição | Severidade | Status |
|---|-----------|-----------|--------|
| | | | |

---

## 📝 Notas

- **Teste com dados reais**: Use nomes, emails e telefones reais se possível
- **Teste com diferentes tipos de entrega**: Retirada, Envio, Especial
- **Teste validações**: Tente quebrar o fluxo com dados inválidos
- **Teste cancelamento**: Certifique-se de que é possível voltar/cancelar em qualquer momento

---

**Data do Teste**: ___/___/_____
**Testador**: _________________
**Status Geral**: _______________
