# SHF Trusted Reporting Implementation Status

## Repository Precheck

- Repository root: `/Users/mikeslate/Projects/shrv1`
- Branch: `v1.2-development`
- HEAD: `ce1f2972c6861f4bf4b3388d706bbe37ac124ff8`
- Initial status: dirty worktree with extensive pre-existing modified, deleted, and untracked files.
- Repository instructions: no `AGENTS.md` or `CLAUDE.md` found by `rg --files -g 'AGENTS.md' -g 'CLAUDE.md' -g '.codex/**'`.
- Real persistent Truth Spine data: not used by this slice.

## Phase Checkpoint

### Phase 9 Wave 1 - Production Reporting Safety and False-Data Removal

Status: complete for the targeted safety scope; Wave 2 producer and ingestion
closure has not started.

Fresh safety evidence:

- `node --test tests/phase9Wave1Safety.test.mjs` - 4 passed.
- SHS seed fallback is removed from both operational report storage and the
  premium report lookup module.
- Static public impact command/map values are suppressed pending canonical
  public Truth data.
- Hub import KPIs and fixture rows are removed from the production-visible
  surface.
- IEP and Lord of Outcomes retained experiences are visibly demonstration-only;
  official-looking demo exports are disabled.
- Sales tools explicitly identify projections/estimates as noncanonical.

Safety audit: `docs/SHF_REPORTING_PHASE9_WAVE1_SAFETY_AUDIT.md`.

The remaining browser-authoritative paths and missing producers remain in the
Phase 8 migration backlog. No producer system, data migration, or production
durability boundary was added in this wave.

### Phase 9 Wave 2 - Existing Producer and Authenticated Ingestion

Status: incomplete; stable tested Wave 2C infrastructure checkpoint.

Implemented and verified:

- Added the real `hub.referral` producer lineage entry based on
  `apps/shs-api/src/domain/cases/service/case-service.ts`.
- Added allowlisted `referral.created` ingestion with `referral` subject
  validation.
- Reused the existing operational event, Evidence, Truth source, and Truth
  claim projection services.
- Enforced server-derived actor, tenant, and organization scope.
- Preserved unverified Source and draft/unapproved Truth state.
- Verified duplicate ingestion and duplicate projection are idempotent.
- No referral report surface was migrated; the canonical referral count metric
  was added only after its Truth eligibility contract passed.
- Added fail-closed `service:shs-api` HMAC identity validation with key IDs,
  bounded credentials, and exact producer/event authorization.
- Added an internal Agent Fabric ingestion route that reuses operational
  ingestion and Evidence/Truth projection.
- Added a PostgreSQL integration outbox migration and transactional referral
  enqueue plus a bounded dispatcher with retry/final-failure states.

Blocking continuation point:

- The code-level bridge contract is tested, but the migration has not run, no
  managed dispatcher is deployed, no approved production secret provider has
  been exercised, and the UI still has a browser Truth fallback. Do not claim
  Wave 2 closure until a deployed cross-service runtime test proves the full
  handoff and the fallback is removed.

Audit: `docs/SHF_REPORTING_PHASE9_WAVE2_PRODUCER_INGESTION_AUDIT.md`.

### Phase 9 Wave 2C - Internal Identity and Outbox Foundation

Status: infrastructure checkpoint complete; Wave 2 remains incomplete pending
deployed runtime exercise.

Implemented:

- `service:shs-api` signed internal request validation with key IDs, bounded
  lifetime, production secret-provider fail-closed behavior, and exact
  `hub.referral` / `referral.created` binding.
- `POST /shf/internal/ingestion/events` reuses operational ingestion and the
  existing Evidence/Truth projection service.
- PostgreSQL `integration_outbox` schema with organization/producer/idempotency
  uniqueness and transactional referral enqueue.
- Bounded dispatcher with authenticated acknowledgment, retryable/final
  failure classification, and safe failure metadata.

Fresh verification:

- `pytest tests/test_internal_service_identity.py ... tests/test_truth_routes.py`:
  102 passed.
