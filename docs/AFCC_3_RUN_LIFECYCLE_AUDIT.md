# AFCC-3 Run Lifecycle Audit

## Scope

Audited implementation under `services/shf-agent-fabric/` plus the existing SHS read bridge under `apps/shs-api/src/domain/agent-fabric-command/`.

This document records current truth only. It does not declare future lifecycle states as live.

## Current Run System

| Concern | Current implementation | Current authority |
| --- | --- | --- |
| Run IDs | `/runs/execute` creates `runId = secrets.token_hex(6)` and appends it to `db/runs/events.jsonl`. | `routers/runs_routes.py` run event log |
| Run persistence | Append-only JSONL at `db/runs/events.jsonl` for executed runs. A separate legacy `fabric/run_ledger.py` writes normalized events to `db/runs.jsonl`; it is not used by `/runs/execute`. | NOT CURRENTLY CANONICAL across both stores |
| Plan model | `/plan` writes plan JSON to `db/plans/{planId}.json` via `fabric/plan_store.py`. | Plan store |
| Execution records | `/runs/execute` appends one terminal event with `kind`, `outcome`, `runId`, `planId`, artifact refs, and timestamp. | Run event log |
| Approval | Plan has `approvalRequired`, `approved`, `status`; `/plan/{id}/approve` and `/reject` mutate status. `/runs/execute` accepts an `approved` boolean and blocks if approval is required but absent. | Plan store |
| Event ledger | Operational events use `services/operational_event_service.py` with tenant/org scoped JSONL. Run execution uses its own JSONL. | Split; NOT CURRENTLY CANONICAL as one ledger |
| Artifacts | `/runs/execute` writes artifact JSON and stores artifact id + sha256 in the run event. | Artifact store |
| Evidence | Run events can carry references; no canonical run evidence table exists. | NOT CURRENTLY CANONICAL |
| Proof | Published reports write proof under `registry/published/{run_id}/proof.json`. | Run report publishing |
| Reports | `run_report_routes.py` builds/publishes run reports; `services/reporting_service.py` owns reporting registry results. | Reporting |
| Timestamps | Run event `ts`; plan `executedAt`; operational events `occurred_at`/`received_at`. | Store-specific |
| Actor/initiator | Operational events derive actor/org from authenticated actor. `/runs/execute` authenticates only with the shared admin key, so no actor identity exists to capture. Phase 2 records `initiator_type: SHARED_ADMIN_CREDENTIAL` on new runs. | NOT CAPTURED (no identity at entry point) |
| Organization/tenant | Operational events store tenant/org; run execution usually does not. | NOT CURRENTLY CANONICAL for runs |
| Agent identity | Plan stores `agent.name`, `agentId`, `layer`; run event repeats `agentName`, `agentId`, `layer`. | Plan/run event |
| Operation/task | Plan input contains request intent; run event `kind` captures execution kind. | Plan store |
| Provider/model | `/runs/execute` runs deterministic tools only (`save_draft_artifact`) and cannot invoke a model. Phase 2 records `executor.model_invoked: false` and the adapters used. | NOT_APPLICABLE for new runs; NOT_CAPTURED for legacy |
| Failures | Run event `outcome` can be `error`/`failed`; message may exist. No structured failure taxonomy. | Run event log |
| Retries | No canonical retry records found for run execution. | NOT IMPLEMENTED |
| Dependencies | No canonical run dependency table; references may be present if an event records them. | NOT CURRENTLY CANONICAL |
| Cancellation | No run cancel endpoint/state found. | NOT IMPLEMENTED |
| Revocation | Truth/report/public approval have revocation concepts; run lifecycle revocation is not canonical. | NOT IMPLEMENTED for runs |
| Timeout | No run timeout state/event found. | NOT IMPLEMENTED |
| Policy/gate | Global execution gate checked before `/runs/execute`; layer gate read projection exists. | Fabric layer gate / plan policy |
| Watchtower | Persisted read projection reads snapshots/quarantine/attestations only; no run-specific canonical relation exists by default. | Watchtower |
| Truth Spine | Truth owns claims, sources, envelopes, packages, approval/revocation, visibility. | Truth Spine |
| LOO | LOO owns validation/scoring/rankings and run-target injection from the run registry. | LOO |
| Reporting | Reporting owns report definitions, calculated reports, lineage references. | Reporting |
| Current run API routes | `/plan`, `/plans/recent`, `/plan/{id}`, `/plan/{id}/approve`, `/plan/{id}/reject`, `/runs/validate`, `/runs/dry-run`, `/runs/execute`, `/runs/recent`, report publish/read routes. | Mixed |
| Current tests | AFCC command read tests, command bridge tests, run/report tests, operational event tests. | Test suite |

