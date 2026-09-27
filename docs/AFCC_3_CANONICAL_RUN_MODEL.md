# AFCC-3 Canonical Run Model

## WorkOrder Decision

No full WorkOrder model exists today. The closest current intent record is the plan `requestId` created by `/plan`.

AFCC-3 therefore reuses `requestId` as the current work-order identifier in read projections and labels the richer WorkOrder model as future work. It does not create a competing intent table.

## Canonical Run Projection

| Field | Status | Source |
| --- | --- | --- |
| `run_id` | EXISTING | Run event `runId` |
| `work_order_id` | DERIVED | Run event `work_order_id`/`workOrderId` or plan `requestId` |
| `tenant_id` | NOT CURRENTLY AVAILABLE for run events | Published only if captured on event |
| `organization_id` | NOT CURRENTLY AVAILABLE for run events | Published only if captured on event |
| `initiator_actor_id` | NOT CURRENTLY AVAILABLE for run events | Published only if captured on event |
| `initiator_type` | NOT CURRENTLY AVAILABLE for run events | Published only if captured on event |
| `source_system` | NOT CURRENTLY AVAILABLE | Phase 2: `NOT_CAPTURED` unless captured (no longer defaulted); see `execution_system` |
| `agent_id` | EXISTING | Run event or plan agent |
| `agent_version` | NOT CURRENTLY AVAILABLE | Published only if captured |
| `operation_type` | EXISTING | Run event `kind` or plan operation |
| `plan_id` | EXISTING | Run event/plan |
| `approval_requirement` | EXISTING | Plan `approvalRequired` |
| `approval_state` | DERIVED | Plan `approvalRequired`, `approved`, `status` |
| `current_state` | DERIVED | Only from supported plan statuses and terminal run outcomes |
| `created_at` | EXISTING/PARTIAL | Run event `ts`; plans may not store creation time |
| `queued_at` | NOT CURRENTLY AVAILABLE | Future lifecycle event |
| `started_at` | NOT CURRENTLY AVAILABLE | Future lifecycle event |
| `completed_at` | DERIVED | Run event `ts` when success outcome, or plan `executedAt` |
| `failed_at` | DERIVED | Run event `ts` when failed outcome |
| `cancelled_at` | NOT CURRENTLY AVAILABLE | Future lifecycle event |
| `timed_out_at` | NOT CURRENTLY AVAILABLE | Future lifecycle event |
| `last_transition_at` | DERIVED | Latest known run/plan timestamp |
| `result` | EXISTING | Run event `outcome` when present |
| `failure_code` | NOT CURRENTLY AVAILABLE/PARTIAL | Event reason fields if present |
| `failure_summary` | PARTIAL | Sanitized event message if failed |
| `evidence_refs` | EXISTING if event captured | References only |
| `artifact_refs` | EXISTING | Artifact id + sha256 from run event |
| `proof_refs` | EXISTING if event captured | References only |
| `report_refs` | EXISTING if event captured | References only |
| `policy_decision_refs` | EXISTING if event captured | References only |
| `gate_decision_refs` | EXISTING if event captured | References only |
| `watchtower_refs` | EXISTING if event captured | References only |
| `truth_refs` | EXISTING if event captured | References only |
| `loo_refs` | EXISTING if event captured | References only |
| `dependency_run_ids` | EXISTING if event captured | References only |
| `provider` | NOT CURRENTLY AVAILABLE | Published as `NOT_CAPTURED` unless event captured it |
| `model` | NOT CURRENTLY AVAILABLE | Published as `NOT_CAPTURED` unless event captured it |
| `adapter` | NOT CURRENTLY AVAILABLE | Published as `NOT_CAPTURED` unless event captured it |
| `retry_count` | NOT CURRENTLY AVAILABLE | Phase 2: `NOT_CAPTURED` unless event captures retries (no longer defaulted to `0`) |
| `parent_run_id` | EXISTING if event captured | Reference only |
| `correlation_id` | DERIVED/PARTIAL | Event correlation id or plan `requestId` |

## Implemented Lifecycle States

- `APPROVAL_REQUIRED`: plan requires approval and is not approved.
- `APPROVED`: plan approved or executed.
- `APPROVAL_DENIED`: plan rejected.
- `COMPLETED`: run event outcome is `ok`, `success`, `completed`, or `done`.
- `FAILED`: run event outcome is `error`, `failed`, or `fail`.

## Deferred Lifecycle States

