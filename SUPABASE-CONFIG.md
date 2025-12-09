# 🚀 Guia de Configuração e Teste — Supabase

## Status Atual

✓ Variáveis de ambiente configuradas em `.env.local`
✓ Cliente Supabase inicializado com sucesso
❌ **Problema:** A chave de anon (ANON_KEY) atual é **inválida** ou expirada

## Próximos Passos Necessários

### 1. Verificar / Obter Chaves Corretas do Supabase

O erro "Invalid API key" indica que a chave atual não é válida. Você precisa obter as chaves corretas do seu projeto Supabase:

1. Acesse **https://app.supabase.com**
2. Faça login com sua conta
3. Selecione o projeto **Portal Modelo** (ou similar)
4. No menu lateral, vá para **Settings** → **API**
5. Copie:
   - **Project URL** → Use em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → Use em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** (opcional, para scripts backend) → Salve em local seguro

### 2. Atualizar `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Substitua pelos valores reais do seu projeto.

### 3. Reiniciar o Servidor

Após atualizar `.env.local`, reinicie o servidor Next.js:

```bash
npm run dev
```

### 4. Configurar Schema (Tabelas)

Se o schema ainda não foi criado, copie o conteúdo de `sql/supabase-init.sql` e execute no **SQL Editor** do Supabase Console:

1. Abra https://app.supabase.com → Seu Projeto → **SQL Editor**
2. Clique em **+ New Query**
3. Cole o conteúdo de `sql/supabase-init.sql`
4. Execute a query

### 5. Inserir Dados de Teste

Após o schema estar criado, insira dados de teste:

1. Abra https://app.supabase.com → Seu Projeto → **SQL Editor**
2. Clique em **+ New Query**
3. Cole o conteúdo de `supabase-seed-manual.sql` (gerado automaticamente)
4. Execute a query

Ou use o script Node.js (requer SERVICE_ROLE_KEY):

```bash
SUPABASE_SERVICE_ROLE_KEY=<sua_chave> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/supabase-seed.js
```

## Testando a Conexão

Após configurar, execute:

```bash
$env:NEXT_PUBLIC_SUPABASE_URL = "https://[seu-projeto].supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiI..."
node scripts/test-supabase-connection.js
```

Você deve ver:

- ✓ Cliente Supabase inicializado
- ✓ Notícias encontradas (ou "Nenhuma notícia")
- ✓ Tabelas verificadas

## Testando no Navegador

1. Certifique-se de que o servidor está rodando: `npm run dev`
2. Acesse `http://localhost:3001/supabase-test`
3. Você deve ver:
   - Status de autenticação (não autenticado é normal)
   - Lista de notícias do Supabase (se houver dados)

## Troubleshooting

### "Invalid API key"

- Confirme que copiei a chave correta do Supabase Console
- Verifique se a chave não tem espaços extras
- Teste: `echo $env:NEXT_PUBLIC_SUPABASE_ANON_KEY` (PowerShell)

### "Nenhuma notícia no Supabase"

- Confirme se a tabela `news` foi criada (execute `sql/supabase-init.sql`)
- Confirme se os dados foram inseridos (execute `supabase-seed-manual.sql`)

### "Connection refused"

- Confirme que `NEXT_PUBLIC_SUPABASE_URL` está correto
- Teste a URL no navegador: deve retornar um redirect

## Próximas Etapas (Dual-Mode Auth)

Após confirmar que Supabase está funcionando:

1. ✅ **useAuth.tsx** já está configurado para dual-mode (detecta `NEXT_PUBLIC_SUPABASE_URL`)
2. **Teste Supabase Auth:**

   - Acesse `http://localhost:3001/cadastro-cliente`
   - Crie uma conta (usuário + senha)
   - Verifique se foi criado em `profiles` no Supabase
   - Faça login com a conta criada

3. **Verifique que Firebase ainda funciona:**
   - Temporariamente, remova `NEXT_PUBLIC_SUPABASE_URL` de `.env.local`
   - Reinicie o servidor
   - Teste login (deve voltar a usar Firebase)

## Dúvidas?

Consulte a documentação:

- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Este projeto: Ver `SUPABASE.md` e arquivos em `src/lib/`
