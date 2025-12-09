# 🔧 Instruções: Corrigir RLS em profiles (Método Manual)

## Problema

As tabelas `profiles`, `stores` e `professionals` têm RLS com recursão infinita. Isto causa erro:

```
infinite recursion detected in policy for relation "profiles"
```

## Solução: Executar SQL no Supabase Console

### Passo 1: Abrir Supabase SQL Editor

1. Acesse: https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new
2. Ou navegue: Project → SQL Editor → New Query

### Passo 2: Copiar e Executar SQL

Cole este SQL no editor:

```sql
-- 1. Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (recursivas)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all" ON profiles;
DROP POLICY IF EXISTS "Public read" ON profiles;
DROP POLICY IF EXISTS "Users can update own" ON profiles;
DROP POLICY IF EXISTS "Users can delete own" ON profiles;

-- 3. Re-habilitar RLS com políticas simples
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas novas (sem recursão)
CREATE POLICY "Public read" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own" ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- 5. Verificar se funcionou
SELECT * FROM profiles LIMIT 1;
```

### Passo 3: Clicar "Run" (▶️)

Você deve ver na saída:

```
Rows: 1
```

Se vir erro, volte para SQL Editor → "RLS Policies" tab e verifique as políticas manualmente.

### Passo 4: Validar Correção

Após executar o SQL, rode na sua máquina:

```bash
npm run test:news
npm run test:admin
```

Esperado: **3/3 testes OK** para test:news

---

## Se ainda falhar:

### Opção 1: Desabilitar RLS Completamente (Temporário)

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
```

Depois rode os testes. Se passarem, o problema é RLS.

### Opção 2: Verificar Políticas Atuais

```sql
-- Ver todas as políticas
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'stores', 'professionals');
```

### Opção 3: Contatar Supabase Support

Se nada funcionar, é possível haver uma limitação de conta. Verifique:

- Project Settings → Authentication → Enable/Disable Row Level Security
- Habilite novamente se desabilitado

---

## Próximos Passos

Após executar o SQL:

```bash
# Terminal 1: Aplicar o SQL (veja acima)

# Terminal 2: Validar
npm run test
npm run test:news
npm run test:admin

# Terminal 3: Testar app
npm run dev
```

Acesse `http://localhost:3000` e teste:

- [ ] Home page carrega
- [ ] Notícias aparecem (/noticias)
- [ ] Login funciona
- [ ] Cadastros funcionam

---

## ✅ Checklist Conclusão

- [ ] Executei o SQL no Supabase Console
- [ ] Rodei `npm run test` e todos passaram
- [ ] Testei `npm run dev` e app funciona
- [ ] Commitei as mudanças: `git add . && git commit -m "fix: correct RLS recursion in profiles"`
