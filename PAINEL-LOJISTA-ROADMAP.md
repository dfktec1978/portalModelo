# 🚀 ROADMAP DE IMPLEMENTAÇÃO DO PAINEL LOJISTA
**Portal Modelo - Fase Varejo & Alimentação**

Data: 16/01/2026
Status: **EM PLANEJAMENTO**

---

## 📋 RESUMO EXECUTIVO

**Objetivo:** Implementar sistema completo de Painel Lojista adaptativo por categoria (Varejo/Alimentação), com módulos específicos, sistema de temas e governança total do Portal Modelo.

**Situação Atual:**
- ✅ Estrutura básica do painel existe
- ✅ Módulos Produtos e Cardápio funcionais
- ❌ Sistema de categorias não persiste no banco
- ❌ Temas não implementados
- ❌ Módulos adaptativos não funcionam
- ❌ 4 módulos são placeholders vazios

---

## 🎯 FASES DE IMPLEMENTAÇÃO

### **FASE 1: FUNDAÇÃO DO SISTEMA** 🔴 CRÍTICO

**Objetivo:** Corrigir banco de dados e estrutura base

#### Tarefa 1.1: Atualizar Schema do Banco de Dados
**Prioridade:** CRÍTICA
**Arquivo:** `sql/add-store-columns.sql` ✅ CRIADO
**Ações:**
1. Executar SQL no Supabase (adicionar colunas)
2. Testar constraints de validação
3. Verificar índices criados
4. Atualizar lojas existentes com valores default

**Validação:**
```bash
node check-stores-schema.js
# Deve mostrar: category, theme_color, logo_url, description, slug, etc.
```

**Tempo Estimado:** 30 minutos
**Bloqueante para:** Tudo

---

#### Tarefa 1.2: Criar Sistema de Temas
**Prioridade:** CRÍTICA
**Arquivo:** `src/lib/themes.ts` ✅ CRIADO
**Ações:**
1. Definir 6 temas (azul, verde, preto-branco, vermelho, roxo, laranja)
2. Criar função `getTheme()` e `applyThemeToStore()`
3. Documentar cores e aplicação

**Validação:**
- Importar `themes.ts` sem erros
- `getTheme('azul')` retorna config correta

**Tempo Estimado:** CONCLUÍDO ✅
**Bloqueante para:** Aparência da Loja

---

#### Tarefa 1.3: Atualizar StoreEditor para Salvar Categoria
**Prioridade:** ALTA
**Arquivo:** `src/components/StoreEditor.tsx`
**Ações:**
1. Garantir que `category` é enviada no payload
2. Validar salvamento no banco
3. Testar criação de loja Varejo
4. Testar criação de loja Alimentação

**Validação:**
```sql
SELECT id, store_name, category FROM stores;
-- Categoria deve aparecer salva
```

**Tempo Estimado:** 1 hora
**Dependências:** Tarefa 1.1 concluída

---

### **FASE 2: MÓDULO APARÊNCIA DA LOJA** 🟡 ALTA

**Objetivo:** Permitir lojista escolher tema e upload de logo

#### Tarefa 2.1: Implementar StoreAppearance Completo
**Prioridade:** ALTA
**Arquivo:** `src/components/StoreAppearance.tsx`
**Features:**
- Seletor visual de temas (6 cards com preview)
- Upload de logo (Storage do Supabase)
- Preview em tempo real
- Mensagem educativa do Portal Modelo
- Botão "Salvar Aparência"

**Código Base:**
```tsx
"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getThemesList, ThemeColor } from "@/lib/themes";
import { useImageUpload } from "@/lib/useImageUpload";

export default function StoreAppearance({ store, onStoreUpdated }: { 
  store: any; 
  onStoreUpdated?: (s: any) => void 
}) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeColor>(
    store?.theme_color || 'azul'
  );
  const [logo, setLogo] = useState(store?.logo_url || '');
  const [saving, setSaving] = useState(false);
  const themes = getThemesList();
  const { uploadImage, uploading } = useImageUpload({ 
    bucket: 'stores', 
    folder: 'logos' 
  });

  // Implementar lógica de upload e salvamento
}
```

**Validação:**
1. Selecionar tema "Verde" → salvar → recarregar → tema permanece
2. Upload de logo → aparece preview
3. Mensagem Portal Modelo visível

**Tempo Estimado:** 3 horas
**Dependências:** Tarefa 1.1, 1.2

---

#### Tarefa 2.2: Aplicar Tema na Página da Loja
**Prioridade:** MÉDIA
**Arquivo:** `src/app/lojas/[slug]/page.tsx` (criar se não existir)
**Ações:**
1. Ler `theme_color` da loja
2. Aplicar CSS variables com `applyThemeToStore()`
3. Testar cores em botões, cards, textos

