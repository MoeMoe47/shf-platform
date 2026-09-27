# AFCC-3 Live Operations Plan

## Implemented Read Model

AFCC-3 adds side-effect-free Fabric read projections:

- `GET /api/v1-command-center/agent-fabric/runs`
- `GET /api/v1-command-center/agent-fabric/runs/{run_id}`
- `GET /api/v1-command-center/agent-fabric/runs/{run_id}/timeline`
- `GET /api/v1-command-center/agent-fabric/runs/{run_id}/evidence`
- `GET /api/v1-command-center/agent-fabric/runs/{run_id}/dependencies`

Each response is an `afcc.read.v1` envelope, read-only, sanitized, and permission-gated by the existing Command Center read permission.

## SHS Bridge

The SHS bridge remains endpoint-specific and read-only:

- Browser calls SHS `/api/agent-fabric/command/...`
- SHS checks `bos.governance.read`
- SHS signs a GET request with the existing `service:shs-api` internal identity
- Fabric verifies the exact method/path signature and allowlist
- Fabric returns a minimized projection

No generic Fabric proxy was added. No mutation route was added.

## Security Rules

- GET only.
- No POST/PUT/PATCH/DELETE through the AFCC bridge.
- Dynamic run ids are constrained to `[A-Za-z0-9_.:-]{1,128}`.
- Outputs pass through the existing Command Center sanitizer.
- Artifact references expose id and sha256 only, never server file paths.
- Missing actor/org/provider/model fields use explicit `NOT_CAPTURED` or `NOT_AVAILABLE`.
- No credentials, HMAC material, admin key, filesystem paths, tracebacks, or raw exception text are projected.

## Freshness

Every projection includes a source and freshness record. AFCC-3 reports:

- `last_updated`
- `captured_at`
- `threshold: NOT_DEFINED`

No stale state is asserted because no authoritative run freshness threshold exists.

## Cancel / Revoke / Timeout / Retry Status

- Cancel: NOT IMPLEMENTED.
- Revoke: NOT IMPLEMENTED for runs.
- Timeout: NOT IMPLEMENTED.
- Retry: NOT IMPLEMENTED. Phase 2 publishes lineage fields only when recorded; `retry_count` is `NOT_CAPTURED` otherwise.

## Future Actions

1. Create canonical WorkOrder persistence for requested intent.
2. Add append-only lifecycle transition events for requested/planned/queued/executing/waiting/terminal states.
3. Capture actor, tenant, organization, source system, provider, model, adapter, and correlation id at plan/run creation.
4. Add explicit cancel, timeout, retry, and revoke semantics before exposing operator controls.
5. Add run-specific Watchtower, Truth Spine, LOO, and Reporting reference writers at the owning domain boundaries.
6. Build Simple Command Home only after this read model is stable.

## PHASE 2 — LIFECYCLE HARDENING

### Run detail answers

| Question | Field(s) | New runs | Legacy runs |
| --- | --- | --- | --- |
| Current state | `current_state`, `state_derivation` | derived, with reason code | derived, with reason code |
| Approval | `approval.{state, required, plan_status, basis}` | basis recorded | basis `NOT_CAPTURED` |
| Initiator | `initiator.{actor_id, initiator_type, entry_point}` | `NOT_CAPTURED` / `SHARED_ADMIN_CREDENTIAL` / `fabric.runs.execute` | `NOT_CAPTURED` |
| Org / tenant | `organization_id`, `tenant_id` | `NOT_CAPTURED` | `NOT_CAPTURED` |
| Source system | `initiator.source_system`, `initiator.execution_system` | `NOT_CAPTURED`, `agent_fabric` | same |
| Agent | `agent.{agent_id, name, layer, version}` | from event/plan; version `NOT_CAPTURED` | same |
| Operation | `operation.{type, plan_id}` | `execute`, plan id | same |
| Provider / model | `execution.*`, `provider`, `model`, `adapter` | `NOT_APPLICABLE` (no model invoked), adapter recorded | `NOT_CAPTURED` |
| Correlation | `correlation.{id, source}` | `PLAN` / `REQUEST_HEADER` / `GENERATED` | `LEGACY_REQUEST_ID` |
| Retry lineage | `retry_lineage.*` | not supported; `DEFERRED` | same |
| Evidence | `artifact_refs`, `evidence_refs`, `proof_refs` | refs only | refs only |
| Domain references | `domain_refs.*` | `NOT_PUBLISHED` unless recorded | same |
| Timeline | `/timeline` | plan-derived + recorded events | legacy-derived events |
| Terminal result / failure | `result`, `completed_at`, `failed_at`, `failure_code`, `failure_summary` | recorded | recorded |

