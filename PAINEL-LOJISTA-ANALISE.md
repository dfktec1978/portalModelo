# 📊 ANÁLISE COMPLETA - PAINEL LOJISTA
**Portal Modelo - Estado Atual vs. Especificação**

Data: 16/01/2026

---

## ✅ O QUE JÁ EXISTE E FUNCIONA

### **1. Estrutura Base do Painel**
- ✅ Roteamento: `/dashboard`
- ✅ Autenticação: proteção de rotas implementada
- ✅ Autorização: apenas lojistas com status `active` ou `pending`
- ✅ Layout: sidebar + área de conteúdo
- ✅ Sistema de views: alternância entre módulos

**Arquivos:**
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) - Página principal
- [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx) - Layout wrapper
- [src/components/StorePanelSidebar.tsx](src/components/StorePanelSidebar.tsx) - Navegação

### **2. Módulos Funcionais (2/7)**

#### ✅ **Produtos (Varejo)** - FUNCIONAL
- Arquivo: [src/components/StoreModuleProducts.tsx](src/components/StoreModuleProducts.tsx)
- Features:
  - Listar produtos do banco
  - Adicionar novo produto
  - Editar produto existente
  - Deletar produto
  - Upload de imagens
  - Sistema de variantes (tamanhos, cores)
  - Controle de estoque
- **Status:** 90% completo

#### ✅ **Cardápio (Alimentação)** - FUNCIONAL
- Arquivo: [src/components/StoreModuleMenu.tsx](src/components/StoreModuleMenu.tsx)
- Features:
  - Listar itens do cardápio
  - Adicionar item
  - Editar item
  - Deletar item
  - Preços
- **Status:** 70% completo (falta categorias, adicionais)

