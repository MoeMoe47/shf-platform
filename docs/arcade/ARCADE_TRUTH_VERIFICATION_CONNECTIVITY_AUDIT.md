# Arcade Truth & Verification Connectivity Audit

**Audit checkpoint:** `beaac4d` (`refactor: quarantine legacy arcade browser authority`)
**Branch requested:** `feature/arcade-modernization-v1`
**Scope:** read-only source and test inspection; this audit adds documents only.

## Executive Finding

**Status: BLOCKED** for the complete Arcade Activity → Attempt → Result → Verified Evidence → Truth Spine chain. The canonical Arcade Result and SHS Verified Evidence projection are server-owned and independent of browser history. However, the downstream integration is not proven operational: `arcade.resulted` is absent from Agent Fabric's internal service event allowlist, so the trusted-reporting worker's HTTP handoff is rejected. The production Truth Spine service also does not select the SHS curriculum fact provider while its durable PostgreSQL mode is active. A test exercises the SHS evidence/fact projection and converts a fact through a mapper, but does not prove production Truth Spine persistence for Arcade.

This is a downstream connectivity gap, not a dependency on the legacy browser ledger. Removing the legacy local ledger would not break creation of canonical Arcade Results or the SHS-side rule-based Verified Evidence/fact projection. It would not, by itself, complete the Truth Spine handoff.

## Canonical Arcade Result

`apps/shs-api/src/domain/arcade/service/arcade-service.ts` is the authority:

- `createActivity()` requires `arcade.activity.manage` and validates the deterministic mastery policy.
- `startAttempt()` requires `arcade.attempt`, requires an active Activity, and creates an org/user/tenant-scoped Attempt.
- `submitResult()` requires `arcade.attempt`; within a transaction it locks the Attempt, checks exact organization and learner ownership, requires `STARTED`, rejects a prior result, reads the Activity policy, validates the allowed raw input, derives mastery with `deriveMastery()`, inserts the Result, and completes the Attempt.
- The client cannot submit `mastery_achieved`. For `PASSED_FLAG` it may submit a boolean `passed`; for `SCORE_THRESHOLD` it may submit a bounded integer score. The server derives `masteryAchieved` from the stored Activity policy.
- `arcade_results.arcade_attempt_id` is unique in migration 052, enforcing at most one Result per Attempt. The row is immutable by the documented domain contract; this audit did not find a mutation path for an existing Result.
- Result reads are learner- or authorized organization-admin-scoped in `listResultsForActor()`.

The result transaction is followed by `outbox.enqueue()` after commit, not in the same transaction. The outbox idempotency key is `arcade.resulted:${result.id}`. This prevents duplicate outbox rows when the same event is enqueued again, but a failure between Result commit and enqueue can leave a Result without an event; a retry of `submitResult()` is rejected because the Attempt is already finalized. No Arcade-specific reconciliation for that gap was found.

## Event and Evidence Handoff

The server producer is `submitResult()` in `arcade-service.ts`. Its payload is derived from the stored Result (`source_record_id` and `mastery_achieved`), and its destination is `shs-verified-evidence`. No browser code produces this canonical event.

`apps/shs-api/src/domain/trusted-reporting/dispatcher.ts` recognizes Verified Evidence event types and invokes `projectAuthoritativeOutboxEvent()` before the external HTTP delivery. In `verified-evidence-service.ts`, `OUTBOX_SOURCE_TYPES` maps `arcade.resulted` to `ARCADE_RESULT`; `SOURCE_TABLES` maps that type to `arcade_results`; the service reloads the source row by organization, checks `mastery_achieved === true`, and creates rule-governed `prepare_prove_evidence` and/or `curriculum_truth_facts` records. Stable IDs and database uniqueness make replay idempotent.

This projection requires an active organization-level `curriculum_evidence_rules` row. The code does not automatically create an Arcade rule. Without one, an event can be handled with `projected: 0`; therefore evidence/fact creation is conditional on configuration. Legacy browser XP, EVU, Polygon, and local-history fields are not read by this adapter; the source is reloaded from `arcade_results`.

## Truth Spine Handoff Gap

The dispatcher then posts the event to Agent Fabric at `/shf/internal/ingestion/events`. Two independent checks prevent claiming a working Arcade Truth Spine handoff:

1. `services/shf-agent-fabric/services/internal_service_identity.py` restricts signed SHS API events to `ALLOWED_SERVICE_EVENTS`. The list does not contain `("curriculum.arcade", "arcade.resulted")`. The request is rejected before event ingestion/projection. The dispatcher classifies this authorization rejection as permanent and marks the outbox row `FAILED_FINAL` (not retryable).
2. The SHF Truth Spine `list_claims()` selects `ShsCurriculumTruthProvider` only when `SHF_TRUTH_SPINE_STORAGE` is not PostgreSQL and `provider_name()` is `shs_postgres`. In production, `is_postgres_mode()` is true; the durable branch instead reads the Truth Spine claims repository. The provider that reads SHS `curriculum_truth_facts` is therefore not the production-mode bridge.

`toTruthSpineFact()` is a pure mapper. The Phase 6 live-projection integration test calls it on an Arcade fact and checks the mapped fields, but the test does not persist that mapped fact in the production Truth Spine repository. The report registry's Arcade mastery metric is configured to consume verified canonical fact predicates, but a metric definition is not proof of successful Arcade ingestion.

**Conclusion:** SHS Verified Evidence and curriculum fact projection from a canonical Result are implemented, if an active rule exists. The production Truth Spine handoff for Arcade is not proven and the event HTTP route is explicitly unauthorized for this event today.

## Other Authority Boundaries

- **Curriculum:** migration 064 defines `curriculum_lesson_arcade_activities` as the canonical Lesson↔Activity definition link. It does not own Attempts, Results, or mastery. Completion-policy Arcade evaluation reads `arcade_results` for the targeted Activity. `arcade_activities.lesson_id` remains legacy/free-text metadata and is not used as the new linkage. The frontend quarantine does not alter either linkage.
- **Metaverse:** mission evidence adapters report Arcade as a possible `ARCADE_RESULT` evidence source and explicitly set `isVerifiedEvidence: false`. Passport projection reads canonical `arcade_results` into an `ARCADE_MASTERY_SIGNAL` with “does not directly verify a capability” framing. No local Arcade history dependency was found in these backend paths.
- **Treasury:** no Arcade Result or `arcade.resulted` consumer was found in Treasury service code. Phase 2D removes the legacy frontend wallet/credit-ledger/Polygon writes; the commit diff shows no Treasury implementation change. No authorized Arcade-to-Treasury reward integration was found to have been disconnected. Result creation does not itself create economic value.
- **Truth Spine:** SHS creates rule-bound curriculum facts; the Agent Fabric Truth Spine is a downstream authority, not an Arcade write target. No direct Arcade-to-Truth-Spine write was found.

## Phase 2D Diff Audit

`git diff f9c4e34..beaac4d -- apps/shs-api services/shf-agent-fabric src/shared src/domain migrations` changes only:

- `src/shared/arcade/arcadeRules.js`
- `src/shared/arcade/useArcadeLedger.js`

No Arcade backend, evidence adapter, Truth Spine, outbox, canonical migration, Curriculum linkage, Treasury, or Agent Fabric authority file changed in this range. The ledger hook no longer imports or writes through browser wallet, credit ledger, or Polygon integrations. `useArcadeHistory.js` remains an unchanged legacy reader at this checkpoint.

## Failure-Mode Answer

Deleting the legacy browser ledger/history would not break canonical Result creation, server-derived mastery, or rule-configured SHS Verified Evidence/fact projection. Those paths load `arcade_results` and do not read local history. It would not fix the Truth Spine gap: Agent Fabric rejects `arcade.resulted`, and the production Truth Spine provider does not automatically read SHS curriculum facts. Phase 2D removed the unauthorized browser authority path; it did not remove a legitimate Treasury integration. The canonical downstream connection remains incomplete independently of Phase 2D.

## Evidence References

