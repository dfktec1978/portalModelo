# 🧪 Guia de Testes - Sincronização de Carrinho

## ✅ Checklist de Testes

### 1️⃣ Teste: Compra via Modal (Compra Rápida)
**Objetivo:** Verificar se o modal continua funcionando

**Passos:**
```
1. npm run dev
2. Abrir loja: http://localhost:3000/lojas/[slug-qualquer-loja]
3. Clicar em "🛒 Compra Rápida" no primeiro produto
4. Selecionar tamanho (se produto tem variantes)
5. Selecionar cor (se disponível)
6. Clicar "Adicionar"
```

**Resultado Esperado:**
- ✓ Botão flutuante 🛒 aparece com count = 1
- ✓ Carrinho exibe o item adicionado
- ✓ localStorage contém: `cart_[id-da-loja]` com o item

**Se falhar:**
- Abrir DevTools → Console → procurar erros
- Verificar localStorage: F12 → Application → Local Storage


---

### 2️⃣ Teste: PRINCIPAL - Ver Detalhes + Add
**Objetivo:** Verificar se a correção funciona

**Passos:**
```
1. ✅ Fazer Teste 1 (ter 1 item no carrinho)
2. Clicar em "👁️ Ver Detalhes" em outro produto
3. Selecionar tamanho (obrigatório)
4. Selecionar cor (obrigatório para varejo)
5. Clicar "Adicionar ao Carrinho"
```

**Resultado Esperado:**
- ✓ Página redireciona automaticamente para loja
- ✓ Botão 🛒 agora mostra count = 2
- ✓ Carrinho exibe: item anterior + novo item
- ✓ localStorage contém ambos os items

**Se falhar (BUG antigo):**
- ❌ Voltaria com carrinho vazio
- ❌ Botão 🛒 teria count = 1 (ou não aparecia)
- ❌ localStorage teria item perdido


---

### 3️⃣ Teste: Persistência via localStorage
**Objetivo:** Verificar se reload restaura carrinho

**Passos:**
```
1. ✅ Fazer Teste 2 (ter 2 items no carrinho)
2. Clicar botão 🛒 para abrir carrinho flutuante
3. Verificar: Exibe "2 itens"
4. Pressionar F5 (ou Ctrl+R)
5. Esperar página recarregar
```

**Resultado Esperado:**
- ✓ Página recarrega
- ✓ Botão 🛒 ainda exibe "2 itens"
- ✓ Carrinho flutuante exibe ambos os items

**Verificação adicional (DevTools):**
```javascript
// Abrir Console (F12 → Console)
// Digitar:
localStorage.getItem('cart_[id-da-loja]')

// Deve retornar algo como:
// [{"id":"...", "name":"...", ...}, {...}]
```


---

### 4️⃣ Teste: Adicionar via Modal DEPOIS de Ver Detalhes
**Objetivo:** Verificar se ambos os métodos se complementam

**Passos:**
```
1. ✅ Fazer Teste 2 (ter 2 items via modal + Ver Detalhes)
2. Clicar novamente "🛒 Compra Rápida" em outro produto
3. Completar seleção e clicar "Adicionar"
4. Carrinho flutuante deve exibir 3 items
```

**Resultado Esperado:**
- ✓ Count = 3
- ✓ localStorage contém 3 items
- ✓ Todos os items aparecem no modal de carrinho


---

### 5️⃣ Teste: Remover Item
**Objetivo:** Verificar se remoção sincroniza com localStorage

**Passos:**
```
1. ✅ Ter 2+ items no carrinho
2. Clicar botão 🛒 (abre carrinho flutuante)
3. Clicar "Remover" no primeiro item
4. Modal fecha (ou item desaparece da lista)
5. Clicar botão 🛒 novamente
6. Verificar count = quantidade anterior - 1
```

**Resultado Esperado:**
- ✓ Item é removido do carrinho
- ✓ localStorage é atualizado
- ✓ Recarregar (F5) mantém a remoção


---

### 6️⃣ Teste: Cenário Completo (Stress Test)
**Objetivo:** Simular fluxo real do usuário

**Passos:**
```
1. Limpar localStorage:
   - F12 → Application → Local Storage
   - Clicar direito em http://localhost:3000
   - "Clear"
   
2. Recarregar página (F5)

3. Adicionar 1 item via modal "Compra Rápida"
   → Verificar: carrinho exibe 1 item

4. Clique "Ver Detalhes" em outro produto
   → Selecione variantes
   → Adicione ao carrinho
   → Voltará para loja

5. Verificar: carrinho exibe 2 items

6. Clique em "Ver Detalhes" novamente (outro produto)
   → Selecione variantes
   → Adicione

7. Verificar: carrinho exibe 3 items

8. Pressione F5 (recarregar)
   → Espere carrinho reaparecer
   → Verificar: ainda exibe 3 items

9. Clique "Remover" no segundo item
   → Verify: count = 2

10. Clique botão WhatsApp
    → Verificar URL contém 2 items com descrição
```