- `node --import tsx --test tests/trusted-reporting-outbox.test.ts`: 5 passed.
- `npm run typecheck` in `apps/shs-api`: passed.
- Wave 1/curriculum Node tests: 5 passed.
- Census validator: 30 surfaces, zero unresolved.
- Python syntax checks and `git diff --check`: passed.

The migration was not run, no production credential was added, no managed
dispatcher was deployed, and the Hub browser Truth fallback remains until a
deployed cross-service runtime test proves the full handoff.

Runtime infrastructure checkpoint result:
`WORKER_ENTRYPOINT_READY_DEPLOYMENT_PENDING`. `apps/shs-api` now exposes the
bounded `worker:trusted-reporting` entrypoint for an approved managed scheduler.
Production requires an approved `SHF_INTERNAL_SERVICE_KEYS_REF`; the outbox
migration and managed worker deployment remain unexecuted. Local PostgreSQL was
unavailable, so no migration was attempted. `src/pages/hub/IntakeNavigatorConsole.jsx`
continues to invoke the browser Truth adapter and local fallback on backend
failure. The Hub surface therefore remains `TRUTH_PROJECTION_REQUIRED` and is
not canonical.

Runtime deployment checkpoint attempt: blocked before mutation because the
authorized local PostgreSQL target was unavailable (`pg_isready: no response`)
and no local container runtime was available. No secret was injected, the
outbox migration was not executed, no worker was started, and no persistent
test referral was created.

### First Canonical Curriculum Reporting Slice

The `Lessons completed` value in
`src/pages/curriculum/sections/LearningProgressCard.jsx` now consumes the
authenticated Reporting Service endpoint
`/shf/reports/curriculum.lesson-completion-count`. It preserves server-returned
zero, report/metric version, verification status, and lineage metadata, and
shows pending/unavailable states without falling back to browser progress.
The surrounding dashboard remains partially legacy by design.

### Phase 0 - Repository and Safety Precheck

Status: complete for this checkpoint.

Fresh verification:

- `pytest tests/test_truth_routes_security.py tests/test_truth_routes.py`
- Result: 53 passed.
- Storage note: existing Truth Spine tests use isolated temporary storage for Truth files.

### Phase 1 - Census Recovery

Status: implementation-relevant findings recovered for this checkpoint.

Confirmed evidence:

- `src/data/shsReports/shsReportStorage.js` reads `shs.reports.records.v1` and falls back to `shsReportSeedRecords`.
- `src/data/shsReports/shsReportSeedData.js` contains sample report records with approved/verified-style labels.
- Existing audit material is present under `docs/v1-layer-audit`.
- Curriculum, Exchange, Grant Binder, Placement KPI, public impact, LOO, Oracle, and development-token findings are represented in the lineage registry for follow-on implementation.

### Phase 2 - Producer and Lineage Contract

Status: complete for this checkpoint.

Changed files:

- `services/shf-agent-fabric/contracts/reporting/producer_lineage_registry.v1.json`
- `services/shf-agent-fabric/services/reporting_lineage_service.py`
- `services/shf-agent-fabric/tests/test_reporting_lineage_registry.py`
- `services/shf-agent-fabric/docs/reporting/SHF_TRUSTED_REPORTING_IMPLEMENTATION_STATUS.md`

Fresh verification:

- `pytest tests/test_reporting_lineage_registry.py`
- Result: 5 passed.

### Phase 9 Grant Binder runtime checkpoint

The isolated local `shs_dev` PostgreSQL database now has the existing
`integration_outbox` prerequisite and `grant_binders` migration applied and
reapplied successfully. `GrantBinderService.createBinder()` writes the binder,
audit row, and one minimized `shs.grant_binder` / `grant_binder.created` v1
outbox event in one transaction. The event remains operational-only until
authenticated Agent Fabric ingestion is separately authorized. No Evidence,
Truth, metric, or Reporting Service side effect is enabled for this producer.

Proof level: `ISOLATED_DEV_RUNTIME_VERIFIED`. No production database, secret,
deployment, or real institutional data was used.

### Phase 3 - Authenticated Ingestion Contract

Status: complete for this checkpoint.

Current slice:

- Adds `shf.event.create`, `shf.event.read`, `shf.evidence.create`, `shf.evidence.read`, `shf.metric.read`, `shf.report.read`, `shf.report.generate`, and `shf.report.export` permissions to the existing role permission system.
- Adds authenticated `POST /shf/ingestion/events` and `GET /shf/ingestion/events`.
- Uses existing session cookies, CSRF validation, and role permissions.
- Derives actor, tenant, and organization scope server-side.
- Persists operational events to an append-oriented JSONL repository abstraction.
- Rejects missing organization scope for ingestion.
- Treats duplicate idempotency keys as safe replays.

Changed files:

- `services/shf-agent-fabric/auth/permissions.py`
- `services/shf-agent-fabric/main.py`
- `services/shf-agent-fabric/routers/shf_ingestion_routes.py`
- `services/shf-agent-fabric/services/operational_event_service.py`
- `services/shf-agent-fabric/tests/test_shf_ingestion_routes.py`

Focused verification:

- `pytest tests/test_shf_ingestion_routes.py`
- Initial result: 7 passed, 2 failed.
- Final result: 9 passed.
- Failure fixes completed: isolated multi-tenant test browser sessions and made unrecognized roles fail closed for permission checks.

Combined checkpoint verification:

- `pytest tests/test_reporting_lineage_registry.py tests/test_shf_ingestion_routes.py tests/test_truth_routes_security.py tests/test_truth_routes.py`
- Previous result: 67 passed.

### Phase 4 - Durable Operational Event Store Hardening

Status: complete for this checkpoint, with explicit non-production durability classification.

Current slice:

- Keeps the JSONL store as a repository abstraction/development implementation.
- Adds explicit storage metadata to persisted operational events:
  - `storage_backend: jsonl_repository_abstraction`
  - `storage_durability_class: development_only`
  - `production_durability_approved: false`
- Adds authenticated `GET /shf/ingestion/storage` so callers cannot mistake the store for production durability.
- Documents deployment requirements and rollback limits.

Changed files:

- `services/shf-agent-fabric/docs/reporting/OPERATIONAL_EVENT_STORE_V1.md`
- `services/shf-agent-fabric/routers/shf_ingestion_routes.py`
- `services/shf-agent-fabric/services/operational_event_service.py`
- `services/shf-agent-fabric/tests/test_shf_ingestion_routes.py`

Focused verification:

- `pytest tests/test_shf_ingestion_routes.py`
- Initial Phase 4 result: 8 passed, 2 failed for missing storage metadata and missing storage endpoint.
- Final result: 10 passed.

Production durability decision:

- No approved production persistence boundary was found for this reporting operational event store.
- Real persistent data remained untouched.

### Phase 5 - Curriculum Producer Integration

Status: checkpoint complete for the current real curriculum producers wired in this pass.

Current slice:

- Adds `src/shared/progress/curriculumIngestionClient.js`.
- `markLessonComplete` now creates a pending browser transport queue item for authenticated backend ingestion.
- Existing quiz submission/completion producers now create pending authenticated backend ingestion queue items mapped to `assessment.submitted` and `assessment.completed`.
- Existing reflection save producer now creates a pending authenticated backend ingestion queue item mapped to `reflection.submitted`.
- A successful backend sync marks the local progress record and queue item as synchronized.
- A failed backend sync preserves local progress, ledger, and queue records and marks the queue as rejected for retry.
- `LessonBody` displays accessible pending/synchronized/rejected status text next to the completion control.
- Existing `ledger:events:v1` behavior remains as a browser transport/compatibility record; it is no longer the only terminal path for lesson completion.

Changed files:

- `src/shared/progress/curriculumIngestionClient.js`
- `src/shared/progress/progressClient.js`
- `src/components/lessons/LessonBody.jsx`
- `tests/curriculumIngestionClient.test.mjs`

Focused verification:

- `node tests/curriculumIngestionClient.test.mjs`
- Initial result: failed with `ERR_MODULE_NOT_FOUND` because the ingestion client did not exist.
- Final lesson-completion result: passed, exit code 0.
- Final lesson + assessment + reflection result: passed, exit code 0.
- `npx playwright test tests/ui/curriculum-phase1-restoration.spec.mjs --grep "Mark as Complete writes a real record"`
- Initial result: failed before test execution due to Chromium sandbox/Mach-port permission error.
- Final result with approved browser launch: 1 passed.
- `npx playwright test tests/ui/curriculum-phase2b-learning-experience.spec.mjs --grep "progress record is written correctly on quiz submission|reflection save writes"`
- Result with approved browser launch: 2 passed.

Combined verification after Phase 4/5:

- `pytest tests/test_reporting_lineage_registry.py tests/test_shf_ingestion_routes.py tests/test_truth_routes_security.py tests/test_truth_routes.py`
- Result: 68 passed.
- `npm run build`
- Result: passed. Existing Vite warnings about dynamic/static imports and large chunks remained warnings.

Real persistent data:

- Untouched.

Unrelated changes:

- Preserved; no pre-existing user changes were reverted or overwritten.

### Phase 6 - Evidence and Truth Claim Projection

Status: checkpoint complete for the first real vertical slice (`curriculum.lesson` / `lesson.completed`).

Change contract:

- Projection is backend-only through authenticated `POST /shf/ingestion/events/{event_id}/truth-projection`.
- The route uses the existing session cookie, CSRF validation, `shf.evidence.create`, and the existing Truth source/claim create permissions.
- Operational event lookup is scoped to the verified actor's derived tenant and organization.
- Eligibility is resolved from `contracts/reporting/producer_lineage_registry.v1.json`; unknown or malformed lineage fails closed.
- Eligible events create minimal evidence records, unverified Truth sources, and unapproved version-1 Agent Fabric Truth Spine claims through `services/truth_spine_service.py`.
- Non-eligible, operational-only, sensitive-restricted, seed, mock, fixture, fabricated, aggregate-only, and not-applicable entries do not create Truth claims.
- Evidence JSONL and projection-result JSONL are explicitly repository abstractions/development-only storage; production durability is not approved.

Current slice:

- Adds deterministic server-side projection:
  - operational event ID
  - evidence ID
  - Truth source ID
  - Truth claim ID/version
- Stores evidence metadata without raw operational payload values.
- Stores `payload_digest`, scope, actor, lineage, correlation, and storage-classification fields on evidence records.
- Creates Truth sources as `verification_status: unverified`.
- Creates Truth claims with `public_approved: false`, `trust_level: draft`, and source evidence references.
- Preserves Truth versioning, scope checks, approval history, and public visibility controls.
- Reprocessing returns the existing terminal projection and does not duplicate evidence, sources, or claims.
- Evidence write failures create no Truth source or claim.
- Truth write failures record retryable projection failures without leaking sensitive payload details.

Changed files:

- `services/shf-agent-fabric/services/evidence_projection_service.py`
- `services/shf-agent-fabric/routers/shf_ingestion_routes.py`
- `services/shf-agent-fabric/services/operational_event_service.py`
- `services/shf-agent-fabric/services/reporting_lineage_service.py`
- `services/shf-agent-fabric/tests/test_shf_truth_projection_routes.py`
- `services/shf-agent-fabric/docs/reporting/SHF_TRUSTED_REPORTING_IMPLEMENTATION_STATUS.md`

Focused verification:

- `pytest tests/test_shf_truth_projection_routes.py`
- Initial result: collection failed because `services.evidence_projection_service` did not exist.
- Intermediate result: 16 passed, 1 failed because evidence metadata exposed a sensitive payload key name.
- Final result: 17 passed.

Regression verification:

- `pytest tests/test_reporting_lineage_registry.py tests/test_shf_ingestion_routes.py tests/test_shf_truth_projection_routes.py tests/test_truth_routes_security.py tests/test_truth_routes.py`
- Result: 85 passed.
- `pytest tests/test_shf_ingestion_routes.py tests/test_shf_truth_projection_routes.py`
- Result: 27 passed.
- `node tests/curriculumIngestionClient.test.mjs`
- Result: passed, exit code 0.
- `npx playwright test tests/ui/curriculum-phase1-restoration.spec.mjs --grep "Mark as Complete writes a real record"`
- Result: 1 passed.
- `npx playwright test tests/ui/curriculum-phase2b-learning-experience.spec.mjs --grep "progress record is written correctly on quiz submission|reflection save writes"`
- Result: 2 passed.
- `python3 -m py_compile services/reporting_lineage_service.py services/operational_event_service.py services/evidence_projection_service.py routers/shf_ingestion_routes.py tests/test_shf_truth_projection_routes.py`
- Result: passed, exit code 0.
- `npm run build`
- Result: passed. Existing Vite warnings about mixed static/dynamic ASL lesson imports and large chunks remained warnings.