## Actual Existing Lifecycle

Currently provable run/plan states are:

- `PLANNED`: plan JSON created with `status: PLANNED`.
- `APPROVED`: plan status can be set by `/plan/{plan_id}/approve`.
- `REJECTED`: plan status can be set by `/plan/{plan_id}/reject`.
- `DONE`: `/runs/execute` marks the plan `DONE`.
- `COMPLETED`: AFCC-3 projection derives only from a run event with success outcome.
- `FAILED`: AFCC-3 projection derives only from a run event with failed/error outcome.

Future vocabulary such as `QUEUED`, `EXECUTING`, `WAITING`, `CANCELLED`, `TIMED_OUT`, and `REVOKED` is not currently backed by canonical run events.

## Authority Summary

- Run identity: run event log.
- Plan: plan store.
- Execution: `/runs/execute` and run event log.
- Approval: plan store.
- Evidence: NOT CURRENTLY CANONICAL for runs; references only.
- Proof: report publishing proof files.
- Policy: plan policy and layer/global gate.
- Risk: Watchtower.
- Truth verification: Truth Spine.
- Outcome scoring: LOO.
- Reporting: Reporting service and run report routes.
- Audit: registry ledger, operational event audit, report publish audit, Watchtower audit depending on domain.

## Key Gaps

- No canonical WorkOrder record beyond plan `requestId`.
- No canonical run lifecycle event stream with from/to transitions.
- No canonical actor/org/tenant capture for `/runs/execute`.
- No provider/model capture in execution.
- No cancel/revoke/timeout/retry support for runs.
- Two event stores exist and must not be conflated.

## PHASE 2 — LIFECYCLE HARDENING

### Event store audit

| Store | Writer | Shape | Verdict |
| --- | --- | --- | --- |
| `db/runs/events.jsonl` | `POST /runs/execute` only | Append-only, one terminal event per execution, keyed by `runId` | **Canonical lifecycle authority.** Extended in place (additive fields), not replaced. |
| `db/reporting/operational_events.jsonl` | `services/operational_event_service.py` | Tenant/org-scoped domain events with a fixed `SUPPORTED_EVENT_TYPES` allowlist (learning, reports, referrals, funding, workforce, GPA truth); `development_only` durability | **Rejected.** No run subject type; adding run events would widen a tenant-scoped domain ledger into a second lifecycle authority. Live operations never reads it. |
| `db/runs.jsonl` | `fabric/run_ledger.py` via `POST /events/ingest` | Normalized SHF events, unauthenticated ingest | **Rejected.** Not written by execution; not read by AFCC. |
| `fabric.sqlite` `runs_registry` | `fabric/runs_registry/store.py` | Upsertable (mutable) LOO/report run registry, caller-chosen ids | **Not a ledger.** Separate run-id namespace from `/runs/execute`. |
| `db/plans/*.json` | `/plan`, `/plan/{id}/approve|reject`, `/runs/execute` | Mutable JSON document | Approval authority only. Projected as DERIVED timeline events. |

### Execution entry points audited

| Entry point | Persists a run? | Actor | Org/tenant | Provider/model |
| --- | --- | --- | --- | --- |
| `POST /runs/execute` | Yes (`db/runs/events.jsonl`) | None (shared `X-Admin-Key`) | None | None — deterministic tools |
| `POST /run`, `/execute-intervention`, `/simulate-outcome` | **No.** `fabric.feedback.log_event` is a no-op. | — | — | `services/ai_layer` is rule-based; no provider calls |
| `POST /plan` | Plan only | None (unauthenticated) | None | — |
| `POST /events/ingest` | `db/runs.jsonl` (non-canonical) | None | None | — |

