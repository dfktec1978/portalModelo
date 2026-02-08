# 🔗 URLS DE ACESSO - Sistema Operacional

**Data:** 15 de janeiro de 2026  
**Status:** ✅ PRONTO PARA USAR

---

## 🏠 URLs Principais

### Development (Local)
```
URL Base:        http://localhost:3000
Admin Panel:     http://localhost:3000/admin/usuarios
Dashboard:       http://localhost:3000/dashboard
Home:            http://localhost:3000
```

### Production (Vercel)
```
URL Base:        https://seu-projeto.vercel.app
Admin Panel:     https://seu-projeto.vercel.app/admin/usuarios
Dashboard:       https://seu-projeto.vercel.app/dashboard
Home:            https://seu-projeto.vercel.app
```

---

## 👤 Dados de Teste

### Admin (para testar aprovação)
```
Email:    admin@example.com
Senha:    [Seu password]
Role:     admin
Status:   active
```

### Lojista (para testar dashboard)
```
Email:    lojista@example.com
Senha:    [Seu password]
Role:     lojista
Status:   pending (até ser aprovado)
```

### Cliente (para testar UX básica)
```
Email:    cliente@example.com
Senha:    [Seu password]
Role:     cliente
Status:   active
```

---

## 📋 Rotas da Aplicação

### Públicas (Sem autenticação)
```
/                    → Home/Landing page
/login               → Login
/registro            → Registro de usuário
/lojas/[slug]        → Página pública da loja
/classificados       → Listagem de classificados
```

### Autenticadas - Cliente
```
/dashboard           → Painel do cliente
                       ├─ Editar perfil
                       └─ Publicar classificados
/classificados/novo  → Criar novo classificado
/perfil              → Dados pessoais
```

### Autenticadas - Lojista
```
/dashboard           → Painel do lojista (se active)
                       ├─ Visão geral
                       ├─ Produtos
                       ├─ Pedidos
                       ├─ Financeiro
                       └─ Configurações
                       
(OU)

/dashboard           → Mensagem "Cadastro em Análise" (se pending)
```

### Autenticadas - Admin
```
/admin               → Painel administrativo
/admin/usuarios      → ⭐ Aprovação de usuários
/admin/lojas         → Gerenciar lojas
/admin/classificados → Gerenciar classificados
/admin/profissionais → Gerenciar profissionais
/admin/noticias      → Gerenciar notícias
```

---

## 🎯 Fluxo de Teste Completo

### 1. Registrar Lojista
```
1. Acesse:     http://localhost:3000/registro
2. Selecione:  "Sou lojista"
3. Preencha:   Email, Senha, Nome da Loja
4. Clique:     "Registrar"
5. Resultado:  Status = "pending" ⏳
```

### 2. Admin Aprova
```
1. Faça login como admin
2. Acesse:     http://localhost:3000/admin/usuarios
3. Procure:    Lojista registrado
4. Clique:     [✅ Aprovar Lojista]
5. Resultado:  Status = "active" ✅
```

### 3. Lojista Vê Painel
```
1. Faça logout
2. Login como lojista
3. Acesse:     http://localhost:3000/dashboard
4. Resultado:  
   ANTES:      "⏳ Cadastro em Análise"
   DEPOIS:     "📊 Painel - Nome Loja" ✨
5. Verifique:  Todas as abas visíveis
```

### 4. Dashboard em Tempo Real
```
1. Abra 2 abas:
   Aba 1: http://localhost:3000/admin/usuarios
   Aba 2: http://localhost:3000/dashboard
2. Em Aba 1:  Aprove o lojista
3. Em Aba 2:  Veja atualizar em < 1s
              (Sem recarregar!)
```

---

## 🔐 Endpoints da API

### Admin Endpoints
```
POST /api/admin/usuarios
├─ Body: { userId, action: 'approve', approveLoja: true }
├─ Response: { success: true, message: "..." }
└─ Status: 200 (sucesso) ou 500 (erro)

POST /api/admin/usuarios
├─ Body: { userId, action: 'changeRole', role: 'lojista' }
├─ Response: { success: true, data: {...} }
└─ Status: 200 (sucesso) ou 500 (erro)
```

### RPC Functions (Supabase)
```
approve_user(p_user_id: uuid, p_approve_store: boolean)
├─ Retorna: { success: true, message: "..." }
├─ Efeito: Update profiles + stores
└─ Permissão: SECURITY DEFINER

change_user_role(p_user_id: uuid, p_new_role: text)
├─ Retorna: { success: true, message: "..." }
├─ Efeito: Update profiles.role
└─ Permissão: SECURITY DEFINER
```

