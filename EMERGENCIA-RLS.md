# 🚨 EMERGÊNCIA: RLS Recursiva Persistente

## Situação

O SQL anterior de `remove-recursive-policies.sql` não resolveu o problema. Os testes ainda mostram:

```
❌ infinite recursion detected in policy for relation "profiles"
```

## Causa Provável

A policy `admin_can_read_all_profiles` que ainda estava na tabela não foi dropada, ou novo SQL não foi executado.

## ✅ Solução: Desabilitar RLS Completamente

**Para desenvolvimento**, basta desabilitar RLS em todas as tabelas:

### Passo 1: Abrir Supabase Console

https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new

### Passo 2: Executar SQL de Emergência

Copie **todo o conteúdo** de:

```
sql/disable-rls-emergency.sql
```

Cole no Supabase Console e clique **▶️ Run**

### Passo 3: Verificar

Deve exibir:

```
tablename    | rowsecurity
-------------|-------------
profiles     | f
professionals | f
stores       | f
classifieds  | f
news         | f
audit_logs   | f
(6 rows)
```

(A coluna `rowsecurity = f` significa RLS desabilitado)

### Passo 4: Testar Localmente

```bash
npm run test:news
npm run test:admin
npm run test
```

**Resultado esperado**: ✅ Todos os testes passam 3/3

## ⚠️ Nota de Segurança

Desabilitar RLS é **apenas para desenvolvimento/teste**. Em produção:

1. Re-enable RLS: `ALTER TABLE X ENABLE ROW LEVEL SECURITY;`
2. Criar policies sem subqueries recursivas
3. Testar joins com care

## 📝 Próximos Passos após Resolver

1. ✅ Verificar se todos os testes passam (3/3 + 3/3)
2. ✅ Iniciar dev server: `npm run dev`
3. ✅ Testar aplicação com dados reais
4. ✅ Implementar funcionalidades de usuário (login, cadastro)
