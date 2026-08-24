<p align="center">
  <img src="public/assets/aekr-logo.png" alt="AEKR — AI Engineering Knowledge Racking" width="200">
</p>

# aekr-web

The public website for **aekr.io** — AEKR is an AI-native, human-orchestrated
software engineering practice.

- **Status:** live
- **Route:** local-first (no build step)
- **Governance:** Lean — public, static, low-risk

## Stack

Static HTML + CSS with one dependency-free script for the interactive
background and the contact form. No framework, no bundler, no npm
dependencies at runtime. A small Worker sits in front of the static assets to
handle contact-form delivery.

```
aekr-web/
├── public/                  ← served as static assets
│   ├── index.html
│   ├── styles.css
│   ├── script.js
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
├── wrangler.jsonc
├── LICENSE
└── README.md
```

### Brand assets

All three PNGs carry real alpha. They were flattened against a near-black
field originally, which showed as a visible rectangle on the page background;
the field is now keyed out so they composite cleanly over any dark surface.
If you replace them, keep the transparency — do not re-export onto a solid
background.

### Terminal-letter signature

Sentence-like prose ends with its final alphabetic character wrapped in
`<span class="terminal-glyph">`, which renders it bold in the AEKR green.
Terminal punctuation stays outside the span. It is authored directly in the
markup — no post-render DOM mutation — so there is no layout shift and screen
readers read the sentence normally.

It applies to prose only. Navigation, buttons, form labels, badges, and
one-word list items are deliberately excluded.

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

## Local preview

```
npx wrangler dev
```

Serves the static assets and the Worker together. Email sends are not
delivered locally unless the `send_email` binding is marked `"remote": true`.

## Deployment

Cloudflare Workers with static assets, custom domain `aekr.io`. Deploy from
the repo root:

```
npx wrangler deploy
```

---

Built with the **AI Engineering Knowledge Racking (AEKR)** workflow.

![Build with AEKR](public/assets/aekr-banner.png)