Real persistent data:

- Untouched. Phase 6 tests monkeypatch operational, evidence, projection-result, Truth, history, and audit paths to `tmp_path`.
- `git status --short services/shf-agent-fabric/db/truth services/shf-agent-fabric/logs/truth.audit.log services/shf-agent-fabric/db/reporting`
- Result: no changed files reported.

Unrelated changes:

- Preserved; no pre-existing user changes were reverted, staged, committed, pushed, deployed, or migrated.

### Phase 7 - Canonical Metric Registry and Calculation Service

Status: complete for the first defensible curriculum metric; Phase 8 entry gate passes.

Implemented `curriculum.lesson.completion_count.v1` as a backend-owned,
versioned registry definition and server-side calculation service. A lesson
completion rate was not implemented because the current repository has no
reliable assigned/started lesson population for a defensible denominator.

Changed files:

- `services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json`
- `services/shf-agent-fabric/services/metric_registry_service.py`
- `services/shf-agent-fabric/routers/shf_metric_routes.py`
- `services/shf-agent-fabric/main.py`
- `services/shf-agent-fabric/contracts/reporting/producer_lineage_registry.v1.json`
- `services/shf-agent-fabric/tests/test_metric_registry_and_calculation.py`

Metric policy:

- Only current, scoped, in-window `curriculum_completion` / `completed_lesson`
  claims with verified sources, evidence IDs, and `public_approved: true` are
  counted.
- Subject IDs are de-duplicated deterministically; malformed, draft,
  unapproved, revoked/unverified, superseded, missing-evidence, out-of-window,
  cross-tenant, and non-public inputs are excluded.
- Results include metric version, definition digest, exclusion reasons, claim
  versions, evidence IDs, and server-derived organization scope.
- Public requests additionally apply the canonical Truth Spine public predicate
  and never return private claim fields.

Fresh Phase 7 verification:

- `pytest tests/test_metric_registry_and_calculation.py`: 4 passed.
- `pytest tests/test_metric_registry_and_calculation.py tests/test_reporting_lineage_registry.py tests/test_shf_ingestion_routes.py tests/test_shf_truth_projection_routes.py tests/test_truth_routes_security.py tests/test_truth_routes.py`: 89 passed.
- `python3 -m py_compile services/metric_registry_service.py routers/shf_metric_routes.py main.py tests/test_metric_registry_and_calculation.py`: passed.
- Temporary isolated Truth/source/evidence storage was used; real persistent
  Truth data was untouched.

Phase 8 hard entry gate: PASS. The canonical Reporting Service may now begin.

## Continuation Point

### Phase 8 - Canonical Reporting Service and Lineage Audit

Status: complete for the Phase 8 reporting-service foundation and exhaustive
surface census.

Implemented:

- Versioned `report_registry.v1.json` with one report definition referencing
  `curriculum.lesson.completion_count.v1`.
- Authenticated `GET /shf/reports/curriculum.lesson-completion-count` using
  `shf.report.read`; scope is derived from the session and client-supplied
  organization/formula values are ignored.
- Reporting Service composes metric results and returns report definition
  version, metric version, verification/public status, suppression status,
  definition digest, and claim/evidence lineage.
- `docs/SHF_REPORTING_LINEAGE_MATRIX.md` inventories the 15 current producer
  lineage entries and 16 explicitly audited report surfaces, with a finite
  migration classification for each.
- `docs/SHF_REPORTING_MIGRATION_BACKLOG.md` records prioritized remediation and
  exact blockers.
- `docs/SHF_REPORTING_CENSUS_CANDIDATES.md` records 40 raw candidates,
  duplicate/group decisions, and exclusions.
