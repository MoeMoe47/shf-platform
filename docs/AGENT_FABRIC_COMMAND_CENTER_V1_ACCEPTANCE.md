# Agent Fabric Command Center — V1 Acceptance (AFCC-0 / 1 / 2 / 2A / 2A.1 / Visual V3 / 2A.2 / 2A.3)

Date: 2026-09-25 (Visual V3 and AFCC-2A.2: 2026-09-26)
Branch: `feature/agent-fabric-command-center-v1` (from `project-1-canonical-city-foundation` @ `6bf3fed`)
Status: implemented, read-only, not committed — pending review.
Plan: `docs/AGENT_FABRIC_COMMAND_CENTER_MASTER_PLAN.md`

The Command Center is a projection over existing Agent Fabric authorities. It owns no agent, run, risk, gate, health, identity or reporting truth. Every value on screen is read from a named endpoint and keeps that endpoint, its authority owner and the time it was observed. Reading the page never runs verification, evaluates Watchtower risk, or writes anything.

## Routes

| Route | Component | Guard | Status |
|---|---|---|---|
| `/admin.html#/agent-fabric` | `AgentFabricPage.jsx` | `protect("/agent-fabric", …, [audit.view])` | Unchanged |
| `/admin.html#/agent-fabric/command` | `AgentFabricCommandCenter.jsx` | `protect("/agent-fabric", …, [audit.view])`, same access rule and permission as the existing page | New; renders full-bleed (AFCC-2A.2) |
| `/api/agent-fabric/command/{agents/health,agents/readiness,gate/status,runs/recent}` (SHS API) | `apps/shs-api/src/domain/agent-fabric-command/api/routes.ts` | SHS session + org context + SHS `bos.governance.read`; GET only (other methods 405) | New (AFCC-2A.2) |

The admin rail gains "Fabric Command". The existing "Agent Fabric" link gets `end: true`. `/watchtower` still redirects to `/agent-fabric`. Frontend guards are not backend authorization; see the endpoint contracts.

## Components

All under `src/pages/admin/agent-fabric-command/`. Visual V3 details: master plan, "AFCC Visual Experience V3 — Operational Topology".

