# 📋 Passos para Migrar Users → Profiles

## Problema Encontrado ⚠️

A tabela `profiles` tem uma **Foreign Key constraint** que referencia `auth.users`:

```sql
id uuid references auth.users on delete cascade primary key
```

Isto impede inserir perfis sem que o usuário exista em `auth.users`.

## Solução: Desabilitar FK Temporariamente

### Passo 1: Abrir Supabase Console

1. Acesse: https://supabase.com/dashboard/projects
2. Selecione seu projeto `poltjzvbrngbkyhnuodw`
3. Vá para **SQL Editor**

### Passo 2: Executar SQL de Preparação

Copie e execute este script no SQL Editor:

```sql
-- Remover constraint de FK
alter table profiles drop constraint if exists profiles_id_fkey;

-- Criar índices
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_status on profiles(status);
```

**Resultado esperado:** ✅ "SUCCESS - Rows affected: 0"

### Passo 3: Executar Migração

De volta no terminal:

```bash
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_FcjGIibuHiilxCdKvBgc2Q_owo0e-jN"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://poltjzvbrngbkyhnuodw.supabase.co"
$env:FIREBASE_PROJECT_ID = "portalmodelo78"

npm run migrate-users
```

### Passo 4: Restaurar Foreign Key (Depois)

Após a migração ser bem-sucedida, você pode restaurar a FK se desejar:

```sql
-- Restaurar FK (comentado por enquanto)
alter table profiles
add constraint profiles_id_fkey
foreign key (id) references auth.users on delete cascade;
```

⚠️ **Aviso:** Se restaurar a FK, qualquer perfil sem usuário correspondente em `auth.users` será violado.

## Arquivo Gerado ✅

Após sucesso, será criado:

- `uid-mapping.json` - Mapeia Firebase UID → Supabase UUID

Este arquivo é **essencial** para migrar stores (que referencia users via ownerUid).

## Próximos Passos

1. ✅ Migrar users → profiles (em progresso)
2. ⏳ Migrar stores (depende do uid-mapping.json)
3. ⏳ Validar dados no Supabase

---

**Arquivo de referência:** `sql/prepare-migration-profiles.sql`
