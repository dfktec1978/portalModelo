# ✅ Migração Concluída: Firestore → Supabase

**Data:** 5 de dezembro de 2025  
**Status:** ✅ Sucesso

## 📊 Resumo Executivo

| Métrica               | Valor  |
| --------------------- | ------ |
| **Coleção**           | `news` |
| **Registros Lidos**   | 3      |
| **Registros Criados** | 3      |
| **Erros**             | 0      |
| **Taxa de Sucesso**   | 100%   |

## 🔄 Processo de Migração

### Fase 1: Preparação ✅

- Variáveis de ambiente configuradas
- Credenciais Supabase validadas
- Service Role Key testada

### Fase 2: Execução ✅

```bash
FIREBASE_PROJECT_ID=portalmodelo78 \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_FcjGIibuHiilxCdKvBgc2Q_owo0e-jN \
NEXT_PUBLIC_SUPABASE_URL=https://poltjzvbrngbkyhnuodw.supabase.co \
node scripts/migrate-firestore-to-supabase-rest.js
```

**Documentos migrados:**

1. `AItBthpZk1TQQ13m37Tl` - Modelo celebra 63 anos de história
2. `UUkmZXkEBgB0eNVGiQXw` - 33ª Sessão Ordinária da Câmara
3. `gT9oIDWqIWxrg1Xiwq8T` - Teste01

### Fase 3: Validação ✅

- ✅ Notícias aparecem em `/noticias`
- ✅ Dados normalizados corretamente em `/supabase-test`
- ✅ Timestamps convertidos corretamente
- ✅ Imagens e conteúdo preservados

## 📝 Transformações Realizadas

| Campo Firestore           | Campo Supabase               | Transformação                                |
| ------------------------- | ---------------------------- | -------------------------------------------- |
| `publishedAt` (Timestamp) | `published_at` (timestamptz) | `seconds * 1000` → ISO string                |
| `imageUrls` (array)       | `image_urls` (jsonb)         | `JSON.stringify()`                           |
| `createdBy` (string)      | `created_by` (uuid)          | Definido como `null` (sem mapeamento de UID) |
| **ID** (Firestore string) | ID (Supabase UUID)           | Gerado automaticamente                       |

## 🔧 Alterações no Script

**Arquivo:** `scripts/migrate-firestore-to-supabase-rest.js`

**Principais características:**

- ✅ Usa API REST do Firestore (sem credential file needed)
- ✅ Converte formato de valores Firestore automaticamente
- ✅ Batch processing de 50 documentos
- ✅ Gera UUIDs automaticamente via Supabase
- ✅ Erro handling robusto com logging detalhado

## 📱 Próximos Passos

### Imediato (Agora)

- [x] Executar migração da coleção `news`
- [x] Validar dados no Supabase
- [x] Testar páginas públicas (`/noticias`)

### Curto Prazo (Próximas sessões)

- [ ] Migrar coleção `users` → `profiles` (com mapeamento UID ↔ UUID)
- [ ] Migrar coleção `stores` → `stores` (com referências corrigidas)
- [ ] Testar funcionalidades de admin
- [ ] Executar migração de `audit_logs`, `classifieds`, `professionals`

### Médio Prazo

- [ ] Atualizar `MIGRATION-GUIDE.md` com status real
- [ ] Criar backup dos dados originais do Firestore
- [ ] Planejar remoção gradual de Firestore (após 30 dias)
- [ ] Documentar aprendizados (tipo de conversão, edge cases)

### Longo Prazo

- [ ] Monitoramento de performance (queries no Supabase vs Firestore)
- [ ] Otimizar índices se necessário
- [ ] Considerar mudança de auth (Firebase Auth → Supabase Auth)

## ⚙️ Como Executar Novamente

**Se precisar remigrar ou migrar outras coleções:**

```bash
# PowerShell
$env:FIREBASE_PROJECT_ID = "portalmodelo78"
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_FcjGIibuHiilxCdKvBgc2Q_owo0e-jN"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://poltjzvbrngbkyhnuodw.supabase.co"

# Editar script para descomentar outras coleções
# Depois executar:
npm run migrate
```

Ou usar o script alternativo (REST):

```bash
node scripts/migrate-firestore-to-supabase-rest.js
```

## 🐛 Troubleshooting (Se Necessário)

**Erro: "Could not find table 'public.news'"**

- Solução: Execute `sql/supabase-init.sql` no SQL Editor do Supabase

**Erro: "invalid input syntax for type uuid"**

- Causa: Campo espera UUID mas recebeu string
- Solução: Definir como `null` ou fazer mapeamento em script

**Erro: "Permission denied"**

- Causa: SERVICE_ROLE_KEY inválida ou sem permissão RLS
- Solução: Verificar chave e desabilitar RLS temporariamente se necessário

## 📚 Documentação Relacionada

- `MIGRATION-GUIDE.md` - Guia completo de migração
- `sql/supabase-init.sql` - Schema e políticas de segurança
- `scripts/migrate-firestore-to-supabase-rest.js` - Script REST (não precisa credential file)
- `scripts/migrate-firestore-to-supabase.js` - Script Admin SDK (requer credential file)

## 📈 Estatísticas de Dados

**Firestore (original):**

```
news: 3 documentos
users: [a ser migrado]
stores: [a ser migrado]
```

**Supabase (após migração):**

```
news: 3 registros ✅
profiles: [a ser migrado]
stores: [a ser migrado]
```

---

**Próximo:** Migrar `users` → `profiles` com mapeamento UID ↔ UUID  
**Blocker:** Necessário criar script de mapeamento de UIDs antes de migrar stores (FK)
