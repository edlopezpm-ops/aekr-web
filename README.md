<p align="center">
  <img src="public/assets/aekr-logo.png" alt="AEKR — AI Engineering Knowledge Racking" width="200">
</p>

# aekr-web

The public website for **aekr.io** — AEKR is an AI-native, human-orchestrated
software engineering practice.

- **Status:** public website; verify the exact deployment before reporting an increment live
- **Route:** local editing and checks; Cloudflare hosting (no website build step)
- **Governance:** Lean / Mode 0 — public information and a bounded email endpoint

Open the [interactive Project Map](PROJECT_MAP.html) directly from disk for
repository orientation. [Conceptual map](PROJECT_MAP.md) ·
[Machine-readable structure](project-map.json).

[Project decisions and operating guide](docs/master.md) records scope, authority,
upstream provenance, the explicit Racking branding variance and verification
boundaries. Read [MASTER_SWITCH.md](MASTER_SWITCH.md) and [AGENTS.md](AGENTS.md)
before substantive repository work.

## Stack

Static HTML + CSS with dependency-free scripts for the interactive background,
contact form, section navigation and English/Spanish selection. No framework, no bundler, no npm
dependencies at runtime. A small Worker sits in front of the static assets to
handle contact-form delivery.

```
aekr-web/
├── public/                  ← served as static assets
│   ├── index.html
│   ├── styles.css
│   ├── startup.css          ← stable first paint and native fragment fallback
│   ├── microscales-config.js
│   ├── microscales.js
│   ├── script.js
│   ├── sections.js
│   ├── i18n.js
│   ├── 404.html
│   ├── favicon.ico
│   ├── robots.txt
│   ├── _headers
│   └── assets/
│       ├── aekr-mark.png     ← orbital mark only (hero)
│       ├── aekr-logo.png     ← full lockup
│       ├── aekr-banner.png
│       └── AEKR-BANNER-LICENSE.txt
├── src/
│   └── index.js              ← Worker: POST /api/contact, else static assets
├── assets/                  ← canonical README/map banner and license (not served)
├── docs/master.md           ← concise source of truth and operating guide
├── PROJECT_MAP.html         ← standalone interactive repository map
├── PROJECT_MAP.md
├── project-map.json         ← canonical map structure
├── MASTER_SWITCH.md
├── AGENTS.md
├── OWNER_PROFILE.md
├── aekr-scaffold.json
├── tools/                   ← local integrity validators and provenance
├── .github/workflows/       ← validation-only CI
├── package.json             ← dependency-free local check command
├── wrangler.jsonc
├── LICENSE
└── README.md
```

### Brand assets

The three website PNGs in `public/assets/` carry real alpha. They were flattened against a near-black
field originally, which showed as a visible rectangle on the page background;
the field is now keyed out so they composite cleanly over any dark surface.
If you replace them, keep the transparency — do not re-export onto a solid
background.

Primary AEKR headings reuse the lettering from the official logo through the
`.brand-lettering` CSS crop. Preserve the artwork's A/E/K/R shapes and dot;
do not substitute a similar font. Accessible AEKR text remains in the markup.

### Ivory microtexture

The decorative layer is global and independent of the seven panels. Its seeded
surface uses versioned WebP assets concentrated diagonally on the right and lower
edge. Canvas 2D lifts reserved AEKR emblems into a right-to-left breeze, with
independent three-axis tumbling, depth, changing gusts and a four-piece dissolution
late in each flight. At most 64 emblems fly at once (44 on narrow viewports),
settling to 80% of their source size as they lift into the breeze.
Each vacated source regrows after its petal clears the surface. Moving the pointer
near the textured field adds a bounded gust; touch gestures retain their navigation
behavior. Hidden tabs suspend work and resume without accumulated emissions.
Ed explicitly requested continuous visible animation regardless of the system's
motion preference, and removal of the introduction pause control. Phrases remain
readable for 7.5 seconds with 1.2-second fades; panel transitions last 1.8 seconds.