- `apps/shs-api/src/domain/arcade/service/arcade-service.ts`: `createActivity`, `startAttempt`, `submitResult`, `listResultsForActor`
- `apps/shs-api/src/domain/arcade/repo/arcade-repo.ts`: row locking, Result insert, Attempt completion, Result lookup
- `apps/shs-api/migrations/052_arcade_activities.sql`: scoped Activity/Attempt/Result tables and unique Result-per-Attempt
- `apps/shs-api/src/domain/trusted-reporting/{dispatcher.ts,outbox-repo.ts}`: projection-before-delivery, retries, final failure, idempotent enqueue
- `apps/shs-api/src/domain/verified-evidence/service/verified-evidence-service.ts`: Arcade source mapping, eligibility, rule-governed Evidence/fact creation
- `apps/shs-api/src/domain/verified-evidence/truth-spine-adapter.ts`: pure fact mapper
- `services/shf-agent-fabric/services/internal_service_identity.py`: signed producer/event allowlist
- `services/shf-agent-fabric/routers/shf_internal_ingestion_routes.py`: authenticated ingestion/projection route
- `services/shf-agent-fabric/services/{truth_spine_service.py,truth_fact_provider.py,truth_spine_postgres_repository.py}`: Truth Spine source selection and durable persistence
- `apps/shs-api/tests/phase6-live-projection.integration.test.ts`: rule setup, Arcade event projection, replay test, mapper assertion
- `apps/shs-api/migrations/064_curriculum_resource_arcade_linkage.sql`: canonical definition linkage

## Phase 2D.6 Remediation Addendum

The findings above describe the `beaac4d` checkpoint and remain historically accurate. Phase 2D.6 closes the SHS event reliability gap and adds a narrowly allowlisted, signed handoff from reviewed SHS Verified Evidence to the existing Truth Spine service.

- Result insert, Attempt completion, and `arcade.resulted` enqueue now run in one Arcade database transaction. The event key remains `arcade.resulted:${result.id}`. An enqueue exception rolls the Result transaction back; retry can then create the single Result/event pair.
- SHS Verified Evidence reloads canonical `arcade_results`, requires an active organization rule, and only exposes REVIEWED `ARCADE_RESULT` records to the downstream bridge. Missing rules and pending evidence fail closed and are retried/auditable; they do not produce Truth Spine claims.
- The dispatcher sends a minimized payload through the existing signed internal ingestion route. Agent Fabric now permits only producer `curriculum.arcade` with event `arcade.resulted`; the Arcade-specific contract rejects unsupported event names, unsigned/badly signed calls, malformed evidence references, mismatched scope, and non-reviewed evidence.
- The signed route invokes the existing Truth Spine source/claim service with stable source and claim identifiers. It does not poll or promote `curriculum_truth_facts`, and it does not write a competing Agent Fabric evidence store. Truth Spine sources remain unverified and claims remain draft/unapproved pending Truth Spine's own workflow.
- SHS PostgreSQL integration tests exercise Activity → Attempt → Result, transactional outbox, evidence rule/projection, dispatcher signing and sanitized request. An Agent Fabric route test exercises signature validation, allowlisting, Evidence validation, Truth Spine service calls, persistence in the isolated test store, and replay idempotency.

**Status at initial 2D.6 remediation: PARTIAL.** The production PostgreSQL Truth Spine persistence mode was not exercised by the first cross-service harness. See the final 2D.6B acceptance below; the historical PARTIAL finding is retained.

## Phase 2D.6B Production Persistence Acceptance

**Final status: PASS.** A disposable local PostgreSQL database was initialized with the existing migration 114 schema, and the actual production-mode `truth_spine_postgres_repository` was selected using `SHF_TRUTH_SPINE_STORAGE=postgres` and `SHF_DATABASE_URL`. A signed request traversed the actual Agent Fabric ingestion route, Arcade Evidence projection, Truth Spine service, PostgreSQL append repository, and canonical Truth Spine read service. Read-back verified tenant/org, learner subject, authenticated `service:shs-api` writer, `arcade.resulted`, Result and Activity provenance, reviewed Evidence reference, and unverified/draft/unapproved state.

Replay returned the stable claim/source IDs and did not add duplicate entities. Invalid signatures, unsupported event names, unreviewed evidence, org mismatch, malformed result provenance, absent organization rule, and retired-only rule were rejected before Truth Spine creation. The signed handoff carries Evidence organization scope to enforce the org mismatch check. Tests: `SHF_ARCADE_TRUTH_SPINE_TEST_DSN=... pytest -q tests/test_arcade_truth_spine_ingestion.py tests/test_truth_spine_wave0c_persistence.py` (7 passed) and SHS Arcade/outbox tests (23 passed). Test records were confined to and removed with the disposable database. Legacy frontend history is not involved.
- `apps/shs-api/src/domain/metaverse/missions/mission-evidence-adapter.ts` and `.../passport-projection-service.ts`: Metaverse reference/projection boundaries
- `apps/shs-api/src/domain/completion-policy/service/requirement-adapters.ts`: result-backed Arcade requirement