- `REQUESTED`: FUTURE. Needs canonical WorkOrder record.
- `QUEUED`: NOT IMPLEMENTED.
- `EXECUTING`: NOT IMPLEMENTED.
- `WAITING`: NOT IMPLEMENTED.
- `CANCELLED`: NOT IMPLEMENTED.
- `TIMED_OUT`: NOT IMPLEMENTED.
- `REVOKED`: NOT IMPLEMENTED for runs.
- `RETRYING`: NOT IMPLEMENTED.

## Event Shape

AFCC-3 read projections expose timeline entries shaped as:

- `event_id`
- `run_id`
- `event_type`
- `from_state`
- `to_state`
- `occurred_at`
- `actor_ref`
- `authority_ref`
- `reason_code`
- `reason_summary`
- `evidence_refs`
- `policy_refs`
- `correlation_id`

Current run events do not store from-state transitions, so `from_state` is `NOT_CAPTURED`.

## Approval Projection

Supported now:

- `NOT_REQUIRED`
- `PENDING`
- `APPROVED`
- `DENIED`

Future-only:

- `EXPIRED`
- `REVOKED`

Approval authority remains the existing plan approval owner. AFCC reads only.

## Evidence Lineage

The canonical reference direction is:

Run -> lifecycle events -> artifact refs -> evidence refs -> proof refs -> Truth refs -> Watchtower refs -> LOO refs -> report refs.

AFCC-3 does not duplicate owned records from artifacts, Truth Spine, Watchtower, LOO, or Reporting.

## PHASE 2 — LIFECYCLE HARDENING

Contract module: `services/shf-agent-fabric/fabric/run_lifecycle.py` (shared by the writer and the read projection).

### Lifecycle event source

`db/runs/events.jsonl` is the single lifecycle authority. New events written by `/runs/execute` carry `schema_version: fabric.run_event.v2` plus these additive fields (every legacy key, including `"id": null`, is still written):

| Field | Value on new runs |
| --- | --- |
| `event_id` | `run_evt_<24 hex>` |
| `event_type` | `run.completed` |
| `from_state` / `to_state` | `APPROVED` / `COMPLETED` |
| `approval_basis` | `NOT_REQUIRED`, `PLAN_STATUS_APPROVED`, or `EXECUTE_REQUEST_APPROVED_FLAG` (captured before the plan is set to DONE) |
| `correlation_id` / `correlation_source` | see Correlation chain |
| `initiator_type` | `SHARED_ADMIN_CREDENTIAL` |
| `entry_point` | `fabric.runs.execute` |
| `execution_system` | `agent_fabric` |
| `executor` | `{adapters: [...], model_invoked: false}` |

Legacy events are never rewritten.

### Canonical lifecycle event projection

Timeline entries (`GET .../runs/{id}/timeline`):

| Field | RECORDED (v2 event) | LEGACY_DERIVED (pre-v2 event) | DERIVED (plan store) |
| --- | --- | --- | --- |
| `event_id` | stored | stored `id`/`event_id`, else `run:{run_id}:{n}` | `plan:{plan_id}:created\|approved\|rejected` |
| `event_type` | stored | `run.{kind}` | `plan.created`, `plan.approved`, `plan.rejected` |
| `from_state` | stored (allowlisted) | `NOT_CAPTURED` | `NOT_APPLICABLE` / `APPROVAL_REQUIRED` |
| `to_state` | derived claim | derived claim | from plan status |
| `occurred_at` | `ts` | `ts` | `createdAt` / `statusUpdatedAt` (or `NOT_CAPTURED`) |
| `actor_ref` | identifier-shaped only | identifier-shaped only | `NOT_CAPTURED` |
| `authority_ref`, `source` | `agent_fabric.run_events` | `agent_fabric.run_events` | `agent_fabric.plan_store` |
| `reason_code` | UPPER_SNAKE only | UPPER_SNAKE only | `PLAN_CREATED`, `PLAN_APPROVED`, `PLAN_REJECTED` |
| `reason_summary` | sanitized `message` | sanitized `message` | `NOT_CAPTURED` |
| `evidence_refs`, `policy_refs` | allowlisted ref ids | allowlisted ref ids | `[]` |
| `correlation_id` | stored, else run correlation | stored, else run correlation | plan `correlationId` |
| `provenance` | `RECORDED` | `LEGACY_DERIVED` | `DERIVED` |

Plan-derived events appear only when the plan store holds the timestamp or status that proves them.

### State precedence

Live states: `APPROVAL_REQUIRED`, `APPROVED`, `APPROVAL_DENIED`, `COMPLETED`, `FAILED`. Anything else derives `UNKNOWN`; unsupported words are never passed through (Phase 1 passed explicit state strings through verbatim — fixed).

Run with events (first match wins):

