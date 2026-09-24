# aekr-web — project decisions and operating guide

**Status:** Visual increment reopened by Ed on 2026-09-23 (local date): ivory microtexture, recoverable archive and local preview. Local preview approved by Ed; Git delivery and live verification in progress. Prior freeze remains historical: [freeze report](FREEZE-2026-09-06.md).
**Governance:** Lean, Mode 0. **Owner:** Ed, Human Orchestrator in Chief (HOC).
**Route:** Mixed — local, dependency-free editing and checks; Cloudflare hosts the
public site and delivers contact email. No paid LLM API is part of this project.

## Ivory microtexture increment — 2026-09-24 UTC

Ed instructed implementation of the root microtexture brief in full. This reopens
only its visual, startup, archive and verification scope; historical deploy
permissions do not authorize publication. Existing local README, guide and browser
fixture changes were preserved in the original snapshot before edits.

The static stack remains sufficient: one precomposed seeded surface plus a
bounded Canvas 2D flight layer replaces the two prior atmosphere engines. The
existing contact, language and navigation responsibilities remain. HTML/CSS own
the initial panel/phrase geometry; native hash navigation works before or without
the controller. The Worker, email contract and hosting configuration are unchanged.
Ed subsequently requested removal of the new background pause button; it is
removed. Reduced-motion and hidden-tab scheduling controls remain.

Recovery and task evidence are local under the internal `.aekr` directory, outside
publication. The original source archive includes base commit, local patch,
checksums and a verified Git bundle; a separate dark-design extraction preserves
accreatio attribution and provides an executable demo. The approved reference
PNG was not supplied in the checkout; exact image matching is not claimed.

Verification: repository checks, three-way map parity and the full existing
browser suite pass locally. The suite covers initial cold/warm/delayed/reduced
layout, all panels, history, gestures, focus, 200% text, translations and mocked
contact outcomes. After Ed removed the background pause button, focused startup
and dynamic preference tests passed again; the complete lifecycle simulation
retains hidden-tab and reduced-motion scheduling coverage. Separate-author
review verified renderer failure paths, exact original alpha/dimensions in all
three brand derivatives, 3.23:1 field borders and 3.55:1 inactive navigation.
Restored original checks and standalone dark demo startup pass. Exact PNG matching and physical devices remain unverified. The implementation
stage introduced no runtime dependency or Worker/hosting configuration change.
Production evidence is established separately by the delivery step below.

### Human acceptance and delivery — 2026-09-24 UTC

Ed reviewed the local preview, requested removal of the background pause button,
and then stated: “me parece que está bien, procede con lo que sigue”. This records
acceptance of the implemented preview and authorizes continuation through the
normal Git/PR delivery and existing Workers Builds publication path. It does not
claim exact comparison with the absent PNG or reopen unrelated project work.

The remote master was refreshed and still matched the implementation base.
Reviewed implementation hashes remained unchanged. The previously uncommitted
September closure documentation and footer test correction are preserved in a
separate historical closure commit; the visual implementation follows it.
The verified original snapshot and Git bundle remain available locally. Delivery
requires checks for the exact PR/merged revision and live asset readback; a PR or
successful build alone is insufficient. No infrastructure, credentials, service
identities or external kommiBo behavior are changed by this delivery.

### Unified dark olive correction — 2026-09-24 UTC

PR #14 merged as `a127ca49a6d1291d105edf1d4e7c3de0e0cc32e8`; GitHub validation
and the existing Workers Builds deployment succeeded. During delivery Ed asked
that the logo, the A in AEKR, buttons and green text use the same dark olive.
This correction continues the authorized delivery, using the existing button
accent `#214d3a` as the single source rather than selecting another palette.

Before implementation, inspection identified preserved mint pixels in the offline
asset generator, a second CSS text accent, mixed hover fills and footer opacity.
The minimum sufficient change extends the existing CSS/generator boundary:
the generator reads `--accent`, the dim accent aliases it, and solid button hover
fills and brand opacity preserve that color. No library, runtime config or new
abstraction is needed. Three version-2 brand derivatives preserve dimensions,
shape and neutral alpha. Review found that original green fill peaks at alpha
228/255 in mark/logo and 254/255 in the banner, making identical RGB look lighter.
Ed's identical-color correction therefore also normalizes chromatic alpha to an
opaque peak, keeping proportional edge coverage. This explicitly supersedes exact
chromatic alpha preservation for the new derivatives; original PNGs remain intact.
Decorative transparency and antialiasing still composite naturally against paper.
Background textures, renderer, navigation, contact, Worker and hosting are outside
this correction. Verification targets pixel colors/alpha, computed desktop/mobile
colors and contrast, repository/map checks, then exact published asset readback.

