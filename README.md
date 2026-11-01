# Second Life Hub

Open-source radar for the Second Life grid: regions, crowd signals, maps, SLurls, events, live parties, public avatar profiles, land for sale and review signals for regions that need a closer look.

**Application:** [Abrir no GitHub Pages](https://wolfosbournesl.github.io/secondlifehub/app.html) · **Project page:** [wolfosbournesl.github.io/secondlifehub](https://wolfosbournesl.github.io/secondlifehub/)

The runtime deployment can be configured independently by each maintainer. This repository does not publish a provider-specific runtime URL or any private deployment identifier.

The GitHub Pages application remains on the project domain. Public snapshots are refreshed by GitHub Actions, and avatar profile queries are rendered in the Hub through the project's public relay instead of sending the visitor away to the source page.

The “Ao vivo no mapa” view includes filters for probable language/country proxy, minimum and maximum avatar count, maturity (G/M/A) and source-published item type. The filter state updates both the region list and the map layer; the source currently publishes probable language, not the visitor's actual nationality.

## What it does

- Brings together public and read-only grid data in one interface.
- Shows busy regions, anonymous crowd snapshots, map layers, SLurls and region details.
- The live view adds lazy-loaded map previews for each busy region, with a safe fallback when a tile is unavailable.
- The map view provides official tile context with Hub overlays, layer switching, zoom, drag navigation, selectable markers and direct SLurls.
- The intelligence view includes scan-history charts, maturity composition, a change watchlist and side-by-side region comparison.
- Separates official, community and editorial sources instead of presenting every signal as fact.
- Includes official events, ShowBuzz live-party previews and public land listings.
- Includes public inworld group search with relevance, name and popularity sorting, maturity filters, pagination and direct World profile links.
- Expands avatar lookup with public display/username, UUID/key, profile image, full description, maturity metadata, picks and direct viewer/profile links; RL details and complete name history remain explicitly marked when unavailable.
- The official-events view supports text, category, day and sort filters, plus public Inworld Map previews for each event region.
- Includes a clearly labeled community-opportunity workflow: visitors can save local drafts, but nothing is presented as publicly submitted or moderated before a persistent review backend exists.
- Lets visitors inspect a public avatar profile by UUID/key without an account.
- Keeps region “abandoned” detection as a review queue: offline is a signal, not proof of abandonment.

## Catálogo público de destinos

O módulo **Catálogo** organiza regiões, parcelas e experiências em uma view pública, gratuita e responsiva. Cada registro pode conter nome, descrição, SLurl, proprietário/grupo quando publicado, categoria, tags, maturidade, acesso, imagem, eventos relacionados, origem e status do dado.

- Busca por nome, região, descrição e tags, com filtros por tipo, categoria, maturidade, acesso, favoritos, visitados e eventos relacionados.
- Detalhe interno do destino com imagem, origem, SLurl para o mapa e ações locais; as views existentes de Grupos e Eventos continuam acessíveis pelo catálogo.
- Seletor aleatório e links para o mapa do Second Life. A abertura no viewer depende do sistema operacional e do viewer instalado; não é considerada validada pelo Hub.
- Favoritos, visitados e coleções de landmarks usam apenas `localStorage` no navegador. Não há login, perfil, sessão, cookie de identidade, sincronização ou coleta de PII.
- Dados iniciais substituíveis em [`data/catalog.json`](data/catalog.json) e [`data/catalog.csv`](data/catalog.csv). O contrato de importação é validado por `node scripts/validate-catalog.mjs`.
- A rota Worker `/api/catalog` e o fallback estático `docs/data/catalog.json` compartilham o mesmo formato. Substitua o seed por um adaptador autorizado que preserve a origem, o timestamp e o status de cada registro.

Registros marcados como `example` são demonstrativos e não comprovam existência, propriedade, disponibilidade ou evento ativo. O seed de regiões e parcelas usa snapshots públicos, que podem mudar; confirme sempre a SLurl no mapa oficial.

## Data sources

The project is designed around no-login, public sources:

- [Inworld Map API](https://inworldmap.com/developers) for read-only region, map, crowd, language and land data.
- [Linden Lab Live Data Feeds](https://wiki.secondlife.com/wiki/Linden_Lab_Official:Live_Data_Feeds) for global grid status and residents online.
- [Second Life events](https://secondlife.com/events/?lang=en-US) for the official event calendar.
- [ShowBuzz](https://showbuzz.org/) for community live entertainment data.
- [Second Life World API](https://world.secondlife.com/) for public avatar profile pages and picks.

No API keys, private tokens or login credentials are required by the published project. The avatar module is a public-profile consultation, not an online-status checker. A UUID/key is queried in the Hub and the public display name, username, image, description, maturity and picks are rendered in the result panel when the source responds. Official profile/viewer links remain optional secondary actions.

## Architecture

```text
Browser UI
   ↓
Cloudflare Worker / same-origin API routes
   ↓
Public Second Life and community sources
```

- `worker/index.js` contains the Worker and embedded frontend.
- `dist/server/index.js` is the generated Worker entrypoint used by Sites.
- `scripts/build.sh` generates the deployable `dist/` directory.
- `scripts/validate-artifact.mjs` checks the generated artifact before publication.
- `docs/` is the static GitHub Pages project page and application build. GitHub Pages cannot execute the Worker API itself, so public snapshots are regenerated hourly by GitHub Actions and the profile module uses a CORS-enabled relay for live public profile reads.

## Run locally

```bash
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

The generated Worker is intended for a Workers-compatible runtime. GitHub Pages is the canonical public entrypoint; its snapshot build keeps the application usable without exposing a provider-specific runtime URL as the application's public address.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

Good first contributions include:

- new public, documented and rate-limit-safe data adapters;
- accessibility and responsive UI improvements;
- better source attribution and freshness indicators;
- tests for parsing, normalization and fallback states;
- translations and clearer Portuguese/English copy.

Please do not add private keys, scraped personal data, viewer credentials or undocumented high-volume collectors. Every adapter should explain its source, terms, rate limits, timestamp and failure behavior.

## License

Released under the [MIT License](LICENSE). Second Life® and related trademarks belong to Linden Research, Inc. This project is independent and is not affiliated with Linden Lab.