1. An event contradicts itself (e.g. `to_state: FAILED`, `outcome: ok`) → `UNKNOWN` / `EVENT_STATE_CONFLICT`
2. An event names an unsupported state (`EXECUTING`, `CANCELLED`, …) → `UNKNOWN` / `UNSUPPORTED_STATE_IN_SOURCE`
3. Events disagree on terminal state → `UNKNOWN` / `CONFLICTING_TERMINAL_STATES`
4. No terminal claim (e.g. `outcome: blocked`) → `UNKNOWN` / `NO_STATE_IN_SOURCE`
5. Events reference more than one plan → `UNKNOWN` / `PLAN_REFERENCE_CONFLICT`
6. Terminal claim but plan is rejected, pending, or self-conflicting → `UNKNOWN` / `APPROVAL_EXECUTION_CONFLICT`
7. Otherwise the single terminal claim → `COMPLETED` or `FAILED` / `RUN_EVENT_TERMINAL`

Plan without a run event:

| Plan | State | Reason |
| --- | --- | --- |
| status not in PLANNED/APPROVED/REJECTED/DONE | `UNKNOWN` | `UNSUPPORTED_PLAN_STATUS` |
| REJECTED but `approved: true` | `UNKNOWN` | `PLAN_APPROVAL_CONFLICT` |
| DONE (executed, no run event) | `UNKNOWN` | `RUN_EVENT_MISSING` |
| REJECTED | `APPROVAL_DENIED` | `PLAN_REJECTED` |
| approval required, not approved | `APPROVAL_REQUIRED` | `PLAN_APPROVAL_PENDING` |
| approved, or approval not required | `APPROVED` | `PLAN_APPROVAL_SATISFIED` |

`APPROVED` means "approval gate satisfied"; `approval.state` distinguishes `APPROVED` from `NOT_REQUIRED`. Every run exposes `state_derivation: {state, reason_code, conflict}`. Events are grouped per run id (Phase 1 emitted one row per event).

### Actor / organization capture

| Field | New runs | Legacy runs |
| --- | --- | --- |
| `initiator_actor_id` | `NOT_CAPTURED` — the shared admin key identifies no one | `NOT_CAPTURED` |
| `initiator_type` | `SHARED_ADMIN_CREDENTIAL` | `NOT_CAPTURED` |
| `organization_id`, `tenant_id` | `NOT_CAPTURED` — none authenticated at the entry point | `NOT_CAPTURED` |
| `source_system` | `NOT_CAPTURED` — caller system is unknown (was defaulted to `agent_fabric` in Phase 1; corrected) | `NOT_CAPTURED` |
| `entry_point` / `execution_system` | `fabric.runs.execute` / `agent_fabric` | `NOT_CAPTURED` / `agent_fabric` |

Request-body claims of actor/org are deliberately not accepted: they would be unauthenticated. If a future writer records these fields, the projection publishes identifier-shaped values only (`[A-Za-z0-9_.:-]{1,128}`); anything else (emails, paths) becomes `[redacted]`.

### Provider / model capture

| Field | New runs | Legacy runs |
| --- | --- | --- |
| `provider`, `model` | `NOT_APPLICABLE` (`model_invoked: false`) | `NOT_CAPTURED` |
| `adapter` / `adapters` | `save_draft_artifact`, `NONE` if no tool step ran, `MULTIPLE` if several | `NOT_CAPTURED` |
| `agent_version` | `NOT_CAPTURED` — agent registry files carry no version | `NOT_CAPTURED` |

Nothing is inferred from agent names.

### Retry lineage

`retry_lineage: {retry_supported: false, retrying_state: DEFERRED, retry_count, parent_run_id, root_run_id, retry_of_run_id, same_plan_run_ids}`.

- `/runs/execute` is idempotent per plan (a DONE plan is not re-executed) and has no retry path, so no writer records retry fields. They are published only if an event carries them, validated as run ids; otherwise `NOT_CAPTURED`.
- `retry_count` is `NOT_CAPTURED` unless recorded (Phase 1 defaulted to `0`, which asserted a fact not in the record — corrected).
- `same_plan_run_ids` lists other runs recorded against the same plan. Because execution is idempotent per plan, a non-empty list is an anomaly signal, not a retry chain.
- `RETRYING` stays deferred.

### Correlation chain

