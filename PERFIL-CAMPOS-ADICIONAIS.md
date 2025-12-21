# Adicionar Campos de Perfil - Instruções

## ⚠️ IMPORTANTE: Execute o SQL primeiro!

**Antes de usar os novos campos, você DEVE executar o SQL abaixo no Supabase.**

### Erro atual: "Could not find the 'facebook' column of 'profiles' in the schema cache"

Este erro ocorre porque as colunas `profile_image`, `instagram` e `facebook` ainda não existem na tabela `profiles`.

## Como resolver:

### 1. Acesse o painel do Supabase

- Vá para [supabase.com](https://supabase.com)
- Entre no seu projeto

### 2. Abra o SQL Editor

- No menu lateral esquerdo, clique em **"SQL Editor"**
- Clique em **"New Query"** (ou use uma query existente)

### 3. Execute o SQL

Cole e execute o código SQL abaixo:

```sql
-- Adicionar coluna para foto de perfil (URL da imagem)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image text;

-- Adicionar coluna para Instagram
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram text;

-- Adicionar coluna para Facebook
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook text;

-- Adicionar comentários às colunas (opcional, para documentação)
COMMENT ON COLUMN profiles.profile_image IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN profiles.instagram IS 'Nome de usuário do Instagram (sem @)';
COMMENT ON COLUMN profiles.facebook IS 'URL ou nome de usuário do Facebook';
```

### 4. Verifique se funcionou

Após executar, você deve ver uma mensagem de sucesso no SQL Editor.

## Após executar o SQL:

- ✅ A página **Editar Perfil** funcionará completamente
- ✅ Campos de **foto de perfil**, **Instagram** e **Facebook** estarão disponíveis
- ✅ Upload de imagens funcionará
- ✅ Validações estarão ativas

## Novos campos adicionados:

- **Foto de Perfil**: Upload de imagem com o componente ImageUpload
- **Instagram**: Campo de texto com prefixo "@" para nome de usuário
- **Facebook**: Campo de texto para URL completa ou nome de usuário

## Validações implementadas:

- **Instagram**: Apenas letras, números, pontos e underscores (máx. 30 caracteres)
- **Facebook**: URL válida do Facebook ou nome de usuário simples
- **Foto de Perfil**: Upload via componente ImageUpload (máx. 1 imagem)

Os campos são todos opcionais e o perfil funcionará normalmente mesmo sem preenchê-los.
