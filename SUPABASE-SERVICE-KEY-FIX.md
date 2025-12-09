# 🔧 URGENTE: Configuração Supabase Incompleta

## ❌ Problema Encontrado

A chave `SUPABASE_SERVICE_ROLE_KEY` está **truncada** no `.env.local`:

- Atual: `sbpvt_FcjGIibuHiilxCdKvBgc2QsXowo0e-jN_63c8bbb` (46 chars)
- Esperado: ~100+ caracteres

## ✅ Solução - Adicione a chave completa

1. Abra: https://app.supabase.com
2. Entre no seu projeto
3. Vá em: **Settings** (engrenagem, lado inferior esquerdo) → **API**
4. Procure por: **"service_role" secret**
5. Copie a chave completa

6. Edite o arquivo `.env.local`:

   ```
   SUPABASE_SERVICE_ROLE_KEY=<COLA A CHAVE COMPLETA AQUI>
   ```

7. Salve e teste novamente:
   ```bash
   node scripts/list-users.js
   ```

## 📝 Exemplo (não use este!)

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHRqenZicm5nYmt5aG51b2R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3NjQxNSwiZXhwIjoyMDgwNDUyNDE1fQ.bEzQbQy...
```

## 🧪 Depois de corrigir

Teste novamente:

```bash
npm test
node scripts/test-auth-real.js
```

Quando estiver pronto, responda: "chave adicionada"