- `POST /plan`: valid `X-Correlation-Id` header (`[A-Za-z0-9_.:-]{8,128}`) or generated `corr_<16 hex>`; stored as plan `correlationId` + `correlationSource`, returned as `correlationId`.
- `POST /runs/execute`: plan `correlationId` → valid header → generated. The plan wins so a later header cannot fork the chain. Stored on the run event, returned as `correlationId`.
- Projection: run event → plan → legacy `requestId` (`source: LEGACY_REQUEST_ID`) → `NOT_CAPTURED`. Timeline events inherit the run correlation.
- Artifacts: linked through the run event's artifact refs; artifact bodies are unchanged (their hashes stay comparable).
- SHS: the AFCC bridge only reads, and SHS does not initiate runs, so no SHS → Fabric correlation exists to persist. No hop is fabricated.

### Domain references

`domain_refs.{truth_spine, watchtower, loo, reporting}` = `{authority, state, link_basis, refs}` (+ `proof_refs` on reporting).

- `PUBLISHED` / `RUN_EVENT_RECORDED` only when the run event itself lists references.
- Otherwise `NOT_PUBLISHED` / `NO_RUN_SPECIFIC_RELATION`.
- Refs must match `[A-Za-z0-9_.:#-]{1,160}`; paths and free text are dropped. No domain record is read or copied.
- No key-join is made to report proofs (`registry/published/{run_id}`) or the LOO `runs_registry`: those use a separate, caller-chosen run-id namespace, so a matching string would not prove a relationship.

### Reserved run ids

`execute, validate, dry-run, recent, approve, reject, cancel, revoke, retry, timeout, loo` (case-insensitive) are never run ids — in the Fabric projection, the Fabric service-identity path allowlist, and the SHS route. A read path can never alias an action route.

## PHASE 3 — AUTHENTICATED AUTHORITY & EXECUTION IDENTITY

Supersedes the Phase 2 rows for `initiator_type: SHARED_ADMIN_CREDENTIAL`, `approval_basis` values, and `EXECUTING` (deferred → live). Modules: `fabric/run_identity.py` (identity), `fabric/run_lifecycle.py` (rules), `auth/permissions.py` (grants).

### Permissions

| Permission | Grants | Held by |
| --- | --- | --- |
| `fabric.plan.create` | `POST /plan` | `shs_admin` only |
| `fabric.plan.approve` | `POST /plan/{id}/approve` **and** `/reject` (the approval decision) | `shs_admin` only |
| `fabric.run.execute` | `POST /runs/execute` | `shs_admin` only |
| `bos.governance.read` (existing) | `GET /plans/recent`, `GET /plan/{id}`, AFCC reads | `shs_admin` only |

Plans and runs carry no organization binding today, so these are platform authority. `audit.view` and `bos.governance.read` grant none of the writes.

### Plan auth

Session + CSRF + `fabric.plan.create`. Human sessions only: no service or agent creates plans today. New plans store:
- `createdBy`: creator identity fields + `identity_verification` + `authority`
- top-level `organization_id` (verified, or `NOT_APPLICABLE` for global actors)
- `declared_identity` only if `input` contained identity-looking keys

Legacy plans stay readable; `created_by` projects `NOT_CAPTURED`.

### Approval auth and approver provenance

Session + CSRF + `fabric.plan.approve`. Optional body: `{"reason": "..."}` (≤ 500 chars). Checked and recorded atomically under the plan-store lock (`record_approval_decision`):

| Refusal | HTTP |
| --- | --- |
| Plan missing, or not reachable by an org-scoped actor | 404 (existence is never confirmed) |
| `PLAN_ALREADY_EXECUTED` (status DONE) | 409 |
| `APPROVAL_NOT_REQUIRED` | 409 |
| `DECISION_ALREADY_RECORDED` (a verified decision exists; decisions are final) | 409 |

A legacy APPROVED/REJECTED plan with no verified decision **can** be decided once, to attribute it.

The decision record (`approvalDecision`, also appended to `approvalHistory`) answers each question:

| Question | Field(s) |
| --- | --- |
| Who | `approver_actor_id` (session `user_id`), `approver_type: HUMAN` |
| Under what authority | `authority: {authentication: FABRIC_SESSION, role, permission: fabric.plan.approve, scope}` |
| Org / tenant | `organization_id`, `tenant_id` + `identity_verification` |
| Decision | `decision: APPROVED \| REJECTED`, optional `reason` |
| When | `decided_at` |
| Which plan | `plan_id` |
| Correlation | `correlation_id`, `correlation_source` |

Every decision and refusal is also written to the Fabric auth audit (`fabric_plan_decision_recorded` / `_refused`). No token, CSRF value, cookie, or email is stored.

### Execution auth and identity

Session + CSRF + `fabric.run.execute`. **The admin key is no longer accepted.** The service identity and agents have no execution authority, and no such caller exists. Every v3 event carries:

