# Studio V1+ Phase 2: Durable Portfolio Backend

## 1. Executive result

Phase 2 adds the first durable Portfolio authority on top of the Phase 1 contract. It stores a learner Portfolio and Evidence-backed Portfolio Artifacts in PostgreSQL, with authenticated scoped reads, bounded presentation edits, non-destructive lifecycle transitions, and transactional outbox events.

Public sharing, `UNLISTED`/`PUBLIC` visibility, deployment, Registry integration, credentials, completion writes, and localStorage migration remain outside this phase.

## 2. Authority inherited from Phase 1

Evidence remains the institutional authority for verification and eligibility. Portfolio owns learner presentation state only. Completion, credentials, Truth, deployment, Registry, and ClientOps remain separate authorities.

## 3. Schema

Migration `075_portfolio_authority.sql` creates `portfolio_profiles` and `portfolio_artifacts`. A profile is scoped to one learner, organization, and tenant. An artifact stores one Evidence reference plus Studio delivery/project/revision provenance and bounded presentation fields. No collections, credential, deployment, or public-sharing tables are added.

## 4. Portfolio ownership

The authenticated learner owns their Portfolio presentation. The service derives learner, organization, and tenant from the authenticated actor and enforces the `tenant:${organizationId}` convention.

## 5. Artifact ownership

Artifacts are created only from eligible Evidence belonging to the authenticated learner and matching the active scope. Teachers and administrators may read organization-visible artifacts through existing Studio view permission; they do not edit learner presentation.

## 6. Evidence eligibility

The service rechecks the canonical `prepare_prove_evidence` row, `source_type=STUDIO_DELIVERY`, non-superseded status, finalized Student delivery, matching project scope, matching learner, and Website/AI Agent project type inside the transaction. Delivery/project identifiers supplied by a client are not accepted.

## 7. Studio provenance

The artifact records the exact finalized Studio delivery, project, integer workspace revision, project type, learner/org/tenant, finalization time, and assignment/release references where Evidence provides them. The current workspace is never read as a substitute for the finalized source.

## 8. Visibility

Phase 2 supports only `PRIVATE` and `ORGANIZATION`; new artifacts default to `PRIVATE`. `PUBLIC`, `UNLISTED`, and unknown values are rejected. Organization visibility still requires authenticated matching organization/tenant scope and the existing Studio view permission. Anonymous access does not exist.

## 9. Presentation fields

Learners may edit title, summary, reflection, thumbnail reference, collection key, position, visibility, and presentation status. Text is bounded and plain-text by contract. Provenance, learner/scope, source identity, project type, competency references, verification, completion, credential, deployment, Registry, and ClientOps fields cannot be changed.

## 10. Immutable fields

`source_type`, `evidence_id`, `studio_project_id`, `studio_delivery_id`, `workspace_revision`, `project_type`, learner, organization, tenant, finalization timestamp, assignment, release, and competency references are persisted as source-derived provenance. Later workspace revisions do not retarget an existing artifact.

## 11. Authorization

Routes use existing authenticated organization context and Studio permissions. The owner may create and edit their own artifacts. Private artifacts are owner-only. Organization artifacts are readable only in the same organization/tenant by an actor with Studio project view permission. Cross-organization, cross-tenant, and cross-learner source access fails closed.

## 12. Tenant/org scope

Database checks and composite foreign keys require profile/artifact scope agreement. Source queries require matching Evidence, Delivery, Project, learner, organization, and tenant values. The API derives scope and rejects authority-field injection.

## 13. Lifecycle

Profiles are `ACTIVE` or `ARCHIVED`. Artifacts are `ACTIVE`, `HIDDEN`, `ARCHIVED`, or `REMOVED`. Lifecycle changes are non-destructive; no hard-delete API exists. Removal preserves Portfolio provenance and all institutional source records.

## 14. Idempotency

The database enforces one non-removed artifact per `(portfolio_id, source_type, evidence_id)`. Repeated creation requests return the existing artifact with `idempotent=true`. A profile is created with an insert conflict guard, so concurrent first-add requests converge on one active profile.

## 15. Concurrency

Profile and artifact creation run in one transaction, use database uniqueness, and re-read after conflicts. The artifact source is locked/revalidated in the same transaction. Outbox writes are transactional with successful mutations.

## 16. Events

Successful mutations emit through `integration_outbox` using existing conventions: `portfolio.created`, `portfolio.artifact.created`, `portfolio.artifact.updated`, `portfolio.artifact.archived`, and `portfolio.artifact.visibility_changed`. Event idempotency keys are scoped to the Portfolio subject. Portfolio never emits Evidence, Completion, Credential, Truth, Registry, Deployment, or ClientOps events.

## 17. Evidence invalidation behavior

Evidence owns supersession. Artifact provenance remains historical and is not deleted or retargeted. The current read path excludes superseded Evidence when creating a new artifact; an existing artifact remains a durable historical presentation record until a later policy defines display restrictions.

## 18. Legacy localStorage isolation

Existing `portfolio:items`, `civic:portfolio:artifacts`, and other local/demo Portfolio surfaces remain disconnected. They are not migrated, read by the service, or treated as institutional truth.

## 19. Security tests

The contract and backend test plan covers scope mismatch, cross-learner Evidence, cross-org/tenant access, foreign Portfolio/artifact identifiers, forbidden visibility, authority-field injection, bounded fields, stale source revisions, duplicate requests, and unauthenticated access. Database-backed tests use disposable PostgreSQL when `SHS_TEST_DATABASE_URL` is available.

## 20. Migration

`075_portfolio_authority.sql` is additive and leaves migrations `001`–`074` unchanged. It adds foreign keys to organizations, users, Evidence, Projects, and Studio deliveries; tenant checks; scope agreement; status/visibility checks; source idempotency; and lookup indexes. Fresh replay through `075` is required before release.

## 21. Phase 3 entry contract

Phase 3 may build the student Portfolio experience over these authenticated APIs: Portfolio read, artifact list/detail, create from eligible Evidence, bounded presentation edit, supported visibility, and non-destructive lifecycle. It must not add public sharing, deployment, Registry, credentials, or completion shortcuts.

## 22. Phase 2.1 database acceptance

Acceptance was run against an isolated PostgreSQL 16 cluster created under `/private/tmp` on port `55439`; no persistent owner database was used. A fresh replay applied migrations `001` through `075` with no pending, drift, or unknown migrations. Strict schema integrity checked 75 migrations and 2,512 migration objects with zero failures; the standard integrity check also passed.

The database-backed acceptance test verified one active scoped Portfolio under concurrent first-add requests, one artifact for the same Evidence source, deterministic retry behavior, cross-learner and cross-organization denial, private and organization visibility, authority-field rejection, unsupported visibility rejection, unsafe thumbnail rejection, immutable revision provenance, superseded Evidence denial, and non-destructive removal. It also verified only the expected Portfolio outbox events were created and that Studio project, Delivery, and Evidence rows were unchanged by artifact removal.

The first acceptance run found and fixed one defect: idempotent artifact retries returned an existing artifact before validating new presentation input. Validation now runs before idempotent resolution, so retries cannot smuggle unsupported visibility or unsafe media references. The corrected database acceptance passes.

Focused Portfolio and Studio regression is 61/61 passing. API typecheck, API build, and `git diff --check` pass. Phase 3 remains the student Portfolio experience and Studio bridge; public visibility, deployment, Registry, credentials, and completion changes remain deferred.
