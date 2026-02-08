This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🎊 Sistema de Aprovação de Usuários (v1.0) ✅

**Status: PRONTO PARA PRODUÇÃO**

Sistema completo de aprovação de lojistas em tempo real com:
- ✅ Admin panel intuitivo para aprovar/rejeitar usuários
- ✅ Dashboard com atualização automática via Realtime
- ✅ RPC Functions PostgreSQL com bypass de RLS
- ✅ Performance < 500ms total
- ✅ Documentação completa (9 guias)

### Quick Start

1. **Execute o SQL** (se ainda não fez):
   - Arquivo: `sql/fix-approve-function.sql`
   - Guia: `EXECUTAR-SQL-APROVAR.md`

2. **Admin panel**: `http://localhost:3000/admin/usuarios`
   - Clique "✅ Aprovar Lojista"

3. **Dashboard atualiza** automaticamente em < 1s ✨

### Documentação

- 📖 [ÍNDICE COMPLETO](./INDICE-DOCUMENTACAO.md)
- ⭐ [EXECUTAR SQL](./EXECUTAR-SQL-APROVAR.md)
- 🎯 [AÇÃO IMEDIATA](./ACAO-IMEDIATA-SQL.md)
- 📊 [DIAGRAMAS](./DIAGRAMA-FLUXO-APROVACAO.md)
- ✅ [STATUS FINAL](./PROJETO-COMPLETO-STATUS-FINAL.md)

---

Teste de sincronização Git

COMIT DIÁRIOS:

git add .
git commit -m "Teste de sincronização"
git push