The list response adds `lifecycle.{supported_states, deferred_states}` and `source.{malformed_event_count, unattributed_event_count}`.

### Security verification

- **GET only.** No route added; the Fabric router and SHS bridge still refuse every non-GET on these paths (tested).
- **No mutation authority.** The only writer changes are additive fields on events/plans that the existing writers already produce. No new endpoint, permission, or state transition.
- **Reserved ids.** Action words cannot be read as run ids in Fabric or SHS (fixes a Phase 1 regression where `GET …/runs/execute` was forwarded).
- **Tenant/org isolation.** The AFCC runs view is platform-governance scoped (`bos.governance.read`); runs carry no tenant today. Live operations never reads the tenant-scoped operational event store; each run is built only from its own events; a shared correlation id never joins data across runs (tested).
- **Actor sanitization.** Actor/org/tenant values must be identifier-shaped or are `[redacted]`.
- **No credentials.** The admin key is never recorded (`initiator_type` names the credential class only); provider/model strings are allowlisted tokens.
- **No filesystem paths / tracebacks.** Artifact refs are id + sha256 only; refs reject path-shaped values; all output passes the existing sanitizer; the SHS minimizer allowlists every new field.
- **No side effects on read.** The projection reads plans directly and never calls `plan_store` helpers that create directories (Phase 1 did); tested by hashing the store tree before and after every projection.

### Future action contracts

None of these has an implementation, endpoint, or UI control. All remain **DISABLED / FUTURE**.

| | CANCEL | REVOKE | TIMEOUT |
| --- | --- | --- | --- |
| Owning authority | Agent Fabric executor (`/runs/execute` owner) | Approval: plan store owner. Output invalidation: Agent Fabric run ledger; downstream Truth/Reporting revocations stay with those owners and are referenced | Agent Fabric executor / scheduler (does not exist) |
| Eligibility | Run exists and is not terminal. Today `/runs/execute` is synchronous and writes only a terminal event, so no run is ever observably non-terminal: **nothing is cancellable** | Approval revoke: plan `APPROVED`, not yet executed. Output revoke: run `COMPLETED` | Run past a defined deadline. No deadline policy exists (`threshold: NOT_DEFINED`) |
| Required permission | New `fabric.run.cancel`, bound to an authenticated identity (not the shared admin key) so the actor is captured. Never `bos.governance.read` | New `fabric.plan.approve` / `fabric.run.revoke` on an authenticated identity; `/plan/*` must be authenticated first | None for operators. System action under the Fabric service identity |
| Required lifecycle state | `QUEUED`, `EXECUTING` or `WAITING` — all deferred | `APPROVED` (pre-execution) or `COMPLETED` (post-hoc) | `EXECUTING` or `WAITING` — deferred |
| Expected event | `run.cancelled` (`from_state` → `CANCELLED`), appended to `db/runs/events.jsonl` with actor, reason code, correlation | `approval.revoked` (→ `APPROVAL_REQUIRED`) or `run.revoked` (`COMPLETED` → `REVOKED`), appended; history never rewritten | `run.timed_out` (→ `TIMED_OUT`), reason `DEADLINE_EXCEEDED`, deadline policy ref |
| Evidence generated | Cancel request record, actor, reason; partial artifacts referenced and marked incomplete | Revocation record, actor, reason, affected artifact refs; references to any Truth/Reporting revocation records | Deadline policy ref, last observed transition |
| Result | Terminal | Approval revoke: non-terminal. Output revoke: terminal | Terminal |
| Status | FUTURE — disabled | FUTURE — disabled | FUTURE — disabled |

Prerequisites before any of these can be enabled: a non-terminal lifecycle (QUEUED/EXECUTING events), authenticated operator identity on Fabric run/plan mutation routes, and a deadline policy.