**Validação:**
- Abrir loja com tema Verde → cores verdes aplicadas
- Abrir loja com tema Vermelho → cores vermelhas aplicadas

**Tempo Estimado:** 2 horas
**Dependências:** Tarefa 2.1

---

### **FASE 3: MÓDULOS ADAPTATIVOS** 🟢 MÉDIA

**Objetivo:** Mostrar/ocultar módulos baseado na categoria

#### Tarefa 3.1: Implementar Lógica Adaptativa no Sidebar
**Prioridade:** MÉDIA
**Arquivo:** `src/components/StorePanelSidebar.tsx`
**Ações:**
1. Ler `store.category`
2. Se `varejo`: mostrar "Produtos", "Estoque", "Variações"
3. Se `alimentacao`: mostrar "Cardápio", "Adicionais", "Horários"
4. Sempre mostrar: Visão Geral, Pedidos, Financeiro, Aparência, Configurações

**Código Base:**
```tsx
const isVarejo = store?.category === 'varejo';
const isAlimentacao = store?.category === 'alimentacao';

{isVarejo && (
  <button onClick={() => setView('products')}>Produtos</button>
)}

{isAlimentacao && (
  <button onClick={() => setView('menu')}>Cardápio</button>
)}
```

**Validação:**
1. Loja Varejo → ver botão "Produtos", NÃO ver "Cardápio"
2. Loja Alimentação → ver botão "Cardápio", NÃO ver "Produtos"

**Tempo Estimado:** 2 horas
**Dependências:** Tarefa 1.3

---

#### Tarefa 3.2: Criar Módulos Exclusivos de Alimentação
**Prioridade:** BAIXA
**Arquivos Novos:**
- `src/components/StoreModuleAdditionals.tsx` (adicionais)
- `src/components/StoreModuleSchedule.tsx` (horários)
- `src/components/StoreModuleDelivery.tsx` (entrega/retirada)

**Tempo Estimado:** 4 horas
**Dependências:** Tarefa 3.1

---

#### Tarefa 3.3: Criar Módulos Exclusivos de Varejo
**Prioridade:** BAIXA
**Arquivos Novos:**
- `src/components/StoreModuleStock.tsx` (gestão de estoque)
- `src/components/StoreModuleVariants.tsx` (cores/tamanhos)

**Tempo Estimado:** 3 horas
**Dependências:** Tarefa 3.1

---

### **FASE 4: MÓDULOS UNIVERSAIS** 🟢 MÉDIA

**Objetivo:** Implementar módulos que aparecem para todos

#### Tarefa 4.1: Implementar Visão Geral (Overview)
**Prioridade:** MÉDIA
**Arquivo:** `src/components/StoreOverview.tsx`
**Features:**
- Total de produtos/itens cardápio
- Pedidos últimos 7 dias
- Faturamento estimado (se houver)
- Status da loja (ativa/pendente)
- Gráfico simples (opcional)

**Tempo Estimado:** 4 horas
**Dependências:** Nenhuma (pode fazer paralelo)

---

#### Tarefa 4.2: Implementar Módulo de Pedidos
**Prioridade:** ALTA (funcionalidade core)
**Arquivo:** `src/components/StoreOrdersModule.tsx`
**Features:**
- Listar pedidos (tabela `orders` - criar se não existir)
- Status: Pendente, Confirmado, Preparando, Pronto, Entregue, Cancelado
- Botões de ação (confirmar, cancelar, marcar pronto)
- Filtros (data, status)

**Schema Banco:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES profiles(id),
  items JSONB NOT NULL,
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tempo Estimado:** 6 horas
**Dependências:** Criar tabela `orders`

---

#### Tarefa 4.3: Implementar Módulo Financeiro
**Prioridade:** BAIXA (pode ser MVP simples)
**Arquivo:** `src/components/StoreFinanceModule.tsx`
**Features MVP:**
- Total vendas mês atual
- Total vendas mês anterior
- Pedidos pagos vs. pendentes
- Link para relatório completo (futuramente)

**Tempo Estimado:** 3 horas
**Dependências:** Tarefa 4.2 (tabela orders)

---

#### Tarefa 4.4: Implementar Configurações da Loja
**Prioridade:** MÉDIA
**Arquivo:** `src/components/StoreSettings.tsx`
**Features:**
- Editar nome da loja
- Editar telefone/WhatsApp
- Editar endereço
- Ativar/desativar loja temporariamente
- Horário de funcionamento (para alimentação)
- Taxa de entrega (para alimentação)

**Tempo Estimado:** 4 horas
**Dependências:** Nenhuma

---

### **FASE 5: POLIMENTO E UX** 🟣 FINAL

#### Tarefa 5.1: Adicionar Mensagens Educativas
**Prioridade:** MÉDIA
**Locais:**
- Aparência: "O Portal Modelo adapta automaticamente..."
- Produtos/Cardápio: Dicas de boas práticas
- Pedidos: Tutorial de gestão