**Resultado Esperado:**
- ✓ Todos os passos funcionam sem erros
- ✓ Carrinho nunca fica vazio inesperadamente
- ✓ localStorage sempre sincronizado
- ✓ Mensagem WhatsApp contém informações corretas


---

### 7️⃣ Teste: Diferentes Lojas
**Objetivo:** Verificar se carrinho é isolado por loja

**Passos:**
```
1. Abrir Loja A: /lojas/loja-a
2. Adicionar 1 item (modal ou Ver Detalhes)
3. Verificar localStorage tem: cart_[id-loja-a]
4. Abrir Loja B: /lojas/loja-b
5. Adicionar 1 item
6. Verificar localStorage tem: cart_[id-loja-b]
7. Voltar para Loja A: /lojas/loja-a
8. Verificar: carrinho da Loja A foi restaurado (1 item)
9. Abrir DevTools → localStorage
   - cart_[id-loja-a]: 1 item
   - cart_[id-loja-b]: 1 item
```

**Resultado Esperado:**
- ✓ Cada loja tem seu carrinho separado
- ✓ Switching entre lojas restaura carrinhos corretos
- ✓ localStorage contém 2 chaves diferentes


---

## 🔍 Verificações em DevTools

### Abrir DevTools
```
Windows/Linux: F12 ou Ctrl+Shift+I
Mac: Cmd+Option+I
```

### Verificar localStorage
```
1. Abra DevTools
2. Vá em: Application → Storage → Local Storage
3. Selecione: http://localhost:3000
4. Procure por chaves começando com: cart_
5. Valores devem ser JSON arrays com items
```

### Exemplo de localStorage válido
```json
{
  "cart_store-id-123": "[{\"id\":\"prod-1\",\"name\":\"Produto A\",\"variant\":{\"color\":\"Azul\",\"size\":\"M\"},\"quantity\":1,\"price\":99.90,\"cartId\":1739123456789},{\"id\":\"prod-2\",\"name\":\"Produto B\",\"quantity\":2,\"price\":49.90,\"cartId\":1739123456790}]"
}
```

### Verificar sessionStorage
```
1. DevTools → Application → Storage → Session Storage
2. Se houver: pending_cart_item
   → Significa que ProductPage acabou de executar
   → LojaPublicPage deve processar em breve
3. Após LojaPublicPage carregar, deve desaparecer
```

### Console Logs
```javascript
// Abrir Console (F12 → Console tab)

// Ver items atuais no carrinho:
// (depois que página carrega completamente)
// Digitar no console:
console.log(document.querySelector('button[data-cart]')?.textContent)

// Ou verificar diretamente localStorage:
JSON.parse(localStorage.getItem('cart_store-id') || '[]').forEach(item => {
  console.log(`${item.quantity}x ${item.name} - R$ ${item.price}`)
})
```


---

## ❌ Troubleshooting

### Problema: Carrinho vazio ao voltar de Ver Detalhes
**Solução:**
- F12 → Application → Local Storage → limpar tudo
- Recarregar página
- Tentar novamente
- Se persistir: consultar logs em `/CARRINHO-SINCRONIZADO-FIX.md`

### Problema: localStorage cresce muito
**Solução:**
- localStorage normal: ~5-10MB de limite
- Cada item ocupa ~200-500 bytes
- Máximo de ~10,000 items antes de limite
- **Ação:** Implementar limite de items futuramente

### Problema: Carrinho aparece duplicado
**Solução:**
- Verificar sessionStorage
- Se houver `pending_cart_item` pendente
- Atualizar página (F5)
- sessionStorage deve desaparecer e duplicação se resolver

### Problema: TypeError no console
**Solução:**
- Abrir DevTools → Console
- Procurar por erros vermelhos
- Se aparecer: "Cannot read property X of null"
  - Significa store.id ainda não carregou
  - Isso é normal e será resolvido automaticamente
  - Nenhuma ação necessária


---

## ✨ Resultados de Sucesso

Quando tudo estiver funcionando corretamente:

✅ Modal "Compra Rápida" funciona
✅ "Ver Detalhes" + Add funciona
✅ Carrinho nunca fica vazio inesperadamente
✅ localStorage sincroniza automaticamente
✅ Reload (F5) restaura o carrinho
✅ Remover item atualiza localStorage
✅ Múltiplas lojas têm carrinhos separados
✅ Sem erros no console

---

## 📱 Teste no Mobile

```
1. Abrir em navegador do celular
2. Repetir Testes 1-6
3. Verificar:
   - Botão 🛒 flutuante visível
   - Modal de carrinho responsivo
   - Cliques funcionam
   - Layout não quebra
```

---

**Duração estimada:** 10-15 minutos para todos os testes
**Ambiente:** http://localhost:3000
**Status:** Pronto para testar
