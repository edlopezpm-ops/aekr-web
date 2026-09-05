# aekr-web — project decisions and operating guide

**Status:** Existing public website; professionalization delivered, with an authorized nebula and official-wordmark follow-up.
**Governance:** Lean, Mode 0. **Owner:** Ed, Human Orchestrator in Chief (HOC).
**Route:** Mixed — local, dependency-free editing and checks; Cloudflare hosts the
public site and delivers contact email. No paid LLM API is part of this project.

## Purpose and boundaries

Explain AEKR's engineering practice and let visitors request contact or pricing.
The runtime is static HTML/CSS/JavaScript plus a small email Worker. It has no
accounts, customer database, payment flow, embedded LLM, or orchestration runtime.
Lean is appropriate to this bounded public-information site; email delivery and
visitor data still require input validation, secret separation and failure checks.
Reconsider the profile before adding authentication, billing, stored personal
data, customer integrations, or privileged operational actions.

`public/` is the website release boundary. Repository governance, Project Map,
validators and engineering documentation stay outside it. `src/index.js` and
`wrangler.jsonc` own the Worker route and deployment configuration respectively.
The repository map is orientation, never deployment or acceptance authority.

## Authority and lifecycle

Read `MASTER_SWITCH.md`, `AGENTS.md`, this file and `OWNER_PROFILE.md` at session
start. Ed's explicit current instructions govern the authorized scope. Mode 0
uses manual agent work; runtime-enforced switches are OFF because no AEKR runtime
is installed. This is not permission to expose credentials, spend on LLM APIs,
collapse executor/reviewer roles or ignore existing user authorization boundaries.
Keep secrets out of tracked files, browser assets, screenshots and logs. Use
subscription-authenticated Codex for development; do not select another provider
or a paid LLM API without Ed's explicit instruction.

Plan and implement one bounded increment, verify its changed leaves, then have a
separate reviewer assess the combined result. The implementer cannot accept its
own work. Existing session authorization can cover routine reversible fixes and
delivery; do not manufacture duplicate approval steps. Final acceptance belongs
to Ed. Deployment success and local checks are separate evidence.

This is a retrofit of an existing site, not a reconstructed seven-phase history.
Idea/discovery and frontend/backend design are represented by the existing
product and source; historical phase acceptance is unverified. A new discovery
survey, volume test plan and Full Audit are NOT_APPLICABLE to this visual and
repository increment. Coding, focused verification, independent review and
authorized delivery apply. Email inbox receipt requires a separately authorized
live submission and must never be inferred from mocked tests or HTTP availability.

## Current increment: minimum sufficient change

The current delivery authorization is Ed's exact instruction:
“Procede con todo esto en full hasta deployar el cambio a la página live. Tú
orquestas. Minimizar los gates humanos.” Here, “full” describes completion of
the requested work through deployment; the bounded project risk still selects
Lean. The orchestrator coordinates delivery and a separate-author review.
The review shares session context and is not claimed as a fresh-context Full Audit.

The requirement is a maintainable AEKR website with the requested visual fixes,
README provenance, Project Map and repeatable engineering checks. Repository
inspection found one README, existing local brand assets, a static frontend and
one Worker; no governance entry files, map or validation workflow existed.

The selected approach reuses the current frontend and AEKR's portable Mode 0
scaffolds. The ordered alternatives are: remove unrelated redesign/provider
scope; reuse existing assets and frontend boundaries; use Node standard-library
checks; keep the existing hosting platform; add no dependency; seed only missing
governance/map boundaries. A framework, database, orchestrator bundle and new
deployment service would add no necessary behavior. The only new operational
surface is a validation-only CI job; the existing Cloudflare release route stays
separate. No runtime dependency, public API or Worker configuration change is
required by the governance retrofit.

Before-edit baseline: `17b712c1fdbefe43c64abc2c9c36b3a4bfa50eee`, clean `master`.
The implementation inventory, verification results and review limitations are
reported against the final diff; a local PASS is not a security certification or
proof of a production deployment.

## Upstream provenance and explicit branding variance

Portable scaffolds were read from `edlopezpm-ops/AEKR` at
`5275f67494b7fbd2762eaedc645a162fc40922cf`. The source remains unmodified.
Constitution V11 and the Project Map validator retain exact upstream bytes.
The 35-row switch schema is unchanged; initial local states select Lean/Mode 0
with the requested map and branding. No private runtime, personal memory,
historical upstream authority decisions or provider configuration is copied.

The reference calls AEKR “AI Engineering Knowledge Repo”; this website already
uses “AI Engineering Knowledge Racking”. This increment preserves the existing
website branding; it does not rename upstream AEKR.
`tools/aekr/validate-generated-project.mjs` is a declared local variant. Its
three branding phrases use Racking. Five delimited insertions adapt the upstream
source-reference scanner to this existing website's concrete syntax:

- Root-relative public HTML URL attributes resolve to real files/directories under
  `public/`; filesystem roots, missing targets and traversal remain rejected.
- Only form action/formaction attributes can map the exact contact endpoint to
  its declared server route. The existing server pathname comparison and exact
  browser endpoint fallback are recognized as URL expressions.
- The exact existing asset wildcard in `public/_headers` checks its real directory;
  the server's known email HTML closing tags are recognized as markup.
- The website's canonical license copy is digest-checked and receives the same
  source-reference treatment as the root canonical banner license.