Local verification passed: repository/map checks and the desktop/mobile navigation,
language, mocked contact and reduced-motion smoke. Separate-author source-PNG
decoding confirms exact opaque `33,77,58` pixels in all three derivatives, unchanged
silhouette support, expected normalized green coverage and unchanged neutral alpha.
Computed button/hover and text colors agree; contrast is 8.59:1 on ivory and 9.43:1
for the button label. Original artwork and background assets are byte-identical.
These local checks do not substitute for the final deployed revision/readback.

## Website closure and external integration boundary — 2026-09-06

La instrucción posterior de Ed cierra esta fase y congela aekr-web. La consulta
de autenticación correspondía a accreatio, otro proyecto. El informe de freeze
anteriormente enlazado prevalece para el estado del corte; los registros que
siguen conservan su fecha y alcance. Los pendientes se trasladan a una próxima
fase no iniciada. Reabrir requiere una instrucción explícita del propietario.

Ed confirmed that movement is resolved and requested completion of the remaining
website work. Current inspection found no outstanding functional change in the
declared quiet-motion increment. Local HEAD and the remote master both resolve
to `ec2128639bb85384467d77d40202e940e2a94dcc`, the merged PR #13 release.
The exact merge commit has successful GitHub validation and Cloudflare Workers
Builds checks. HTTP readback of the homepage, stylesheet, section controller,
translation script, atmosphere/contact script and 404 document matches local
release bytes; an unknown URL returns HTTP 404. The connected Brave tab also
shows the released site and EN/SP control. This closes the previously open
merged-source and live-asset readback for that increment.

The planned remaining change was documentation only: reuse this operating guide for the
closure and scope boundary, and correct the README's script inventory. No new
document system, dependency, runtime behavior, interface, configuration or
Project Map component is needed. Movement, accessibility preferences, artwork,
contact behavior, Worker and hosting are excluded from this change. Historical
records below retain their original scope and verification limitations.

Closure verification exposed a browser-fixture race, not a phrase-animation
change: before the lazy footer banner decodes, its declared aspect ratio places
the hero at 610.140625 px; after decode, the natural ratio moves it to
610.296875 px. A delayed-image reproduction confirmed both samples remained
in the reading phase. The minimal test-only correction waits for banner decode
and the existing footer-height observer before sampling. Exact stationary-line
assertions remain unchanged; no production source or asset is modified.

Validation result: `npm run check`, the complete `npm run check:browser` and
`git diff --check` passed. The browser suite used local static assets in Brave,
with intercepted email requests and zero page errors. A separate author reviewed
the closure text and implemented the fixture correction; the orchestrator
reviewed that test diff. This is shared-context review, not an independent Audit.
The closure inventory is README +4/-2, this guide +51/-1 and browser tests +6/-0;
there is no runtime complexity or public-contract delta. These closure changes
are local worktree changes, separate from the already verified live release.

**External work in progress (owner report, not deployment evidence):** another
session is integrating the kommiBo console into the website, with intended
access at `https://aekr.io/kommibo`. The kommiBo repository owns that work and its
implementation details. This website-closure task records the coordination
boundary only; it does not implement the console, routes, authentication,
bindings, credentials or infrastructure. Availability and acceptance of that
integration require evidence from its owning session.

Real email inbox receipt remains unverified; browser tests intercept submissions.
Account billing, deployment-control configuration and durable abuse protection
retain the separate evidence boundaries below. These are not newly authorized
implementation tasks or evidence that the visual release failed.

## Quiet motion and EN/SP toggle — 2026-09-05

Ed rejected the particle treatment after viewing PR #12 and authorized restoring
the previous bitmap logo journey, replacing phrase particles with a researched,
restrained transition, and using one EN/SP language button without a dropdown.
Standing full commit, push, PR, kommiBo review by edfortheblind, merge and live
deployment authorization applies. Base is PR #12 merge `68426a7`; the verified
bundle and `rollback/aekr-web-pre-quiet-motion-2026-09-05` preserve it. The exact
PR #4 and pre-PR #12 rollback references remain intact.

