# Duplicate Layer Audit

Date: 2026-06-14

Scope: static audit of duplicate layers, routers, services, admin pages, docs, route prefixes, source-of-truth files, backups, and enforcement coverage. No source code was changed for this audit.

## Executive Summary

The official governed SHS layer set is anchored in `docs/MASTER_LAYER_REGISTRY.md`. The active V1 governance stack now has clear official files for Truth Spine, Oracle, AI/Swarm Guardrails, and Game Theory. Reports, Watchtower, LOO, Alignment, and Admin routes remain mounted and active.

The main duplicate risks are not in the new V1 layer files. They come from:

- Active-looking backup router files under `services/shf-agent-fabric/routers`.
- A duplicated unmounted admin agents router named `admin_agents_routes 2.py`.
- Two Watchtower attestation routers with the same prefix, only one mounted.
- Multiple old registry/layer/global-gate backup files near active governance code.
- Large top-level backup/recovery folders that contain old Truth/Oracle/reporting/command-center implementations and can mislead future agents.
- Admin sidebar links that do not map to active `AdminRoutes.jsx` routes.
- Several registered layers that are partial or missing dedicated enforcement checks.

No active route conflict was found for the official V1 route families:

- `/truth`
- `/oracle`
- `/ai-guardrails`
- `/game-theory`
- `/reports`
- `/watchtower`
- `/loo`
- `/align`

## Registered Layer Inventory

Registered official layers from `docs/MASTER_LAYER_REGISTRY.md`:

1. Identity & Access
2. API Gateway
3. Event/Webhook
4. Batch/Import
5. Warehouse Sync
6. Apps/Programs
7. Adapter Layer
8. Truth Spine
9. Oracle Layer
10. Game Theory Layer
11. AI/Swarm Layer
12. Alignment Layer
13. LOO
14. Watchtower
15. Governance Layer
16. Audit & Verification
17. Readiness Gate
18. Verified Aggregation
19. Reports
20. Funding Intelligence
21. Public Approval
22. Narrative/Story
23. Partner/Institution
24. Security/Privacy
25. Data Ownership/IP
26. Decision Journal
27. Replay Engine
28. Signed Manifest
29. Self-Audit
30. Layer Control System
31. Context-Adaptive Analyst
32. SHS Sales Layer
33. Production Ops
34. Development Library
35. QA + Delivery
36. ClientOps
37. Website Studio
38. Production Automation
39. SHF Impact Command Center
40. Public Impact Map
41. Career Pathways
42. Program Registry
43. Sponsorship Layer
44. Grant/Proposal Layer
45. Governance Binder

## Governance Checks Found

| Check | File / Script | Status |
| --- | --- | --- |
| Master Layer Registry | `scripts/check_master_layer_registry.py` | Present |
| Architecture Proposal | `scripts/check_architecture_proposal.py` | Present |
| Truth Spine Freeze | `scripts/check_truth_spine_freeze.py` | Present |
| Oracle V1 | `scripts/check_oracle_layer.py` | Present |
| AI/Swarm Guardrails V1 | `scripts/check_ai_guardrails_layer.py` | Present |
| Game Theory V1 | `scripts/check_game_theory_layer.py` | Present |
| Combined Governance | `npm run check:governance` | Present; chains registry, proposal, Truth, Oracle, AI, Game Theory |

## Expected Official Files

