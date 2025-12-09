# 🔄 Guia de Migração: Firestore → Supabase

## Visão Geral

Este guia documenta o processo de migração incremental de dados do Firebase Firestore para Supabase PostgreSQL.

**Status:** ✅ Scripts prontos | ⏳ Execução manual (você controla quando)

## Arquitetura da Migração

```
Firebase (origem)                    Supabase (destino)
├── Firestore                        ├── PostgreSQL
│   ├── news                         │   ├── news
│   ├── users                        │   ├── profiles
│   ├── stores                       │   ├── stores
│   ├── audit_logs                   │   ├── audit_logs
│   ├── classifieds                  │   ├── classifieds
│   └── professionals                │   └── professionals
```

## Mapeamento de Dados

### Collection: `news`

| Firestore                 | Supabase                     | Transformação                                  |
| ------------------------- | ---------------------------- | ---------------------------------------------- |
| `id` (doc ID)             | `id` (uuid)                  | Converter string → uuid (manual se necessário) |
| `publishedAt` (Timestamp) | `published_at` (timestamptz) | `seconds * 1000` → ISO string                  |
| `imageUrls` (array)       | `image_urls` (jsonb)         | `JSON.stringify()`                             |
| `imageData` (array)       | —                            | Não migrar (apenas referência em metadata)     |
| `createdBy` (string)      | `created_by` (uuid)          | Manter como-está                               |

### Collection: `users`

| Firestore              | Supabase       | Transformação    |
| ---------------------- | -------------- | ---------------- |
| `uid` (Firebase ID)    | `id` (uuid)    | Manter como-está |
| `email`                | `email`        | Manter como-está |
| `name` / `displayName` | `display_name` | Normalizar       |
| `role`                 | `role`         | Manter como-está |
| `status`               | `status`       | Padrão: "active" |

### Collection: `stores`

| Firestore               | Supabase                   | Transformação          |
| ----------------------- | -------------------------- | ---------------------- |
| `uid` (doc ID)          | `id` (uuid)                | Novo uuid (não reusar) |
| `ownerUid`              | `owner_id` (uuid ref)      | Manter como-está       |
| `storeName`             | `store_name`               | Manter como-está       |
| `createdAt` (Timestamp) | `created_at` (timestamptz) | Converter              |

## Processo de Migração

### Fase 1: Preparação (você faz)

1. **Backup do Firestore:**

   ```bash
   # Firebase CLI (se instalado)
   firebase firestore:export ./backup
   ```

   Ou use o Console do Firebase para exportar dados.

2. **Verificar schema do Supabase:**

   - Certifique-se de que `sql/supabase-init.sql` foi executado
   - Verifique tabelas: `profiles`, `stores`, `news`, etc.
   - Confirme RLS policies estão habilitadas

3. **Obter credenciais:**
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → Secret keys)
   - `NEXT_PUBLIC_SUPABASE_URL`

### Fase 2: Migração Executável Localmente

Execute o script de migração em seu computador:

```bash
# PowerShell
cd C:\portal-modelo
$env:SUPABASE_SERVICE_ROLE_KEY = "<sua-service-role-key>"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://seu-projeto.supabase.co"
npm run migrate
```

Ou usando variáveis direto:

```bash
SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> npm run migrate
```

**O que o script faz:**

1. Conecta ao Firebase Admin SDK (lê dados de Firestore)
2. Normaliza cada documento conforme tabela acima
3. Insere/atualiza no Supabase via `upsert()`
4. Gera relatório: quantos criados, quantos falharam

### Fase 3: Validação

Após o script terminar:

1. **Verificar contagens:**

   ```sql
   -- No Supabase SQL Editor
   SELECT COUNT(*) FROM news;
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM stores;
   ```

   Compare com Firestore (Firebase Console).

2. **Testar queries da app:**

   - Acesse `/noticias` → deve listar notícias do Supabase
   - Acesse `/supabase-test` → deve mostrar dados normalizados
   - Crie nova conta em `/cadastro-cliente` → deve ir para Supabase

3. **Verificar integridade:**

   ```sql
   -- Notícias sem timestamp
   SELECT id, title FROM news WHERE published_at IS NULL;

   -- Profiles sem email
   SELECT id FROM profiles WHERE email IS NULL;
   ```

### Fase 4: Cutover (Quando Ready)

Quando tudo validado:

1. **Deixar Supabase ativo** (manter `NEXT_PUBLIC_SUPABASE_URL` em `.env.local`)
2. **Manter Firebase como fallback** (não remover Firebase config)
3. **Monitorar logs** por alguns dias
4. **Depois, opcionalmente:**
   - Remover dados do Firestore (apenas após semanas de certeza)
   - Desativar Firebase (economizar custos)
   - Remover imports de Firebase do código

## Scripts Disponíveis

| Comando                  | Descrição                                       |
| ------------------------ | ----------------------------------------------- |
| `npm run migrate`        | Executar migração Firestore → Supabase          |
| `npm run test-supabase`  | Validar conexão e listar dados do Supabase      |
| `npm run status`         | Ver status completo da configuração             |
| `npm run setup-supabase` | Configurar credenciais Supabase interativamente |

## Troubleshooting

### Erro: "firebase-admin not found"

```bash
npm install firebase-admin
```

### Erro: "Could not find profiles table"

- Execute `sql/supabase-init.sql` no SQL Editor do Supabase

### Erro: "Invalid API key"

- Verifique que usou `SUPABASE_SERVICE_ROLE_KEY` (não anon key)
- Confirme que copiou a chave corretamente (sem espaços)

### Erro: "Foreign key violation"

- Isso indica que perfis/stores referenciadas não existem em `profiles`
- Migre `users` antes de `stores`
- Ou desabilite FKs temporariamente no Supabase para permitir inserção

### Alguns registros não foram migrados

- Verifique logs: procure por "⚠️" no output
- Verifique RLS policies: `authenticated_insert_` pode estar bloqueando
- Considere usar trigger para auto-criar `profiles` quando não existir

## Rollback

Se algo der errado:

1. **Limpar dados do Supabase** (resetar tabelas):

   ```sql
   TRUNCATE TABLE news CASCADE;
   TRUNCATE TABLE profiles CASCADE;
   TRUNCATE TABLE stores CASCADE;
   ```

2. **Remover `NEXT_PUBLIC_SUPABASE_URL` de `.env.local`**

3. **Reiniciar aplicação:** `npm run dev`
   (voltará a usar Firebase automaticamente)

4. **Re-executar migração** depois de ajustar dados/script

## Próximos Passos

- [ ] Executar fase 1 (preparação)
- [ ] Executar fase 2 (migração)
- [ ] Validar fase 3 (testes)
- [ ] Decidir cutover fase 4

Quando estiver pronto, execute:

```bash
npm run migrate
```

---

**Documentação do Supabase:** https://supabase.com/docs/guides/database/migrations  
**Documentação do Firebase:** https://firebase.google.com/docs/firestore/solutions/schedule-export
