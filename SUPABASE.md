# Supabase — Portal Modelo

Guia para integração e inicialização do Supabase no Portal Modelo.

## Quickstart

### 1. Criar projeto Supabase

- Acesse https://app.supabase.com
- Crie um novo projeto (preencha nome, senha do DB, região)
- Aguarde provisionamento

### 2. Configurar variáveis de ambiente

No `.env.local` (raiz do projeto):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

Para scripts server-side (opcional):

```env
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
```

**Onde encontrar as chaves:**

- Console Supabase → Project Settings → API
- `SUPABASE_URL`: "Project URL"
- `SUPABASE_ANON_KEY`: "anon public"
- `SERVICE_ROLE_KEY`: "service_role secret" (guardado com segurança, não exponha ao cliente)

### 3. Criar tabelas e políticas

Cole o conteúdo de `sql/supabase-init.sql` no SQL Editor do Supabase Console e execute.

Isso criará:

- `profiles` — perfis de usuários vinculados a auth.users
- `stores` — lojas/empreendimentos
- `news` — notícias
- `audit_logs` — logs de auditoria
- `classifieds` — classificados
- `professionals` — profissionais

Com políticas RLS básicas (Row Level Security).

### 4. Testar conexão

Abra a página de teste:

```bash
npm run dev
# Acesse http://localhost:3000/supabase-test
```

Você verá:

- Status de autenticação
- Lista de notícias (se houver alguma na tabela)

### 5. Popular dados de exemplo (opcional)

Execute o script de seed para inserir dados de teste:

```bash
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key> NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co node scripts/supabase-seed.js
```

Ou no PowerShell (Windows):

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "<sua-service-role-key>"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://<seu-projeto>.supabase.co"
node scripts/supabase-seed.js
```

## Estrutura

- `src/lib/supabase.ts` — cliente Supabase
- `src/lib/useSupabaseAuth.tsx` — hook para autenticação (protótipo)
- `src/components/SupabaseNewsExample.tsx` — componente exemplo para listar notícias
- `src/app/supabase-test/page.tsx` — página de teste
- `sql/supabase-init.sql` — DDL para criar tabelas/policies
- `scripts/supabase-seed.js` — script para popular dados

## Próximos passos

1. **Autenticação:** Adaptar `useAuth` para suportar Supabase (ou usar `@supabase/auth-helpers-nextjs`)
2. **Queries:** Converter Firestore queries para SQL (ex.: `supabase.from('news').select(...)`)
3. **Upload:** Trocar Firebase Storage por Supabase Storage
4. **Realtime:** Opcionalmente, usar `supabase.channel()` para listeners em tempo real
5. **Migrations:** Quando pronto, migrar dados do Firestore

## Segurança

- RLS está habilitado em todas as tabelas
- Políticas padrão permitem leitura pública de dados públicos (news, lojas ativas, etc.)
- Admin (role = 'admin') pode ler/escrever dados sensíveis
- Para produção, configure custom claims em `auth.jwt()` ao invés de depender de role na tabela

## Troubleshooting

**"Nenhuma notícia no Supabase"**

- Verifique se a tabela `news` existe no Supabase Console → SQL Editor
- Confirme que você colou e executou `sql/supabase-init.sql`
- Tente inserir manualmente via SQL: `INSERT INTO news (title, summary) VALUES ('Test', 'Test');`

**"Erro de autenticação"**

- Confirme que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão em `.env.local`
- Reinicie o dev server após alterar variáveis: `npm run dev`

**"CORS ou acesso negado ao Storage"**

- Configure CORS no bucket Storage do Supabase Console (ou use signed URLs)
- Confirme que as políticas RLS permitem a operação

## Referências

- Docs Supabase: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript/introduction
- Auth: https://supabase.com/docs/guides/auth/overview
- RLS: https://supabase.com/docs/guides/auth/row-level-security