| Layer | Backend Service | Backend Router | Admin UI | Docs | Check |
| --- | --- | --- | --- | --- | --- |
| Truth Spine | `services/shf-agent-fabric/services/truth_spine_service.py` | `services/shf-agent-fabric/routers/truth_routes.py` | `src/pages/admin/truth-spine/TruthSpinePage.jsx` | `docs/TRUTH_SPINE_V1.md`, `docs/TRUTH_SPINE_FREEZE_V1.md`, `docs/TRUTH_SPINE_GUARDRAILS.md` | `scripts/check_truth_spine_freeze.py` |
| Oracle Layer | `services/shf-agent-fabric/services/oracle_service.py` | `services/shf-agent-fabric/routers/oracle_routes.py` | `src/pages/admin/oracle/OraclePage.jsx` | `docs/ORACLE_LAYER_V1.md` | `scripts/check_oracle_layer.py` |
| AI/Swarm Layer | `services/shf-agent-fabric/services/ai_guardrails_service.py` plus older `services/shf-agent-fabric/services/ai_layer/*` | `services/shf-agent-fabric/routers/ai_guardrails_routes.py` | `src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx` | `docs/AI_SWARM_GUARDRAILS_V1.md` | `scripts/check_ai_guardrails_layer.py` |
| Game Theory Layer | `services/shf-agent-fabric/services/game_theory_service.py`, reusing `services/shf-agent-fabric/services/ai_layer/game_theory.py` | `services/shf-agent-fabric/routers/game_theory_routes.py` | `src/pages/admin/game-theory/GameTheoryPage.jsx` | `docs/GAME_THEORY_LAYER_V1.md` | `scripts/check_game_theory_layer.py` |
| LOO | `services/shf-agent-fabric/fabric/loo/*` | `services/shf-agent-fabric/routers/loo_routes.py`, `loo_rankings_routes.py`, `loo_adapters_routes.py` | External/admin route currently not first-class in `AdminRoutes.jsx`; sidebar links `/lord-outcomes` | Covered partly by registry/Truth docs | Missing dedicated layer check |
| Watchtower | `services/shf-agent-fabric/fabric/watchtower/*` | `services/shf-agent-fabric/routers/watchtower_routes.py`, `watchtower_attestation_routes.py` | No dedicated admin page found | Covered partly by Truth/registry docs | Missing dedicated layer check |
| Alignment | `services/shf-agent-fabric/routers/alignment/*` | `/align`, `/admin/align`, `/admin/align/plans` | `src/pages/admin/AlignmentSwitchboard.jsx` | Covered partly by registry/AI docs | Missing dedicated layer check |
| Reports | `services/shf-agent-fabric/fabric/reports/*` plus `routers/reports_routes.py` | `/reports`, `/runs/report*` | `src/pages/admin/reporting/ReportingCommandSurface.jsx`, related panels | Covered partly by Truth docs | Missing dedicated layer check |

## Duplicate Findings

