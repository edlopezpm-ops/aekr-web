# Website refresh — 2026-09-04

## Scope and authority

Ed authorized AEKR repository professionalization, an accreatio nebula adaptation,
removal of green/bold terminal letters, and delivery through the live website:
“Procede con todo esto en full hasta deployar el cambio a la página live.
Tú orquestas. Minimizar los gates humanos.”

The orchestrator used three gpt-6-astra agents with ultra reasoning. AEKR source
was inspected at `5275f67494b7fbd2762eaedc645a162fc40922cf`; accreatio at
`de3558870aed85a9b763421a1e919fdf19c25dea`. Both reference checkouts stayed clean.
This was host-agent work with Lean/Mode 0 records, not an AEKR runtime execution.

## Verification

- Typography: 35 wrappers removed. Both HTML files equal the baseline with only
  those wrappers unwrapped; text, punctuation, other attributes and semantic
  emphasis are unchanged.
- Nebula: original shader equations, home timing and mouse response retained;
  colors adapted to AEKR. The existing AEKR stars remain. No new runtime dependency.
- Chromium: desktop and mobile views inspected; no script errors, missing images
  or horizontal overflow. Real WebGL renders; pointer offsets respond. Reduced
  motion and a simulated hidden-document transition stop drawing and resume
  correctly. Coarse-pointer and unavailable-WebGL fallbacks remain usable.
- Contact UI: intercepted responses prove failure preserves input, success clears
  it and buttons recover. Pricing classification and custom 404 checked. No email
  was sent; actual inbox delivery is not asserted.
- Project Map: opens directly from disk, renders, searches, and accepts keyboard
  selection without browser errors.
- Wrangler 4.129.0 deployment dry run passed. Worker code, Cloudflare configuration
  and response headers are unchanged from the baseline.

The typography implementer cross-reviewed the other agents' nebula and governance
work; the orchestrator separately verified typography. The review used existing
agent context and is not a fresh-context Full Audit or security certification.
The requested three roles ran; an additional fresh reviewer could not be spawned
because the session's agent thread limit had been reached.

The combined repository check and standalone map validator passed. The map has
22 IDs; the persisted validator suite covers 10 URL boundary cases. Separate
reviewer probes additionally verified 3 positive and 14 negative cases. The
local validator variance and exact upstream reconstruction are documented in
`master.md`; this is not an unmodified upstream validator PASS. The animation
regression suite rejects the baseline background and accepts this implementation.

## Recovery and delivery boundary

Source baseline: `17b712c1fdbefe43c64abc2c9c36b3a4bfa50eee`.
Previous active Cloudflare version: `ba65459d-a6a6-4475-884f-6d084528b6d5`,
confirmed through the authenticated deployment list before publication. It follows
a secret change and a deployment after the last source build. The source
baseline's historical GitHub build version is
`91aef13c-cb95-40eb-ac74-90f8143b57ff`; its build ID is
`bb12a2ef-2f0e-4166-9462-0b775cd677df`. Production JavaScript matched baseline bytes
before this increment.

Recovery uses the recorded Worker version or a normal revert of the bounded
source change followed by the existing Workers Builds integration; no forced
history rewrite is required. Local checks are pre-deployment evidence. The exact
new build/version and live readback belong to the delivery result, not an inferred
claim from a successful push.

The bounded output inventory is recorded in `change-manifest-2026-09-04.json`.
It hashes the changed files only and excludes its own manifest to avoid a cycle.

A complete Git bundle and source archive were verified locally; the recovery
tag was also pushed to GitHub. See `rollback.md` for restoration instructions.