- `initiator_actor_id`, `initiator_type: HUMAN`
- `organization_id`, `tenant_id`, `source_system: agent_fabric.session`
- `identity_verification`, `authority` (permission `fabric.run.execute`)
- `declared_identity` if the payload had identity-looking keys

### Verified vs declared

| Status | Meaning |
| --- | --- |
| `VERIFIED` | Taken from the authenticated session by the writer |
| `DERIVED_FROM_VERIFIED_ORGANIZATION` | Tenant `tenant:{org}` computed from a verified org (same convention as operational events) |
| `DECLARED` | A body claim, or a legacy captured value with no verification record. Never merged into verified fields. |
| `NOT_CAPTURED` | Absent |
| `NOT_APPLICABLE` | Global actor: no organization/tenant binding (reported with `organization_verification: VERIFIED`, scope `PLATFORM_GLOBAL`) |

Body keys treated as claims: `actor_id`, `actorId`, `initiatedBy`, `initiator_actor_id`, `userId`, `user_id`, `approver_id`, `organization_id`, `organizationId`, `org_id`, `orgId`, `tenant_id`, `tenantId`, `source_system`, `sourceSystem`. Non-identifier values become `[redacted]`.

### Approval / execution coherence

`execution_refusal(plan)` is checked before any run exists. Refused requests never become runs.

| Plan | Result |
| --- | --- |
| REJECTED | 409 `PLAN_REJECTED` |
| approval required, not APPROVED | 409 `APPROVAL_REQUIRED` (the `approved` body flag is ignored) |
| APPROVED without a verified decision (legacy) | 409 `APPROVAL_NOT_ATTRIBUTABLE` |
| unknown status | 409 `PLAN_STATUS_NOT_EXECUTABLE` |
| approval not required | executes (current policy), `approval_basis: NOT_REQUIRED` |
| APPROVED by a verified approver | executes, `approval_basis: PLAN_APPROVAL_VERIFIED`, `approval_decision_ref: plan:{id}:decision` |
| DONE | idempotent no-op (unchanged) |

Org-scoped actors may only decide or execute plans whose `organization_id` equals their verified org. Global actors may act on any plan.

### Execution state support: EXECUTING is live

`/runs/execute` now appends `run.execution_started` (`APPROVED → EXECUTING`, `outcome: started`) to `db/runs/events.jsonl` **before** any artifact is written. The line is on disk and independently readable while work runs (tested by reading the projection from inside the artifact write).

It then always attempts exactly one terminal event:

| Path | Event | `failure_code` |
| --- | --- | --- |
| success | `run.completed` (`EXECUTING → COMPLETED`) | — |
| artifact write raises | `run.execution_failed` (`EXECUTING → FAILED`) | `ARTIFACT_WRITE_FAILED` |
| plan update raises | `run.execution_failed` | `PLAN_UPDATE_FAILED` |

- The original exception is always re-raised unchanged. No exception text is stored.
- If the failure event itself cannot be written, the original error still propagates and the run truthfully stays `EXECUTING` (terminal not recorded).
- `COMPLETED` is never written after a failure.
- Validation, auth, approval, and gate refusals happen **before** the start event, so they produce no run.
- The executor invokes no agent/model; "agent failure" has no separate path.

Derivation additions (`derive_run_state`, first match wins):

| Condition | Result |
| --- | --- |
| `EXECUTING` not from a recorded `run.execution_started` (v2/v3) event | `UNKNOWN` / `UNSUPPORTED_STATE_IN_SOURCE` |
| more than one start event | `UNKNOWN` / `DUPLICATE_START_EVENT` |
| terminal recorded before start | `UNKNOWN` / `EVENT_ORDER_CONFLICT` |
| run says `PLAN_APPROVAL_VERIFIED`, plan has no verified decision | `UNKNOWN` / `APPROVAL_PROVENANCE_CONFLICT` |
| start only | `EXECUTING` / `RUN_EXECUTION_STARTED` |

Plan-only: APPROVED without a verified approver → `APPROVAL_REQUIRED` / `PLAN_APPROVAL_UNATTRIBUTED` (`approval.state: APPROVED_UNATTRIBUTED`). DONE plans keep `APPROVED` as history.

Live states: `APPROVAL_REQUIRED`, `APPROVED`, `APPROVAL_DENIED`, `EXECUTING`, `COMPLETED`, `FAILED`.
Still deferred: `REQUESTED`, `QUEUED`, `WAITING`, `RETRYING`, `CANCELLED`, `TIMED_OUT`, `REVOKED`. The runtime has no queue, no wait points, and no retry path.

