<p align="center">
  <img src="public/assets/aekr-logo.png" alt="AEKR — AI Engineering Knowledge Repo" width="200">
</p>

# aekr-web

The public website for **aekr.io** — a single static page explaining what
AEKR (AI Engineering Knowledge Repo) is, in about 10–15 seconds.

- **Status:** first implementation, pre-deploy
- **Route:** A — local-first (no backend, no build step)
- **Governance:** Lean — public, static, low-risk

## Stack

Static HTML + CSS, plus one small dependency-free script for the
interactive background (canvas starfield, no framework, no bundler). No
Vanta/Three.js, no npm dependencies at runtime. Deploys to Cloudflare
Workers static assets via `wrangler deploy`.

```
aekr-web/
├── public/                  ← deployed as-is (wrangler.jsonc assets.directory)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── 404.html
│   ├── favicon.ico
│   ├── robots.txt
│   ├── _headers
│   └── assets/
│       ├── aekr-logo.png
│       ├── aekr-banner.png
│       └── AEKR-BANNER-LICENSE.txt
├── wrangler.jsonc            ← deploy config, not part of the site
├── LICENSE
└── README.md
```

Everything Cloudflare serves lives under `public/`. Repo metadata
(`README.md`, `LICENSE`, `wrangler.jsonc`) stays at root, outside the
assets directory, so it's never walked or uploaded.

## Local preview

```
npx serve public
```

## Deployment

Cloudflare Workers (static assets), custom domain `aekr.io`. No server,
no database, no paid services required. Deploy command: `npx wrangler
deploy`, run from the repo root — `wrangler.jsonc` points at `./public`.

---

Built with the **AI Engineering Knowledge Repo (AEKR)** workflow.

![Build with AEKR](public/assets/aekr-banner.png)