The self-integrity digest is recomputed. Constitution identity, switch schema,
map validation and other structural controls are preserved. The original scan
rejected existing favicon/style URLs as absolute filesystem paths and the
unchanged copied license's upstream provenance paths as missing dependencies.
The adaptation addresses those false positives without rewriting website source
or omitting runtime files from validation. Its exact upstream SHA-256 is
`019b38a55e2b211ccab524e27ffae22772328e4d19bb0ab61fef9e5cb24bd3e3`.
`tools/aekr/provenance.json` pins the upstream and local artifacts;
`tools/check.mjs` proves that removing exactly the five declared insertion blocks,
reversing the three branding substitutions and restoring the projection digest
reconstructs the upstream validator exactly. The portable code/template copyright
and MIT terms are preserved by the repository license and banner license.

An unmodified upstream generated-project PASS is therefore not claimed. Local
`VALIDATOR_VERIFIED` reports only this declared variant's structural validation.
`INHERITED_UNTESTED` and confidence inheritance `false` remain in scaffold metadata.
Root `assets/` contains the canonical README/map provenance banner and license;
`public/assets/` keeps the existing transparency-adjusted website artwork.

### Approved README banner update — 2026-09-05

Ed approved distributing the accepted soft-edge banner after reviewing the
accreatio pilot. The minimum change reuses AEKR's exact approved PNG at the
existing README and Project Map asset path. Website artwork, master logos,
README prose, runtime code and dependencies remain outside this increment.
The source SHA-256 is
`81a60d8e3d28b2e0934cecd22c703af20e2bddd164f68a0888193647c1b816fc`.

The generated-project validator previously required the old banner digest, so
its banner constant, self-integrity digest and local provenance pins change
together. The historical upstream source stays pinned to the same commit.
Provenance reconstruction additionally reverses this one declared banner-digest
substitution; the five insertion blocks and three branding substitutions remain
unchanged. No check is removed and an altered asset must still be rejected.
This adds no runtime, dependency, public interface or configuration surface.
Verification covers exact source bytes, PNG decoding, existing reference
resolution, the existing repository checks and rejection of altered bytes.
The existing `npm run check` passed; both the provenance check and generated-project
validator rejected a one-byte-altered banner. The approved bytes were restored.

Local implementation result: seeded the portable core, initialized switchboard,
owner profile and scaffold metadata; added the three-view map, provenance assets,
local checks and validation-only CI; refreshed README and this operating guide.
No dependency, Worker source change, new provider, new configuration key or
public API was introduced by this retrofit. Existing artwork, Worker and hosting
boundaries were reused. Added complexity belongs to deterministic source checks
and the inherited navigation/validation tools; it adds no website runtime cost.
The exact final line delta and combined visual-change inventory belong to the
reviewed Git diff and the orchestrator's delivery evidence.

## Verification and delivery

Run `npm run check` with Node 22 or newer; no package installation is needed.
It checks JavaScript syntax, governance and map integrity, validator provenance,
local website references, configuration/release boundaries, banner licensing,
the atmosphere's motion/failure lifecycle, and URL-validator regression cases.
The governance check uses an
isolated snapshot of tracked and nonignored new source files because the upstream
validator treats local Wrangler database caches as source. Git-ignored local state
is excluded; the temporary snapshot is removed after validation. Required source
files remain mandatory and validator provenance is checked before execution.
Inspect the website on desktop/mobile and with reduced motion; inspect the map
directly from disk, including keyboard selection and search. For changes
to email behavior, add focused request/failure tests before deployment.

The validation workflow runs on pushes and pull requests with read-only repository
permissions and no deployment credentials. Check its result for the exact commit.
Cloudflare deployment and production smoke checks remain separate. Follow the
README deployment/rollback procedure, preserve the previous version identifier,
and record the deployed commit and observed result. Do not treat a successful
Git push, CI check or old deployment as evidence of the new version being live.

## Open verification boundaries

Live email receipt, account billing/entitlements, deployment controls and durable
abuse protection require their own current evidence. The Worker's in-memory
throttle is best effort, not a durable rate limit. Do not promote any of these
to a verified claim based on repository metadata or the Project Map.

## Increment evidence

The follow-up requested on 2026-09-04 uses accreatio's deployed design-v14 preview
at `53343211a2176be487c17fa8f58202146f3eac7e`, including autonomous currents and
left-click gas bursts. Its preview source differs from the older `main` used in
the first refresh. Ed also requested the official AEKR lettering in primary
brand headings. See [the follow-up record](nebula-follow-up-2026-09-04.md) for
the reference correction, bounded implementation and verification evidence.

See [the 2026-09-04 verification record](verification-2026-09-04.md) for scope,
review, executed checks and the previous Cloudflare version. The delivery
commit's GitHub Workers Builds check records its production build and version;
verify current live responses before treating a historical record as current.

### Footer banner edges — 2026-09-05

Ed requested softer edges only on the footer's Build with AEKR banner. Its frame
is rasterized into the existing artwork. The minimum sufficient change reuses
the scoped `.provenance img` rule: two intersected gradient masks fade the four
edges while preserving the center, dimensions, opacity and original asset.
No new dependency, component, configuration or runtime behavior is introduced.
Before/after Brave screenshots at 1440 and 390 pixels confirm softer edges,
legible lettering, identical bounds and no overflow or page errors. Focused
visual verification covers this reversible styling change; existing repository
checks and separate-author review apply. Recovery source is `9c22cbd`; its
Cloudflare version is `fed566d3-bd78-40f9-bbab-6ff339e781e9`.
