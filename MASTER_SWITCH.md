# Project Master Switchboard

**Authority:** Ed — Human Orchestrator in Chief (HOC)
**Last reviewed:** 2026-09-04
**State vocabulary:** exactly `ON` or `OFF`

This copied file is the single source for persistent capability states in this project. Every agent and orchestrator must read it before substantive work. ON makes a capability available; it does not select a provider, authorize spend, bypass a gate, or begin work automatically.

Only the project owner authorizes a `State` change. The owner may change one cell directly or give the orchestrator one exact command to change one existing row and append the reason below. The command is operator attestation, not cryptographic owner authentication. Without that exact instruction, agents must not alter a state. Review the diff and restart any executable orchestrator after a change. Keep every base row, the marker lines, and the table columns unchanged so the runtime can validate the file. Represent an unused base capability as OFF, never by deleting its row. A project-specific row is appended only after one exact, dated owner instruction names the stable ID and authorizes its initial state and complete routing/reference cells; apply that instruction by direct table edit, validate the complete board, and append the exact instruction and reason to **Change record**. The `-SetSwitch` route changes one existing row only and cannot append. An adapter extension requires a matching `ADAPTER_*` row and explicit registry metadata for real-provider and workspace-write capability. When the orchestrator is seeded, follow its README provider-lifecycle procedure before enabling, replacing, or decommissioning any AI provider; switch state alone never revokes credentials, deletes state, selects a replacement, or creates fallback behavior.

When the orchestrator is seeded, add the literal `.MASTER_SWITCH.md.lock` to the project-root `.gitignore`, keep that stable sidecar in place between commands, and run the switch-only command from the orchestrator directory:

```powershell
.\orchestrator.ps1 -SetSwitch SWITCH_ID -SwitchState ON -HocCommand "Exact owner instruction and reason"
```

The route must validate dependencies, serialize cooperative updates through a stable ignored `.MASTER_SWITCH.md.lock`, replace the file atomically, record the transition, and exit without starting a provider run. Direct editors do not participate in the advisory lock. Use temporary copies for tests; a regression test is not itself authority to change the canonical project state.