Before implementation: the unwanted effect lives in two Canvas implementations
inside the existing section script. The approved bitmap traveler is recoverable
from `75865df`; WAAPI, DOM phrase cells, pause state, locale events and static
fallbacks already cover the replacement. The language boundary already owns
translation and explicit preference storage; only its input control changes.
The smallest coherent change removes both particle engines, restores the bitmap
journey within the current 1500 ms section envelope, and transitions whole phrase
nodes with opacity and a small vertical displacement. The initial phrase is
immediately readable. Each phrase holds fully still for 3000 ms, exits in 240 ms
(0 to -2 px), then the next enters in 400 ms (+4 to 0 px). Text never overlaps.
These timings are a project design choice informed by [Carbon motion guidance](https://carbondesignsystem.com/elements/motion/overview/),
using its productive entrance/exit curves. Pause and static alternatives retain
the [W3C pause guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

Minimum Sufficient Change ladder: exclude nebula, section content, brand artwork,
backend, contact delivery and infrastructure changes. Reuse the existing bitmap,
DOM grid, navigation state and browser animation API; remove samplers, Canvas
buffers, particle resource caps and RAF schedulers instead of leaving dormant
effects. No animation dependency, new router, API, configuration key or operating
surface is necessary. Keep current spacing, mobile geometry and softer section
transitions. A native button shows the active language as EN/SP, toggles en/es
with click or keyboard, and names both the language and next action accessibly.
English remains the default without an explicit stored selection. Existing
translation, storage failure and contact draft/status behavior are preserved.

Expected surface: section script/styles, language control, browser regression
tests and this guide. Verification covers actual bitmap movement, whole-line
opacity/position, stationary three-second reading, pause and interruption,
language persistence and keyboard use, both languages in responsive layouts,
reduced motion, static fallbacks and the unchanged contact/atmosphere boundary.
The design author and runtime implementer are separate. The test author reviews
runtime; the orchestrator separately reviews the test diff. These shared-context
reviews are not independent-context audits. Final inventory and observed evidence
are recorded after implementation below; no success is inferred from this plan.

Implementation result: the official bitmap uses its original `75865df` movement
and easing with the current 1500 ms coordination. Both particle renderers and
their sampling, drawing, resource and failure machinery are deleted. The hero
uses one native whole-line animation or one reading timer; identity-checked
completion handlers cannot replace a phrase after cancellation. Pause, locale,
viewport and visibility changes settle to readable text. Reduced motion or
missing animation capability retains the existing static introduction. The
seven phrases, approved spacing, softer section transitions, typography, content,
nebula and contact code remain unchanged.

One 44 px EN/SP button replaces the label/select/options. Its accessible name
contains the visible code, current language and next action. Native Enter/Space,
explicit preference storage and the existing header/compact-menu placement are
reused. No translation API, route, configuration or dependency is introduced.
The Project Map already describes these same components accurately; no new
component or map projection is needed.

Inventory: section script +58/-445, styles +4/-24, language script +10/-19,
browser tests +143/-195 and this guide. Section script length falls from 914 to
527 lines; named functions from 28 to 19, Canvas creation sites from four to zero
and RAF requests from three to zero. These are descriptive counts, not a
cyclomatic or cognitive score. The one timer and existing state boundaries
remain; no parallel scheduler or renderer is retained. The deliberate
simplification is active for this quiet-motion work item, owned by Ed/HOC:
whole-line transitions are the supported visual ceiling. Reconsider only on an
explicit new visual requirement; use the existing browser animation boundary
before proposing another renderer. No unresolved minimality finding remains.

Repository checks and the implementer's real-Brave smoke pass. Observed reading
lasted 3006 ms; whole-line frames had fractional opacity and 2–4 px bounded
movement without blur. Separate visual review passes desktop, mobile, landscape
and 200% text, including EN/SP and both bitmap directions. The technical reviewer
authored the updated tests but not the runtime; the orchestrator separately
reviewed that test diff. The initial browser run passed motion, navigation,
responsive layout and contact groups before a fixture race: it checked mobile
links before the emulated breakpoint event had finished. Two state-based waits
correct that fixture without changing runtime. The unchanged remaining language,
fallback and reduced-motion groups passed in a bound continuation; this is
combined coverage, not a claim that the original full command exited zero.
Immutable receipt binding precedes the already-authorized Git/provider delivery.
Evidence is stored with the external recovery bundle. Browser evidence uses actual Brave with
mobile emulation, not physical Safari; visibility events are synthetic and all
email requests are intercepted.

## Organic motion and language selection — 2026-09-05 (superseded motion/control)

Ed requested a wider, subtler and varying particle cloud; moving the fixed
“Humans orchestrate. Machines execute.” line into that loop; more breathing
room; slower, elegant section transitions including Back; and a smoke-particle
journey of the official symbol between hero and header. He also restored the
English/Spanish selector with English as the default. Standing full Git,
kommiBo review by edfortheblind, merge and production delivery authorization
applies to this bounded increment. Base `75865df` is the approved PR #11 release.
A verified, restored Git bundle and the new pre-organic-motion recovery tag
preserve it; the exact PR #4 recovery tag remains intact.

Before implementation: the current cloud samples uniform rectangular start
positions, clamps dispersed targets to a rectangle and uses the same sinusoidal
bend. These mechanics explain the repeated box-like shape. Section exits last
240 ms within a 900 ms journey; the symbol is one translated bitmap. Existing
Canvas text sampling, requestAnimationFrame cancellation, WAAPI section state,
image assets, native scrolling, reduced-motion fallback and disclosure control
are reusable. A separate design pass selected 2–4 correlated, rotated cloud
lobes per cycle, smooth boundary fading and a larger responsive halo. Formation
lasts 1400 ms, static DOM reading remains 3000 ms and dispersion lasts 1300 ms.
The released tagline space supports larger gaps without shrinking brand artwork.
All section routes use a 1500 ms envelope with a 460 ms exit and delayed, gentle
arrival; a small settling displacement provides restrained elasticity.

The official transparent symbol can be sampled locally once: up to 900 colored
points disassemble, follow a curved smoke filament and reassemble into the exact
bitmap at the destination. Only hero/header journeys use this effect. Existing
navigation cancellation and destination state remain authoritative. The canvas
runs only during a journey at 30 fps, DPR at most 2 and at most 0.9 million pixels;
image/context/capacity failures retain the existing bitmap traveler. Resize,
hidden-page and reduced-motion changes settle immediately without orphan work.

Search/reuse ladder: exclude changes to content sections, contact delivery,
nebula rendering, brand assets and infrastructure. Extend the existing native
Canvas/WAAPI controller rather than add an animation library or router. Static
English copy stays in HTML; one small local translation boundary selects Spanish
text and accessible labels without network requests or HTML injection. English
is the default when no explicit preference exists; storage failure remains
usable. A native English/Español selector appears in the desktop header and in
the compact Menu disclosure. One language-change event lets existing controllers
refresh measurements, particle masks and dynamic announcements. The contact
handler only translates user-visible status text; delivery semantics and its
background renderer are preserved. No dependency or backend change is needed.

Expected change surface: existing HTML/CSS/section controller, minimal contact
status integration, one translation script, browser tests and project guide/map.
The new script owns locale selection and copy, avoiding translation logic spread
through renderers. Bounded verification covers organic motion frames, static
reading, interruption/fallbacks, header travel, both languages and persistence,
contact mock responses, mobile geometry, 200% text and reduced motion. A separate
technical reviewer checks the immutable diff and output manifest before the
existing one-PR kommiBo route. Visual review uses Brave emulation because the
in-app Browser currently exposes no available browser session.

Implementation result: the seven-phrase loop includes the former fixed tagline
as its second phrase. The fixed block and its obsolete CSS are removed; accessible
static prose retains the message. Native glyph sampling now uses 2–4 oblique
cloud lobes, varied trajectories, small round particles and a responsive halo.
Spatial alpha falls to zero before neighboring copy/controls and viewport edges;
coordinates are not clamped into a box. Desktop story/CTA gaps are 40 px; compact
gaps are 32/28 px. Formation, reading and dispersion are 1400/3000/1300 ms.

The same navigation controller owns the 1500 ms transitions and bounded symbol
journeys. It samples the official bitmap once and reuses the small mask as a
radial-sprite atlas. The 300/800/400 ms dissolve/travel/reform sequence returns to
the exact original bitmap. Compact journeys use at most 600 points, desktop at
most 900; the two backing stores share a 900,000-pixel ceiling. The center of
the smoke uses lower alpha to avoid a confetti appearance. Reversal reuses the
current particle positions; navigation to another content view keeps the same
dock journey. Settlement releases the journey backing store and cancels its RAF.
Image/context/readback/budget failure uses the original bitmap travel route.

One native English/Español selector has a translated label and moves between the
header and compact disclosure. Original English text/attributes are retained,
so repeated switching never translates already-translated text or replaces
markup. Official AEKR names stay unchanged. The single browser preference key
`aekr-language` stores only an explicit selection; English remains the fresh-entry
and unavailable-storage default. The small `window.AEKRLanguage.text` boundary
and one post-translation event keep copy out of animation and request logic.
Contact status retains its original message for retranslation; request payloads,
visits, duplicate guards and draft ownership are unchanged. The atmosphere and
its interaction code are byte-identical to the base.

Visual review found four bounded issues during this increment: particles over
neighboring text/buttons, overly dense symbol dust, a clipped Spanish legend in
short landscape, and a collapsed language select at the 768 px breakpoint with
200% text. The first two are resolved through the existing alpha/sprite boundary.
The landscape story spans two existing grid rows, leaving all four identity rows
and CTA visible. The header can wrap and preserves the native selector's intrinsic
width. These changes keep the approved artwork and typography sizes intact.
A seeded follow-up found particles over the lateral Pause control in some cloud
shapes; a distance-based alpha exclusion now keeps that control clear without
changing the trajectories. Moving the existing header wrap rule to its base
selector also preserves the ordinary bilingual page when the section script or
its animation capability is unavailable. Both cases have reproducible browser regressions.

Runtime inventory: HTML +2/-2, CSS +60/-31, section script +321/-45, contact script
+9/-1 and one new 207-line translation script. The three Project Map projections
add that real component; browser tests and this guide document its contracts.
Named section-controller functions increase from 21 to 28: five own the bounded
symbol lifecycle, one relocates the existing selector and one centralizes translated
announcements. The contact controller adds one status translation function; the
translation boundary has two named functions. These are descriptive structure
counts, not a cyclomatic or cognitive complexity score. New branches serve the
requested motion, cancellation, capacity/failure handling and explicit locale
selection; no general animation framework, duplicate router or background loop
is added. Existing state, fallback, native layout/scrolling and contact behavior
are reused. No dependency, server API, worker, artwork or hosting setting changes.
The new preference/event are the only added client coordination surface.

Verification covers actual glyph/symbol pixels, three-second static reading,
all section routes, history and fresh gestures, cancellation with at most one
symbol RAF, locale changes during every phrase phase, blocked storage, contact
success/failure/races, responsive header reparenting, 200% text and ordinary-page
fallbacks. Seeded tests retain the lateral-Pause regression. The header fallback
capability test disables Web Animations only; removing ResizeObserver globally
also breaks the unchanged background and is not a compatibility claim here.
The atmosphere boundary is compared byte-for-byte with the base.

Separate technical and UI/UX reviewers verified the resolved findings and final
runtime hashes. Their contexts are shared with the orchestration; this is separate
authorship, not an independent-context Audit or human acceptance. Evidence uses
actual Brave with desktop/mobile emulation, not physical iOS, Safari or a native
soft keyboard. No real contact email was sent. Final repository/browser runs and
changed-output hashes must be bound to the immutable technical review before the
one-PR kommiBo approval and authorized delivery. External recovery artifacts hold
logs, screenshots, source manifests and the separate review/provider readbacks.
No unresolved minimality finding, new dependency or production configuration
change remains in this increment.

## Mobile experience refinement — 2026-09-05

Ed authorized a complete mobile UI/UX review, implementation of its recommendations,
validation and delivery through a new PR, kommiBo review and merge. Standing
deployment authority remains applicable. Base `0ac5959` is the verified PR #10
release; a restored Git bundle and `rollback/aekr-web-pre-mobile-revamp-2026-09-05`
preserve it, alongside the exact PR #4 recovery point.

Before implementation: separate design and navigation reviews inspected all seven
views at 320/360/390/430 px and touch landscape 844 x 390, with enlarged text and
reduced motion. The fixed rail consumes the reading width: at 320 px the panel
has 236 px and the phrase only 168 px. The hero is displaced 22 px from center;
landscape initially exposes branding without explanatory content. Touch users
cannot see the six rail destinations, and short-screen targets shrink to 30 px.
Existing section selection, native inner scrolling, history, focus/inert and
contact behavior pass. Their working contracts should be reused.

The minimum sufficient change is one compact presentation of the existing shell,
not a second mobile router or duplicate section model. At widths up to 767 px,
and coarse-pointer landscape up to 1024 x 560, reuse the six anchors in a named
disclosure below the header. One Menu toggle replaces the small header wordmark
in this mode; Contact remains on the right and the official traveling symbol
remains centered. Escape, outside selection and section navigation close the
disclosure with appropriate focus. Its own scroll area preserves 44 px targets
in short viewports. Centered content removes the reserved rail gutter, the header
uses a smaller dock, and the compact footer retains the banner and copyright.
Responsive hero, card and form spacing use existing content and CSS boundaries.
Desktop keeps its rail, geometry and approved appearance.

The compact hero removes the phrase's side inset and gives Pause its own 44 px
row. Physical 20–28 px spacing preserves breathing room when text is enlarged.
Portrait retains the approved brand sizes; short touch landscape uses existing
hero nodes in two columns so identity, the proposition and primary CTA can share
the first view. Cards/forms use 16 px internal padding. Lifecycle descriptions
span the reading width below their number/title row, eliminating the persistent
number-column gutter. Small/enlarged views retain inner scrolling and complete
text rather than reducing font sizes to force everything into one screen.
The proposed visible panel scrollbar is excluded to preserve Ed's approved
scrollbar-free section experience; native inner scrolling remains available.

Search/reuse decision: existing media queries, DOM anchors, section controller,
viewport measurement and CSS layout cover the behavior. Native button semantics
plus one explicit expanded state supply the missing disclosure; no library,
second renderer, route, dependency, API or infrastructure setting is needed.
Implementation is bounded to the existing HTML/CSS/navigation boundary, browser
tests and this guide. The particle engine, nebula, contact handler, copy and
artwork remain outside scope. Verification compares desktop preservation and
mobile width/centering, named navigation, keyboard/touch/focus, short viewports,
200% text and existing golden/failure paths. Separate visual review checks the
settled mobile views and actual transitions, not only screenshots during motion.

Implementation result: one Menu button controls the existing six anchors. The
same controller handles disclosure state, focus recovery and input isolation;
closed links are hidden and inert. The existing ResizeObserver now also watches
the two header controls, so changing text size reflows their layout without a
viewport resize. The compact presentation is selected once from the declared
media query. CSS centers the reading column, reduces fixed chrome, places Pause
below the phrase, and uses the existing hero nodes in short-landscape columns.
Lifecycle descriptions span below their number/title, with verification after
the final stage. Desktop container rules are explicitly reset in compact mode.
Particle overflow is clipped only around the compact phrase boundary.

At 320 px, the reading column grows from 236 to 288 px. With 200% text, lifecycle
description width grows from about 142 to 288 px and the available panel height
from about 258 to 382 px. Compact header heights are 60/76 px, the dock is 52 px,
and the footer is 48 px at default text size. The main CTA and proposition are
visible initially at 390 x 844 and 844 x 390. All content remains scroll reachable
at smaller or enlarged sizes; no text is removed or reduced to force a fit.

Changed outputs are the existing HTML, CSS, section script, browser tests and
this guide. Runtime delta is HTML +2/-1, CSS +303/-44 and section controller
+52/-11 lines. Added branches serve one compact condition and one disclosure
state; native scrolling, anchors, history and the observer are reused. Old compact
rail rules are replaced rather than kept as a second mobile implementation.
No dependency, public API, configuration, worker, artwork or Project Map topology
changes. The complete particle IIFE and atmosphere/contact script are identical
to the base; all six desktop content-view geometry/typography comparisons pass.

Repository checks and the full final Brave suite pass. Evidence includes five
mobile viewports, real touch input, menu names/targets, Escape/outside/selection,
focus through breakpoint changes, scroll and gesture isolation, live 200% text
without resize, landscape lifecycle flow, particle overflow, original navigation,
mocked contact races, reduced motion and no-JavaScript. Separate technical and
UI/UX review reverified both discovered regressions and report no remaining
findings. This is Brave with mobile emulation, not a physical-phone, native
keyboard or Safari test. No real email was sent. The external recovery directory
holds changed-output hashes, logs, screenshots and separate review/delivery
receipts. No unresolved minimality finding or new operational surface remains.

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
