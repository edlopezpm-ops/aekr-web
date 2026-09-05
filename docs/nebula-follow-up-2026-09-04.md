# Nebula motion and official lettering — 2026-09-04

## Requirement and reference correction

Ed reported an immobile nebula in Brave and requested the effect from accreatio
as deployed that day, retaining AEKR colors. He also requested the official logo's
lettering in primary AEKR headings. Implementation, verification and deployment
remain covered by his existing session authorization.

The first refresh used accreatio `main` at
`de3558870aed85a9b763421a1e919fdf19c25dea`. That version has slower gas and mouse
parallax, with no click bursts. Authenticated Cloudflare Pages metadata and
accreatio's deployment record identify the newer successful `design-v14-preview`
deployment `4dff21cf-d9cc-4ed4-94fe-4b11b5bf532e`, whose clean source commit is
`53343211a2176be487c17fa8f58202146f3eac7e`. That is this follow-up's reference.
The preview is protected by Cloudflare Access; its source and deployment identity
were inspected, but authenticated visual inspection of the preview is not claimed.

The older AEKR deployment already animated in a clean Brave profile during a
timed GPU and screenshot check. Thus a universal Brave rendering failure is not
established. The reference mismatch is established. Separate pre-fix regressions
also showed a coarse-pointer motion exclusion and a sticky renderer-failure state.

## Minimum sufficient change

Reuse the existing static site, WebGL lifecycle, official artwork and Cloudflare
delivery route. Port the newer reference's gas equations, home speed `2.6`, moving
emission cores, shader visibility mask and density-qualified left-click bursts.
Four burst slots and a 1.6-second active lifetime bound interaction work. Picking
uses a one-pixel framebuffer only for eligible clicks on exposed layout space.
Foreground controls, text, keyboard activation and touch remain excluded.

AEKR supplies its mint, teal, steel and silver palette, existing star density and
reading scrim. The mobile scrim is wider and darker because the new bright gas
reduced the introductory text's legibility in the first mobile screenshot.
Keep reduced-motion, slow-update, data-saving and hidden-tab
behavior, bounded resolution and resource cleanup. Retry a failed renderer only
at an actual visibility or preference event. Replace the earlier pointer-coupled
path instead of layering two interaction models.

Reuse the official logo artwork for brand lettering; retain accessible AEKR
names and ordinary typography in body copy. The normal view crops the existing
official artwork with CSS; forced-colors mode exposes readable system text.
No Worker, contact API, dependency,
paid service, hosting configuration or governance-switch change is needed.

## Verification and delivery evidence

- Seven lifecycle groups pass: exact home timing; autonomous mobile behavior;
  one-pixel picking and bounded bursts; input/density exclusions; failed-picking
  restoration; motion preferences; GPU failure cleanup and bounded recovery.
  The new burst regression failed against the older shader before adaptation.
- In real Brave 152, a stationary pointer produced changing gas shapes and shader
  time advancement on desktop and emulated touch/mobile. A real mouse click on
  visible gas produced a localized pressure wave. Comparing the GPU output at
  the same shader time with and without its active burst changed 61.9% of sampled
  local channels, with a maximum difference of 213/255. The burst then expired.
- Brave preserved contact navigation and input focus; foreground text and touch
  generated no picking. Reduced-motion changes paused and resumed the effect.
  No first-party failed responses, JavaScript errors or horizontal overflow were
  observed in these checks. Desktop and mobile screenshots were inspected.
- Official-lettering checks passed at 320, 390 and 1440 pixels. Forced-colors
  light and dark use readable AEKR text; the normal official crop stays unchanged.
- Intercepted contact failure/success tests preserved input, pricing classification,
  reset and button recovery. The custom 404 remained functional. No email was sent.
- Repository validation passed, including provenance, release boundaries, the
  declared generated-project validator and ten URL/filesystem regression cases.

Focused review is separate from implementation and does not claim a Full Audit.
The [closed output manifest](nebula-follow-up-manifest-2026-09-04.json) records
only this increment's changed output files; it excludes its own receipt bytes.
Production
identity and asset readback are checked separately after the authorized deployment;
the exact commit's GitHub Workers Builds check and the local synchronization
receipt provide deployment evidence without changing the delivered source.

The prior verification record remains historical and does not certify this new
diff. Source and deployment recovery are documented in [rollback.md](rollback.md).
The second Git bundle was restored independently to the exact pre-change commit;
both recovery checkpoints are retained.