---

## 🧪 URLs de Debug/Teste

### Verificar SQL
```
Supabase → SQL Editor

SELECT proname FROM pg_proc 
WHERE proname IN ('approve_user', 'change_user_role');
```

### Console do Browser
```
Abra Developer Tools: F12
Veja aba "Console" para logs
Veja aba "Network" para requisições
Veja aba "Application" → LocalStorage para tokens
```

### Realtime Debug
```
F12 → Network → WS
Procure por conexão WebSocket com Supabase
Deve estar conectada quando approve_user é chamado
```

---

## 📱 Mobile (Responsivo)

Todas as URLs funcionam em mobile:
```
Teste em:
├─ Desktop (1920x1080)
├─ Tablet (768x1024)
├─ Mobile (375x667)
└─ Ultra-wide (2560x1440)
```

---

## 🌐 Variáveis de Ambiente

Necessárias para funcionamento:
```
.env.local:
├─ NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
├─ NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
└─ SUPABASE_SERVICE_ROLE_KEY=xxx

.env.production:
├─ (mesmas variáveis)
└─ NODE_ENV=production
```

---

## 📊 Status das URLs

| URL | Dev | Prod | Autenticação | Status |
|-----|-----|------|--------------|--------|
| / | ✅ | ✅ | Não | ✅ OK |
| /admin/usuarios | ✅ | ✅ | Sim (admin) | ✅ NOVO |
| /dashboard | ✅ | ✅ | Sim | ✅ REALTIME |
| /login | ✅ | ✅ | Não | ✅ OK |
| /registro | ✅ | ✅ | Não | ✅ OK |
| /lojas/[slug] | ✅ | ✅ | Não | ✅ OK |

---

## 🎬 Demo Quickstart

1. **Clone/Abra projeto**
   ```bash
   cd c:\dev\portalModelo
   npm install
   npm run dev
   ```

2. **Registre lojista**
   ```
   http://localhost:3000/registro
   → Selecione "Sou lojista"
   → Preencha dados
   ```

3. **Abra admin panel**
   ```
   http://localhost:3000/admin/usuarios
   → Procure lojista registrado
   → Clique [✅ APROVAR]
   ```

4. **Veja dashboard atualizar**
   ```
   http://localhost:3000/dashboard
   → Mude para o usuário lojista
   → Veja painel aparecer em < 1s ✨
   ```

---

## 🆘 Se Algo Não Funcionar

### Admin panel mostra erro
```
Erro: "function approve_user does not exist"
Solução: Execute SQL em Supabase
Arquivo: sql/fix-approve-function.sql
Guia: EXECUTAR-SQL-APROVAR.md
```

### Dashboard não atualiza
```
Erro: UI não muda após aprovação
Solução 1: Aguarde 1-2 segundos (Realtime)
Solução 2: Recarregue (F5)
Solução 3: Verifique console (F12)
```

### Não consegue fazer login
```
Erro: Email/Senha inválidos
Solução: Verifique dados de teste
Verifique: user criado em Supabase?
```

### Página em branco
```
Erro: Componente não renderiza
Solução 1: Verificar console (F12) para errors
Solução 2: Verificar Network para requisições
Solução 3: Hard refresh (Ctrl+Shift+R)
```

---

## 📚 Documentação Rápida por URL

| URL | Documentação |
|-----|--------------|
| /admin/usuarios | [CHECKLIST-VALIDACAO.md](CHECKLIST-VALIDACAO.md) |
| /dashboard | [DIAGRAMA-FLUXO-APROVACAO.md](DIAGRAMA-FLUXO-APROVACAO.md) |
| Setup | [EXECUTAR-SQL-APROVAR.md](EXECUTAR-SQL-APROVAR.md) |
| Geral | [INDICE-DOCUMENTACAO.md](INDICE-DOCUMENTACAO.md) |

---

## ✅ Verificação de Status

### Verifique se está tudo rodando:

1. **Dev server rodando?**
   ```bash
   npm run dev
   # Deve aparecer: "Ready in X ms"
   ```

2. **Supabase conectado?**
   ```bash
   # F12 → Console
   # Não deve haver errors de Supabase
   ```

3. **SQL executado?**
   ```sql
   # No Supabase SQL Editor:
   SELECT proname FROM pg_proc WHERE proname = 'approve_user';
   # Deve retornar 1 linha
   ```

4. **Realtime conectado?**
   ```bash
   # F12 → Network → WS
   # Deve haver conexão WebSocket ativa
   ```

---

**Tudo pronto para uso! 🚀**

Para começar: `npm run dev` e acesse `http://localhost:3000`
