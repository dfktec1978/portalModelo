# ⚡ CRONOGRAMA DE EXECUÇÃO - PAINEL LOJISTA
**Ordem de Prioridade por Dependências**

Data Início: 16/01/2026
Status: **EM EXECUÇÃO**

---

## 🔴 FASE 1: FUNDAÇÃO (BLOQUEANTE) - 1h

### ✅ Tarefa 1.1: Atualizar Schema do Banco ⏱️ 15min
**Status:** PRONTO PARA EXECUTAR
**Bloqueante:** SIM - Todo o resto depende disso

**Ações:**
1. [ ] Executar `sql/add-store-columns.sql` no Supabase
2. [ ] Validar com `node check-stores-schema.js`
3. [ ] Verificar constraints criadas

**Validação:**
```bash
node check-stores-schema.js
# Deve mostrar 15 colunas (incluindo category, theme_color, logo_url)
```

---

### ✅ Tarefa 1.2: Atualizar Loja Existente ⏱️ 10min
**Status:** AGUARDANDO 1.1
**Dependência:** Tarefa 1.1 completa

**Ações:**
1. [ ] Executar UPDATE na loja do lojista915b
2. [ ] Definir category = 'varejo'
3. [ ] Definir theme_color = 'azul'
4. [ ] Validar dados salvos

**SQL:**
```sql
UPDATE stores 
SET 
  category = 'varejo',
  theme_color = 'azul',
  slug = 'loja-demo-modelo'
WHERE owner_id = 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63';
```

---

### ✅ Tarefa 1.3: Implementar StoreAppearance.tsx ⏱️ 45min
**Status:** AGUARDANDO 1.1
**Dependência:** Tarefa 1.1 completa

**Ações:**
1. [ ] Reescrever componente com seletor de temas
2. [ ] Adicionar upload de logo
3. [ ] Adicionar mensagem educativa do Portal
4. [ ] Implementar preview em tempo real
5. [ ] Testar salvamento

**Validação:**
- Lojista vê 6 cards de temas
- Pode selecionar e salvar tema
- Pode fazer upload de logo
- Mensagem educativa visível

---

## 🟡 FASE 2: MÓDULOS ADAPTATIVOS - 2h

### ✅ Tarefa 2.1: Lógica Adaptativa no Sidebar ⏱️ 30min
**Status:** AGUARDANDO 1.2
**Dependência:** Loja com category definida

**Ações:**
1. [ ] Editar `StorePanelSidebar.tsx`
2. [ ] Adicionar condicional `if (category === 'varejo')`
3. [ ] Adicionar condicional `if (category === 'alimentacao')`
4. [ ] Ocultar módulos não aplicáveis
5. [ ] Testar alternância Varejo/Alimentação

**Código:**
```tsx
{store?.category === 'varejo' && (
  <>
    <button>Produtos</button>
    <button>Estoque</button>
  </>
)}
{store?.category === 'alimentacao' && (
  <>
    <button>Cardápio</button>
    <button>Horários</button>
  </>
)}
```

**Validação:**
- Loja Varejo: ver "Produtos", NÃO ver "Cardápio"
- Loja Alimentação: ver "Cardápio", NÃO ver "Produtos"

---

### ✅ Tarefa 2.2: Criar Módulo Horários (Alimentação) ⏱️ 45min
**Status:** AGUARDANDO 2.1

**Ações:**
1. [ ] Criar `src/components/StoreModuleSchedule.tsx`
2. [ ] Formulário de horário (seg-dom)
3. [ ] Salvar em JSONB na tabela stores
4. [ ] Integrar no dashboard

**Schema Adicional:**
```sql
ALTER TABLE stores ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}';
```

---

### ✅ Tarefa 2.3: Criar Módulo Estoque (Varejo) ⏱️ 45min
**Status:** AGUARDANDO 2.1

**Ações:**
1. [ ] Criar `src/components/StoreModuleStock.tsx`
2. [ ] Listar produtos com estoque baixo
3. [ ] Permitir ajuste rápido de quantidade
4. [ ] Alertas de estoque zerado

---

## 🟢 FASE 3: MÓDULOS UNIVERSAIS - 4h

### ✅ Tarefa 3.1: Implementar Visão Geral ⏱️ 90min
**Status:** PODE FAZER EM PARALELO

**Ações:**
1. [ ] Editar `StoreOverview.tsx`
2. [ ] Contar produtos/itens cardápio
3. [ ] Contar pedidos (quando tabela existir)
4. [ ] Mostrar status da loja
5. [ ] Adicionar mini-gráfico (opcional)