| Area | Finding | Risk | Keep | Merge / Archive Later | Why |
| --- | --- | --- | --- | --- | --- |
| Admin agents router | `services/shf-agent-fabric/routers/admin_agents_routes 2.py` has prefix `/admin/agents` and is unmounted while `admin_agents_routes.py` is mounted with same prefix | High | `admin_agents_routes.py` | Archive `admin_agents_routes 2.py` | Active-looking duplicate route family can confuse future agents or be mounted accidentally |
| Watchtower attestation | `watchtower_attest_routes.py` and `watchtower_attestation_routes.py` both use `/watchtower/attest`; only `watchtower_attestation_routes.py` is mounted | High | `watchtower_attestation_routes.py` unless global-chain endpoints are intentionally needed | Merge needed endpoints from `watchtower_attest_routes.py`, then archive it | Same prefix, different endpoint contract, high chance of accidental route conflict |
| Admin routes | `routers/admin_routes.py` is unmounted but exposes `/admin/mode`, `/admin/agents`, `/admin/layers` overlapping active admin routers | Medium | `admin_force_routes.py`, `admin_agents_routes.py`, `admin_layers_routes.py`, `admin_registry_routes.py` | Archive or document `admin_routes.py` | Old combined admin router overlaps active split routers |
| Backup router files | Many `.bak` files for `run_routes.py`, `runs_routes.py`, `plan_routes.py`, `admin_layers_routes.py`, `admin_registry_routes.py`, `funding_rulesets.py`, `funding_partner.py`, `loo_routes.py` | Medium | Non-`.bak` active files | Move backups under archive outside import/search paths | They are not mounted, but names contain active layer logic and can mislead future agents |
| Game Theory service | `game_theory_service.py` and `services/ai_layer/game_theory.py` both contain Game Theory logic | Low | Keep both as documented: V1 wrapper plus reused primitive | Do not archive reused primitive | `GAME_THEORY_LAYER_V1.md` documents this intentional reuse |
| Reports renderers | Active `fabric/reports/pdf_report.py`, `funder_report.py`, institutional builder plus many `.bak` and `_broken_backups` report files | Medium | Active non-backup report files and `reports_routes.py` | Archive `.bak` and `_broken_backups` trees | Backup report files contain old institutional/report readiness logic |
| Registry source files | `fabric/registry.py`, `registry_canon.py`, `registry_parity.py`, `registry_event_ledger.py`, plus many backups | Medium | Current non-backup registry files and `docs/MASTER_LAYER_REGISTRY.md` | Archive backup registry files | Multiple registry-like names make source of truth easy to confuse |
| Top-level backups | Hundreds of `_backup_*`, `_LOCKED_*`, `_recovery_*`, `_broken_*`, `_production_archive`, `.restore_points` folders | Medium | Active repo paths only | Move/mark backups as historical archive | Broad scans surface obsolete Truth, Oracle, reporting, SHF command, and map logic |
| Admin sidebar | Links `/admin`, `/admin/users`, `/admin/settings`, `/analytics`, `/lord-outcomes`, `/dev/docs`, `/health` do not map to visible `AdminRoutes.jsx` entries | Medium | Existing working routes in `AdminRoutes.jsx` | Either add routes later or remove/update sidebar links | User may hit fallback route; future agents may assume pages exist |
| Docs | `docs/checkpoints/HUB_V1_TRUTH_SPINE_FEEDBACK_TOUR_LOCK.md` mentions older “Truth Spine Engine” hub flow | Low/Medium | Official Truth docs | Mark checkpoint as historical or update language later | Could confuse agents about current Agent Fabric Truth Spine authority |

## Backend Router Findings

| Layer | Router File | Prefix | Mounted | Duplicate Risk | Recommended Action |
| --- | --- | --- | --- | --- | --- |
| Truth Spine | `routers/truth_routes.py` | `/truth` | Yes | Low | Keep official |
| Oracle | `routers/oracle_routes.py` | `/oracle` | Yes | Low | Keep official |
| AI/Swarm Guardrails | `routers/ai_guardrails_routes.py` | `/ai-guardrails` | Yes | Low | Keep official |
| Game Theory | `routers/game_theory_routes.py` | `/game-theory` | Yes | Low | Keep official |
| Reports | `routers/reports_routes.py` | `/reports` | Yes | Low | Keep snapshot/report metadata route |
| Watchtower | `routers/watchtower_routes.py` | `/watchtower` | Yes | Low | Keep official summary/risk route |
| Watchtower Attestation | `routers/watchtower_attestation_routes.py` | `/watchtower/attest` | Yes | High with unmounted duplicate | Keep mounted route; compare and possibly merge global-chain endpoints |
| Watchtower Attest Old | `routers/watchtower_attest_routes.py` | `/watchtower/attest` | No | High | Archive after confirming unused endpoints |
| LOO | `routers/loo_routes.py`, `loo_rankings_routes.py`, `loo_adapters_routes.py` | `/loo` | Yes | Low/Medium | Keep split routers; add check script later |
| Alignment | `routers/alignment/routes_gateway.py`, `routes_admin.py`, `routes_plans_admin.py` | `/align`, `/admin/align`, `/admin/align/plans` | Yes | Low | Keep split routers |
| Admin Agents | `routers/admin_agents_routes.py` | `/admin/agents` | Yes | High with `admin_agents_routes 2.py` | Keep official; archive duplicate |
| Admin Agents Duplicate | `routers/admin_agents_routes 2.py` | `/admin/agents` | No | High | Archive |
| Admin Combined | `routers/admin_routes.py` | `/admin` | No | Medium | Archive or document as obsolete |
| API v1 Outcomes | `routers/api_v1/outcomes_routes.py`, `outcomes_verify_routes.py` | `/api/v1/outcomes` | Yes through `api_v1` aggregator | Medium | Keep if intentional split; document ownership under Audit/Verification + Apps/Programs |
| Funding | `funding_*` routers | `/api/funding` | Mostly yes | Low/Medium | Keep active split; archive `.bak` and unmounted empty partner routers if obsolete |
| Runs | `run_routes.py`, `runs_routes.py`, `run_report_routes.py`, `runs_*` | `/run`, `/runs` and root actions | Yes | Medium | Keep active, but document distinction from Reports/LOO/Alignment |