| File | Role |
|---|---|
| `AgentFabricCommandCenter.jsx` | Shell: navigation, header (search, refresh), priority + health strip, priority matches, ecosystem map, panels, drawer, search palette. Container-width layout: `ultra` ≥1760 (docked drawer), `wide` ≥1180, `medium` ≥780, `narrow` |
| `components/CommandSidebar.jsx` | Command navigation (14 entries) + Ecosystem Authorities (12). Current page, in-page regions, existing admin/app routes, or disabled with a reason |
| `components/CommandStatusStrip.jsx` | **V3:** Priority filters (Critical, Needs Review, Degraded, Stale, Normal) with per-category coverage, and Global health (Fabric Live/Degraded/Offline, Readiness, Agent health, Infrastructure, Watchtower risk). Only posture changes are announced |
| `components/EcosystemMap.jsx` | **V3:** interactive topology (SVG edges, button nodes), Operations / Dependency views, Geography disabled, hover tooltip, selection path, priority highlight, legend |
| `components/CommandOverview.jsx` | **V3 panels:** Recent operations, Watchtower & LOO, Infrastructure, Observability, Agent fleet, Governance & alignment, Known data gaps |
| `components/CommandDrawer.jsx` | Context drawer with **Overview / Authority / Timeline / Evidence / Dependencies** for systems, runs, agents, sources, posture, gate, fleet, gaps |
| `components/CommandSearch.jsx` | **V3:** ⌘K / Ctrl+K palette over loaded systems, agents, runs, alerts |
| `components/SourceState.jsx` | `GapValue`, `GapMarker`, `StateChip`, `SourceNotice`, `SourceFooter` |
| `ecosystemTopology.js` | **V3:** canonical nodes/edges from the Ecosystem Connection Matrix (each edge cites its row), flow-typed lineage traversal |
| `operationalModel.js` | **V3:** priority classification + coverage, node status, edge state, search index. Pure |
| `topologyLayout.js` | **V3:** deterministic frame/grid geometry and edge paths. Pure |
| `agent-fabric-command.css` | Scoped styles (class names avoid the app's global `[class*=…]` selectors) |

## Data adapters (contracts)

| Module | Contents |
|---|---|
| `commandContracts.js` | Frozen endpoint contract; `LEGACY_UNSAFE_ENDPOINTS` (never fetched); `SOURCE_STATE`; `GAP` vocabulary; `KNOWN_DATA_GAPS`; sections; poll intervals |
| `commandClient.js` | GET-only fetch via `fabricUrl()` / `FABRIC_API_BASE`, with `credentials: "include"` so a same-origin Fabric session cookie is sent. **Sends no credential header (AFCC-2A.1).** Routes that accept only the Fabric admin key are never called (state `AUTH_BRIDGE_REQUIRED`). Never fetches when the production Fabric route is unconfigured |
| `commandAdapters.js` | FabricHealth, FabricAgentSummary, FabricLayerGate, FabricRunSummary, **FabricWatchtowerSummary** (`adaptWatchtowerRead`), **FabricInfrastructureStatus / FabricObservabilityStatus** (`adaptInfrastructureRead` / `adaptObservabilityRead`), `derivePosture` |
| `commandPresentation.js`, `commandTime.js` | State copy, global health strip (V3: Infrastructure replaces Recent runs, which has its own panel), elapsed-age wording (V3: compact `formatAgeShort` for map nodes) |
| `overviewCoordinator.js` / `useCommandOverview.js` | One shared poller; per-source independent failure; paused when the tab is hidden |

Each projection is `{ state, source: { key, endpoint, authority, httpStatus, observedAt, message }, data }`. A payload that breaks its contract becomes `INVALID_RESPONSE` as a whole. The AFCC-2A read envelopes are additionally validated for `contract: "afcc.read.v1"`, the matching `kind`, and `read_only: true`.

## Endpoint contracts

| Endpoint | Backend auth (confirmed) | Poll |
|---|---|---|
| `GET /health/live` | Public probe | 60s |
| `GET /health/ready` (200 or 503 with payload) | Public probe; active verification, see AFCC-2B | 60s |
| `GET /health/degraded` | Public probe; active verification, see AFCC-2B | 60s |
| `GET /status` | Public probe | 60s |
| `GET /admin/agents/summary/health` | `X-Admin-Key` (router dependency), fails closed. **Not browser-reachable since AFCC-2A.1: never called** | — |
| `GET /admin/agents/summary/execution-readiness` | same. **Never called** | — |
| `GET /admin/layers/gate/status` | `X-Admin-Key` (router dependency), fails closed. **Never called** | — |
| `GET /runs/recent?limit=25` | `X-Admin-Key` (handler), fails closed. **Never called** | — |
| `GET /api/v1-command-center/agent-fabric/watchtower` | **AFCC-2A command read** | 60s |
| `GET /api/v1-command-center/agent-fabric/infrastructure` | **AFCC-2A command read** | 120s |
| `GET /api/v1-command-center/agent-fabric/observability` | **AFCC-2A command read** | 120s |

Never fetched (`LEGACY_UNSAFE_ENDPOINTS`): `/watchtower/summary`, `/admin/infra/verify`, `/admin/observability/verify`. Also never called: `/watchtower/programs` and `/watchtower/quarantine/*`.

## AFCC-2A — Safe read projection hardening

### Old endpoints and why each was rejected (measured, not assumed)

Each handler was run once against an isolated copy of the Fabric, recording files written, subprocesses and network connections.

| Endpoint | Side effects per call | Expensive work | Auth before 2A |
|---|---|---|---|
| `GET /watchtower/summary` (also `/watchtower/programs`) | +1 risk snapshot, +1 risk-history row, +1 audit line **per catalog program** (hash chain extended); creates `logs/game_theory.audit.log` | Recomputes all program risk from LOO rankings, and runs about 25 layer summaries (~30–60ms; no subprocess or network) | None |
| `GET /admin/infra/verify` | Would append a probe row to `data/watchtower.db`, but **never ran**: a doubled script path (`services/shf-agent-fabric/scripts/...` resolved from inside the service dir) made 4 of 5 checks fail every time, returning absolute interpreter and file paths in `stderr_tail` | 6 subprocesses (~230ms) | None |
| `GET /admin/observability/verify` | None in practice: the Watchtower probe called `build_watchtower_alerts()` without its required argument and raised `TypeError`, whose text was returned; the endpoint was always 503 | 6 subprocesses (~280ms) | None |

**Correction to the earlier V1 notes:** V1 stated that `/admin/observability/verify` writes Watchtower snapshots. It did not, because of the `TypeError` above. With the approved fix it now does, as an admin-only action (see below).

No runtime callers of any of the three exist. Only docs and tests reference them.

### Persisted state discovered

- **Watchtower** (`var/watchtower_store.sqlite`): hash-chained `risk_snapshots` (latest per program: time, band, quarantine flag, action, reasons), `risk_history`, manual `quarantine`, `attestations`. **Alerts and integrity rates are not persisted**; they exist only during evaluation.
- **Infrastructure / observability:** no last result was persisted anywhere. The verify endpoints returned results without storing them; startup checks only log. `var/self_audit/latest.json` is a separate engine whose "infrastructure" runner only checks file presence, so it is not used.

### New safe read projections (`services/shf-agent-fabric/routers/command_read_routes.py`)

| Route | Reads | Never does |
|---|---|---|
| `GET /api/v1-command-center/agent-fabric/watchtower` | `fabric/watchtower/read_projection.py`: opens the store with sqlite `mode=ro`, no `ensure_schema`, no pragmas. Latest snapshot per **catalog** program (same static LOO catalog Watchtower uses), active manual quarantine, latest attestation. Worst band and risk counts are rolled up from persisted bands with Watchtower's own rule. Programs with no snapshot report `NOT_YET_EVALUATED`; snapshots outside the catalog are excluded and counted. Alerts/integrity: `NOT_PUBLISHED` | recompute risk, call LOO, write snapshots/history/audit/quarantine/attestations, create the store |
| `GET /api/v1-command-center/agent-fabric/infrastructure` | `fabric/command/verification_results.py`: last record written by the privileged action | run scripts or subprocesses, create directories |
| `GET /api/v1-command-center/agent-fabric/observability` | same | same |

Each read returns `contract: "afcc.read.v1"`, `read_only: true`, the `access` path used, and an explicit `state`: `AVAILABLE`, `NOT_YET_VERIFIED`, `NOT_YET_EVALUATED`, or `BACKEND_ERROR` with a reason code. Any exception returns `503 {state: BACKEND_ERROR, reason_code: PROJECTION_READ_FAILED}` with no exception text.

Measured on a copy of the real store: 4–6ms median per read, no subprocesses (a test harness that raises on subprocess spawn stayed silent), and no network.

### READ versus privileged ACTION

| Privileged ACTION (unchanged location) | Now | READ projection |
|---|---|---|
| `GET /watchtower/summary` | Unchanged: still evaluates and writes (it is the evaluation). Not called by AFCC | `/…/watchtower` |
| `GET /admin/infra/verify` | Requires `X-Admin-Key`; doubled-path bug fixed (scripts run with the Fabric interpreter from the service root, `PYTHONPATH` set); records a sanitized result. Response contract unchanged | `/…/infrastructure` |
| `GET /admin/observability/verify` | Requires `X-Admin-Key`; `TypeError` fixed (`rows, integrity = compute_watchtower_rows(); build_watchtower_alerts(integrity)`), as the probe's authors intended. **As a result, a privileged observability run now performs one Watchtower evaluation (writes snapshots).** Records a sanitized result | `/…/observability` |

Neither action is exposed in the Command Center UI.

### Auth model

- **Fabric session with `bos.governance.read`** is the only accepted read credential. It is an existing read-only permission granted only to `shs_admin`, and the default gate of the existing command-center projections.
- The option B transitional `X-Admin-Key` read (chosen 2026-09-25) was **removed in AFCC-2A.1**: privileged keys must never be browser-held.
- No session: 401, which the UI shows as "Auth bridge required". A session without the permission: 403, recorded as an auth event, shown as "Access restricted".
- The read credential unlocks no action: verify actions, `/runs/execute`, report publish, layer/agent toggles and alignment containment all return 401 without the server-held admin key (tested).

### Sanitization (`fabric/command/sanitize.py`)

All projection output passes a safe-output boundary:
- **Dropped keys:** paths, stdout/stderr, tracebacks, exceptions, `baseUrl`, secrets, tokens, keys/keyrings/kids, env, commands, raw payload JSON.
- **Redacted strings:** absolute and Windows paths, tracebacks, `SomethingError`/`Exception` text, secret assignments, bearer tokens, `ENV=value`, long hex and base64 blobs.
- **Recorded verification results** hold only check name, pass/fail, and an UPPER_SNAKE reason code (`CHECK_FAILED`, `PROBE_FAILED`). Nothing else is stored.
- **Operator-safe identifiers:** sources and actions are named by ID (`watchtower_store`, `admin.infra.verify`), not by path.

### Staleness

There is no canonical freshness threshold in the Fabric. Projections return `staleness: { age_seconds, threshold: "NOT_DEFINED" }` and the UI shows the age as a fact ("Last evaluated 23 days ago", "Verified 3 hours ago"), never a derived STALE verdict. Posture treats a last-recorded non-PASS verification as degraded and always quotes its age. Missing results are listed as "Not included (not yet verified)". Viewer access problems on verification reads (401/403) are listed as not included rather than as Fabric faults.

### SQLite note

Opening a WAL-mode database read-only can create SQLite's `-wal`/`-shm` coordination files if they don't exist. They hold no Watchtower data, and tests compare the store by full logical dump. The audit itself created such files for `var/watchtower_store.sqlite` and `data/watchtower.db`; they were empty and have been removed.

## AFCC-2A.1 — Browser secret removal

### Original vulnerability

The Fabric admin key (the value Fabric checks as `ADMIN_API_KEY`, which authorizes admin reads and mutations including `/runs/execute`, agent/layer toggles and registry changes) was reachable by browsers in three ways:

| Source | Secret / variable | Browser reachable? | Consumer | Fix |
|---|---|---|---|---|
| `.env.local` | `VITE_SHF_AGENT_ADMIN_KEY` (same value as the Fabric `ADMIN_API_KEY`) | **Yes.** Inlined into production chunks, and served in every dev-server module | `AgentSyncStatus.jsx`, `aiAnalystContextAdapter.js` (page-context dry run) | Consumers removed; line removed from `.env.local`; build guard test |
| 31 source files | whole-object `import.meta.env` (`?.`, `&&`, `[name]`, bare) | **Yes, root cause.** Any such reference makes Vite inline **every** `VITE_*` value into the chunk | fabricConfig, Metaverse clients, Universe registry, cross-app bridge, analytics, lessons, arcade, … | Member-access reads, or the `src/system/env/publicEnv.js` allowlist |
| `src/pages/admin/{AlignmentSwitchboard,ReportsDashboard}.jsx` | `VITE_ADMIN_KEY`, `VITE_APP_GATEWAY_KEY` (not set locally) | Would be, if set | Alignment plan execute/validate/app state; reports snapshot | Removed; admin calls fail closed (401 → explicit notice); snapshot needs no key |
| `localStorage.ADMIN_API_KEY` / `shf_admin_key` | Browser-held Fabric admin key | Yes, sent as `X-Admin-Key` | `AgentFabricPage.jsx`, `Registry.jsx`, `registry_admin_api.js`, AFCC `commandClient.js` | Removed; routes fail closed |
| `src/shared/hardening/runtimeDynamicDependencyAudit.json` (tracked) | Captured bundle snippet containing the key value | Not bundled, but **committed** (`91ded67`, 2026-05-28) and on 12 remote branches of a **public** GitHub repo | none (audit artifact) | Redacted in the working tree; history not rewritten; rotation required |
| `.env`, `services/shf-agent-fabric/.env` | `ADMIN_API_KEY` (server-only) | No: not `VITE_*`, no `envPrefix` change, no `define`, proxy injects no headers | Fabric server | Unchanged (server-only) |
| `.env.local` | `VITE_MAPBOX_TOKEN` (`pk.` public token) | Yes, by design | map components | Out of scope; public token (URL-restrict it in Mapbox) |

**Root cause:** `VITE_*` variables are public browser configuration, and whole-object `import.meta.env` references inline all of them.

### Affected surfaces and their state now

| Surface | Calls | Class | Now |
|---|---|---|---|
| `/admin.html#/agent-fabric` | `/admin/agents`, `/verify`, `/summary/health`, `/admin/layers/gate/status` | READ | No key sent; 401, explicit "requires a server-side auth bridge" notice |
| AFCC `/agent-fabric/command` | agents ×2, gate, runs | READ | Never called; lanes show **Auth bridge required** |
| AFCC read projections | watchtower, infrastructure, observability | READ | Fabric session only; 401 → Auth bridge required; 403 → Access restricted |
| `/admin.html#/registry` (`Registry.jsx`, `registry_admin_api.js`) | list/events/get, upsert, lifecycle, attest | READ, REGISTRY MUTATION | No key sent; fail closed (401) with notice |
| Alignment Switchboard (enabled by `VITE_ENABLE_ADMIN`) | `/admin/mode`, `/admin/apps`, `/admin/align/plans`, app state/force, `/runs/validate`, `/runs/dry-run`, `/runs/execute` | READ, MUTATION, DRY RUN, EXECUTION | No key sent; 401 → notice |
| SHF Command AI Analyst sync (`AgentSyncStatus.jsx`) | `POST /admin/agents/ai_analyst_agent/page-context-dry-run` | DRY RUN | Not called; status `auth_bridge_required` |
| Reports dashboard | `/reports/snapshot` | READ (no backend auth) | Works; the useless key header was dropped |

### Replacement auth architecture

- **Supported today (model B):** a browser holding a **Fabric session** (`/fabric-api/auth/login`, same-origin cookie) reads the AFCC projections with `bos.governance.read`. This was verified live: the `shs_admin` fixture session reads real Watchtower data, and the `client` fixture session gets 403.
- **Not supported yet (model A/C):** the SHS admin UI authenticates only to the SHS API. No server-side SHS→Fabric read path exists, because the SHS HMAC service identity (`signInternalRequest`, `services/internal_service_identity.py`) is hard-scoped to `POST /shf/internal/ingestion/events`.
- **Recommended AFCC-2A.2:** an SHS-owned `/api` read proxy authorized by the SHS session and permission. It calls the Fabric with a new, separately reviewed HMAC **read** scope (GET-only allowlist mapped to `bos.governance.read`), preserving user and org context. The browser never receives a credential.

### Build-time secret regression test

`tests/afccBrowserSecretScan.test.mjs` (`npm run security:bundle-secret-scan`):
- **Source checks:** no whole-object `import.meta.env`; no key-like `VITE_*` reads (Mapbox public token excepted); no `X-Admin-Key` header setting; no localStorage admin-key reads.
- **Build check:** a real production build into a temp dir, with random sentinels injected into `VITE_SHF_AGENT_ADMIN_KEY` / `VITE_ADMIN_KEY` / `VITE_APP_GATEWAY_KEY`. It scans every output file for the sentinels, all local server-only secret values, known fixture secrets and credential markers. It prints counts only.
- **Result: `scanned 378 browser files … privileged findings: 0`**. The real `dist/` from `npm run build` was scanned the same way: 0.

### Key rotation assessment: **ROTATION REQUIRED**

- The value was committed in `src/shared/hardening/runtimeDynamicDependencyAudit.json` (commit `91ded67`, 2026-05-28).
- That commit is on 12 remote branches of `github.com/MoeMoe47/shf-platform`, which is **publicly readable** (the GitHub API returned 200 unauthenticated).
- The same value is the Fabric server's `ADMIN_API_KEY`.
- It was also present in any production build made on this machine since the `VITE_` variable was added, and in local copies (`~/Desktop/shrv1` and the `shrv1-claude`, `shrv1-codex`, `shrv1-codex-next` checkouts each contain it once).
- `.env.production` does not contain it. Whether this value is used by any staging or production deployment could not be determined from the repo, so treat it as compromised everywhere it is used.
- **Recommended actions** (not performed; no key was rotated automatically):
  1. Generate a new Fabric `ADMIN_API_KEY` and update every server that uses it.
  2. Consider purging the value from git history (history rewrite plus force-push; coordinate with collaborators).
  3. Check GitHub secret-scanning alerts.
- The redaction in the working tree only stops further copies; it does not un-leak the value.

### Temporarily unavailable in the browser (fail closed)

- AFCC agents, gate and runs lanes.
- The Agent Fabric page's registry data.
- Registry admin reads and mutations.
- Alignment Switchboard admin actions.
- SHF Command AI Analyst sync.
- AFCC Watchtower and verifier lanes, for browsers without a Fabric session.

All of them work again once AFCC-2A.2 provides server-side authorization.

## Lanes

V3 regrouped the lanes (the AFCC-2 lettering below is kept as the record of what each shows). Posture moved from a lane into the Fabric health item and the Agent Fabric / posture drawer; Recent operations, Watchtower & LOO, Infrastructure, Observability, Agent fleet and Governance & alignment are separate panels.

- **Global health strip (V3):** Fabric Live/Degraded/Offline/Checking with a probe-derived detail line; Readiness READY/NOT READY; Agent health (`ready / total`); Infrastructure (last recorded verdict + "Verified … ago"); Watchtower risk (worst band + "Evaluated … ago"), or the source state.
- **A. System posture:** a view-level composition, not stored. OFFLINE when liveness fails. DEGRADED when readiness or the degraded probe fails or is unreadable, or when the last recorded verification is not PASS (with its age). Otherwise OPERATIONAL. The six contributing sources are always shown.
- **B. Recent operations:** `/runs/recent` as recorded. No invented run states. Not captured / Not published markers.
- **C. Agent readiness:** registered, enabled, healthy, health warnings, execution blocked, approval required.
- **D. Governance gate:** pass/blocked, required layers, enabled, blockers. No toggles.
- **E. Watchtower risk:** worst band and "Last evaluated … ago"; programs evaluated / not yet evaluated; quarantined at last evaluation; manual quarantine active; Alerts and Integrity marked Not published; Attestation Not captured when none is recorded. The drawer lists each program's band, action, reasons and time. No quarantine actions.
- **F. Infrastructure and observability:** last recorded verdict plus "Verified … ago", or Not yet verified. The drawer shows per-check pass/fail with reason codes and who recorded it. No verify buttons.
- **Known data gaps:** the master plan's gap list.

## Missing-data and state vocabulary

States: Available, Auth required (401), Access restricted (403), Network error, Timed out, Invalid response, Backend error, Auth hardening required, Not yet verified, Not yet evaluated, Not configured, No records.
Field gaps: Not captured, Not published, Not available, Auth hardening required. "Unknown" is never rendered (asserted).

## Accessibility

Landmarks and headings, native buttons and links, visible focus, 44px targets (asserted at six widths), screen-reader captions and labels, one polite live region for posture, text alongside every color, reduced motion (asserted). Drawer (V3): docked non-modal in `ultra` (≥1760); modal overlay in `wide` and `medium`; full-screen modal sheet in `narrow`. V3 adds keyboard-operable map nodes, WAI-ARIA drawer tabs, and a combobox search palette. Focus moves to the heading, Tab is trapped in modal modes, the background is `inert`, and Escape returns focus to the trigger.

## Browser acceptance (live Fabric with AFCC-2A, real data copy, Chromium)

Run against the new Fabric code in an isolated worktree, with a copy of the real Watchtower store, via the Vite `/fabric-api` proxy.

| Width | Layout | Drawer | H-scroll | Console errors | Unsafe / non-GET requests | Leaked paths/traces |
|---|---|---|---|---|---|---|
| 1440 | wide | docked | none | none | none | none |
| 1280 | wide | docked | none | none | none | none |
| 1024 | medium | overlay | none | none | none | none |
| 768 | medium | overlay | none | none | none | none |
| 430 | narrow | sheet | none | none | none | none |
| 390 | narrow | sheet | none | none | none | none |

- **Phase A** (before any verification): Watchtower "RED · Last evaluated 23 days ago" from real persisted state; Infrastructure and Observability "Not yet verified". Watchtower store row counts, full dump hash and audit line count were identical before and after six browser sessions; no verification record was created.
- **Phase B** (after an operator ran both privileged actions with the admin key): Infrastructure DEGRADED (4/5 pass; `watchtower_attestation` fails, see gaps), Observability PASS, ages shown. Six more browser sessions left the Watchtower dump, the audit log and both verification records byte-identical.
- 11 Fabric requests per session, all GET, all same-origin `/fabric-api`. No `localhost`, `:8090`, or `:8000` requests from the browser.

## Screenshots

AFCC-2A.2, live, with no mocks: an isolated stack of a Fabric copy with real registry, gate and run ledger, a second SHS instance, and a separate Vite instance. The keyring was generated in memory and never written. Files in `docs/agent-fabric-command-center/v3-2a2/`:
- `AFCC-2A2_live_{1920,1440,1280,1024,390}.png`
- `AFCC-2A2_live_1440_fullpage.png`
- `AFCC-2A2_live_drawer_{fabric,fleet,run_evidence}_1440.png`

Visual V3 (mocked `/fabric-api`, acceptance fixtures) in `docs/agent-fabric-command-center/v3/`: `AFCC-V3_command_{1920,1600,1440,1280,1024,768,430,390}.png`, `AFCC-V3_command_1440_fullpage.png`, `AFCC-V3_workflow_review_civicsure_1440.png`, `AFCC-V3_priority_degraded_1440.png`, `AFCC-V3_drawer_watchtower_dependencies_1440.png`, `AFCC-V3_drawer_docked_1920.png`, `AFCC-V3_drawer_overlay_1024.png`, `AFCC-V3_drawer_sheet_390.png`, `AFCC-V3_dependency_view_1440.png`, `AFCC-V3_search_1440.png`, `AFCC-V3_hover_truth_1440.png`. The V1 images below show the pre-V3 layout.

AFCC-2A.1 (live, worktree Fabric, real store copy):
- `AFCC-2A1_no_fabric_session_{1440,390}.png`: every non-public lane fails closed
- `AFCC-2A1_fabric_session_shs_admin_1440.png`: canonical session path reads the projections
- `AFCC-2A1_fabric_session_client_1440.png`: session without `bos.governance.read` → Access restricted

Earlier:

`docs/agent-fabric-command-center/v1/`:
- `AFCC-V1_command_{1440,1280,1024,768,430,390}.png`: current page with recorded verification results
- `AFCC-V1_drawer_{1440,1024,390}.png`: docked, overlay and sheet drawer
- `AFCC-2A_not_yet_verified_{1440,390}.png`
- `AFCC-2A_drawer_infrastructure_1440.png`, `AFCC-2A_drawer_watchtower_1440.png`

## Watchtower test isolation + local state cleanup (2026-09-26)

**Finding (contamination).**
- 11 Fabric test files ran the evaluating `GET /watchtower/summary` / `/watchtower/programs` without isolating Watchtower persistence. Each wrote risk snapshots, risk history and audit lines to the developer's real stores:
  - `test_adapter_layer_routes`, `test_api_gateway_routes`, `test_batch_import_routes`, `test_event_webhook_routes`, `test_notification_alert_routes`, `test_production_automation_routes`, `test_verified_aggregation_routes`, `test_warehouse_sync_routes`, `test_watchtower_contract`, `test_watchtower_coverage`: 2 snapshots + 2 audit lines per file.
  - `test_loo_rankings_contract_lock`: creates the store schema.
- Paths affected:
  - `var/watchtower_store.sqlite` (gitignored; the store the Command Center reads)
  - `var/watchtower_audit.jsonl` (**tracked**)
- No test writes `data/watchtower.db` (the snapshot self-check DB); only Fabric's own startup and verify probes write there. No test wrote quarantine, attestations or enforcement flags.
- **Consequence:** the Watchtower state the Command Center showed locally ("RED", "Degraded", "evaluated N hours ago") was produced by test runs. The earlier AFCC-2A.3 live-results line describing it as real persisted state is therefore superseded by this section.
- Method: every test file was run separately with Watchtower redirected to a scratch directory, recording which files wrote Watchtower state and fingerprinting the real files.

**Isolation fix** (`services/shf-agent-fabric/tests/conftest.py`):
1. The three overrides (`SHF_WATCHTOWER_STORE_PATH`, `SHF_WATCHTOWER_AUDIT_PATH`, `SHF_WATCHTOWER_SNAPSHOT_DB_PATH`) are set to a session temp directory at conftest import, before any test imports the app.
2. An autouse fixture gives every test a fresh Watchtower directory. Tests that set their own paths still win.
3. A guard wraps `sqlite3.connect` and raises `RealWatchtowerStoreAccess` for the real store or snapshot DB.
4. `pytest_sessionfinish` fingerprints the real store, audit journal and snapshot DB; any change fails the run and prints `WATCHTOWER CONTAMINATION: …`. Verified with a temporary probe test (exit code 1), then removed.

**Regression tests** (`tests/test_watchtower_test_isolation.py`, 7):
- every Watchtower path resolver points into the per-test directory
- an evaluating `/watchtower/summary` writes only to the isolated store and journal, and the real files are unchanged
- each test starts with an empty store
- the guard refuses the real databases, including read-only URI opens, and still allows other databases
- clearing the env override cannot fall back to the real store

**Local state cleanup decision.** Classified before any change, read-only from a backup:
- There is no operator-authored state: quarantine, attestations and enforcement flags are all empty.
- The audit journal contains only `watchtower_risk` auto-evaluations, with no actor.
- The store contains only derived evaluations (603 snapshots, 629 history rows) for the demo/catalog programs `arena_observation_deck` and `watchtower_demo_program`, plus one `__manual_test__` row.
- The only writer is the evaluating GET route, and no page, script, cron job or launch agent calls it.

The store was therefore judged dev/test-only.
1. **Backup, outside the repo:** `~/Projects/shrv1-local-backups/watchtower-20260926T213323Z/`, holding the store, snapshot DB and audit journal via the SQLite online backup API. The backup's logical dump was verified identical to the live store before reset. The live files were then moved (not deleted) into `moved-at-reset/`.
2. **Fabric restarted normally.** Startup does not create the store, and reads never create it.
3. **Not reset:** `data/watchtower.db` (not test-written; self-check probes) and the tracked audit journal. Its committed history contains past evaluation lines, and rewriting tracked history was out of scope. Neither is read by the Command Center.
4. **No evaluation was triggered.**

**Resulting state.**
- **Bridge:** Watchtower returns `NOT_YET_EVALUATED` (`WATCHTOWER_STORE_NOT_CREATED`); both catalog programs are not yet evaluated; 0 quarantines.
- **Command Center at 1440:**
  - The Watchtower lane, the risk strip and the drawer show "Not yet evaluated". The map node reads "Unavailable · Not yet evaluated".
  - No RED or Degraded carries over from test data. Degraded priority dropped from 2 to 0.
  - 0 console errors, 0 evaluating/verify/quarantine requests, 0 non-GET requests.
  - Screenshots: `docs/agent-fabric-command-center/v1-watchtower-clean/`.

**Verification after the fix.**
- **Fabric full suite:** 605 passed / 6 failed / 2 skipped / 1 xfailed, the same 6 as baseline, with zero contamination warnings.
- **Local stores after the suite:** the store stays uncreated; the audit journal and snapshot DB are unchanged.
- **Other suites:** SHS bridge security 15/15; AFCC, routing and secret-scan suites 99/99; browser 36/36; build passes; `git diff --check` clean.

**Remaining persistence risks (not Watchtower).** `test_truth_pipeline_runtime` rewrites the tracked `services/truth_pipeline/runtime_state/state.json`, and `test_funding_replay_engine` appends to the tracked `services/var/funding_decision_journal.jsonl`. Both use hardcoded module-level paths with no override. They were restored with `git checkout` after each run. Fixing them needs a path override in those modules plus a matching fixture.

## AFCC-2A.3 acceptance (all six lanes bridged; canonical SHS dev startup)

Details: master plan, "AFCC-2A.3 — Complete Safe Read Bridge + Canonical SHS Dev Startup".

- **Routes added:** `GET /api/agent-fabric/command/{watchtower,infrastructure,observability}` → Fabric's unchanged AFCC-2A safe projections, via the `service:shs-api` read audience.
- **Startup:**
  - SHS: `cd apps/shs-api && npm run dev`, which now runs `tsx watch --env-file-if-exists=.env src/server.ts`.
  - Fabric: `.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8090`.
- **Live:**
  - Watchtower showed RED/DEGRADE from the local store. This was later found to be test-generated; after cleanup it shows Not yet evaluated (see "Watchtower test isolation").
  - Infrastructure and Observability show Not yet verified.
  - No "Auth bridge required" anywhere.
  - 14 systems stay Not published.
- **Tests:**
  - Fabric: bridge and projection suites 115 passed / 1 xfailed; full suite 598 passed / 6 failed, identical to baseline.
  - SHS: bridge security 15/15; routing 6/6 and 6/6; typecheck 0 errors.
  - Frontend node tests 104/104; browser 36/36; build passes; `git diff --check` clean.
- **Screenshots:** `docs/agent-fabric-command-center/v1-bridge/` at 1920, 1440 (plus full page and Agent Fabric drawer), 1280, 1024, 430.
- **Tracked runtime files** rewritten by Fabric tests were restored, and `git status` matched the pre-test snapshot.
- **Finding:** the Fabric suite writes real evaluations into the local gitignored Watchtower store (see master plan). Local Watchtower data therefore reflects test runs until the tests isolate that store.

## Final V1 live acceptance (local services, 2026-09-26)

Run against the real local stack through the normal Vite dev server (:5173): SHS API on :8091, Agent Fabric on :8090. No mocks.

**Local configuration (development only; nothing committed).**
- `SHF_INTERNAL_SERVICE_KEYS_JSON` is a JSON object `{"<kid>": "<secret>"}`. SHS signs with the entry named by `SHF_INTERNAL_SERVICE_ACTIVE_KID` as `service:shs-api`; Fabric verifies by the kid header against the same object. Both services therefore need the identical keyring.
- A new local-only key id and a 256-bit random secret were written to `apps/shs-api/.env` and `services/shf-agent-fabric/.env`. Both files are gitignored (`.gitignore` `.env`), untracked, never in history, and now mode 600.
- Values were compared by hash only. `.env.example` files were not changed with secret material.
- Local misconfiguration found and fixed in `apps/shs-api/.env`: `SHF_AGENT_FABRIC_INTERNAL_URL` pointed at `127.0.0.1:8091` (SHS itself). It is now `127.0.0.1:8090`. This URL is shared with the trusted-reporting dispatcher.

**Startup.**
- The SHS API does not load `apps/shs-api/.env` by itself (plain `tsx`). Start it with `node --env-file=.env --import tsx src/server.ts` from `apps/shs-api`; process environment still wins over the file.
- Fabric loads its `.env` via `load_dotenv()`.
- Fabric's `init_db()` is SQLAlchemy `create_all` on the gitignored local `db/fabric.sqlite`.
- Startup and page loads changed no tracked file. SQLite creates `var/watchtower_store.sqlite-wal/-shm` while the store is open.

**Results.**
- **Bridge:** all four sources are live, via `/api/agent-fabric/command/*` → SHS → HMAC-signed GET → Fabric.
- **Agent fleet:** 19 registered, 19 enabled, 19 healthy, 0 warnings; readiness 7 auto-ready, 12 approval required by policy, 0 blocked.
- **Recent operations:** 25-event window.
- **Governance:** gate blocked; 32 required layers, 25 `not_enforced_ready`.
- **Watchtower, Infrastructure, Observability:** still Fabric-session reads, so the browser shows "Auth bridge required". Read by the local fixture `shs_admin` reader:
  - Watchtower is available: worst band RED, evaluated about 4.6 h earlier, no threshold, so not stale.
  - Infrastructure and Observability are Not yet verified (`NO_VERIFICATION_RECORDED`).
  - None of the three is a backend or Fabric error. The privileged verify actions were not run.
- **Map:** Agent Fabric Operational (flags the blocked gate); Watchtower Restricted; 14 systems Not published.
- **Page:** full-bleed only on `/agent-fabric/command`.
- **Browser network:**
  - only the four SHS bridge GETs, plus the public probes and session reads on `/fabric-api`
  - 0 admin Fabric calls, 0 non-GET requests, 0 direct :8090/:8091/:8000 requests, 0 credential headers
  - 0 console errors
- **Bundle (378 files) and live bridge responses:** no key names, no keyring secret, no key id, no admin-key value.

**Evidence.**
- Screenshots in `docs/agent-fabric-command-center/v1-final/`: 1920, 1440 (plus full page and three drawers), 1280, 1024, 430.
- Tests:
  - Fabric: 579 passed / 6 failed, identical to baseline; targeted suites 109 passed.
  - SHS: bridge security 11/11, routing 6/6 and 6/6, typecheck 0 errors.
  - Frontend node tests 103/103; browser 35/35; build passes; `git diff --check` clean.
- Tracked runtime files rewritten by the Fabric tests were restored.

## Tests

AFCC-2A.2:
- **Fabric `tests/test_command_bridge_reads.py`:** 42/42. It covers:
  - the allow-list is exactly the four reads; unauthenticated gets 401
  - a valid service signature reads the sanitized envelope; the admin key alone gets 401; a Fabric `shs_admin` session reads and a `client` session gets 403
  - the signature binds path and method; a wrong secret, key id or service, an expired signature, or an over-long TTL all get 401 and are audited
  - the service identity cannot read Watchtower, Infrastructure or Observability, cannot reach `/runs/execute`, agent or layer mutations, admin summaries, `/runs/recent` or the verify actions, and cannot ingest
  - the bridged paths are GET only (405 otherwise)
  - the runs projection drops paths and exception text, keeps SHA-256 hashes, and fixes its window at 25 regardless of `?limit`
  - agent and gate projections contain only contract fields; a projection failure returns only a code
  - reads cause no subprocess, network or log writes
- **Fabric full suite:** 579 passed / 6 failed / 2 skipped / 1 xfailed. Baseline before this phase was 537 / 6 / 2 / 1, and **the failure set is identical** (treasury, pools, payout store state, reporting lineage, Truth projection). Existing ingestion and service-identity suites are unchanged (27 passed, 1 skipped).
- **SHS `tests/agent-fabric-command-bridge.security.test.ts`:** 11/11, in process, with real routes, `requirePermission`, org context and HMAC signer, and a fake Fabric that verifies signatures independently. It covers:
  1. unauthenticated (real `authMiddleware`) gets 401
  2. and 12. `org_admin`, `partner_org_admin`, `reviewer_verifier`, `auditor`, `shf_admin`, `read_only_viewer` and `student` get 403, including `audit.view` holders; a missing or invalid org context gets 403 before any Fabric call
  3. `shs_admin` and `super_admin` read all four through verified GETs to allow-listed paths
  4. and 5. no admin key, HMAC secret, key id or service header in any response body or header, and Fabric never receives `X-Admin-Key`
  6. POST, PUT, PATCH and DELETE get 405 with no Fabric call
  7. to 10. query strings, headers and path tricks never change the Fabric path, and the permission is referenced only by the bridge
  11. a raw 500 traceback, `BACKEND_ERROR`, a 401 and a malformed contract each map to a distinct code and layer without leaks; successful payloads are minimized and redacted while hashes survive

  The error model's not-configured, unreachable and timeout cases are covered too.
- **SHS regression:** the 128 self-contained test files, run on a clean `HEAD` worktree and on the working tree, are **identical per file** (821 passed, 2 failed in the pre-existing `studio-phase10-contract`). `tsc --noEmit` reports 0 errors. Two router-shape tests caught an `app.all` usage during development, and it was replaced.
- **Frontend node:** 103/103 across `afccCommandCenter` (65), `afccBrowserSecretScan`, `fabricRoutingAuthority`, `fabricProductionOriginV3`, `fabricProductionDeploymentPath`, `pr1FrontendSecretExposure`, `fe1DesignSystem` and `fe2ShellAdoption`.
- **Browser (Playwright, mocked Fabric and SHS bridge):** 35/35. New tests: bridged lanes show data and only the four bridge GETs are sent; each bridge failure names its hop; SHS 401/403 at Browser → SHS; Fabric not running reads as Backend unavailable; full-bleed on the Command Center while `/agent-fabric` keeps the rail.
- **Live browser, no mocks:** 0 console errors, 0 off-origin requests, 0 requests to :8090/:8091/:8000/:18090/:18091, 0 credential headers, 0 admin Fabric calls, 0 non-GET requests, 0 horizontal overflow, and 0 clipped labels at 1440.
- **Built bundle (`vite build`, 378 files):** 0 occurrences of `X-Admin-Key`, `ADMIN_API_KEY`, `x-shf-service`, `SHF_INTERNAL_SERVICE_KEYS`, `SHF_INTERNAL_SERVICE_ACTIVE_KID` or `SHF_AGENT_FABRIC_INTERNAL_URL`. The configured admin-key and service key-id values are absent (compared in memory, never printed).
- `git diff --check` is clean for tracked and untracked files.

Visual V3:
- **`tests/afccCommandCenter.test.mjs`:** 61/61 (46 existing, 2 updated on purpose — global health strip items and the navigation contract — plus 15 new): every edge cites a real matrix row; OAS not drawn and producers reach Fabric only via SHS API; CivicSure lineage and real chains; Watchtower up/downstream; classification only from published states; approval policy not counted as review; per-category coverage; unreadable category shows its reason, never zero; Stale only with a published threshold; node status never inferred across authorities; edge state from upstream, unpublished ends "not observed"; **geometry: no node overlap and no edge behind an unrelated node at six widths**; grid layout; search scope; navigation destinations exist; no mock numbers / invented run states / "Unknown"; V3 modules add no fetch path.
- **`tests/afcc-command-center-browser.spec.mjs`:** 31/31 (Playwright, Chromium). Existing tests updated for V3 hooks (posture now `[data-posture]` on the Fabric item; drawer modes per new breakpoints; widths now include 1920 and 1600). New: topology renders 16 nodes / 19 edges with source-backed status; priority → map → drawer tabs → dependencies workflow; CivicSure lineage highlighting and Escape/background clear; keyboard (focus tooltip, Enter, arrow/End between views, Escape returns focus); ⌘K search; Dependency View relationships and disabled Geography; 1440×900 fold and no clipped labels. Every test still plants a decoy admin key and asserts it is never sent.
- `tests/afccBrowserSecretScan.test.mjs`, `fabricRoutingAuthority`, `fabricProductionOriginV3`, `fabricProductionDeploymentPath`: pass (93/93 node tests together with the AFCC unit suite).
- `vite build` passes. `git diff --check` clean (tracked and untracked AFCC files).

AFCC-2A.1 additions:
- **`tests/afccBrowserSecretScan.test.mjs`:** 4/4, bundle privileged secret count 0.
- **`tests/afccCommandCenter.test.mjs`:** 46/46. Admin-key-only routes are never fetched (even with a key left in storage); command reads send no credential header; a 401 on a command read maps to `AUTH_BRIDGE_REQUIRED`; the read router has no admin-key path.
- **`tests/afcc-command-center-browser.spec.mjs`:** 22/22, twice. Every test plants a decoy key in localStorage and asserts no request, payload or console output carries it. The existing `/agent-fabric` page fails closed; AFCC never calls admin-only routes; no-session and 403 lanes behave correctly.
- **`test_command_read_projections.py`:** reads use a Fabric session; the admin key alone now gets 401.
- **Full Fabric suite:** 536 passed / 7 failed / 1 xfailed; **failure set identical to baseline**.
- **Frontend regression, domain suites (108 suites touching admin, Fabric, routing, Metaverse, Universe, orientation, analytics, live-learning):** 942/943. The 1 failure is the pre-existing `reportsBriefingsSurfaceReview`.
- **Frontend regression, every unit suite that references a changed file (108 suites, 820 tests):** 815/820. **All 5 failures also fail on untouched `HEAD`:** `ax6AccessibilityOperations`, `capstoneEntryPolicy`, a dashboard fallback-balance test, a curriculum projection-storage test, and the reporting test.
- **Two existing tests were updated on purpose:**
  - `fabricProductionOriginV3`: the last reader of the retired `VITE_SHF_AGENT_FABRIC_BASE` is gone.
  - `pr1FrontendSecretExposure`: it required the insufficient `PROD ? "" :` guard, and now requires that the private `VITE_*` keys and `X-Admin-Key` are absent from those files.
- **Live browser (6 widths, plus session variants):** 0 `X-Admin-Key` headers; 0 admin-only or unsafe calls; 0 secret hits across 725 served JS modules; 0 console errors; no horizontal scroll; drawer focus in and back.

Earlier:

| Suite | Covers | Result |
|---|---|---|
| `services/shf-agent-fabric/tests/test_command_read_projections.py` (new, 40 tests + 1 strict xfail) | 401 unauthenticated / wrong key; 403 session without permission; session and transitional-key reads; GET-only router; read session cannot run verify, execute runs, publish, toggle layers/agents or change containment; reads cause no file changes, subprocesses or network (subprocess and socket patched to raise); Watchtower counts, audit, quarantine and attestations unchanged by reads; legacy summary still evaluates (control); reads don't create stores; not-yet-verified/evaluated; latest-snapshot correctness; non-catalog exclusion; staleness age; action then read round trip (path bug fixed, checks really run); observability probe fixed; sanitizer redaction and blocked keys; failure returns a code without text; unreadable record → `BACKEND_ERROR`, not fabricated | pass |
| Updated `test_admin_infra_verify_route.py`, `test_admin_observability_verify_route.py` | Now require the admin key (401 without it). Side effects redirected to temp paths. The infra "overall ok" assertion now matches the route's unchanged all-checks rule; its old 3-check subset only matched because every script check failed | pass |
| Full Fabric suite (isolated worktree) | Baseline 496 passed / 7 failed → now 536 passed / 7 failed / 1 xfailed; **the failure set is identical to baseline** (treasury, pools, payout, LOO contract lock, reporting lineage, Truth projection) | no regressions |
| `tests/afccCommandCenter.test.mjs` (node) | Contracts, legacy-never-fetched, backend auth findings vs source, client states, all adapters incl. read envelopes, NOT_YET_* states, age wording, posture incl. verification age, strip, coordinator (5 poll groups), routing, reduced motion, no action controls, class names | 45/45 |
| `tests/afcc-command-center-browser.spec.mjs` (Playwright, mocked Fabric) | Previous 18 plus Watchtower persisted state with age; verifier last-known/not-yet-verified; unauthorized/failing reads isolated per lane; no leaks; GET-only; posture/gaps full-width regression | 22/22, twice |
| Frontend regression (37 suites) | admin routes, sidebar, fabric config/routing, Truth/Oracle/Watchtower/LOO, SHS routing | 222/223. The 1 failure (`reportsBriefingsSurfaceReview`) fails identically at baseline |

Build (`vite build`) passes. `git diff --check` is clean.

## Security findings outside AFCC scope (need decisions)

1. ~~The Fabric admin key is bundled into local production builds.~~ **Resolved in AFCC-2A.1** (see below). **Key rotation is required**: the value is in public git history.
2. **`POST`/`DELETE /watchtower/quarantine/{id}` have no backend auth for any caller.** Recorded as a strict `xfail` test that will flip when fixed.
3. **`POST /self-audit/run` and `/run/scheduled` have no auth.**
4. **`scripts/verify_watchtower_attestation.py` has a latent bug:** it unpacks two values from `verify_attestation_signature`, which returns more, so it raises `ValueError`. It was hidden until the path fix. Not fixed (not approved in this task). It also prints key IDs to stdout, which only the admin-only action response contains.
5. **`app/db/sqlite_growth.py` is excluded by the `.gitignore` rule `db/`,** so a clean checkout cannot boot the Fabric (`main.py` imports it).
6. **The command-center access module `routers/v1_command_center_routes.py` doesn't exist,** which is why `contract_runtime_routes.py` and `truth_pipeline_runtime_routes.py` are not mounted.
7. **Registry RBAC trusts a caller-asserted `X-Admin-Role` header** (behind the admin key). It is harmless while no browser holds the key. AFCC-2A.2 does not touch Registry and forwards no client header to Fabric.
8. **AFCC-2A.2: local dev auth.** Outside production, an unauthenticated SHS request gets the local demo `super_admin` identity (pre-existing), so the bridge is readable on a developer machine without signing in. Production fails closed (tested with the real `authMiddleware`).

## Known gaps

- **Watchtower freshness depends on evaluations.** Reads never evaluate. The real store's last evaluation is 2026-09-01, and the lane says so. A scheduled or privileged evaluation is a follow-up.
- **Alerts and integrity rates are Not published** until Watchtower persists them at evaluation time.
- **Infrastructure attestation check fails** until finding 4 is fixed and a keyring is configured.
- **All six operational lanes are bridged** (AFCC-2A.2 + 2A.3). The Fabric AFCC-2A routes still also accept a Fabric session.
- **Local keyring:** configured (V1 live acceptance). SHS's canonical `npm run dev` now loads it.
- **Other fail-closed admin pages are not bridged:** the Agent Fabric page, Registry, Alignment Switchboard, and AI Analyst sync.
- **Admin shell CSS:** `admin.main.jsx` never imports the rail and shell styles. The Command Center now renders full-bleed; all other admin pages still show the unstyled chrome.
- **Fabric test hygiene:** the Fabric test suite rewrites tracked runtime files (`services/truth_pipeline/runtime_state/state.json`, `var/watchtower_audit.jsonl`, `services/var/funding_decision_journal.jsonl`). They were restored after each run in this phase.
- **Active verification in health probes:** `/health/ready` and `/health/degraded` run 4 subprocesses per call. See AFCC-2B.
- Platform data gaps (run state machine, work order, model/provider, actor/org, resource permissions, approval queue, evidence lineage, cancel/revoke, timeout) are unchanged and displayed.
- The admin shell (`AdminHeader`/`AdminSidebar`) renders unstyled on admin pages; this is pre-existing. The repo has no working ESLint setup.

## Remaining phases

**AFCC-2B:** health probe hardening. Make `/health/ready` and `/health/degraded` cheap, or split them into a recorded verification action plus a read, the same pattern as 2A.

Then AFCC-3 Live Operations → 4 Agent Fleet → 5 Authority + Approvals → 6 Ecosystem Graph → 7 Governance → 8 Evidence + Truth → 9 Watchtower + Risk → 10 Security → 11 Infrastructure → 12 Incidents → 13 Run Trace → 14 A11y/Perf/Mobile → 15 System Acceptance.
