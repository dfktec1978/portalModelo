# 🚀 Próximos Passos: Paralelizar Migração + Testes

**Status:** Configuração concluída - pronto para execução

---

## 📋 Checklist de Execução

### FASE 1: Restaurar Integridade (5 min)

- [ ] Abrir Supabase SQL Editor
- [ ] Executar `sql/restore-fk-post-migration.sql`
- [ ] Verificar contagens de records

### FASE 2: Migrar Coleções Restantes (1-2 horas)

Execute cada script em ordem:

```bash
# Classificados
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_FcjGIibuHiilxCdKvBgc2Q_owo0e-jN"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://poltjzvbrngbkyhnuodw.supabase.co"
$env:FIREBASE_PROJECT_ID = "portalmodelo78"

npm run migrate-classifieds

# Profissionais
npm run migrate-professionals
```

**Esperado:**

```
✅ classifieds: X lidos, X criados, 0 erros
✅ professionals: X lidos, X criados, 0 erros
```

### FASE 3: Rodar Testes (10 min)

```bash
# Todos os testes
npm run test

# Ou individual
npm run test:news
npm run test:admin
```

**Esperado:**

```
✅ TODOS OS TESTES PASSARAM!
```

---

## 📁 Arquivos Criados

### Scripts de Migração

- ✅ `scripts/migrate-classifieds.js` - Migra classificados
- ✅ `scripts/migrate-professionals.js` - Migra profissionais

### Testes

- ✅ `src/lib/__tests__/newsQueries.test.ts` - Testa queries de notícias
- ✅ `src/lib/__tests__/adminQueries.test.ts` - Testa admin queries

### Documentação

- ✅ `sql/restore-fk-post-migration.sql` - SQL pós-migração

### Package.json

- ✅ `npm run migrate-classifieds`
- ✅ `npm run migrate-professionals`
- ✅ `npm run test` (todos)
- ✅ `npm run test:news`
- ✅ `npm run test:admin`

---

## 🎯 Resultado Final Esperado

Após completar as 3 fases:

```
📊 MIGRAÇÃO COMPLETA:
   ✅ news: 3 registros
   ✅ users→profiles: 1 usuário
   ✅ stores: 1 loja
   ✅ classifieds: X registros
   ✅ professionals: X registros

🧪 TESTES:
   ✅ newsQueries: 4/4 testes
   ✅ adminQueries: 3/3 testes

🏁 PRONTO PARA:
   ✅ Beta testing em staging
   ✅ Performance comparison
   ✅ UAT com usuários
```

---

## 📝 Notas Importantes

1. **FK Restoration:** Sem isto, dados ficarão orphaned
2. **Test Order:** Não importa a ordem das migrações
3. **Test Execution:** Testes requerem `.env.local` preenchido

---

## 🚨 Troubleshooting

### Se migração falhar:

```bash
# Verificar logs do Supabase
npm run test-supabase
```

### Se testes falharem:

- Verifique `.env.local` com credenciais
- Rode individualmente: `npm run test:news`
- Verifique se dados foram migrados

---

## ⏱️ Tempo Total Estimado

- Restaurar FK: 5 min
- Migração: 30-60 min
- Testes: 10 min
- **Total: ~1.5 horas**

---

**Comece por:** `sql/restore-fk-post-migration.sql` no Supabase Console
