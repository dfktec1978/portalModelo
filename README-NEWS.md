# Gerador de notícias

Como funciona

- Crie/edite `news-sources.json` na raiz do projeto com um array de objetos { name, url } apontando para feeds RSS das fontes desejadas (ex.: portais regionais que cubram Oeste de SC).
- Rode `npm install` (se você ainda não tiver instalado a dependência adicionada `rss-parser`).
- Execute `npm run generate-news`. O script irá buscar os feeds e gravar `public/data/news.json`.
- A página `/noticias` lê `public/data/news.json` e exibe as notícias.

Exemplo de `news-sources.json`:
[
{ "name": "G1 Santa Catarina", "url": "https://g1.globo.com/sc/santa-catarina/rss.xml" }
]

Observações

- Alguns sites podem bloquear fetchs ou não oferecer RSS; adicione somente fontes que permitam agregação.
- Posso melhorar o script para rodar como uma função serverless (ex.: Netlify/Vercel) ou integrar um CMS (Strapi, Ghost) se preferir.
