# Phase 2D.5 Final Report

## Status: BLOCKED

The canonical Arcade Result and server-side SHS Verified Evidence/fact projection are independent of the legacy frontend ledger. The complete Result→Evidence→Truth Spine path is **not proven intact**: the Agent Fabric internal ingestion allowlist excludes `curriculum.arcade` / `arcade.resulted`, and production Truth Spine mode reads its durable claim repository rather than automatically ingesting SHS `curriculum_truth_facts`. Existing Arcade integration coverage creates an evidence rule, projects the event twice, and checks a mapped fact; it does not prove production Truth Spine persistence or the actual Agent Fabric handoff.

## Findings

1. **Canonical truth chain:** Activity definitions, Attempts, Results, and server-derived mastery are implemented in the Arcade service/repository. Result submission is org/user scoped, locks and finalizes a single Attempt, and enforces one Result per Attempt.
2. **Result authority:** `submitResult()` in `apps/shs-api/src/domain/arcade/service/arcade-service.ts`; schema/invariants in migration 052. The client cannot submit mastery.
3. **Event producer:** the same service emits server-side `arcade.resulted` after Result commit, using Result-derived idempotency/correlation and source references. Enqueue is outside the Result transaction; an enqueue error can strand a committed Result without an event, and no Arcade-specific reconciliation was found.
4. **Verified Evidence consumer:** `verified-evidence-service.ts` maps the event to `ARCADE_RESULT`, reloads `arcade_results`, and accepts only `mastery_achieved=true`. An active org rule is required; projection is idempotent. Browser/local history is not required.
5. **Truth Spine handoff:** not proven operational. The dispatcher posts to Agent Fabric, but its event allowlist excludes the Arcade producer/event, resulting in permanent rejection. The production Truth Spine mode does not automatically use the SHS PostgreSQL fact provider. `toTruthSpineFact()` is only a mapper, and the Phase 6 test verifies the map rather than production persistence.
6. **Curriculum:** migration 064 remains the canonical Lesson↔Activity definition link. Curriculum completion reads canonical mastered Results. `arcade_activities.lesson_id` is not promoted as canonical linkage.
7. **Metaverse:** Arcade is consumed as a signal/reference from canonical `arcade_results`; the adapter says it is not verified evidence or capability mastery. No legacy local history dependency was found.
8. **Treasury:** separate authority; no Arcade Result consumer or automatic reward write found. Phase 2D did not modify Treasury code or remove a legitimate integration.
9. **Duplicate truth path:** the browser write path is quarantined. The unchanged `useArcadeHistory` still reads local ledger rows and exposes legacy XP/on-chain summary fields to current history consumers. This is a stale legacy read/presentation path for Phase 2E, not a canonical write authority; do not treat it as verified truth.
10. **Phase 2D scope:** diff `f9c4e34..beaac4d` changes only `src/shared/arcade/arcadeRules.js` and `src/shared/arcade/useArcadeLedger.js` under the requested authority/backend paths. No API service, evidence adapter, Truth Spine, outbox, migration, Curriculum linkage, Treasury, or Agent Fabric authority changed.
11. **Legacy deletion scenario:** removing local ledger/history would not break canonical Result creation or rule-configured SHS Evidence/fact projection. It would not repair the independent Truth Spine handoff gap.

## Search and Verification Evidence

- Ran the requested repository-wide `rg` search over `apps services src tests`; it produced 23,342 matching lines. Targeted source inspection followed for Arcade service/repository, evidence service, dispatcher/outbox, internal ingestion allowlist/router, Truth Spine provider/storage, Curriculum linkage/completion, Metaverse projections, and Treasury source.
- Ran `git diff f9c4e34..beaac4d -- apps/shs-api services/shf-agent-fabric src/shared src/domain migrations`; only the two legacy frontend Arcade files listed above changed.
- Inspected `apps/shs-api/tests/phase6-live-projection.integration.test.ts`, including its Arcade setup and mapper assertion. No tests/build were run because this was a read-only forensic audit and runtime execution was not requested.
- No database or migration changes were made. No application code or tests were modified. No commit was created.

## Required Follow-up Before PASS

- Decide and implement an authorized Agent Fabric ingestion/lineage contract for `curriculum.arcade` / `arcade.resulted`, or define a separate production Truth Spine handoff from the SHS canonical fact store.
- Prove the production Truth Spine persistence path with an integration test that starts from a canonical Arcade Result and active rule, dispatches the event, and reads the resulting authorized Truth Spine projection.
- Make Result persistence and outbox enqueue atomic, or add a recoverable reconciliation mechanism for the post-commit enqueue gap.
- Phase 2E should quarantine authority-like historical display fields in `useArcadeHistory`; this is separate from the server-side gap and does not block canonical Result creation.

## Phase 2D.6 Remediation Status

The original status above remains the accurate 2D.5 checkpoint. Remediation now:

1. Moves Result persistence, Attempt completion, and `arcade.resulted` enqueue into one transaction, retaining `arcade.resulted:${result.id}` idempotency.
2. Requires an active organization Arcade evidence rule and reviewed `ARCADE_RESULT` evidence before Truth Spine handoff. Absence/pending state fails closed; no truth claim is created.
3. Adds the exact signed allowlist pair `curriculum.arcade` / `arcade.resulted` and sends a minimized handoff through the existing ingestion endpoint into existing Truth Spine source/claim services.
4. Uses stable Truth Spine identifiers and proves replay behavior in the route test. SHS `curriculum_truth_facts` is not promoted or polled as Truth Spine authority.

**Updated gate: PARTIAL.** Tests exercise the real SHS transaction/service/outbox and dispatcher payload construction, and the Agent Fabric signed route plus Truth Spine service in an isolated test store. The cross-service HTTP receiver is mocked in the SHS test, and the durable production PostgreSQL Truth Spine writer/readback is not exercised. Therefore end-to-end production persistence is still an explicit gap; this is not PASS.

## Phase 2D.6B Final Acceptance

**Final gate: PASS.** The prior PARTIAL finding accurately records the earlier harness limitation. Phase 2D.6B added and ran a PostgreSQL-backed acceptance against the existing production-mode Truth Spine repository and schema. The real signed route persisted the source/claim; canonical service reads returned the expected scoped provenance; replay reused stable IDs without duplicate source/claim entities. Negative route cases produced no writes. SHS tests prove missing and retired organization rules produce no Evidence/fact and do not proceed to handoff. Production records remain `draft`/unapproved and sources `unverified` as required. The acceptance database was disposable and removed after testing.

The previous mocked HTTP test remains useful for dispatcher request construction, but the PostgreSQL acceptance itself did not mock the ingestion route, Truth Spine service, or PostgreSQL repository.

No frontend ledger/history dependency, Treasury authority, Curriculum authority, Metaverse behavior, database migration, or invented Activity ID was introduced.
