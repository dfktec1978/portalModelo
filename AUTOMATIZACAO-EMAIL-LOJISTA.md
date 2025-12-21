# Automatização de E-mail de Aprovação de Lojista

Este documento explica como configurar e usar a automatização de envio de e-mail quando um lojista é aprovado pelo administrador.

## 📋 Visão Geral

Quando um administrador altera o status de um lojista de `pending` para `active` (aprovado), o sistema automaticamente envia um e-mail de congratulações para o lojista.

## 🏗️ Arquitetura

- **Trigger PostgreSQL**: Detecta mudanças de status na tabela `profiles`
- **Edge Function**: Processa o envio do e-mail via API do Resend
- **Serviço de E-mail**: Resend (pode ser substituído por SendGrid, etc.)

## 🚀 Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Serviço de E-mail (Resend)

1. Crie uma conta no [Resend](https://resend.com)
2. Obtenha sua API Key
3. Configure a variável de ambiente no Supabase:

   No painel do Supabase → Project Settings → Edge Functions → Environment variables:

   ```
   RESEND_API_KEY=your_resend_api_key_here
   ```

### 3. Configurar Trigger no Banco

Execute o script de configuração:

```bash
npm run setup-lojista-approval
```

Este comando irá:

- Criar a função `notify_lojista_approval()`
- Criar o trigger `trigger_lojista_approval_email`
- Habilitar a extensão `pg_net` (para HTTP requests)

### 4. Atualizar URL da Edge Function

No arquivo `sql/trigger-lojista-approval-email.sql`, substitua `seu-projeto` pelo ID real do seu projeto Supabase:

```sql
edge_function_url := 'https://SEU-PROJETO-ID.supabase.co/functions/v1/send-lojista-approval-email';
```

### 5. Deploy da Edge Function

```bash
npx supabase functions deploy send-lojista-approval-email
```

## 📧 Conteúdo do E-mail

### Assunto

```
Seu cadastro como lojista foi aprovado 🎉
```

### Corpo (HTML + Texto)

- Saudação personalizada com nome do lojista
- Confirmação de aprovação
- Instruções dos próximos passos
- Mensagem de sucesso da equipe

## 🧪 Teste

### Teste Local

1. Inicie o Supabase local:

```bash
npx supabase start
```

2. Teste a Edge Function:

```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/send-lojista-approval-email' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{"email":"teste@exemplo.com","name":"João Silva"}'
```

### Teste em Produção

1. Aprovar um lojista através do painel administrativo
2. Verificar se o e-mail foi enviado
3. Verificar logs da Edge Function no painel do Supabase

## 🔧 Personalização

### Alterar Serviço de E-mail

Para usar outro provedor (SendGrid, Mailgun, etc.):

1. Modifique a Edge Function `supabase/functions/send-lojista-approval-email/index.ts`
2. Atualize a lógica de envio de e-mail
3. Configure as variáveis de ambiente necessárias

### Personalizar Conteúdo do E-mail

Edite o conteúdo HTML e texto na Edge Function para personalizar:

- Assunto
- Corpo da mensagem
- Estilo/visual
- Informações incluídas

## 📊 Monitoramento

### Logs

- **PostgreSQL**: Logs do trigger aparecem nos logs do banco
- **Edge Function**: Logs disponíveis no painel do Supabase → Edge Functions

### Possíveis Problemas

1. **E-mail não enviado**: Verificar configuração da API key do Resend
2. **Trigger não dispara**: Verificar se o status mudou exatamente de `pending` para `active`
3. **Erro na Edge Function**: Verificar logs e validar payload

## 🔒 Segurança

- A função usa `SECURITY DEFINER` para ter permissões adequadas
- Erros no envio de e-mail não bloqueiam a aprovação do lojista
- Dados sensíveis são transmitidos de forma segura via HTTPS

## 📁 Arquivos Relacionados

- `supabase/functions/send-lojista-approval-email/index.ts` - Edge Function
- `sql/trigger-lojista-approval-email.sql` - Trigger e função SQL
- `scripts/setup-lojista-approval-trigger.js` - Script de configuração
