# aekr-web — project decisions and operating guide

**Status:** Existing public website; atomic phrase formation and bounded layout refinement.
**Governance:** Lean, Mode 0. **Owner:** Ed, Human Orchestrator in Chief (HOC).
**Route:** Mixed — local, dependency-free editing and checks; Cloudflare hosts the
public site and delivers contact email. No paid LLM API is part of this project.

## Atomic phrase formation and proportions — 2026-09-05

Ed requested particles that form each phrase, three seconds of completely static
reading, then dispersion into the next phrase; slightly more space above and
below that line; a wider, shorter Interferometry card; and an arrow with only
“Back”. Full implementation, review, Git delivery and deployment remain authorized.
The immediate base `9a184b4` is preserved in a restored/verified bundle and the tag
`rollback/aekr-web-pre-atomic-phrases-2026-09-05`; the PR #4 tag remains included.

Before implementation: the nine decorative motes and whole-line fade cannot form
letter shapes. Reuse the existing phrase grid, six phrases, pause control and
selected-section state. The visual research follows the text-mask/particle target
technique in [Codrops](https://tympanus.net/codrops/2011/11/09/interactive-html5-typography/)
and the native [Canvas readback](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)
and [rendering guidance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).
The new implementation is original; no external code or dependency is imported.
Existing CSS animation lacks glyph sampling; native Canvas 2D supplies that
missing primitive without a general particle framework, new WebGL renderer or
server/configuration surface. This is the minimum new local rendering boundary
needed for the authorized formation effect. The site's background renderer and
section/symbol controller remain outside the change.

A separate UI/UX design pass selects local glyph-aligned particles, a crisp DOM
handoff and exactly 3000 ms of stationary text. Bound particle count, drawing rate,
pixel area and device-pixel ratio; draw only while forming or dispersing. Preserve
the static accessible prose and no-JavaScript/reduced-motion fallback, and stop
work for pause, hidden tab, off-hero visibility and unusable Canvas readback.
Tests must prove real pixel motion, a stationary dwell, wrap alignment, suspension
and failure recovery. The card reuses its present styling at roughly 17rem width
and 60% of the stage-column height, centered vertically; narrow layouts retain
their reading order. Two local spacing changes and the shorter Back label finish
the bounded scope. Verification and separate review cover only affected outputs.

Implementation result: the existing hero IIFE now samples actual browser-wrapped
lines into a local Canvas mask. Up to 1,600 particles converge for 1,100 ms, hand
off to completely stationary DOM text for 3,000 ms, then disperse for 1,000 ms.
A 150 ms complementary mask blend makes the particle/text handoff continuous.
Drawing is capped at 30 fps and DPR 2; both backing stores together are capped
at 1.5 million pixels. Reading uses one timer and no hero animation frames. Pause,
visibility, section changes, resize and motion preferences reuse existing state;
unavailable or unusable Canvas sampling retains the original accessible prose.

The changed outputs are `public/sections.js`, `public/styles.css`,
`public/index.html`, `tests/sections.mjs` and this guide. The hero IIFE grows from
103 to 281 lines (+226/-48); its added branches serve glyph sampling, bounded
rendering, phase transitions and failure/suspension handling. The nine decorative
motes and whole-line floating animation are removed. There is no new dependency,
public API, configuration, server behavior or Project Map topology. The entire
atmosphere/contact script and the approved section/symbol controller prefix are
byte-identical to the base. Original artwork, identity sizes and green headings
are preserved. Desktop Interferometry changes from 208 x 536 px to 272 x 337 px
at 1440 x 1000; mobile retains the original reading order. Both phrase gaps gain
8 px at the default text size. The home link retains its route and arrow, with
only “Back” as visible text.

Validation: repository checks and the real-Brave browser suite pass, including
actual particle pixel motion, a measured three-second stationary dwell, loop,
pause/resume, visibility-event suspension, resized glyph sampling, four Canvas
failure fallbacks, 320 px/200% text, original navigation and mocked contact
success/failure/race behavior. A separate agent checked callback/pixel limits;
UI/UX review checked intermediate frames and wrapped handoff alignment. No real
contact email was sent. Review is a separate shared-context pass under this
Lean Mode 0 board, not an independent-context audit. Changed-output hashes,
validation logs, screenshots, review and delivery receipts remain in the external
recovery directory. No unresolved minimality or functional finding remains.

## Heading color refinement — 2026-09-05

Ed requested the AEKR green for section titles, lifecycle stage names and the
principle-card titles during delivery. Minimum sufficient change: reuse the
existing `--accent` token in the four existing heading rules, including the
control-model concept headings. No markup, body copy, dimensions, artwork,
animation, contact behavior or infrastructure changes are needed. PR #8 source
`f88ade3` and its active Cloudflare version
`7e1256c7-bbc3-42a5-8081-09e734ff2a0d` are preserved by the new recovery tag
`rollback/aekr-web-pre-heading-colors-2026-09-05` and verified Git bundle.

The output inventory is four CSS color declarations and this decision record;
there is no added branch, abstraction, dependency or interface. Verification is
bounded to computed heading/body colors and browser screenshots, existing
repository checks, separate delta review and merged-source/live-asset readback.
All functional evidence for the unchanged PR #8 increment remains applicable.

## Hero, contact and lifecycle refinement — 2026-09-05

Ed approved the PR #6 experience and authorized a bounded follow-up through PR,
kommiBo review and deployment: one floating, nebulous hero phrase at a time in a
loop; 15% larger hero symbol, lettering and both legends; a direct Contact-to-home
arrow; successful contact replaced by thanks until leaving and returning; and a
tall Interferometry panel to the right of the lifecycle on sufficiently wide views.
The refreshed base `b5d7834` also retains the unrelated approved PR #7 attribution
configuration. The verified bundle and tag
`rollback/aekr-web-pre-hero-contact-refinement-2026-09-05` preserve that base;
the exact PR #4 recovery tag below remains available.

Before implementation: this mixed visual/state task extends the current DOM,
native animation and section-selection state. Static hero prose, the existing
contact handler and lifecycle markup are the reuse boundaries. The current prose
never rotates, successful submissions leave the controls usable, and the wide
verification paragraph adds height below the stages. No general carousel, new
renderer, dependency, router, server API or deployment setting is needed. Changes
are limited to existing presentation/script files, focused browser tests and this
guide; artwork, background renderer, section transitions, footer and unrelated
section copy remain intact. A separate UI/UX design pass recommends a six-second
phrase cycle with a long readable dwell, soft drift and restrained motes, real
layout sizing, and a discrete pause control. Motion pauses off-screen and outside
the hero; reduced motion retains stable prose. Narrow layouts may wrap naturally.

Verification will measure the 15% scale, check phrase sequencing/pause and reduced
motion, compare lifecycle height and narrow readability, and exercise successful,
failed, duplicate and pending contact submissions with intercepted requests only.
Leaving/re-entering Contact must not let an old response close a new visit. The
existing direct hash route supplies the home arrow without intermediate sections.
Separate technical and visual review applies to this increment, not a Full Audit.

Implementation result: six short hero phrases share a fixed-height grid and a
six-second native animation cycle. One small pause control leaves the current
phrase readable; section visibility, tab visibility and motion preference stop
the loop. Existing prose remains the stable accessibility and no-JavaScript
equivalent. The four hero brand dimensions increase by 15%, with narrow-width
containment retained. Interferometry uses the available desktop reading width
and a dark translucent panel; mobile keeps the original vertical reading order.
Contact requires the existing server's explicit `ok: true` response before
replacing the form with thanks. A per-visit counter rejects stale UI updates,
while the existing in-flight guard prevents duplicate requests. The home arrow
uses the existing direct hash route. No server payload, public API, dependency,
configuration or Project Map topology changes. The original atmosphere and full
section/symbol controller prefixes remain byte-identical.

The changed inventory is HTML, styles, the two browser scripts, this guide and
the existing browser suite. Added complexity serves one optional animation loop
and contact visit ownership; native animation cancellation, layout containment,
focus and overflow are reused rather than introducing a second navigation or
rendering abstraction. Separate review checks these boundaries. Desktop browser
measurements confirm the 15% scale and a roughly 25% reduction in lifecycle
scroll height, with every stage visible at 1440 by 1000. Contact tests intercept
all sends and cover accepted, rejected, malformed and delayed responses, repeated
submission, visit changes and enlarged-text acknowledgment. Visual review also
checks phrase phases, panel contrast and the initial acknowledgment position.
Exact file deltas, output hashes, validation and review receipts accompany the
recovery bundle outside the public tree. Merged-source and live-provider readback
remain the final delivery checks.

## Nebular transition refinement — 2026-09-05

Ed requested smoother, living nebular transitions and a continuous official-symbol
movement from the hero into an enlarged, centered header; the symbol stays docked
between content views and returns above the hero lettering on home navigation.
This refines the existing experience rather than replacing its content or visual
identity. The same session authorizes implementation, PR delivery and deployment.
The requested optional full-return point is explicitly tagged at PR #4,
`6a234384097938caa5e668a5e8bb7ae5cd37161a`, as
`rollback/aekr-web-pr4-approved-2026-09-05`; its Cloudflare version is
`161fd91e-fa66-4090-a09f-b059127fe3d9`. No production rollback is implied by
creating this recovery point. A separate verified bundle/tag preserves the
immediate refinement base `c5307d6` and version
`0bbe87d8-8f31-41b5-9500-cbbd16936479`.

Before implementation, a separate UI/UX design review identified overlapping
readable text during the simultaneous 420 ms fade and the missing persistent
visual anchor. The selected approximately 900 ms sequence dissolves outgoing
text first, reveals incoming text with a short, soft drift, and carries a subtle
two-lobe mist pulse behind the content. The existing shader and starfield retain
their own time and interaction. The official symbol travels continuously between
measured hero and header positions; the enlarged header stays stable between
the six content views. Reduced motion and deep-link initialization settle directly.

Minimum sufficient change: reuse the current section controller, native Web
Animations, existing artwork and atmosphere container. Scope excludes section
copy, typography changes, form behavior, Worker, shader code and hosting changes.
Standard browser animation/measurement facilities suffice; no library, renderer,
router, public API, dependency or production configuration is introduced. Native
cancellation handles interrupted navigation; viewport/preference changes settle
the current destination. New branches must serve these observed motion and
accessibility boundaries. Existing browser checks will extend to intermediate
symbol positions, header docking, return travel, rapid navigation, reduced motion,
and narrow enlarged-text layouts. A separate reviewer checks the final experience.

Implementation result: the existing controller now owns a cancellable sequence,
a single visible symbol traveler and a temporary mist pulse; no continuous loop
or new runtime dependency is added. One header home anchor, scoped styling and
focused browser regressions complete the five-file change with this guide. The
source section markup, official artwork, atmosphere/contact script, Worker and
hosting configuration remain byte-identical. Project Map topology is unchanged.
Generation-bound completion prevents an interrupted animation from settling a
newer destination. The symbol/header use gradual acceleration and deceleration;
text keeps a separate short dissolve and delayed reveal.

Executed verification: repository/provenance checks and real Brave desktop/mobile
tests pass for intermediate symbol positions, header growth and stable docking,
return travel, sequential text/mist, rapid reversal, history, keyboard, touch,
form-draft preservation, resize and preference changes, reduced motion and the
normal document fallback. Narrow 320-pixel layouts at 200% text pass both final
bounds and intermediate Contact hit-testing. Separate UI/UX review inspected
intermediate frames and approved the refined experience. Review found and
resolved a flash of unrevealed text during rapid navigation and temporary clipping
of enlarged header controls. Current visual state is retained when restarting a
dissolve, and controls remain visible as the header grows. No unresolved blocking
or minimality finding remains. The changed-output manifest and separate technical
and visual receipts are kept with the verified recovery bundle; deployment still
requires exact merged-commit checks and live source readback.

## Section navigation increment — 2026-09-05

Ed authorized replacing continuous page scrolling with fading individual views,
six clickable green navigation bars, and a fixed low footer; existing section
copy and artwork remain intact. The hero remains the opening view, reachable
through the home wordmark. Commit, push, a new PR and delivery are authorized;
Ed also authorized unblocking kommiBo for this PR's bounded review operation.
That instruction does not require activating unrelated scheduled jobs.

Before implementation, the clean base was refreshed to `d302880`, including the
concurrent approved README-banner update. Its active Cloudflare version was
`4e45360c-54ea-40f2-8eeb-b3cf639f220f`. A complete verified Git bundle and the
recovery tag `rollback/aekr-web-pre-section-transitions-2026-09-05` preserve it.

Minimum sufficient change: the existing page already has a hero, six named
sections and working hash links. Reuse those boundaries and their entire
contents, add one vanilla browser controller, and scope layout changes to its
enhancement class. Remove unrelated copy, nebula, Worker and hosting work from
scope. Native overflow, focus/inert, history and CSS transitions provide the
required primitives; the existing framework-free platform needs no new runtime
dependency, router framework, public API or configuration surface. The new
controller owns view selection and input coordination separately from the
unchanged atmosphere/contact script. Root cause: the original normal document
flow exposes every section continuously and anchors only scroll the document.

This is a mixed task: visual judgment chooses the transition/layout; deterministic
state and browser checks verify navigation, focus, scroll boundaries and recovery.
Hidden scrollbars do not remove overflow access: tall sections scroll within
their own view before a fresh gesture advances. Header/footer bounds reserve
space, inactive views leave the focus/accessibility tree, and reduced motion
removes fades. Without JavaScript the existing document flow remains available.
Verification covers desktop, narrow/short mobile layouts, keyboard, touch,
history/deep links, form preservation, reduced motion and the unchanged content.
Separate-author focused review applies; this is not a phase-closing Full Audit.

Implementation result: one 206-line controller, 12 added HTML lines and 311
enhancement-scoped CSS lines; section inner markup and the atmosphere/contact
script are unchanged. The other changed leaves are the three Project Map files,
this guide, README, package scripts, syntax-check coverage and a real-browser
regression suite. Added decision branches serve gesture boundaries, history,
focus, motion preferences and viewport measurement; no router abstraction,
runtime dependency, server contract or deployment configuration was added.
The optional browser check reuses an existing Playwright/browser installation
and introduces only explicit test-process inputs, outside the website runtime.

Verification passed: existing repository/provenance checks, actual intermediate
fade opacity, all six destinations, wheel reversal and momentum containment,
history/reload, keyboard from navigation links, native mobile touch, failed-form
draft preservation, reduced motion, no-JavaScript fallback and exact original
section markup. Brave covered desktop, 390- and 320-pixel phones, short landscape
and 320-pixel layouts with text enlarged to 200%. Separate review found and
resolved keyboard edge navigation and enlarged-text clipping; final panel and
fixed-control bounds pass. No unresolved minimality finding remains. A closed
changed-output manifest, browser captures, verified bundle restoration and the
separate review receipt accompany the recovery record outside the public tree.
The kommiBo operation uses its unchanged GitHub adapter with a single-repository,
single-PR permit and a separate-author technical receipt; its local one-use
control returns to PAUSED after that operation. This is not activation of its
global scheduler or a claim of human acceptance. Production readback remains
a separate delivery step tied to the merged commit and live asset bytes.

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

### Footer simplification — 2026-09-05

Ed's latest instruction replaces the footer's three brand/tagline rows with
only the existing banner and the exact copyright `© 2026`. The banner's outer
frame must disappear. Reuse the footer markup and mask rule, remove obsolete
footer-only styling and its former lead-in gap, and hold the raster frame fully
transparent before fading into the artwork. Header, main content, source image,
animation, forms and hosting configuration stay unchanged. No new dependency,
component or contract is needed. Focused desktop/mobile visual verification and
separate-author review apply. Recovery source is `287a693`; its Cloudflare
version is `1e2ebc45-896b-403e-99ea-ebc0513b06c0`.
Brave verification passed at 1440 and 390 pixels: only the banner and copyright
remain, its frame is hidden, original image size/opacity are retained, and no
overflow or page errors occur. Existing repository checks also passed.