## Backend Service and Data Findings

| Layer | Service/Data File | Purpose Inferred | Duplicate Risk | Recommended Action |
| --- | --- | --- | --- | --- |
| Truth Spine | `services/truth_spine_service.py`, `db/truth/*` | Official claims/sources/packages/federation | Low | Keep |
| Oracle | `services/oracle_service.py`, `db/oracle/*` | Official cases/rulings | Low | Keep |
| AI/Swarm Guardrails | `services/ai_guardrails_service.py`, `db/ai_guardrails/*` | Official AI publication/action guardrails | Low | Keep |
| AI Legacy Layer | `services/ai_layer/*` | Older AI orchestration, rules, live optimizer, Game Theory primitive | Medium | Keep only documented primitives; avoid treating as governance source of truth |
| Game Theory | `services/game_theory_service.py`, `db/game_theory/*` | Official V1 wrapper/persistence | Low | Keep |
| Game Theory Primitive | `services/ai_layer/game_theory.py` | Reused deterministic strategy primitive | Low | Keep; documented as reused asset |
| Watchtower | `fabric/watchtower/*`, `var/watchtower_store.sqlite` | Observability, risk, attestation, audit | Low/Medium | Keep active; document attestation router split |
| LOO | `fabric/loo/*`, `db/artifacts/loo_schema.latest.json`, `db/arena/loo_payload.latest.json` | Outcome adapters/scoring contracts | Medium | Keep; add dedicated enforcement check later |
| Reports | `fabric/reports/*` | Report rendering/export | Medium | Keep active files; archive report backups |
| Registry | `fabric/registry*.py`, `registry/*`, `db/registry_events.jsonl` | Runtime registry, ledger, published reports | Medium | Clarify source of truth: Master Layer Registry for architecture, fabric registry for runtime registry |
| Alignment | `db/alignment/containment_flags.json`, `routers/alignment/*` | Action containment/allowed actions | Low | Keep; add dedicated enforcement check later |

## Frontend Admin Findings

