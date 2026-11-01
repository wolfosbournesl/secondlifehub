# Second Life Hub

Open-source radar for the Second Life grid: regions, crowd signals, maps, SLurls, events, live parties, public avatar profiles, land for sale and review signals for regions that need a closer look.

**Application:** [Abrir no GitHub Pages](https://wolfosbournesl.github.io/secondlifehub/app.html) · **Project page:** [wolfosbournesl.github.io/secondlifehub](https://wolfosbournesl.github.io/secondlifehub/)

The runtime deployment can be configured independently by each maintainer. This repository does not publish a provider-specific runtime URL or any private deployment identifier.

The GitHub Pages application is self-contained on the project domain. It uses public snapshots refreshed by GitHub Actions and links directly to official Second Life sources when a static page cannot perform a server-side relay.

## What it does

- Brings together public and read-only grid data in one interface.
- Shows busy regions, anonymous crowd snapshots, map layers, SLurls and region details.
- The live view adds lazy-loaded map previews for each busy region, with a safe fallback when a tile is unavailable.
- The map view provides official tile context with Hub overlays, layer switching, zoom, drag navigation, selectable markers and direct SLurls.
- The intelligence view includes scan-history charts, maturity composition, a change watchlist and side-by-side region comparison.
- Separates official, community and editorial sources instead of presenting every signal as fact.
- Includes official events, ShowBuzz live-party previews and public land listings.
- Includes public inworld group search with relevance, name and popularity sorting, maturity filters, pagination and direct World profile links.
- Expands avatar lookup with public display/username, UUID/key, profile image, full description, maturity metadata, picks and direct viewer/profile links; online presence, RL details and complete name history remain explicitly marked when unavailable.
- The official-events view supports text, category, day and sort filters, plus public Inworld Map previews for each event region.
- Includes a clearly labeled community-opportunity workflow: visitors can save local drafts, but nothing is presented as publicly submitted or moderated before a persistent review backend exists.
- Lets visitors inspect a public avatar profile by UUID/key without an account.
- Keeps region “abandoned” detection as a review queue: offline is a signal, not proof of abandonment.

## Data sources

The project is designed around no-login, public sources:

- [Inworld Map API](https://inworldmap.com/developers) for read-only region, map, crowd, language and land data.
- [Linden Lab Live Data Feeds](https://wiki.secondlife.com/wiki/Linden_Lab_Official:Live_Data_Feeds) for global grid status and residents online.
- [Second Life events](https://secondlife.com/events/?lang=en-US) for the official event calendar.
- [ShowBuzz](https://showbuzz.org/) for community live entertainment data.
- [Second Life World API](https://world.secondlife.com/) for public avatar profile pages and picks.

No API keys, private tokens or login credentials are required by the published project. The public profile page does not provide a reliable real-time online flag; the Hub reports that limitation instead of guessing. Exact presence confirmation would require an authorized viewer/LSL bridge.

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
- `docs/` is the static GitHub Pages project page. GitHub Pages cannot execute the Worker API; the live-data runtime is configured separately from this repository.

## Run locally

```bash
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

The generated Worker is intended for a Workers-compatible runtime. The hosted live version is published through Sites; GitHub Pages is used for documentation and project discovery.

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