<!-- AEKR_SWITCH_TABLE_START -->
| Switch ID | State | Class | Dependency / selection | ON route | OFF route | Critical references |
| --- | --- | --- | --- | --- | --- | --- |
| `OPERATING_ROUTE_LOCAL` | ON | Routing | At least one operating route must be ON; both ON means mixed | Evaluate local/open-weight infrastructure | Exclude local execution claims | `docs/master.md`; project infrastructure docs |
| `OPERATING_ROUTE_VENDOR` | ON | Routing | At least one operating route must be ON; both ON means mixed | Evaluate approved vendor-managed services | Exclude vendor-managed execution and spend | `docs/master.md`; project infrastructure docs |
| `GOVERNANCE_FULL` | OFF | Routing | Select from actual project risk; Lean is the bootstrap default | Follow Full/high-risk delivery artifacts | Follow the concise Lean source of truth | `docs/master.md`; `AGENTS.md` or equivalent |
| `INDEPENDENT_AUDIT` | OFF | Guarded | Must be ON when `GOVERNANCE_FULL` is ON or the owner requests Audit; context freshness is governed separately | Use the audit checklist; apply `INDEPENDENT_AUDIT_CONTEXT` to context enforcement | Lean normal review only | `docs/delivery/audit-checklist.md`; tool entry constitution |
| `PROJECT_MAP` | ON | Routing | Required for Full/high-risk; optional for structurally simple Lean repos | Maintain the autonomous Project Map | Navigate through README and canonical docs | `PROJECT_MAP.html`; `PROJECT_MAP.md` |
| `AEKR_BRANDING` | ON | Routing | OFF requires a documented client, legal, contractual, or brand exception | Keep local AEKR provenance assets | Remove prohibited branding and record the exception | `README.md`; project source of truth |
| `SCHEDULED_CHECKINS` | OFF | External | Requires a separately configured scheduler | Use reporting-only scheduled prompts | Use on-demand prompts | `docs/delivery/scheduled-checkins.md` when present |
| `ORCHESTRATOR_MODE1` | OFF | Runtime-enforced | Mode 0 remains default | Permit human-gated Mode 1 after validation | Use Mode 0 manual prompts | `toolkit/orchestrator/README.md` when Mode 1 is seeded <!-- AEKR-CONDITIONAL-REFERENCE switch=ORCHESTRATOR_MODE1 state=ON target=toolkit/orchestrator/README.md --> |
| `MODE2_PROPOSAL_API` | OFF | Routing | Read-only proposal evaluation only | Permit the bounded read-only API | Do not route work through Mode 2 | `toolkit/orchestrator/ARCHITECTURE.md` when Mode 1 is seeded <!-- AEKR-CONDITIONAL-REFERENCE switch=ORCHESTRATOR_MODE1 state=ON target=toolkit/orchestrator/ARCHITECTURE.md --> |
| `REAL_PROVIDER_EXECUTION` | OFF | Runtime-enforced | Requires Mode 1, selected adapter, health, enabled limits, and the effective typed gate | Permit configured real-provider preflight | Block real providers; mock may remain available | `toolkit/orchestrator/GATE_MODEL.md` and provider lifecycle in README when Mode 1 is seeded <!-- AEKR-CONDITIONAL-REFERENCE switch=ORCHESTRATOR_MODE1 state=ON target=toolkit/orchestrator/GATE_MODEL.md --> |
| `ADAPTER_MOCK` | OFF | Runtime-enforced | YAML must explicitly select `kind: mock` | Permit zero-usage simulation | Reject mock selection | Orchestrator config when seeded |
| `ADAPTER_CODEX` | OFF | Runtime-enforced | YAML must explicitly select `kind: codex` | Make Codex selectable | Reject Codex selection | Orchestrator config and provider lifecycle when seeded |
| `ADAPTER_CLAUDE_CODE` | OFF | Runtime-enforced | YAML must explicitly select `kind: claude_code` | Make Claude Code selectable | Reject Claude Code selection | Orchestrator config and provider lifecycle when seeded |
| `CODEX_CUSTOM_CA_FORWARDING` | OFF | Runtime-enforced | Requires `ADAPTER_CODEX` ON and operator-controlled CA path | Forward `CODEX_CA_CERTIFICATE` only to Codex children | Drop the Codex-specific variable | Codex adapter docs when seeded |
| `PROVIDER_WORKSPACE_WRITE` | OFF | Runtime-enforced | Implementador only plus sandbox/tool policy and the effective typed gate | Permit bounded provider write tools | Reject write-capable real-provider config | Orchestrator adapter docs when seeded |
| `CODEX_NON_GIT_EXECUTION` | OFF | Runtime-enforced | Requires Codex and `allow_non_git: true` | Permit the explicit non-Git option | Reject `allow_non_git: true` | Codex adapter docs when seeded |
| `CLAUDE_BASH_TOOLS` | OFF | Runtime-enforced | Requires Claude Implementador and exact rules | Permit only listed Bash rules | Reject non-empty Bash rules | Claude adapter docs when seeded |
| `USD_BUDGET_CEILING` | OFF | Runtime-enforced | ON requires `budget.ceiling`; unmeasurable providers fail closed | Enforce configured USD ceiling | Reject a configured USD ceiling | Orchestrator budget docs when seeded |
| `HUMAN_FINAL_AUTHORITY` | ON | Guarded | Applies to final task/project acceptance and terminal release decisions; switch creation and mutation remain owner-controlled | Require recorded human acceptance for final results and release | Permit configured deterministic runtime acceptance only when every other applicable switch and gate permits | Tool-entry constitution; orchestrator Gate Model when seeded; project lifecycle SOP |
| `GATE_TABLE_HUMAN_ONLY` | OFF | Runtime-enforced | Global named-gate default; OFF neither selects an executor nor changes another switch row | Force every named default gate to `HUMAN_ONLY` | Permit `RUNTIME_AUTO` classification only where the applicable action-specific switch and trusted configuration separately allow it; Mode 1 still forces human authorization | Orchestrator Gate Model, gate engine, and runner when seeded |
| `INDEPENDENT_AUDIT_CONTEXT` | OFF | Runtime-enforced | Relevant when an audit is selected; audit availability remains governed by `INDEPENDENT_AUDIT` | Require a fresh orchestration and provider context for independent audit | Permit a configured audit/review without fresh-context enforcement and record reduced assurance | Audit checklist; tool-entry constitution; orchestrator adapter/session docs when seeded |
| `SECRET_HANDLING_CONTROLS` | OFF | Runtime-enforced | Governs AEKR environment exposure, persistence, and logging; the typed secret-access gate remains separate | Enforce controlled exposure, non-persistence, redaction, and the typed credential gate | Permit explicitly configured bounded secret handling without AEKR filtering; external policy and applicable law still apply | Tool-entry constitution; project security policy; orchestrator gate/adapter docs when seeded |
| `BILLING_CONTROLS` | OFF | Runtime-enforced | Applies to real adapters; the USD ceiling and external account billing reality remain separate | Enforce the configured subscription-auth boundary and refuse API-key billing paths | Permit the selected adapter's explicitly configured billing/auth path; do not select a provider, spend funds, or change external billing | Orchestrator adapter, architecture, and provider-lifecycle docs when seeded |
| `NO_PROVIDER_FALLBACK` | OFF | Runtime-enforced | Provider selection remains explicit; OFF requires a trusted explicit ordered fallback and never invents provider priority | Stop when the selected provider fails; never invoke another provider | Permit only an explicitly configured fallback if separately implemented; no fallback executor is supplied by this template | Orchestrator registry, runner, architecture, and provider-lifecycle docs when seeded |
| `CONTROL_PLANE_ISOLATION` | OFF | Runtime-enforced | Applies to effectful orchestration state, journal, lock, and authoritative `STOP`; provider sandboxing remains separate | Require the control plane outside the provider project tree and reject project-local authoritative control state | Permit an explicitly configured project-local control root with its exposure acknowledged | Orchestrator runner, architecture, and Gate Model when seeded |
| `SESSION_DEADLINES` | OFF | Runtime-enforced | Applies to Work Sessions, health checks, and provider invocations; component timeouts remain configuration parameters | Persist an absolute Work Session deadline and bound provider operations to it | Apply no AEKR absolute Work Session deadline; retain configured component timeouts | Orchestrator state, runner, adapter, and architecture docs when seeded |
| `ITERATION_INVOCATION_CAPS` | OFF | Runtime-enforced | Covers iteration, provider-invocation, and consecutive-failure caps; USD ceiling and session deadline remain separate | Enforce configured operational caps and escalate when exceeded | Apply no AEKR iteration, invocation, or consecutive-failure caps; retain other enabled controls | Orchestrator budget, runner, and architecture docs when seeded |
| `AUTOMATIC_SHARED_HISTORY` | OFF | Runtime-enforced | Requires `GATE_TABLE_HUMAN_ONLY` OFF, a typed commit/push/merge action, and a trusted executor; destructive history also requires `AUTOMATIC_DESTRUCTIVE_ACTION` ON | Permit configured automatic commit, push, or merge through the typed gate | Require exact human authorization before writing shared history | Orchestrator gate policy; tool-entry constitution |
| `AUTOMATIC_DEPLOYMENT` | OFF | Runtime-enforced | Requires `GATE_TABLE_HUMAN_ONLY` OFF, a typed production action, a trusted executor, and every other enabled production control | Permit configured automatic deployment or production configuration through the typed gate | Require exact human authorization before deployment or production configuration | Orchestrator gate policy; project definition of done |
| `AUTOMATIC_DESTRUCTIVE_ACTION` | OFF | Runtime-enforced | Requires `GATE_TABLE_HUMAN_ONLY` OFF, a typed bounded destructive action, and a trusted executor; it does not imply shared-history or deployment authority | Permit the configured bounded destructive action through the typed gate | Require exact human authorization for destructive action | Orchestrator gate policy; tool-entry constitution |
| `AUTOMATIC_PHASE_EXPANSION` | OFF | Runtime-enforced | Requires `GATE_TABLE_HUMAN_ONLY` OFF plus a typed phase/scope action and lifecycle prerequisites; it does not authorize later prompts or another switch | Permit configured automatic phase transition or declared-scope expansion through the typed gate | Require exact human authorization for phase transition or scope expansion | Orchestrator gate policy; orchestration loop; project lifecycle SOP |
| `NARROW_POC` | OFF | Routing | One concrete risky unknown only | Run bounded feasibility work | Continue Discovery without speculative build | `docs/master.md` or discovery source |
| `VOLUME_TEST_PLAN` | OFF | Routing | Enable by evidenced volume/concurrency risk | Add scripted volume evidence | Use ordinary risk-proportionate tests | Test plan or `docs/master.md` |
| `UAT` | OFF | Routing | Enable by stakeholder/operational need | Add user-acceptance evidence | Use engineering verification appropriate to risk | Test plan or `docs/master.md` |
| `MODE2_PERSISTENT_RUNNER` | OFF | Reserved | No implementation is supplied | Reserved; requires separate authority and implementation | Keep Mode 2 non-effectful | Orchestrator status docs when seeded |
<!-- AEKR_SWITCH_TABLE_END -->