### Correlation propagation

One id from `/plan` (valid `X-Correlation-Id` or generated) through:
- the approval decision (plan id wins over a later header)
- the start event and terminal event (plan id wins)
- the artifact body: `provenance: {run_id, plan_id, correlation_id}`, part of the hashed content for new artifacts

A legacy plan without a correlation id gets one at its first decision. The projection reports `correlation.continuity`: `CONSISTENT` when every recorded id in plan, decision, and run events matches, `DIVERGENT` otherwise, `NOT_CAPTURED` if none are recorded.

## PHASE 4 — EXECUTION SAFETY

Modules: `fabric/run_claims.py` (claim + lease), `fabric/run_lifecycle.py` (states), `routers/runs_routes.py` (executor). Run event schema: `fabric.run_event.v4` (v2/v3 still recognized).

### Execution locking (single-flight)

One claim per plan at `db/runs/claims/{plan_id}.json`, created with `O_CREAT|O_EXCL`:
- The first request holds it.
- Any other request for the same plan gets **409 `RUN_ALREADY_EXECUTING`** before writing anything: no start event, no artifact.
- Under the claim, the plan is **re-loaded and re-checked**, so a plan that finished, or was rejected, between the first check and the claim is refused.

Sequence: pre-checks (auth, gate, approval, validation) → claim → re-check → `run.execution_started` → work → terminal event → release.

| Outcome | Claim |
| --- | --- |
| COMPLETED / FAILED / TIMED_OUT recorded | released (only by its own run id) |
| start event could not be written | released (nothing started) |
| terminal could not be recorded (crash, unwritable log) | **kept** — the plan stays blocked until lease + grace, then is reclaimable |

### Claim / lease

The claim holds:
- `plan_id`, `run_id`
- `claimed_by_actor_id` (verified session), `correlation_id`
- `claimed_at`, `lease_seconds`, `lease_expires_at`
- `heartbeat: NOT_SUPPORTED`
- `holder: {pid, process_instance}` — never projected

Lease rules:
- **Lease** = `FABRIC_RUN_LEASE_SECONDS` (server env, default 300, bounded 30–3600). No request field can change it (tested).
- **No heartbeat.** Execution is one synchronous request, so there is no separate worker to beat.
- The start event carries `lease_expires_at`, `lease_seconds`, `claim_ref`.

### Timeout (TIMED_OUT — supported)

The executor enforces its lease at **checkpoints**: before each tool step and before finalizing.
- If the deadline has passed, it stops and writes `run.timed_out` (`EXECUTING → TIMED_OUT`, `failure_code: DEADLINE_EXCEEDED`, `partial: true`, artifacts written so far listed).
- It then releases the claim and returns **504 `RUN_TIMED_OUT`**.
- The plan is not marked DONE and may be executed again.
- Guarantee: no step starts, and no completion is written, after the deadline. A step already running cannot be interrupted; its overrun is caught at the next checkpoint.

### Orphaned runs (ORPHANED — supported, non-terminal)

A run with a start event and no terminal event is:

| Evidence | State | Reason |
| --- | --- | --- |
| lease not expired | `EXECUTING` | `RUN_EXECUTION_STARTED` |
| lease expired (clock) | `ORPHANED` | `LEASE_EXPIRED_NO_TERMINAL` |
| `run.lease_expired` recorded | `ORPHANED` | `ORPHAN_RECORDED` |
| pre-Phase-4 start (no lease) | `EXECUTING` — nothing proves abandonment | `RUN_EXECUTION_STARTED` |

Why lease expiry supports "orphaned":
- The executor never completes after its deadline; it can only add TIMED_OUT (or FAILED).
- So once the lease expires with no terminal, the run has lost its authority to complete and has no recorded outcome.
- ORPHANED **never** claims failure or completion. A late terminal from the original executor wins over ORPHANED.

Recovery:
- After `lease_expires_at + 60s` grace, the next authorized `/runs/execute` may reclaim the claim.
- The stale claim is atomically renamed to `.reclaimed.*.json` and kept as evidence.
- The reclaimer appends `run.lease_expired` (`EXECUTING → ORPHANED`, reason `LEASE_EXPIRED_NO_TERMINAL`) **for the old run**. The reclaimer's identity is nested under `recorded_by`, so it is never shown as the orphan's initiator.
- The new execution then proceeds under a fresh claim.

Residual risk: claim, plan, and run log are separate files. If an executor were suspended for longer than the whole grace window exactly between its final deadline check and its DONE write, a reclaimer could start a second execution. Fencing that fully requires one transactional store.

### Cancellation (deferred)