| Layer | Frontend File | Route | Sidebar Linked | Backend Paired | Duplicate Risk | Recommended Action |
| --- | --- | --- | --- | --- | --- | --- |
| Truth Spine | `src/pages/admin/truth-spine/TruthSpinePage.jsx` | `/truth-spine` | Yes | Yes `/truth` | Low | Keep |
| Oracle | `src/pages/admin/oracle/OraclePage.jsx` | `/oracle` | Yes | Yes `/oracle` | Low | Keep |
| AI/Swarm Guardrails | `src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx` | `/ai-guardrails` | Yes | Yes `/ai-guardrails` | Low | Keep |
| Game Theory | `src/pages/admin/game-theory/GameTheoryPage.jsx` | `/game-theory` | Yes | Yes `/game-theory` | Low | Keep |
| Alignment | `src/pages/admin/AlignmentSwitchboard.jsx` | `/alignment` | No current System sidebar item | Yes `/align`, `/admin/align` | Low | Keep; consider sidebar grouping later |
| Reports | `src/pages/admin/reporting/ReportingCommandSurface.jsx` | `/reporting` | Not in current AdminSidebar | Yes `/reports` plus report exports | Low/Medium | Keep; decide sidebar route later |
| Verification Audit | `src/pages/admin/reporting/VerificationAuditSurface.jsx` | `/verification-audit` | Not in current AdminSidebar | Partial | Low | Keep |
| Identity | `src/pages/admin/identity/IdentityManagement.jsx` | `/identity` | No current sidebar item | Auth context | Medium due to many `.bak` files | Keep current; archive identity backups |
| Production Ops | `src/pages/admin/ops/*` | `/ops/*` | Yes | Local storage/data | Low | Keep |
| Website Studio | `BuilderHub.jsx`, `web-maker.css` | `/builder`, `/web-maker`, `/studio/templates` | Partly | Frontend/local | Medium | Clarify distinction between public WebMaker and admin BuilderHub |
| Sidebar stale links | `AdminSidebar.jsx` | `/admin`, `/admin/users`, `/admin/settings`, `/analytics`, `/lord-outcomes`, `/dev/docs`, `/health` | Yes | No visible AdminRoutes target | Medium | Add/redirect/remove later |

## Docs Findings

| Doc File | Concept | Official/Current | Conflict Risk | Recommended Action |
| --- | --- | --- | --- | --- |
| `docs/MASTER_LAYER_REGISTRY.md` | Architecture registry | Yes | Low | Keep canonical |
| `docs/TRUTH_SPINE_V1.md` | Truth Spine V1 | Yes | Low | Keep |
| `docs/TRUTH_SPINE_FREEZE_V1.md` | Truth Spine freeze | Yes | Low | Keep |
| `docs/TRUTH_SPINE_GUARDRAILS.md` | Cross-layer guardrails | Yes | Low | Keep |
| `docs/ORACLE_LAYER_V1.md` | Oracle V1 | Yes | Low | Keep |
| `docs/AI_SWARM_GUARDRAILS_V1.md` | AI/Swarm V1 | Yes | Low | Keep |
| `docs/GAME_THEORY_LAYER_V1.md` | Game Theory V1 | Yes | Low | Keep |
| `docs/ARCHITECTURE_CHANGE_PROPOSAL_TEMPLATE.md` | Architecture gate | Yes | Low | Keep |
| `docs/checkpoints/HUB_V1_TRUTH_SPINE_FEEDBACK_TOUR_LOCK.md` | Older hub checkpoint | Historical | Medium | Mark as historical or update later |
| `docs/governance/binder/*` | Governance Binder | Current-ish | Low | Keep; not duplicate layer source |
| Top-level backup folders with markdown/code | Historical implementation snapshots | No | Medium | Archive outside main scan path later |

## Route Prefix Findings

Official route family per layer:

| Prefix | Layer / Purpose | Official Router | Notes |
| --- | --- | --- | --- |
| `/truth` | Truth Spine | `truth_routes.py` | Official |
| `/oracle` | Oracle | `oracle_routes.py` | Official |
| `/ai-guardrails` | AI/Swarm Guardrails | `ai_guardrails_routes.py` | Official |
| `/game-theory` | Game Theory | `game_theory_routes.py` | Official |
| `/reports` | Reports snapshot | `reports_routes.py` | Official for snapshot metadata |
| `/watchtower` | Watchtower | `watchtower_routes.py` | Official |
| `/watchtower/attest` | Watchtower Attestation | `watchtower_attestation_routes.py` | Duplicate unmounted candidate exists |
| `/loo` | LOO | `loo_routes.py`, `loo_rankings_routes.py`, `loo_adapters_routes.py` | Intentional split |
| `/align` | Alignment gateway | `routes_gateway.py` | Official action gate |
| `/admin/align` | Alignment admin | `routes_admin.py` | Official admin controls |
| `/runs` | Runs/report/LOO payloads | multiple run routers | Active but overlaps reporting concepts; document boundaries |
| `/api/v1/outcomes` | Apps/Outcomes/Audit Verification | `api_v1` aggregator | Multiple modules share prefix intentionally; needs docs/check ownership |
| `/api/funding` | Funding Intelligence | multiple funding routers | Intentional split; archive old backups |