`public/microscales-config.js` centralizes surface and motion settings. Geometry,
relief or density changes require rebuilding assets and incrementing their version
before publication. Run `node tools/visual/build-microscales.mjs --surface-only` with an existing
Playwright module path in `PLAYWRIGHT_MODULE` and browser in `BROWSER_EXECUTABLE`.
The surface-only build leaves brand derivatives untouched; omit that option only
when intentionally rebuilding the brand assets too. The build derives neutral
ink/emboss from the official artwork. Brand derivatives
retain geometry and neutral alpha, and normalize green coverage to an opaque fill
with proportional antialiased edges so original translucency cannot lighten it.
They use the CSS `--accent` olive (#2b5b43),
matching buttons and green text, including hover. Accent changes require rebuilding
and versioning the three brand PNGs. Original PNGs and provenance assets remain
unchanged. No image-generation model or runtime package is required.

Initial panels and phrase dimensions come from HTML/CSS. Native fragment links
remain usable without JavaScript or when the section controller fails. A small
head bootstrap selects an initial deep link before deferred scripts run.
Panels center their content when it fits. Desktop Contact places the introduction
beside the form; narrow screens and enlarged text retain accessible scrolling.
The small attribution banner sits in the lower-right corner, with copyright in
the lower-left, outside the content area.

### Archived nebula attribution

The prior starfield and nebula are absent from the active runtime. Their original
code, tests and assets remain in the verified local design archive, including a
standalone reuse demo. The accreatio-derived renderer retains its copyright and
reserved rights; the general MIT license does not relicense it. Historical
provenance is in [the follow-up record](docs/nebula-follow-up-2026-09-04.md).
Internal archive, restore instructions and captures are outside `public/` and
excluded from Git publication. They are local recovery evidence, not a live release.

## Contact form

`POST /api/contact` accepts `{ email, comment, company, requestType }` and
emails the submission. `requestType` is either `contact` or `pricing`, which
only changes the subject line so the two are distinguishable in the inbox.
`company` is a honeypot — real visitors never see it.

The destination mailbox is **never** in the repo or the client bundle. It is
a Worker secret:

```
npx wrangler secret put CONTACT_RECIPIENT_EMAIL
```

The sender address (`CONTACT_SENDER_EMAIL`, default `website@aekr.io`) is a
plain var in `wrangler.jsonc`; its domain must be onboarded to Cloudflare
Email Sending:

```
npx wrangler email sending enable aekr.io
npx wrangler email sending dns get aekr.io
```

If either the secret or the `EMAIL` binding is missing, the endpoint returns
`503` and the form shows a failure. It never reports success for a message it
did not send.

## Validation

Use Node 22 or newer. No dependency installation or credentials are needed:

```sh
npm run check
```

The checks validate syntax, local references, deployment boundaries, the Project
Map and the declared AEKR scaffold variant. CI repeats the same command on pushes
and pull requests. It does not deploy the site or prove live email delivery.
Visual and keyboard checks remain part of review for frontend/map changes.

The section-navigation browser checks run with `npm run check:browser` using an
existing Playwright installation. If that installation is outside the project,
set `PLAYWRIGHT_MODULE` to its module entry and optionally `BROWSER_EXECUTABLE`
to a Chromium-compatible browser executable. No website dependency is added.
The check starts a temporary local static server, exercises desktop/mobile
navigation, history, keyboard, touch, form preservation and motion preferences,
and intercepts contact submissions so it cannot send email. `SITE_URL` selects
an already running site; `SCREENSHOT_DIR` optionally saves viewport screenshots.
`BASELINE_REF` additionally compares all original section markup against a Git
revision during local verification. Browser checks are separate from the
dependency-free default CI command.

## Local preview

```
npx wrangler dev
```

Serves the static assets and the Worker together. Email sends are not
delivered locally unless the `send_email` binding is marked `"remote": true`.

## Deployment and rollback

[Verified pre-refresh backup and rollback instructions](docs/rollback.md).

Cloudflare Workers with static assets serves `aekr.io`. Only `public/` is the
static asset directory; repository documentation and tools are not published.
The existing Cloudflare Workers Builds integration can deploy the configured
branch after a push. The validation workflow is separate: verify both results
for the exact commit and do not assume deployment waits for validation.

Before authorized delivery, run the checks, review the diff, and record the
currently deployed version. Observe the new Cloudflare build/version and smoke
check the homepage, asset responses, 404 page and contact error handling. A
successful local check or push is not a production result.

For a separately authorized manual deployment with the existing account session:

```sh
npx wrangler deploy
```

If the new version fails verification, restore the previously recorded Worker
version through Cloudflare's deployment controls, then repeat the smoke checks.
For source recovery, revert the bounded change through normal Git history;
avoid rewriting the shared branch. Never infer inbox delivery from HTTP success
without checking a separately authorized test message.

---

Built with the **AI Engineering Knowledge Racking (AEKR)** workflow.

![Build with AEKR](assets/aekr-banner.png)
