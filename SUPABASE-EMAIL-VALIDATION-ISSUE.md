# 🚨 Status: Erro de Validação de Email no Supabase

## Problema

Supabase está rejeitando TODOS os emails com erro:

```
Email address "{email}" is invalid
```

Isso ocorre mesmo com emails válidos como:

- `user1764984797142@example.com` ❌
- `portal@dfktec.com.br` ❌
- `teste@test.com` ❌

## Possíveis Causas

1. **Email Domain Whitelist/Blacklist** ativado no Supabase

   - Verificar em: Settings → Auth → Email Validation

2. **Email Provider não configurado**

   - Supabase precisa de um provider de email para confirmar

3. **Rate Limiting ou Throttling**

   - Bloqueio temporário por muitas tentativas

4. **Chave API incorreta**
   - Embora a conexão funcione (conseguimos ler news)

## ✅ Próximos Passos

1. Acesse: https://app.supabase.com/project/seu-projeto/settings/auth
2. Verifique:

   - [ ] Email provider está configurado (SendGrid, Postmark, etc)?
   - [ ] Há algum domínio whitelistado?
   - [ ] MFA ou confirmação de email obrigatória?

3. Se quiser testar sem email confirmation:

   - Desabilite "Confirm email" em: Settings → Auth → Email
   - Ou use a opção `emailRedirectTo`

4. Alternativa: Usar OAuth (GitHub, Google) que não precisa de validação

## 🧪 Teste Rápido

Se conseguir fazer o signup funcionar, a app já tem tudo pronto:

- ✅ Header com login/logout
- ✅ Cadastro-cliente com auto-profile
- ✅ Login com redirecionamento
- ✅ Dashboard protegido
- ✅ Logout

Só espera Supabase autorizar o signup!