## Master Registry Matrix

| Layer | Service | Router | Admin UI | Docs | Check Script | Status | Duplicate Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Truth Spine | Yes | Yes | Yes | Yes | Yes | Complete/Frozen V1 | Low |
| Oracle Layer | Yes | Yes | Yes | Yes | Yes | Complete V1 | Low |
| Game Theory Layer | Yes | Yes | Yes | Yes | Yes | Complete V1 | Low |
| AI/Swarm Layer | Yes | Yes | Yes | Yes | Yes | Complete V1 guardrails | Medium because older `services/ai_layer/*` exists |
| Alignment Layer | Partial | Yes | Yes | Registry only | No dedicated check | Partial | Low/Medium |
| LOO | Yes | Yes | Partial/sidebar mismatch | Partial | No dedicated check | Partial | Medium |
| Watchtower | Yes | Yes | No dedicated page | Partial | No dedicated check | Partial | Medium due attestation duplicate |
| Reports | Yes | Yes | Yes | Partial | No dedicated check | Partial | Medium due report backups |
| Funding Intelligence | Yes | Yes | Partial | Partial | No dedicated check | Partial | Medium |
| Production Ops | Frontend/local | N/A | Yes | Registry only | No dedicated check | Partial | Low |
| ClientOps | Frontend/hub | N/A | Hub routes | Registry/Truth guardrails | No dedicated check | Partial | Low |
| Website Studio | Frontend/local | N/A | Yes | Registry only | No dedicated check | Partial | Medium due route aliases |
| Governance Binder | Docs | N/A | Grant/Binder page | Yes | No dedicated check | Partial | Low |
| Public Approval | Truth field | Truth routes | Truth UI | Truth docs | Truth check | Partial via Truth | Low |
| Readiness Gate | Truth/report metadata | Truth/Reports | Reporting UI | Truth docs | Truth check | Partial via Truth | Low |
| Verified Aggregation | Aggregation UI | N/A | AggregationDashboard | Registry only | No dedicated check | Partial | Medium |
| Audit & Verification | Audit/reporting/fabric | multiple | AuditLog/VerificationAudit | Registry only | No dedicated check | Partial | Medium |
| Replay Engine | Truth/funding replay | Truth/funding | No unified UI | Truth docs | Truth check partial | Partial | Medium |
| Signed Manifest | fabric funding/compliance | funding/routes | No dedicated UI | Registry only | No dedicated check | Partial | Low/Medium |
| Self-Audit | fabric/watchtower/self_audit | self_audit route | No dedicated UI | Registry only | No dedicated check | Partial | Low/Medium |
| Layer Control System | fabric/layers/admin_layers | admin_layers | Registry/Admin | Registry | registry check partial | Partial | Medium due backups |

Layers not listed above either appear as frontend/domain surfaces only or lack obvious active V1 implementations in this scan.

## Recommended Cleanup Plan

### Priority 1: Active Route Conflict / Governance Bypass Risk

1. Keep `routers/admin_agents_routes.py`; archive `routers/admin_agents_routes 2.py`.
   - Why: same prefix `/admin/agents`, unmounted duplicate.
   - Risk if ignored: future accidental mount creates route conflicts or stale admin behavior.
2. Keep `routers/watchtower_attestation_routes.py`; review and merge any still-needed endpoints from `routers/watchtower_attest_routes.py`, then archive it.
   - Why: same prefix `/watchtower/attest`, different contract.
   - Risk if ignored: confusing attestation API and possible duplicate prefix conflict.
3. Keep split active admin routers; archive or clearly mark `routers/admin_routes.py` obsolete.
   - Why: overlaps `/admin/agents` and `/admin/layers`.
   - Risk if ignored: future agent may mount old combined router.