### Findings recorded (not fixed in Phase 2 — see Phase 3 for resolution)

- `POST /plan`, `POST /plan/{id}/approve` and `POST /plan/{id}/reject` have **no authentication**. Approval authority is therefore unattributed. Capturing an approver requires authenticating these routes first; Phase 2 does not change their access model.
- `/runs/execute` never writes a FAILED event: validation and I/O failures raise HTTP errors before any event is appended. FAILED is only observable from legacy/external events.
- `/runs/execute` requires `approved: true` in the request even when the plan is already `APPROVED`.
- Phase 1 regression fixed: SHS `GET /agent-fabric/command/runs/execute` matched `/runs/:runId` and forwarded a read of run id `execute`. Action words are now reserved (see Canonical Run Model).

## PHASE 3 — AUTHENTICATED AUTHORITY & EXECUTION IDENTITY

### Caller audit

| Route | Callers found | Kind | Auth before Phase 3 |
| --- | --- | --- | --- |
| `POST /plan` | `bin/run_plan.sh`, `bin/run_schema.sh` (curl to localhost) | server-side script | **none** |
| `POST /plan/{id}/approve`, `/reject` | none in repo | — | **none** |
| `GET /plans/recent`, `GET /plan/{id}` | none in repo | — | **none** |
| `POST /runs/execute` | the two scripts (admin key); `src/pages/admin/AlignmentSwitchboard.jsx` (browser, `VITE_ENABLE_ADMIN`, sends **no** admin key, so it already received 401) | script + browser | shared `X-Admin-Key` |
| `POST /run`, `/execute-intervention`, `/simulate-outcome` | frontend demo flows | browser | none; persist nothing (`log_event` is a no-op) |

### Existing mechanisms reused

- **Fabric session** (`auth/sessions.py`): cookie session carrying `user_id`, `role`, and `organization_id` (`None` = global authority). Reused as the only write authority.
- **CSRF** (`auth/csrf.py`): per-session token + origin check. Required on every write.
- **Role → permission map** (`auth/permissions.py`). `bos.governance.read` (Command Center read) has no write analogue. `bos.agents.approve` and `bos.command.approve` exist but are wired to no route. Their names mean agent and command-bus approval, so binding plan approval to them would silently widen them. Three narrow permissions were added instead (see Canonical Run Model).
- **Service identity** (`service:shs-api` HMAC): scoped to event ingestion + Command Center GETs. SHS never creates, approves, or executes plans, so it was **not** granted any plan/run authority.
- SHS SYS-6B agent identity/delegation lives in SHS Postgres and is not reachable from Fabric; not reused.

### Resolution of Phase 2 findings

| Finding | Phase 3 |
| --- | --- |
| `/plan`, `/approve`, `/reject` unauthenticated | **Fixed.** Session + CSRF + `fabric.plan.create` / `fabric.plan.approve`. Plan reads need `bos.governance.read`. |
| Shared admin key is the executor | **Fixed.** `/runs/execute` no longer accepts the admin key; session + CSRF + `fabric.run.execute`. |
| Execution never writes FAILED | **Fixed.** Start event + guaranteed terminal attempt (see Canonical Run Model). |
| `approved: true` in the execute body *was* the approval | **Fixed.** The body flag is ignored; only an attributable plan-store decision authorizes execution. A rejected plan could previously execute with `approved: true`; it now cannot. |

### Callers affected

- `bin/run_plan.sh`, `bin/run_schema.sh`: updated to log in (`FABRIC_EMAIL` / `FABRIC_PASSWORD`), then create → approve → execute with the session. Syntax-checked; not run against a live server (it would write to the real `db/` stores).
- `AlignmentSwitchboard.jsx` "Approve + Execute": unchanged (no UI work in this phase). It was already non-functional (no admin key sent); it now needs a session, CSRF, and a prior attributable approval.
