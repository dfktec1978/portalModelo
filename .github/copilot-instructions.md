## Instruções rápidas para agentes IA — Projeto Portal Modelo

Este projeto é um frontend Next.js (app router) com Tailwind e components em `src/components`. Use este arquivo para entender rapidamente padrões, comandos de desenvolvimento e onde procurar comportamento importante.

Principais pontos (big picture)

- Next.js (app router) em `src/app/*` — layout e páginas principais vivem em `src/app/layout.tsx` e `src/app/page.tsx`.
- Componentes reutilizáveis em `src/components` — ex.: `Header.tsx`, `Footer.tsx`, `AuthModal.tsx`.
- Configs importantes: `package.json`, `tsconfig.json` (usa `baseUrl: src` e alias `@/*`), `tailwind.config.js` (paleta oficial do projeto).
- Imagens públicas: `public/img/...` — use caminhos relativos a `/img/...` com `next/image`.

Como iniciar (dev / build)

- Instalar dependências:
  - npm: `npm install`
  - yarn: `yarn`
  - pnpm: `pnpm install`
- Rodar em dev (Turbopack já configurado): `npm run dev` (usa `next dev --turbopack`)
- Build: `npm run build` (usa Turbopack) — Start: `npm start`
- Lint: `npm run lint`

Padrões e convenções do projeto

- Estrutura: todo código TS/TSX fica em `src/` (o `tsconfig.json` tem `baseUrl: "src"`). Import comum: `import Header from "@/components/Header"`.
- Se houver erro de import com `@/`, confirme `tsconfig.json` e reinicie o TS Server no VSCode.
- Componentes que usam estado/efeitos devem ter `"use client"` no topo (ex.: `Header.tsx` e `AuthModal.tsx`).
- Cores oficiais em `tailwind.config.js`: `azul: #003049`, `vermelho: #D62828`, `amarelo: #FDC500`, `branco`, `preto`.
- Utility CSS adicional pode ser colocada em `src/app/globals.css`.

Padrões de componente e exemplos úteis

- Header: usa `next/image` para o logo (`/img/logos/logo.png`) e um botão `Entrar` que abre `AuthModal`. Favor usar SVG inline para ícones (projeto já contém ícones inline no `Header`).
- Layout: `src/app/layout.tsx` centraliza o container com `max-w-6xl mx-auto px-4` — ao inserir faixas horizontais (bandeira amarela), siga o padrão:

```tsx
/* após <Header /> */
<div className="w-full h-3" style={{ backgroundColor: "#FFD400" }} />
```

Importante sobre rotas e imagens

- Páginas da aplicação ficam em `src/app` (app router). Caso precise criar rotas estáticas, crie pastas em `src/app/nome-da-rota/page.tsx`.
- Use `next/image` para otimização. Arquivos estejam em `public/img/...` e referenciados como `/img/whatever.png`.

Dependências notáveis (ver `package.json`)

- `next`, `react`, `tailwindcss`, `react-icons` (já listada) — se encontrar erro "não é possível localizar 'react-icons'", rode `npm install react-icons`.

Erros recorrentes e como resolver

- Erro TS2307 (module not found '@/components/...') → Verifique `tsconfig.json` (baseUrl) e reinicie o TS Server (Command Palette → Restart TS Server).
- Erro import './AuthModal' missing → verifique se `src/components/AuthModal.tsx` foi criado; preferir imports relativos (`./AuthModal`) quando estiver no mesmo diretório.
- Ícones: se preferir não instalar `react-icons`, favor usar SVG inline (projeto já usa SVGs inline no `Header`).

Fluxo de trabalho do dev

- Criar nova feature branch: `git checkout -b feat/<descrição>`
- Rodar dev: `npm run dev` e abrir `http://localhost:3000`
- Testar componentes com dados reais em `public/img` e rotas locais; ao alterar `tsconfig.json` reiniciar TS Server.

Integrações e próximos passos (MVP recomendado)

- Banco: o projeto recomenda Supabase. Para acelerar, crie tabelas mínimas: `users`, `lojas`, `produtos`, `pedidos`, `classificados`, `profissionais`.
- Autenticação: Supabase Auth inicialmente (email). Storage para imagens: Supabase Storage.
- Pagamentos: começar com fluxo Pix manual (QR/WhatsApp) — integração automática futuramente.

Onde procurar comportamento crítico

- `src/app/layout.tsx` — estrutura global do site (header, container, faixas amarela)
- `src/components/Header.tsx` — menu desktop, mobile, modal de login (ver `use client` e ícones)
- `src/components/AuthModal.tsx` — modal de login/registro (se existir) — caso não exista, criar com o padrão mostrado no header
- `src/app/page.tsx` — home/hero, botões principais com ícones

Melhorias futuras para agentes IA

- Gerar scaffolding de páginas: loja, produto, checkout, painel lojista (CRUD). Use Supabase Edge Functions para lógica serverless inicial.
- Criar testes unitários básicos para componentes com React Testing Library.

Perguntas úteis para o dev humano (peça antes de editar)

- Deseja manter alias `@/*` (requer `tsconfig.json` já configurado) ou prefere imports relativos? (alguns editores reclamam se não reiniciados)
- Preferência por `react-icons` (instalar) vs SVG inline (sem dependência extra)?

Se quiser atualizar este arquivo

- Responda com pontos que faltaram (ex.: detalhes de deploy, variáveis de ambiente, chaves Supabase) e atualizo.

---

Arquivos referenciados: `package.json`, `tsconfig.json`, `tailwind.config.js`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/AuthModal.tsx`.

FIM
