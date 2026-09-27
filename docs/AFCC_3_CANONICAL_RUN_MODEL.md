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