### Priority 2: Duplicate Docs / Agent Confusion

1. Keep `docs/MASTER_LAYER_REGISTRY.md` as canonical architecture source.
2. Keep `docs/TRUTH_SPINE_*`, `docs/ORACLE_LAYER_V1.md`, `docs/AI_SWARM_GUARDRAILS_V1.md`, and `docs/GAME_THEORY_LAYER_V1.md`.
3. Mark `docs/checkpoints/HUB_V1_TRUTH_SPINE_FEEDBACK_TOUR_LOCK.md` as historical or update it to point at Agent Fabric Truth Spine V1.
   - Risk if ignored: future agents may resurrect older “Truth Spine Engine” assumptions.

### Priority 3: Backup Files to Archive Later

1. Move router `.bak` files out of active source paths:
   - `routers/run_routes.py.bak*`
   - `routers/runs_routes.py.bak*`
   - `routers/plan_routes.py.bak*`
   - `routers/admin_layers_routes.py.bak*`
   - `routers/admin_registry_routes.py.bak*`
   - `routers/loo_routes.py.bak*`
   - funding `.bak` route files
2. Move report renderer backups out of `fabric/reports`:
   - `pdf_report.py.bak*`
   - `funder_report.py.bak*`
   - `institutional.bak.*`
   - `_broken_backups`
3. Move or quarantine top-level `_backup_*`, `_LOCKED_*`, `_recovery_*`, `_broken_*`, `.restore_points`, and `_production_archive` trees.
   - Risk if ignored: broad search output remains noisy and future agents may copy obsolete logic.

### Priority 4: Missing Check Scripts / Missing Docs

Add dedicated enforcement checks later for:

- Watchtower
- LOO
- Alignment
- Reports
- Funding Intelligence
- Registry/Layer Control System runtime boundaries

These should verify official files, route prefixes, docs, and no duplicate active router variants.

## Medium-Risk Cleanup Candidates — Not Yet Archived

These candidates remain in place after Cleanup Pass 1. They were not moved because this pass was limited to confirmed high-risk duplicate/conflicting route files.

### Router `.bak` Files

- `services/shf-agent-fabric/routers/run_routes.py.bak*`
- `services/shf-agent-fabric/routers/runs_routes.py.bak*`
- `services/shf-agent-fabric/routers/plan_routes.py.bak*`
- `services/shf-agent-fabric/routers/admin_layers_routes.py.bak*`
- `services/shf-agent-fabric/routers/admin_registry_routes.py.bak*`
- `services/shf-agent-fabric/routers/admin_agents_routes.py.bak*`
- `services/shf-agent-fabric/routers/loo_routes.py.bak*`
- `services/shf-agent-fabric/routers/funding_rulesets.py.bak*`
- `services/shf-agent-fabric/routers/funding_partner.py.bak*`
- `services/shf-agent-fabric/routers/run_report_routes.py.bak*`
- `services/shf-agent-fabric/routers/bfe_routes.py.bak*`

### Backup Report Implementations

- `services/shf-agent-fabric/fabric/reports/pdf_report.py.bak*`
- `services/shf-agent-fabric/fabric/reports/funder_report.py.bak*`
- `services/shf-agent-fabric/fabric/reports/_broken_backups/*`
- `services/shf-agent-fabric/fabric/reports/institutional/*.bak*`
- `services/shf-agent-fabric/fabric/reports/institutional/pages/*.bak*`

### Backup Registry And Layer Implementations

- `services/shf-agent-fabric/fabric/registry_event_ledger.py.bak*`
- `services/shf-agent-fabric/fabric/registry_parity.py.bak*`
- `services/shf-agent-fabric/fabric/registry_canon.py.bak*`
- `services/shf-agent-fabric/fabric/layers/*.bak*`
- `services/shf-agent-fabric/fabric/agent_store.py.bak*`