## Required routing procedure

Read this file, follow references for applicable ON states, remove OFF branches, then resolve provider selection from explicit configuration. Missing/invalid/duplicate/contradictory state or runtime digest drift is `BLOCKED`.

## Complete switch coverage and external authority

The base table represents every capability enforced by the copied AEKR governance and orchestrator. Before project work begins, represent any additional project-enforced capability as a complete owner-authorized row rather than an unreachable rule. The State column above is the sole current snapshot after copying; no prose sentence substitutes for it. States express availability and policy eligibility only: they do not select a provider, create an executor, or bypass execution-mode and final-authority requirements.

The board cannot grant authority held elsewhere. Provider terms of service, vendor machine-managed policy, actual account billing or entitlements, contracts, and applicable law remain binding even when an AEKR row is OFF.

## Change record

- 2026-09-04 — Initial project state selected by Ed — Human Orchestrator in Chief (HOC): Authorized website professionalization; Lean/Mode 0, mixed route, requested map and branding, human final authority; runtime capabilities absent.

This initializes this repository only and does not mutate upstream switches.
Current session authorization for implementation and delivery is recorded in
`docs/master.md`; it is not an automatic runtime capability.

## Local interpretation

Read `docs/master.md` for the project-specific addendum, source provenance,
branding variance and verification/delivery boundaries. In Mode 0, OFF runtime
rows mean absent local runtime enforcement; they do not override user instructions,
provider policy, privacy duties, or the manual project's secret and cost rules.