## PHASE 3 — AUTHENTICATED AUTHORITY & EXECUTION IDENTITY

### Projection additions

| Field | Content |
| --- | --- |
| `initiator.actor_verification` / `organization_verification` / `tenant_verification` / `source_system_verification` | `VERIFIED`, `DERIVED_FROM_VERIFIED_ORGANIZATION`, `DECLARED`, `NOT_CAPTURED`, `NOT_APPLICABLE` |
| `initiator.authority` | `{authentication, role, permission, scope}` |
| `initiator.declared_identity` | body claims labelled `DECLARED`, or `NOT_CAPTURED` |
| `approval.decision` | approver id/type, verification, authority, `decided_at`, `reason`, `correlation_id`, `provenance: RECORDED`; `NOT_CAPTURED` for legacy |
| `approval.state` | adds `APPROVED_UNATTRIBUTED` |
| `created_by` (plan rows) | verified creator, or `NOT_CAPTURED` |
| `started_at` | start-event timestamp; `NOT_CAPTURED` without one |
| `current_state: EXECUTING` | only from a recorded start event with no terminal |
| `correlation.continuity` | `CONSISTENT` / `DIVERGENT` / `NOT_CAPTURED` |
| timeline | `plan.approved` / `plan.rejected` entries from `approvalHistory` (`RECORDED`, `actor_ref` = approver); `run.execution_started`; `run.execution_failed` |

Legacy records stay truthful:
- Phase 1 events: `LEGACY_DERIVED`, identity `NOT_CAPTURED`
- Phase 2 `SHARED_ADMIN_CREDENTIAL` events: actor `NOT_CAPTURED`; any captured actor is `DECLARED`, never `VERIFIED`
- Legacy approvals: `decision: NOT_CAPTURED`

The SHS minimizer allowlists each new field. Credentials, tokens, and emails are dropped (tested).

### Tenant / organization limitations

- Plan/run write authority is enforced per organization: an org-scoped actor cannot decide or execute another scope's plan by supplying its id (404).
- No role that holds `fabric.*` today is org-scoped, so every new plan/run is `PLATFORM_GLOBAL` (`organization_id: NOT_APPLICABLE`, verified).
- The **read** side is not tenant-filtered: AFCC reads and plan reads require `bos.governance.read`, held only by `shs_admin`. They remain explicitly **platform-wide admin scope**. Tenant-filtered reads must be implemented before either (a) `fabric.*` or `bos.governance.read` is granted to an org-scoped role, or (b) the SHS service identity forwards a user's organization. Partial read scoping was deliberately not activated.

### Security verification (Phase 3)

- Unauthenticated `/plan`, `/approve`, `/reject`, `/runs/execute`, `/plans/recent`, `/plan/{id}` → 401.
- Admin key alone and the SHS service signature → 401 on every write.
- `client_admin` / `client` → 403.
- A role holding only `bos.governance.read` → 403 on create/approve/reject/execute (it still reads).
- `shs_admin` without CSRF → 403.
- Body actor/org/tenant/source claims never reach verified fields.
- No session token, CSRF token, admin key, HMAC secret, or email appears in plans, run events, responses, or projections.
- The AFCC router remains GET-only; no cancel/revoke/timeout/retry route exists.
- Mutation check: disabling the permission and CSRF checks makes 10 of the Phase 3 security tests fail.

### Cancel / Revoke / Timeout — reassessed

| | Phase 3 finding | Status |
| --- | --- | --- |
| CANCEL | An `EXECUTING` window now exists, but execution is a single synchronous in-process request with no cooperative stop point or worker to signal; a cancel request could not stop it. | DEFERRED |
| REVOKE | Prerequisite met: approval is now an authenticated, attributable, final decision in the plan store. Revoking a pre-execution approval is technically feasible; not implemented (it would add mutation authority, out of scope). | DEFERRED — now feasible |
| TIMEOUT | A run that never gets a terminal event is now observable as `EXECUTING` with a `started_at`. There is still no deadline policy and no sweeper to append `run.timed_out`. | DEFERRED |

### Remaining gaps