**Dados Reais:**
- Total produtos: `SELECT COUNT(*) FROM products WHERE store_id = ?`
- Status loja: ativo/pendente/bloqueado
- Última atualização

---

### ✅ Tarefa 3.2: Criar Tabela Orders ⏱️ 30min
**Status:** PODE FAZER EM PARALELO

**Ações:**
1. [ ] Criar `sql/create-orders-table.sql`
2. [ ] Executar no Supabase
3. [ ] Criar RLS policies
4. [ ] Criar índices

**Schema:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES profiles(id),
  items JSONB NOT NULL,
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  delivery_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### ✅ Tarefa 3.3: Implementar Módulo de Pedidos ⏱️ 2h
**Status:** AGUARDANDO 3.2
**Dependência:** Tabela orders criada

**Ações:**
1. [ ] Editar `StoreOrdersModule.tsx`
2. [ ] Listar pedidos por status
3. [ ] Botões de ação (confirmar, cancelar, pronto)
4. [ ] Filtros (data, status)
5. [ ] Detalhes do pedido (modal)

**Validação:**
- Lojista vê lista de pedidos
- Pode mudar status
- Filtros funcionam

---

### ✅ Tarefa 3.4: Implementar Configurações ⏱️ 60min
**Status:** PODE FAZER EM PARALELO

**Ações:**
1. [ ] Editar `StoreSettings.tsx`
2. [ ] Formulário de edição (nome, telefone, endereço)
3. [ ] Salvar alterações
4. [ ] Validações

---

## 🟣 FASE 4: REFINAMENTO - 2h

### ✅ Tarefa 4.1: Aplicar Tema na Loja Pública ⏱️ 60min
**Status:** AGUARDANDO 1.3

**Ações:**
1. [ ] Criar/editar `src/app/lojas/[slug]/page.tsx`
2. [ ] Ler theme_color do banco
3. [ ] Aplicar CSS variables
4. [ ] Testar diferentes temas

---

### ✅ Tarefa 4.2: Testes E2E Completos ⏱️ 60min
**Status:** AGUARDANDO TUDO

**Checklist:**
- [ ] Cadastrar loja Varejo → módulos corretos
- [ ] Cadastrar loja Alimentação → módulos corretos
- [ ] Trocar tema → salva e aplica
- [ ] Upload logo → aparece no painel
- [ ] Criar produto → lista correta
- [ ] Criar item cardápio → lista correta
- [ ] Trocar categoria → módulos mudam

---

## 📊 CRONOGRAMA RESUMIDO

| Fase | Tempo | Prioridade | Pode Começar |
|------|-------|------------|--------------|
| **FASE 1** | 1h | 🔴 CRÍTICO | ✅ AGORA |
| **FASE 2** | 2h | 🟡 ALTA | Após FASE 1 |
| **FASE 3** | 4h | 🟢 MÉDIA | Paralelo |
| **FASE 4** | 2h | 🟣 FINAL | Após tudo |
| **TOTAL** | **9h** | | |

---

## 🎯 MILESTONES

### Milestone 1: Fundação Completa ✅
**ETA:** +1h a partir de AGORA
- [x] Banco atualizado
- [x] Loja com category/theme
- [x] StoreAppearance funcional

### Milestone 2: Adaptativos Funcionando ✅
**ETA:** +3h a partir de AGORA
- [ ] Sidebar mostra módulos por categoria
- [ ] Módulos exclusivos criados

### Milestone 3: Sistema Funcional ✅
**ETA:** +7h a partir de AGORA
- [ ] Todos os módulos implementados
- [ ] Pedidos funcionando

### Milestone 4: Sistema Completo ✅
**ETA:** +9h a partir de AGORA
- [ ] Temas aplicados
- [ ] Tudo testado

---

## ⚡ PRÓXIMA AÇÃO IMEDIATA

**AGORA (você confirma, eu executo):**

### Opção A: AUTOMÁTICO (EU FAÇO TUDO)
```
✅ Eu abro Supabase e executo SQL
✅ Eu edito StoreAppearance.tsx
✅ Eu edito StorePanelSidebar.tsx
✅ Eu testo tudo
```

### Opção B: COLABORATIVO (VOCÊ AJUDA)
```
👉 VOCÊ: Executar SQL no Supabase
✅ EU: Validar schema
✅ EU: Implementar componentes
✅ EU: Testar tudo
```

---

**Qual opção prefere? Diga apenas "A" ou "B" e começo imediatamente!** 🚀
