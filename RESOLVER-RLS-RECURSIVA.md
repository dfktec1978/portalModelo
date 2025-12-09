# 🔧 RESOLUÇÃO: RLS Recursiva em `profiles`

## 📋 Situação Atual

- **Problema**: Erro `infinite recursion detected in policy for relation "profiles"`
- **Escopo**: Afeta leitura de `professionals` e `profiles` diretamente
- **Testes**: 2/3 passando (news ✓, classifieds ✓, professionals ❌)
- **Admin tests**: 0/3 passando (todas usam joins com profiles)

## ✅ Solução: Executar SQL no Console

### Passo 1: Abrir Supabase Console SQL

```
https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new
```

### Passo 2: Copiar SQL

Abra o arquivo:

```
c:\portal-modelo\sql\remove-recursive-policies.sql
```

Copie **todo o conteúdo**.

### Passo 3: Colar no Console

- Cole o SQL na aba "SQL Editor" do Supabase
- Clique no botão **▶️ Run** (canto superior direito)
- Aguarde execução (deve levar 2-5 segundos)

### Passo 4: Verificar Resultado

Deve exibir:

```
schemaname | tablename
-----------+---------------
 public    | profiles
 public    | professionals
 public    | stores
 public    | classifieds
(4 rows)
```

### Passo 5: Testar Localmente

Após executar o SQL no Supabase, rode:

```bash
npm run test:news
npm run test:admin
```

**Resultado esperado**:

- ✅ test:news → 3/3 testes OK
- ✅ test:admin → 3/3 testes OK

## 🆘 Se Ainda Falhar

1. Verifique se o SQL foi realmente executado (veja resultado acima)
2. Tente recarregar o console do navegador
3. Aguarde 10-15 segundos e re-rode os testes

## ⚙️ O Que o SQL Faz

1. **Remove todas as políticas RLS** que podem estar recursivas
2. **Cria políticas simples**:

   - `profiles`: Qualquer um pode ler, usuários atualizam próprio perfil
   - `professionals`: Qualquer um pode ler, usuários criam/atualizam próprios
   - `stores`: Qualquer um pode ler, donos atualizam
   - `classifieds`: Qualquer um pode ler, usuários criam/atualizam próprios

3. **Evita recursão**: Nenhuma política referencia outra tabela com RLS

## 📝 Alternativa: Desabilitar RLS Completamente

Se o SQL acima não funcionar, execute no Supabase Console:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds DISABLE ROW LEVEL SECURITY;
```

Isso removerá completamente RLS (segurança em desenvolvimento reduzida, mas funciona).