### Top-Level Backup, Recovery, Archive, And Lock Folders

- Top-level `_backup_*` folders
- Top-level `.backup_*` folders
- Top-level `_LOCKED_*` folders
- Top-level `_recovery_*` folders
- Top-level `_broken_*` folders
- Top-level `_safe_broken_*` and `_emergency_backup_*` folders
- `_production_archive`
- `.restore_points`
- `backups`

### Historical Truth Spine Checkpoint Docs

- `docs/checkpoints/HUB_V1_TRUTH_SPINE_FEEDBACK_TOUR_LOCK.md`

## Cleanup Pass 1 Results

Archive folder:

- `_archive/duplicate-layer-audit/20260614-093838/`

Archived files:

| Archived File | Active Official Replacement | Result |
| --- | --- | --- |
| `services/shf-agent-fabric/routers/admin_agents_routes 2.py` | `services/shf-agent-fabric/routers/admin_agents_routes.py` | Archived; no merge needed. |
| `services/shf-agent-fabric/routers/watchtower_attest_routes.py` | `services/shf-agent-fabric/routers/watchtower_attestation_routes.py` | Archived; manual review needed before any future merge because it contains unique global-chain endpoints. |
| `services/shf-agent-fabric/routers/admin_routes.py` | Split admin routers: `admin_force_routes.py`, `admin_agents_routes.py`, `admin_registry_routes.py`, `admin_layers_routes.py` | Archived; no merge performed. |

Files requiring manual review:

- `_archive/duplicate-layer-audit/20260614-093838/watchtower_attest_routes.py`
  - Unique endpoints found: `POST /watchtower/attest/root`, `GET /watchtower/attest/chain/verify`, and `GET /watchtower/attest/program/{program_id}/snapshots`.
  - These were not merged into the official Watchtower attestation route because doing so would change active route behavior.

Validation results from this pass:

- `python3 scripts/check_duplicate_layer_cleanup.py`: PASS
- `python3 scripts/check_master_layer_registry.py`: PASS
- `python3 scripts/check_truth_spine_freeze.py`: PASS
- `python3 scripts/check_oracle_layer.py`: PASS
- `python3 scripts/check_ai_guardrails_layer.py`: PASS
- `python3 scripts/check_game_theory_layer.py`: PASS
- `npm run check:governance`: PASS
- Core backend pytest route tests: PASS
- `npm run build`: PASS

Remaining duplicate risks:

- Medium-risk `.bak` router files remain in active source directories.
- Backup report, registry, and layer files remain near active implementation paths.
- Top-level backup/recovery/archive folders still create broad-search noise.
- Historical Truth Spine checkpoint docs still need historical/superseded labeling.
- Dedicated enforcement scripts are still missing for Watchtower, LOO, Alignment, Reports, Funding Intelligence, and runtime Layer Control boundaries.

Next cleanup recommendations:

1. Move `.bak` router files to a timestamped archive outside `services/shf-agent-fabric/routers`.
2. Move report renderer backups and `_broken_backups` out of `fabric/reports`.
3. Move registry/layer backup files out of `fabric`.
4. Label historical checkpoint docs as superseded by Agent Fabric Truth Spine V1.
5. Add dedicated checks for Watchtower, LOO, Alignment, Reports, Funding Intelligence, and Layer Control.

## Initial Audit No-Code-Change Confirmation

This audit intentionally did not modify source code, package scripts, governance scripts, backend behavior, frontend routes, persistence files, or runtime data. The only intended file change from this task is this audit report:

- `docs/DUPLICATE_LAYER_AUDIT.md`

Note: Cleanup Pass 1 occurred after the initial no-code-change audit. Cleanup Pass 1 moved confirmed duplicate files into `_archive/duplicate-layer-audit/20260614-093838/`, added `scripts/check_duplicate_layer_cleanup.py`, and added `check:duplicates` to `package.json`. No source file was deleted and no active official router behavior was changed.