- `docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json` records all 30 confirmed
  surfaces with complete lineage fields and exactly one classification each.
- `scripts/check_shf_reporting_census.py` validates the registry structure,
  metric references, code evidence, and canonical mappings.

Focused verification:

- `pytest tests/test_shf_reporting_service.py`: 3 passed.
- `python3 scripts/check_shf_reporting_census.py`: 30 surfaces; zero blocked or
  unresolved classifications.
- `pytest tests/test_shf_reporting_census.py`: 1 passed.
- Integrated Phase 1-8 backend regression: 93 passed.
- `python3 -m py_compile scripts/check_shf_reporting_census.py ...`: passed.
- `node tests/curriculumIngestionClient.test.mjs`: passed.
- `git diff --check`: passed.

Completion boundary:

- No frontend report surface was migrated or declared canonical.
- The field-level matrix is exhaustive for the defined repository boundary;
  no unresolved candidate remains. No frontend report surface was migrated or
  falsely declared canonical.

## Continuation Point

### Controlled Rebuild Slice Review: Personal Curriculum Lesson Completion

Status: reviewed with no forced institutional migration.

The actual route is `/curriculum/lesson/:id` in `src/router/CurriculumRoutes.jsx`.
It loads a learner-local lesson record in `src/pages/curriculum/Lesson.jsx` and
renders `src/components/lessons/LessonBody.jsx`. The completion control records
personal progress and exposes pending/synchronized/rejected backend transport
status; it does not display the organization-scoped completion-count metric.

The surface registry records `reporting_role: PERSONAL_UX_ONLY` and
`migration_status: NOT_APPLICABLE`. The institutional lesson-completion metric
remains owned by `LearningProgressCard` and the canonical Reporting Service.
No legacy file is safe to delete from this review.

### Controlled Rebuild Surface Review: Assignments

Status: reviewed with no institutional migration.

The curriculum route is `/curriculum/asl/assignments`; the shared career route
is `/assignments`. Both render `src/pages/Assignments.jsx`. The page contains
three placeholder open items and moves them into an ephemeral completed list
with component state. It does not read progress records or a backend assignment
source, and its values are not equivalent to
`curriculum.lesson.completion_count.v1`.

The surface registry records `reporting_role: PERSONAL_UX_ONLY` and
`migration_status: NOT_APPLICABLE`. No assignment producer or metric was
invented, and no existing personal progress infrastructure was removed.

Focused verification: `node --test
tests/curriculumLessonCompletionSurface.test.mjs tests/curriculumReportingClient.test.mjs
tests/curriculumIngestionClient.test.mjs` (5 passed); census and rebuild
validators passed.

Phase 8 is complete. Phase 9/report-surface migration is the next authorized
phase; do not begin it in this checkpoint.

## Local Runtime Deployment Checkpoint

`ISOLATED_DEV_RUNTIME_VERIFIED` on 2026-08-25. A synthetic SHS API referral
was persisted with a PostgreSQL outbox row, delivered by the trusted-reporting
worker using local-only HMAC configuration, and accepted by Agent Fabric in a
separate local process. The isolated stores contain one operational event, one
Evidence record, one unverified Source, and one draft/unapproved/non-public
Truth claim. Valid replay was idempotent and an invalid signature was rejected
with 401. No production secret, database, deployment, or real data was used.

`IntakeNavigatorConsole` no longer writes browser Truth or fabricates a local
referral when SHS API creation fails. The `Referrals Created` field on
`surface.hub.referrals` now has a canonical Reporting Service mapping; JSONL stores remain development-only and
production secret-provider configuration, PostgreSQL migration, and managed
worker scheduling remain deployment prerequisites. Other Hub Truth-adapter
callers were not changed.

## Hub Referral Truth Semantic Contract

The generic Truth claim contract preserves
`subject_id`, `predicate`, `occurred_at`, `evidence_ids`, `source_ids`,
`lineage_id`, producer/event identity, tenant/org scope, and deterministic
version/current-state metadata for `hub_referral_created` projections.