Checkpoints now exist and would be the honest place to stop. But execution is a single synchronous request, normally sub-second, with one tool step. There is no async worker, and no request could realistically land mid-run. `CANCEL_REQUESTED` / `CANCELLED` stay **deferred** until execution is asynchronous or multi-step. At that point: `REQUEST_CANCEL` (recorded request) → the executor observes it at its next checkpoint → `CANCELLED` only when the executor itself stopped.

### Revoke (deferred, separated)

Three different things; none overloads another:

| Concept | Belongs to | Meaning | Status |
| --- | --- | --- | --- |
| Approval revocation | plan store (approval authority) | withdraw an APPROVED decision **before execution**; appended to `approvalHistory`; plan returns to requiring approval; prohibits future execution | feasible (attributable, final decisions exist); **deferred** |
| Execution authority revocation | auth (session / role / permission) | removing a user's `fabric.run.execute` or session | already enforced by auth on every request |
| Active run termination | executor | stopping a running execution | this is **cancellation**, not revoke (deferred) |

`REVOKED` is not a run state.

### Separation of duties (Phase 4: deferred — superseded, enforced in Phase 4.1)

| Policy | Rule | Convention in repo |
| --- | --- | --- |
| A | same actor may create, approve, execute | Fabric today |
| **B** | **creator cannot approve** | **SHS convention in 5 domains** (403 `SELF_APPROVAL_DENIED`) |
| C | approver cannot execute | none |
| D | all three distinct | none |
| E | configurable per plan risk class | AI Governance exempts `READ_ONLY` consequence from B |

Recommendation: **B**, returning 403 `SELF_APPROVAL_DENIED` as AI Governance does; legacy plans with no verified creator stay approvable. Phase 4 owner decision was to document and defer. **Phase 4.1 enforces B** (see below).

### Lifecycle states now supported

| State | Terminal | Source |
| --- | --- | --- |
| `APPROVAL_REQUIRED` | no | plan store (pending, or approved without a verified approver) |
| `APPROVED` | no | plan store (verified approval, or not required) |
| `APPROVAL_DENIED` | yes (for the plan) | plan store |
| `EXECUTING` | no | `run.execution_started`, lease live |
| `ORPHANED` | no | `run.lease_expired`, or start + expired lease, no terminal |
| `COMPLETED` | yes | `run.completed` |
| `FAILED` | yes | `run.execution_failed` |
| `TIMED_OUT` | yes | `run.timed_out` |
| `UNKNOWN` | — | conflicting or unsupported source data |

`EXECUTING`, `TIMED_OUT`, and `ORPHANED` are accepted only from their own recorded event type; a bare state word derives `UNKNOWN`.

Still deferred: `REQUESTED`, `QUEUED`, `WAITING`, `RETRYING`, `CANCEL_REQUESTED`, `CANCELLED`, `REVOKED`.

## PHASE 4.1 — GOVERNANCE & DISTRIBUTED SAFETY RECONCILIATION

### Policy B enforced: creator ≠ approver

Rule: **the plan creator cannot approve or reject their own plan.** Reject is included because the SHS convention covers both ("cannot approve or decline its own case").

- Enforced in `plan_routes._decide` under the plan-store lock.
- Compares the **verified** creator (`createdBy.creator_actor_id` with `identity_verification.actor == VERIFIED`) against the **verified** session actor. Request bodies play no part.
- Same actor → **403 `SELF_APPROVAL_DENIED`**. Recorded in the auth audit as `fabric_plan_decision_refused`, reason `SELF_APPROVAL_DENIED`. Nothing is written to `approvalDecision` or `approvalHistory`.

Order of checks:
1. cross-org → 404 (existence never confirmed)
2. self-approval → 403
3. DONE → 409 `PLAN_ALREADY_EXECUTED`
4. not required → 409 `APPROVAL_NOT_REQUIRED`
5. already decided → 409 `DECISION_ALREADY_RECORDED`

Legacy compatibility: a plan with no creator, or a creator recorded without `VERIFIED`, cannot be compared and stays decidable by any authorized approver.

Not enforced (by design): approver ≠ executor, and all-three-distinct. The approver may execute when they hold `fabric.run.execute`; so may the creator once someone else approved.

### Development workflow

