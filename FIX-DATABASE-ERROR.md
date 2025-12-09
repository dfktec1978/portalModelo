# 🔐 Fix: "Database error saving new user"

## ❌ Problema

Ao tentar criar nova conta (signup), recebe erro:

```
Database error saving new user
```

## 🔍 Causa

O trigger `on_auth_user_created` no Supabase está falhando. Este trigger tenta criar automaticamente um profile na tabela `profiles` quando um novo usuário se registra.

O trigger está em `/sql/supabase-init.sql` linhas 208-214:

```sql
create or replace function public.sync_profile()
returns trigger as $$
begin
  insert into profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do update set email = new.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.sync_profile();
```

## ✅ Solução

Desabilite o trigger diretamente no Supabase:

### Passo 1: Abra o Supabase Console

https://app.supabase.com → Seu Projeto

### Passo 2: SQL Editor

Clique em **SQL Editor** (lado esquerdo) → **New Query**

### Passo 3: Execute este SQL

```sql
-- Desabilitar o trigger que está falhando
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- (Opcional) Deletar a função
DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;
```

### Passo 4: Confirme

Clique em **RUN** (Ctrl+Enter)

Deve aparecer a mensagem: `executed successfully`

## 🧪 Testar Depois

Após executar o SQL:

1. Acesse http://localhost:3000/cadastro-cliente
2. Preencha o formulário:
   - Nome: Teste User
   - Email: teste@email.com
   - Telefone: 11999999999
   - Senha: Senha123!
3. Clique em "Criar Conta"
4. Você será redirecionado para o /dashboard

## 📝 Notas

- O código agora cria o profile MANUALMENTE após o signup (não depende do trigger)
- Ver: `src/lib/AuthContext.tsx` linha 27-50
- O profile será criado com `role: "cliente"` e `status: "active"`

## 🚀 Próximos Passos

Após confirmar que o signup funciona:

1. Testar login em http://localhost:3000/login
2. Testar logout no /dashboard
3. Começar CRUD de Classificados