- Separation of duties is not enforced: one `shs_admin` can create, approve, and execute the same plan (all attributable).
- No concurrency guard between two simultaneous executions of one approved plan (surfaced via `same_plan_run_ids`).
- A crash after the start event leaves the run `EXECUTING` with no terminal and no timeout sweeper.
- `/runs/validate`, `/runs/dry-run`, and report publishing still use the admin key (no state transition; unchanged).
- `AlignmentSwitchboard.jsx` still posts `approved: true` without a session; it needs UI work (not in scope).

## PHASE 4 — EXECUTION SAFETY

### Projection additions

| Field | Content |
| --- | --- |
| `current_state` | adds `ORPHANED` and `TIMED_OUT` |
| `timed_out_at` | `run.timed_out` timestamp |
| `failure_code` / `failure_summary` | also populated for `TIMED_OUT` (`DEADLINE_EXCEEDED`) |
| `execution_lease.status` | `ACTIVE`, `EXPIRED`, `CLOSED_BY_TERMINAL`, or `NOT_CAPTURED` (pre-Phase-4 or no start) |
| `execution_lease.*` | `lease_expires_at`, `lease_seconds`, `heartbeat: NOT_SUPPORTED`, `orphan_recorded`, `evaluated_at` |

`ORPHANED` and `ACTIVE`/`EXPIRED` are evaluated against the clock at read time; `evaluated_at` says when. The claim holder's pid/process instance is never projected; the SHS minimizer drops it (tested).

### Security / concurrency verification

- **Real threads:** 2 requests (winner held mid-execution) → 200 + 409 `RUN_ALREADY_EXECUTING`. 8 simultaneous requests → exactly 1 × 200, 7 × 409, 1 start event, 1 artifact.
- **Real processes:** 6 OS processes race for one claim → exactly one `ACQUIRED`.
- **Mutation check:** replacing `O_EXCL` with truncate-create makes 6 Phase 4 tests fail.
- **Claim lifecycle:** created once; released on success, recorded failure, and timeout; kept when no terminal can be recorded; released if the start write fails.
- **Re-check:** a plan completed between check and claim → idempotent response, no run.
- **Authority unchanged:** admin key, read permission, wrong org (404), rejected plan, and unattributable approval are all refused before any claim. Body identity cannot alter the executor or claim holder.
- **Preflight:** `/runs/validate`, `/runs/dry-run` → 401 without a session or with the admin key, 403 without CSRF or with read-only permission.
- AFCC remains GET-only; no cancel/revoke/retry route exists.

### Remaining lifecycle gaps

- Cancellation and approval revocation: deferred (design above).
- ~~Separation of duties: Policy B documented, not enforced.~~ Enforced in Phase 4.1.
- No heartbeat; a hung step is only caught at the next checkpoint.
- Residual fencing gap across separate files (documented above); closing it needs a transactional store.
- Report publishing and `/runs/recent` still use the admin key (Reporting / legacy read).
- Live Operations UI not built.

## PHASE 4.1 — GOVERNANCE & DISTRIBUTED SAFETY RECONCILIATION

### Operator-facing truth

- The runs list and run detail carry `execution_safety` (`LOCAL` / `ACTIVE` / `NOT_GUARANTEED` / `REPLICA_LOCAL`). A UI must show **"LOCAL SINGLE-FLIGHT ACTIVE"** and **"DISTRIBUTED SINGLE-FLIGHT NOT YET GUARANTEED"**, never a global "no duplicates" assurance.
- `execution_lease.scope: REPLICA_LOCAL`: lease, orphan, and timeout facts come from the answering replica only.
- The SHS bridge forwards exactly these fields and drops anything else (tested).
- Approval decisions now always show two different verified actors: creator (`created_by`) and approver (`approval.decision`).

### Corrected Phase 4 claim

Phase 4 reported "no duplicate execution" for the same plan store. The accurate statement:
- duplicates are blocked across threads and processes that share one store;
- production does **not** share a store across replicas, so distributed single-flight is **not** guaranteed.

### Remaining gaps

- Production blocker above (classification B; migration requires explicit approval).
- Cancellation and approval revocation are deferred.
- No heartbeat.
- Report publishing and `/runs/recent` use the admin key.
- Live Operations UI not built.