- Dev-only second operator: `approver@demo.shs` (`demo_shs_approver`, `shs_admin`, global scope, fixture password).
- It resolves only when `SHS_AUTH_ENV`/`ENVIRONMENT` is `development`, `test`, or `local`, and is checked at lookup time. It **does not exist in production** or any unlisted environment (tested). No production identity was created.
- `bin/run_plan.sh` / `bin/run_schema.sh`:
  - creator logs in with `FABRIC_EMAIL`/`FABRIC_PASSWORD` and creates the plan;
  - approver logs in with `APPROVER_EMAIL`/`APPROVER_PASSWORD` and approves;
  - executor logs in with `EXECUTOR_EMAIL`/`EXECUTOR_PASSWORD` (default: the approver) and runs validate → dry-run → execute.
- The scripts refuse to start if creator and approver emails match. There is no policy bypass.

### Execution safety levels

| Level | Guarantee | Status |
| --- | --- | --- |
| 1. Thread safety | concurrent requests in one process | **YES** (real-thread tests) |
| 2. Process safety, shared filesystem | processes sharing `db/runs` | **YES** (real multi-process test) |
| 3. Replica / distributed safety | executions on different replicas | **NO** |

Code: `run_claims.EXECUTION_SAFETY`. Projection: `execution_safety` on the runs list and on run detail:
```
level: LOCAL
local_single_flight: ACTIVE
distributed_single_flight: NOT_GUARANTEED
scope: REPLICA_LOCAL
production_blocker: DISTRIBUTED_SINGLE_FLIGHT_NOT_GUARANTEED
summary: LOCAL SINGLE-FLIGHT ACTIVE; DISTRIBUTED SINGLE-FLIGHT NOT YET GUARANTEED
```
It carries no paths or process details. `execution_lease.scope: REPLICA_LOCAL`.

### Production truth — PRODUCTION BLOCKER: DISTRIBUTED SINGLE-FLIGHT NOT GUARANTEED

Topology: Azure Container App `agent-fabric`, `max_replicas = 2`, **no shared volume**. Plans, approvals, run events, claims, and artifacts are files on each replica's ephemeral disk.

What another replica can see:

| Record | Visible from the other replica? |
| --- | --- |
| execution claim | **No** |
| `run.execution_started` | **No** |
| terminal events (`run.completed` / `run.execution_failed` / `run.timed_out` / `run.lease_expired`) | **No** |
| plans and approval decisions | **No** |

Consequences, all replica-local:
- A plan exists only on the replica that created it. Approve/execute requests routed to the other replica get 404.
- The AFCC read shows only the answering replica's runs.
- Container restarts lose all of it (storage is already classified `development_only` for operational events).

- **ORPHANED** is replica-local. Only the replica holding the start event can derive it, and only that replica can reclaim the plan and record `run.lease_expired`. **Cross-replica orphan recovery is not supported.**
- **TIMED_OUT** is enforced by the executing process itself, so the deadline holds wherever the run executes. The resulting record is replica-local.

### Shared-store audit and decision: **B**

| Candidate | Finding |
| --- | --- |
| Azure PostgreSQL (`infra/azure/postgres.tf`) → `SHF_DATABASE_URL` on the Fabric container | **exists, shared, production-capable** |
| Fabric Postgres users | Truth Spine (`truth_spine_records`), public population, evidence projection, internal-ingestion rate limit |
| Schema ownership | SHS migration runner (`apps/shs-api/migrations`, e.g. `114_truth_spine_canonical_persistence.sql`) |
| `services/shf-agent-fabric/migrations/20260310_execution_pipeline.sql` | unrelated (`execution_actions`, `execution_rules`); no runner applies it |
| Redis / advisory locks / lease or idempotency table for plans or runs | **none** |
| Plan store, approvals, run ledger | replica-local JSON; no Postgres representation |

**Classification B — a shared store exists, but migration is a separate project.** A Postgres-only claim would not be correct while the plan state and run ledger it guards stay on replica disks. The claim must share a transaction with the plan status transition and the terminal close. No lock was invented, no schema created, no replica count or volume changed.

### Recommended distributed-claim follow-up (needs explicit approval)

1. Add an SHS-owned migration for Fabric run authority, in the same Postgres: `fabric_plans` (status, approval decision), `fabric_run_events` (append-only), and `fabric_execution_claims` (`plan_id` PRIMARY KEY, `run_id`, actor, correlation, `lease_expires_at`, `released_at`).
2. Claim = `INSERT … ON CONFLICT DO NOTHING`, or `UPDATE … WHERE lease_expires_at < now() - grace` for reclaim, in the **same transaction** as reading the plan status. Terminal close = the terminal event insert + `plan.status = DONE` + claim release in one transaction. A fencing token (claim version) is checked on every write.
3. Keep the file claim as the development fallback. Flip `EXECUTION_SAFETY` to `DISTRIBUTED` only after the Postgres path is the production authority and a two-connection concurrency test proves it.
