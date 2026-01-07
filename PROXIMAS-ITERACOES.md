# 🚀 Próximas Iterações - Roadmap

## 📋 Fase 5: CRUD Lojas (Próximo)

### Objetivo

Implementar sistema completo de CRUD para lojas, permitindo que lojistas criem e gerenciem suas lojas.

### Tasks

#### 1. Query Layer (`src/lib/storeQueries.ts`)

```typescript
// Funções necessárias:
- createStore(userId, data)
- listStores(filters?)
- getStore(id)
- getMyStore(userId)
- updateStore(id, userId, data)
- deleteStore(id, userId)
- searchStores(query)
- getStoreStats(userId)
```

#### 2. Páginass

```
✅ /lojas - Listagem pública
✅ /lojas/nova - Criar loja
✅ /lojas/[id] - Detalhes
✅ /lojas/[id]/editar - Editar
✅ /dashboard/minha-loja - Gerenciar
```

#### 3. Funcionalidades

- [x] Campos: Nome, descrição, logo, banner, telefone, endereço, horário, categoria
- [x] Upload de imagens (logo + banner)
- [x] Validação de dados
- [x] Soft delete
- [x] Busca e filtros

#### 4. Integração

- [x] Link no Header
- [x] Link no Dashboard
- [x] Vincular classificados à loja

### Tempo Estimado

⏱️ 3-4 horas

### Checklist

- [ ] Query layer criada
- [ ] Testes de query passando
- [ ] 5 páginas criadas
- [ ] Upload de imagens integrado
- [ ] Links no Header/Dashboard
- [ ] Testes de CRUD completo

---

## 📋 Fase 6: CRUD Profissionais (Depois)

### Objetivo

Implementar sistema de profissionais (freelancers, prestadores de serviço).

### Estrutura Similar a Lojas

- Query layer com 8 funções
- 5 páginas CRUD
- Upload de fotos
- Busca e filtros
- Validação de dados

### Campos

- Nome, descrição, foto, especialidades
- Telefone, whatsapp, email
- Endereço, horário, taxa
- Avaliação (integrar depois)

### Tempo Estimado

⏱️ 2-3 horas (similar a lojas)

---

## 🎨 Fase 7: Features Avançadas

### 7.1 Sistema de Ratings (Simples)

```
- Tabela ratings (id, user_id, target_id, target_type, stars, comment)
- Componente Stars (1-5)
- Página de reviews
- Agregação de média
```

### 7.2 Favoritos

```
- Tabela favorites (id, user_id, item_id, item_type)
- Button heart em detalhes
- Página /dashboard/favoritos
- Badge no header (contador)
```

### 7.3 Notificações por Email

```
- Queue de emails (Bull)
- Template HTML
- Eventos: novo classificado, loja seguida, profissional contratado
- Dashboard de notificações
```

### 7.4 Pagamentos (Pix)

```
- Integração Easypix ou similiar
- QR Code gerado
- Webhook para confirmação
- Dashboard de transações
```

---

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
npm run dev           # Inicia servidor (Turbopack)
npm run lint          # Lint TypeScript
npm run build         # Build para produção
npm start             # Rodas build em produção
```

### Testes

```bash
node scripts/get-test-user.js                    # Obter usuário válido
node scripts/create-storage-bucket.js            # Criar bucket
node scripts/test-classified-complete.js         # Testar CRUD classificados
```

### Database

```bash
# Ver tabelas
supabase db list

# Rodar migrations
supabase migration up

# Seed data
node scripts/seed-data.js
```

---

## 📚 Padrões a Seguir

### Query Layer

```typescript
// Sempre retornar { data, error }
export async function queryFunction(...) {
  const { data, error } = await supabase
    .from("table")
    .select("*")
    .eq("field", value);

  return { data, error };
}
```

### Componentes

```typescript
// "use client" para interatividade
// Hooks de auth ao topo
// Props com interface
// Error boundaries
// Loading states
```

### Páginas

```typescript
// "use client" se usar hooks
// Protegidas com useAuth() check
// Loading state durante fetch
// Error handling com try/catch
// Redirect se necessário
```

---

## 🗺️ Mapa de Navegação (Futuro)

```
Home /
├── Classificados /classificados
├── Lojas /lojas (novo)
├── Profissionais /profissionais (novo)
└── Notícias /noticias