**Tempo Estimado:** 2 horas

---

#### Tarefa 5.2: Criar Página de Preview da Loja
**Prioridade:** ALTA
**Arquivo:** `src/app/lojas/[slug]/page.tsx`
**Features:**
- Renderizar loja pública
- Aplicar tema escolhido
- Mostrar logo
- Layout diferente por categoria

**Tempo Estimado:** 5 horas

---

#### Tarefa 5.3: Testes E2E
**Prioridade:** ALTA
**Ações:**
1. Cadastrar loja Varejo → verificar módulos
2. Cadastrar loja Alimentação → verificar módulos
3. Trocar tema → verificar aplicação
4. Upload logo → verificar storage
5. Criar produto → verificar listagem
6. Criar item cardápio → verificar listagem

**Tempo Estimado:** 3 horas

---

## 📊 CRONOGRAMA ESTIMADO

| Fase | Tarefas | Tempo Total | Prioridade |
|------|---------|-------------|------------|
| **FASE 1** | 1.1, 1.2, 1.3 | ~1.5h | 🔴 CRÍTICO |
| **FASE 2** | 2.1, 2.2 | ~5h | 🟡 ALTA |
| **FASE 3** | 3.1, 3.2, 3.3 | ~9h | 🟢 MÉDIA |
| **FASE 4** | 4.1, 4.2, 4.3, 4.4 | ~17h | 🟢 MÉDIA |
| **FASE 5** | 5.1, 5.2, 5.3 | ~10h | 🟣 FINAL |
| **TOTAL** | | **~42.5 horas** | |

**Estimativa de Conclusão:** 5-7 dias úteis (trabalhando 6-8h/dia)

---

## 🎯 MILESTONES

### **Milestone 1: MVP Funcional** (Fases 1 + 2.1)
- ✅ Banco atualizado
- ✅ Categoria salva corretamente
- ✅ Lojista escolhe tema
- ✅ Logo upload funciona
- **ETA:** 1 dia

### **Milestone 2: Módulos Adaptativos** (Fase 3.1)
- ✅ Sidebar mostra módulos por categoria
- ✅ Lojista vê apenas o relevante
- **ETA:** +1 dia

### **Milestone 3: Pedidos Funcionais** (Fase 4.2)
- ✅ Tabela orders criada
- ✅ Lojista gerencia pedidos
- **ETA:** +2 dias

### **Milestone 4: Sistema Completo** (Todas as fases)
- ✅ Todos os módulos funcionais
- ✅ Preview da loja pública
- ✅ Temas aplicados
- **ETA:** 5-7 dias

---

## ⚠️ RISCOS E DEPENDÊNCIAS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Schema banco desatualizado | Alta | Crítico | Executar SQL imediatamente |
| Storage Supabase não configurado | Média | Alto | Testar upload antes de implementar |
| Tabela orders não existe | Alta | Médio | Criar schema completo Fase 4 |
| Conflito de slug (lojas duplicadas) | Baixa | Médio | Adicionar unique constraint |

---

## 🔧 PRÓXIMOS PASSOS IMEDIATOS

### **AGORA (próximos 30 minutos):**
1. ✅ Executar `sql/add-store-columns.sql` no Supabase
2. ✅ Validar com `node check-stores-schema.js`
3. ✅ Atualizar loja existente (lojista915b) com categoria "varejo"

### **HOJE:**
1. Implementar StoreAppearance.tsx completo
2. Testar seleção de tema
3. Testar upload de logo

### **AMANHÃ:**
1. Implementar lógica adaptativa no Sidebar
2. Criar módulos exclusivos de Alimentação
3. Testar fluxo completo Varejo vs. Alimentação

---

## 📝 NOTAS IMPORTANTES

1. **Governança Total:** Lojista NÃO escolhe layout, apenas categoria/tema
2. **Mensagens Educativas:** Sempre explicar que Portal controla experiência
3. **Validações:** Category e theme_color devem ter constraints no banco
4. **Unique Slugs:** Adicionar constraint unique no slug (evitar duplicatas)
5. **RLS Policies:** Garantir que lojista só edita sua própria loja

---

## 🎨 REFERÊNCIAS DE DESIGN

**Texto Padrão (Aparência):**
> "O Portal Modelo adapta automaticamente a apresentação da sua loja para oferecer a melhor experiência de compra aos seus clientes, com base na categoria escolhida. Você pode personalizar cores e logo, mas o layout é otimizado pela plataforma."

**Temas Disponíveis:**
- Azul Oceano (padrão Portal Modelo)
- Verde Natureza
- Preto & Branco (minimalista)
- Vermelho Energia
- Roxo Elegante
- Laranja Vibrante

---

**FIM DO ROADMAP**
Última atualização: 16/01/2026
