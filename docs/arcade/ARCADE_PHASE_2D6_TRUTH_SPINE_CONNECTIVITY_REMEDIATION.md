# Phase 2D.6 Arcade Truth Spine Connectivity Remediation

## Status: PASS

The original 2D.5 gate was BLOCKED and the initial 2D.6 test state was PARTIAL. Phase 2D.6B closes the remaining production persistence acceptance gap with an actual PostgreSQL-backed signed-route test.

## Original Blockers

- Agent Fabric rejected the Arcade producer/event pair.
- Production Truth Spine did not automatically consume SHS `curriculum_truth_facts`.
- Arcade Result commit and event enqueue had a failure window.
- SHS evidence projection required an active organization rule, but the no-rule behavior was not an observable fail-closed handoff.

## Architecture and Ownership

The canonical chain is:

`Arcade Activity → Attempt → Result → server-derived mastery → arcade.resulted → Verified Evidence → signed Truth Spine ingestion → Truth Spine`

Arcade owns Activity, Attempt, Result, and server-derived mastery. Verified Evidence owns evidence interpretation and review. Truth Spine owns institutional source/claim persistence and its own verification/approval. Curriculum owns lesson/activity definition linkage. Treasury owns rewards/economy. Metaverse owns its projections. The frontend owns presentation only.

**The Arcade frontend is not part of the canonical verification path.** Browser local history, XP, EVU, credit, wallet, Polygon metadata, and legacy skill tags are not read or sent by this bridge.

## Producer, Reliability, and Idempotency

`submitResult()` locks and scopes the Attempt, derives mastery from the stored Activity policy, inserts one immutable Result, completes the Attempt, and enqueues `arcade.resulted` within the same transaction. The event retains producer `curriculum.arcade`, destination `shs-verified-evidence`, and idempotency key `arcade.resulted:${result.id}`. A failed enqueue rolls back Result and Attempt completion; a caller can retry without stranding a Result. Existing outbox retry/backoff and unique idempotency behavior remain in force.

## Evidence and Signed Handoff

The SHS dispatcher reloads the canonical Result and applies the organization Arcade evidence rule. Missing active rule raises a retryable, observable failure; pending or unreviewed evidence does not create a Truth Spine claim. Invalid evidence data fails closed. Once evidence is REVIEWED, only minimum provenance is forwarded: Result ID, Activity ID, actor/org scope, `ARCADE_RESULT` evidence ID, rule/version, mastery/result state, event identity, and source occurrence time.

Agent Fabric's service-ingestion allowlist adds only `curriculum.arcade` + `arcade.resulted`. Signed route validation binds the signature to the request, checks exact producer/event and canonical idempotency key, and validates Result/Activity/evidence consistency and REVIEWED status. Unsupported Arcade events, invalid signatures, and malformed or unreviewed evidence are rejected. The handoff does not include XP, EVU, credit, wallet, Polygon, or browser-derived skill claims.

## Truth Spine Bridge

The signed route invokes the existing Truth Spine source/claim service. It creates references to canonical SHS Verified Evidence records and stable source/claim identities, enabling replay without duplicate claims. It does not create an Agent Fabric evidence store, insert directly into Truth Spine tables from Arcade, or poll SHS `curriculum_truth_facts`. That table remains an SHS-side projection/read model, not Truth Spine authority.

Truth Spine's existing workflow retains final authority: the created source is unverified and claim is draft/unapproved until Truth Spine's own verification and approval process runs. This remediation does not fabricate Truth Spine verification.

## Failure, Retry, and Rule Behavior

- Result and outbox are atomic in one database transaction.
- SHS outbox delivery retains bounded retry/backoff and idempotent event identity.
- Missing rule and evidence-pending conditions do not create a Truth Spine claim and remain observable through retry/failure state.
- Invalid signature, unsupported event, mismatched scope, or invalid Evidence reference fails closed.
- Replaying the same signed canonical event resolves stable source/claim identifiers and does not create duplicate Truth Spine truth.
- Truth Spine approval/verification remains a separate downstream operation.

## Verification

- `apps/shs-api/tests/arcade-truth-spine.integration.test.ts`: real API database-backed Activity/Attempt/Result flow, server mastery, atomic outbox, rule-required evidence behavior, dispatcher signing/sanitization, enqueue failure rollback/retry. Cross-service HTTP receiver is mocked.
- `apps/shs-api/tests/trusted-reporting-outbox.test.ts`: sanitized Arcade handoff and outbox contract/retry regressions.
- `apps/shs-api/tests/phase6-live-projection.integration.test.ts`: existing projection regressions.
- `services/shf-agent-fabric/tests/test_arcade_truth_spine_ingestion.py`: actual signed route/allowlist validation, failure cases, Truth Spine service call, evidence provenance, and idempotent replay using isolated test storage.
- Production PostgreSQL Truth Spine writer/readback is not exercised by this integration harness. That durable storage hop remains the explicit gap behind PARTIAL.

### Phase 2D.6B PostgreSQL Acceptance

The new `test_signed_arcade_handoff_persists_reads_back_and_replays_idempotently_in_postgres` ran with `SHF_TRUTH_SPINE_STORAGE=postgres` and a dedicated local PostgreSQL DSN. It exercised the real internal ingestion route, Arcade evidence projection, Truth Spine service, and `truth_spine_postgres_repository` against the existing migration 114 schema. It read the resulting records through Truth Spine service APIs and verified the repository row identity. The same signed handoff was replayed and returned stable IDs without duplicate claims or sources.

The test also proved invalid HMAC, unsupported Arcade event, unreviewed Evidence, organization mismatch, and malformed Result/Evidence provenance leave canonical Truth Spine reads unchanged. SHS PostgreSQL-backed tests separately prove both absent and retired-only organization rules fail closed before evidence/fact creation or handoff. Claim provenance records `service:shs-api` as writer and the learner as subject; source remains unverified and claim remains draft/unapproved. Data lived only in a disposable acceptance database that was dropped after verification.

**Final status: PASS.** The production repository was exercised; no frontend dependency, second bridge/store, or authority transfer was introduced. No migration was changed.

## Authority Invariants

No database migration was added. Treasury, Curriculum, Metaverse, Identity, and Arcade frontend behavior were not changed. No Arcade Activity ID was inferred or fabricated. No browser authority path was restored. The architecture remains **SEPARATE AUTHORITIES, SHARED COORDINATION**.