Truth Spine now provides separately authorized internal approval and revocation
transitions. Approval requires a verified Source, is restricted to the
existing SHS-admin approval authority, is append-only audited, and never sets
or infers `public_approved`. Service principals, cross-organization actors,
unverified claims, legacy-unscoped records, missing lineage metadata, and
superseded versions fail closed for future internal metric eligibility.

The versioned `hub.referral.created_count.v1` metric is now implemented as a
distinct current referral-subject count. Internal calculation requires verified
Source and internal approval; public calculation additionally requires the
canonical public predicate. No denominator or rate was added. The report
definition `hub.referral.created_count` v1 is exposed at
`GET /shf/reports/hub.referral-created-count`; lifecycle and outcome surface
migration remains separate.

`surface.hub.reports` was reviewed at `/hub/reports`. Its `Hub Referrals
Created` KPI now consumes the canonical referral report through the shared
frontend client. Readiness, Truth, audit, workflow, report-card, and export
history values remain operational, browser-summary, static, or demonstration
data and are visibly separated from the canonical field. The surface remains
`REPORTING_SERVICE_REQUIRED`; no new metric or producer was created.

`surface.shs.create` now has a backend-owned draft workflow at
`/reporting/drafts`. PostgreSQL `report_drafts` and
`report_draft_revisions` own server IDs/timestamps, tenant/org/actor scope,
draft lifecycle, versions, and audit-backed changes. The frontend create,
history, and preview path uses the backend client; legacy `shsReportStorage.js`
remains for other SHS report consumers. The surface is
`BACKEND_OWNED_DRAFT_WORKFLOW` / `NOT_APPLICABLE` for Trusted Reporting claims.
The narrowly scoped operational-only `lineage.shs.report.created.v1` contract
is defined, transactionally enqueued through the existing SHS integration
outbox, and accepted by authenticated Agent Fabric ingestion. It contains only
report/revision/version/lifecycle metadata and no draft content. Draft
creation does not justify Evidence or Truth; a distinct submitted/finalized
lifecycle event would be required for future institutional review.

`surface.grant.binder` now has authenticated operational-event ingestion for
`lineage.shs.grant_binder.created.v1`. The existing SHS API transactional
outbox and trusted-reporting worker deliver the minimized
`grant_binder.created` v1 event with server-owned binder subject, scope, actor,
timestamp, and deterministic idempotency. Agent Fabric creates exactly one
operational event on replay and returns `projection_status: not_configured`;
no Evidence, Source, Truth, metric, or report side effect is registered.
The surface advances only to `TRUTH_PROJECTION_REQUIRED`. JSONL Agent Fabric
storage remains development-only and no production durability claim is made.

Grant Binder projection review: `grant_binder.created` proves only creation of
a backend-owned draft workspace. Because no submission/finalization/award or
other institutional lifecycle fact exists, projecting it into Truth would
duplicate ordinary workspace and audit history. It remains
`OPERATIONAL_EVENT_ONLY`; no Evidence projector, Source, Truth claim, metric,
or report is registered. `surface.grant.binder` is `NOT_APPLICABLE` for current
Trusted Reporting claims until a real lifecycle producer supplies a meaningful
institutional assertion.

Exchange Funding Commitment metric review: the narrow
`exchange.funding.commitment_count.v1` metric is registered and tested as a
historical distinct count of eligible `funding_commitment_committed` Truth
subjects in UTC windows. It requires verified first-party commitment Source
and internal Truth approval, and does not imply transfer, settlement, receipt,
ROI, impact, or public benefit. Cancelled commitments remain historical event
facts; current-active counting requires separate cancellation lineage. A
committed-amount metric is not registered because mixed currencies have no
approved FX policy. `surface.exchange.investor` is
`FRONTEND_MIGRATION_REQUIRED` after adding the registered
`report.exchange.funding.commitment_count.v1` definition and authenticated
`GET /shf/reports/exchange.funding-commitment-count`. The endpoint preserves
metric eligibility and public suppression. `InvestorDashboard` now displays
that historical count through the shared authenticated client; its remaining
pool, deployment, outcome, ranking, risk, and allocation language remains
placeholder/noncanonical. The surface is `PARTIAL_CANONICAL`.