### **3. Sistema de Categorias (Parcial)**
- ✅ Campo existe no frontend: [StoreEditor.tsx](src/components/StoreEditor.tsx#L25)
- ✅ Valores corretos: `"varejo"` | `"alimentacao"`
- ❌ **NÃO PERSISTE NO BANCO** - coluna `category` não existe na tabela `stores`

---

## ❌ O QUE FALTA / NÃO FUNCIONA

### **1. BANCO DE DADOS - GAPS CRÍTICOS**

#### Schema Atual da Tabela `stores`:
```
id, owner_id, store_name, phone, address, status, created_at, approved_at
```

#### **Colunas Faltando:**
| Coluna | Tipo | Propósito | Prioridade |
|--------|------|-----------|------------|
| `category` | TEXT | varejo \| alimentacao | 🔴 CRÍTICO |
| `theme_color` | TEXT | azul \| verde \| vermelho... | 🔴 CRÍTICO |
| `logo_url` | TEXT | URL da logo no Storage | 🟡 ALTA |
| `description` | TEXT | Descrição da loja | 🟢 MÉDIA |
| `slug` | TEXT | URL amigável (/lojas/slug) | 🟢 MÉDIA |
| `external_url` | TEXT | Site externo (opcional) | 🟣 BAIXA |
| `gallery` | JSONB | Galeria de imagens | 🟣 BAIXA |

**Consequência:** Sistema de categorias e temas NÃO FUNCIONA porque os dados não são salvos.

---

### **2. SISTEMA DE TEMAS - NÃO IMPLEMENTADO**

#### Status Atual:
- ❌ Coluna `theme_color` não existe no banco
- ❌ Componente `StoreAppearance` é apenas placeholder (7 linhas)
- ❌ Nenhuma lógica de aplicação de cores
- ❌ Sem seleção visual de temas

#### Especificação vs. Realidade:
| Especificação | Implementado |
|---------------|--------------|
| 6 temas pré-definidos | ❌ Nenhum |
| Azul, Verde, Preto-Branco, Vermelho, Roxo, Laranja | ❌ Nenhum |
| Seletor visual com preview | ❌ Não existe |
| Aplicação automática nas páginas | ❌ Não existe |
| Lojista NÃO pode escolher cores customizadas | ✅ Correto (não há escolha) |

**Solução Criada:**
- ✅ Arquivo: [src/lib/themes.ts](src/lib/themes.ts) - Config completa de 6 temas
- ⏳ Pendente: implementar componente `StoreAppearance`

---

### **3. MÓDULOS ADAPTATIVOS - NÃO FUNCIONAM**

#### Especificação:
> **Varejo:** Produtos, Categorias, Estoque, Variações  
> **Alimentação:** Cardápio, Categorias, Adicionais, Combos, Horários, Entrega

#### Realidade:
- ❌ Sidebar mostra TODOS os módulos para TODOS os lojistas
- ❌ Não há lógica condicional baseada em `category`
- ❌ Módulos exclusivos não existem (Adicionais, Horários, Estoque)

**Código Atual:**
```tsx
// StorePanelSidebar.tsx - linha 156
<button onClick={() => setView('appearance')}>Aparência</button>
<button onClick={() => setView('products')}>Produtos</button>
<button onClick={() => setView('menu')}>Cardápio</button>
// ❌ Nenhuma condicional por categoria
```

**Código Necessário:**
```tsx
{store?.category === 'varejo' && (
  <button onClick={() => setView('products')}>Produtos</button>
)}
{store?.category === 'alimentacao' && (
  <button onClick={() => setView('menu')}>Cardápio</button>
)}
```

---

### **4. MÓDULOS PLACEHOLDERS (5/7 não funcionam)**

| Módulo | Status | Arquivo | Problema |
|--------|--------|---------|----------|
| **Visão Geral** | 🟡 Placeholder | [StoreOverview.tsx](src/components/StoreOverview.tsx) | Números estáticos (0, 0, 0) |
| **Pedidos** | 🟡 Placeholder | [StoreOrdersModule.tsx](src/components/StoreOrdersModule.tsx) | Apenas texto |
| **Financeiro** | 🟡 Placeholder | [StoreFinanceModule.tsx](src/components/StoreFinanceModule.tsx) | Apenas texto |
| **Aparência** | 🔴 Vazio | [StoreAppearance.tsx](src/components/StoreAppearance.tsx) | 7 linhas, sem funcionalidade |
| **Configurações** | 🟡 Placeholder | [StoreSettings.tsx](src/components/StoreSettings.tsx) | Apenas texto |

**Código Típico (StoreOverview):**
```tsx
<div className="text-2xl font-bold">0</div>
<div className="text-sm text-gray-600">Anúncios</div>
// ❌ Hardcoded, sem dados reais
```

---

### **5. UPLOAD DE LOGO - NÃO INTEGRADO**

#### Status:
- ✅ Hook `useImageUpload` existe e funciona
- ✅ Storage Supabase configurado (bucket `stores`)
- ❌ Componente `StoreAppearance` não usa o hook
- ❌ Coluna `logo_url` não existe no banco
- ❌ Logo não é exibida no painel ou na loja pública

---

### **6. MÓDULOS EXCLUSIVOS - NÃO EXISTEM**

#### Faltam para **Alimentação:**
- ❌ `StoreModuleAdditionals.tsx` - Adicionais (queijo extra, bacon, etc)
- ❌ `StoreModuleSchedule.tsx` - Horários de funcionamento
- ❌ `StoreModuleDelivery.tsx` - Config de entrega/retirada
- ❌ `StoreModuleCombos.tsx` - Combos promocionais

#### Faltam para **Varejo:**
- ❌ `StoreModuleStock.tsx` - Gestão de estoque (separado de Produtos)
- ❌ `StoreModuleCategories.tsx` - Categorias de produtos

---

### **7. SISTEMA DE PEDIDOS - NÃO EXISTE**

#### Problemas:
- ❌ Tabela `orders` não existe no banco
- ❌ Módulo `StoreOrdersModule` é placeholder
- ❌ Sem fluxo de checkout
- ❌ Sem notificações de pedidos
- ❌ Sem gestão de status (Pendente → Confirmado → Entregue)

**Necessário:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES profiles(id),
  items JSONB,
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 MELHORIAS NECESSÁRIAS

### **1. GOVERNANÇA E MENSAGENS EDUCATIVAS**

#### Problema Atual:
- ❌ Sem mensagens explicando que Portal controla layout
- ❌ Pode parecer que lojista tem controle total
- ❌ Não há texto padrão da especificação

#### Solução:
Adicionar em `StoreAppearance`:
```tsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
  <p className="text-sm text-gray-700">
    O Portal Modelo adapta automaticamente a apresentação da sua loja 
    para oferecer a melhor experiência de compra aos seus clientes, 
    com base na categoria escolhida.
  </p>
</div>
```

---

### **2. VALIDAÇÕES NO BANCO**

#### Faltam Constraints:
```sql
-- Validar valores de category
ALTER TABLE stores ADD CONSTRAINT stores_category_check 
  CHECK (category IN ('varejo', 'alimentacao'));

-- Validar valores de theme_color
ALTER TABLE stores ADD CONSTRAINT stores_theme_check 
  CHECK (theme_color IN ('azul', 'verde', 'preto-branco', 'vermelho', 'roxo', 'laranja'));

-- Garantir slug único
ALTER TABLE stores ADD CONSTRAINT stores_slug_unique 
  UNIQUE (slug);
```

---

### **3. RLS POLICIES**

#### Verificar Políticas:
- ✅ Lojista pode editar apenas sua loja: `owner_id = auth.uid()`
- ⚠️ Admin pode editar qualquer loja (via API, não direto)
- ✅ Público pode ler lojas ativas: `status = 'active'`

---

### **4. INTEGRAÇÃO STORAGE**

#### Buckets Necessários:
- `stores/logos` - Logos das lojas
- `stores/galleries` - Fotos da loja
- `products/images` - Imagens de produtos

#### Policies de Upload:
```sql
-- Permitir lojista fazer upload apenas para sua loja
CREATE POLICY "lojista_upload_logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'stores' AND 
    (storage.foldername(name))[1] = 'logos'
  );
```

---

## 🎯 CORREÇÕES PRIORITÁRIAS

### **🔴 PRIORIDADE CRÍTICA (Hoje)**

1. **Executar SQL:** [sql/add-store-columns.sql](sql/add-store-columns.sql)
   - Adiciona: `category`, `theme_color`, `logo_url`, etc.
   - Tempo: 5 minutos
   - Bloqueante: Todo o resto depende disso

2. **Validar Schema:**
   ```bash
   node check-stores-schema.js
   # Deve mostrar 15+ colunas
   ```

3. **Atualizar Loja Existente:**
   ```sql
   UPDATE stores 
   SET category = 'varejo', theme_color = 'azul' 
   WHERE owner_id = 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63';
   -- lojista915b@hotmail.com
   ```

---

### **🟡 PRIORIDADE ALTA (Esta Semana)**

4. **Implementar StoreAppearance Completo**
   - Seletor de 6 temas
   - Upload de logo
   - Preview em tempo real
   - Mensagem educativa
   - Tempo: 3 horas

5. **Implementar Módulos Adaptativos**
   - Condicional no `StorePanelSidebar`
   - Mostrar Produtos OU Cardápio (não ambos)
   - Tempo: 2 horas

---

### **🟢 PRIORIDADE MÉDIA (Próxima Semana)**

6. **Criar Tabela Orders**
7. **Implementar StoreOrdersModule**
8. **Implementar StoreOverview com dados reais**
9. **Criar módulos exclusivos (Adicionais, Horários, Estoque)**

---

### **🟣 PRIORIDADE BAIXA (Futuro)**

10. **Relatórios financeiros**
11. **Gráficos e analytics**
12. **Combos e promoções**
13. **Integração com delivery**

---

## 📈 MÉTRICAS DE PROGRESSO

| Aspecto | Completo | Total | % |
|---------|----------|-------|---|
| **Banco de Dados** | 8 cols | 15 cols | 53% |
| **Módulos Base** | 2 | 7 | 29% |
| **Módulos Adaptativos** | 0 | 6 | 0% |
| **Sistema de Temas** | Config | UI | 50% |
| **Upload de Imagens** | Hook | Integração | 50% |
| **TOTAL GERAL** | - | - | **35%** |

---

## 🚀 PRÓXIMA AÇÃO

**AGORA (próximos 15 minutos):**
1. Abrir Supabase SQL Editor
2. Copiar conteúdo de `sql/add-store-columns.sql`
3. Executar
4. Validar com `node check-stores-schema.js`

**Resultado Esperado:**
```
📊 Colunas encontradas na tabela stores:
──────────────────────────────────────────────────
  • id
  • owner_id
  • store_name
  • phone
  • address
  • status
  • created_at
  • approved_at
  • category           ✨ NOVO
  • theme_color        ✨ NOVO
  • logo_url          ✨ NOVO
  • description       ✨ NOVO
  • slug              ✨ NOVO
  • external_url      ✨ NOVO
  • gallery           ✨ NOVO
──────────────────────────────────────────────────
Total de colunas: 15
```

---

**FIM DA ANÁLISE**