Dashboard /dashboard (protegido)
├── Meus Classificados
├── Minha Loja (novo)
├── Meus Serviços (novo)
├── Favoritos (novo)
└── Notificações (novo)

Admin /admin (futuro)
├── Usuários
├── Relatórios
└── Configurações
```

---

## 🎯 Milestones

### v1.0 - MVP (✅ 60% completo)

- [x] Autenticação
- [x] Classificados CRUD
- [x] Upload de imagens
- [ ] Lojas CRUD (próximo)
- [ ] Profissionais CRUD

### v1.1 - Features Sociais

- [ ] Favoritos
- [ ] Ratings/Reviews
- [ ] Seguir usuários/lojas
- [ ] Feed de atividades

### v1.2 - Comercial

- [ ] Pagamentos (Pix)
- [ ] Carrinhos
- [ ] Pedidos
- [ ] Notificações

### v2.0 - Mobile

- [ ] React Native app
- [ ] PWA offline support
- [ ] Push notifications

---

## 💰 Custos Estimados

### Supabase (Free tier suficiente por enquanto)

- [x] Database: 500MB (gratuito)
- [x] Storage: 1GB (gratuito)
- [x] Auth: Unlimited users (gratuito)
- [ ] Upgrade para Pro quando: >1M requests/mês

### Vercel Hosting

- [x] Free tier: OK para MVP
- [ ] Pro: $20/mês (quando tráfego aumentar)

### Domínio & Email

- [ ] Domínio: ~R$50/ano
- [ ] Email corporativo: ~R$10-20/mês

---

## 📖 Referências de Código

### Padrão Query (já existe)

Ver: `src/lib/classifiedQueries.ts` (170 linhas)

### Padrão Componente React

Ver: `src/components/ImageUpload.tsx` (207 linhas)

### Padrão Página CRUD

Ver: `src/app/classificados/novo/page.tsx` (256 linhas)

### Padrão AuthContext

Ver: `src/lib/AuthContext.tsx` (95 linhas)

---

## ✅ Checklist Antes de Iniciar Fase 5

- [x] Servidor rodando (npm run dev)
- [x] Tests de classificados passando
- [x] Upload funcionando
- [x] Auth funcionando
- [x] Documentação atualizada
- [ ] Planejar estrutura de Stores
- [ ] Fazer backup do código

---

## 🚀 Como Continuar

1. **Crie um novo branch:**

   ```bash
   git checkout -b feat/crud-lojas
   ```

2. **Crie `src/lib/storeQueries.ts`** com 8 funções (copie padrão de classified)

3. **Crie pastas de páginas:**

   ```
   src/app/lojas/
   src/app/lojas/nova/
   src/app/lojas/[id]/
   src/app/lojas/[id]/editar/
   src/app/dashboard/minha-loja/
   ```

4. **Comece pelas páginas de listagem** (mais simples)

5. **Integre upload de imagens** (já sabe fazer!)

6. **Teste tudo com scripts**

7. **Commit & push** quando estiver pronto

---

## 📞 Dúvidas Frequentes

**P: Como adicionar novo campo em um formulário?**
A: Adicione no `formData` state, no formulário HTML, e no objeto enviado para query.

**P: Como fazer validação customizada?**
A: Adicione `if (condition) { setError(...) ; return; }` antes de chamar query.

**P: Como adicionar nova rota?**
A: Crie pasta em `src/app/` com `page.tsx` dentro.

**P: Como proteger uma página?**
A: Use `useAuth()` hook ao topo e redirecione se `!user`.

**P: Como fazer query ao banco?**
A: Use `supabase.from("table").select()` ou crie função em `lib/queries.ts`.

---

**Última atualização:** 8 de dezembro de 2025  
**Próxima fase:** CRUD Lojas  
**Status:** Pronto para continuar! 🚀
