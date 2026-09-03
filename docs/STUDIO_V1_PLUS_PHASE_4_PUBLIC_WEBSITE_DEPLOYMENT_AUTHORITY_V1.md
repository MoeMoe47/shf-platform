# Studio V1+ Phase 4: Public Website Deployment Authority + Provider Contract

## 1. Executive Result

Phase 4 introduces a separate, provider-neutral Website Deployment authority. It records test deployment state for an exact finalized Website delivery without changing Studio lifecycle, Evidence, Portfolio, Completion, Credentials, Registry, or ClientOps authority. The local provider is a deterministic simulation and is not public hosting.

## 2. Current-State Deployment Audit

The certified V1 source contains Studio delivery/finalization but no active canonical deployment table, service, route, or cloud-provider integration. Existing `publish` and `deploy` references are unrelated or prototype/reference surfaces. SHF-Next remains reference-only.

## 3. Ownership and Status

Deployment owns request, provider, target, exact delivery/revision, publication status, provider identity, timestamps, and failure metadata. It does not own QA, Review, Delivery finalization, Evidence, Completion, Portfolio, Credentials, Registry, or ClientOps. Statuses are `REQUESTED`, `QUEUED`, `DEPLOYING`, `LIVE`, `FAILED`, `SUPERSEDED`, and `UNPUBLISHED`; Studio statuses are never reused.

## 4. Eligibility and Provenance

The server accepts only a `deliveryId`. It verifies scoped `FINALIZED` delivery, `WEBSITE` project type, `STUDENT` destination, matching Website workspace revision, learner/org/tenant scope, and deployment permission. The package is derived from the exact workspace snapshot and includes a deterministic hash. Newer revisions do not retarget an existing deployment.

## 5. Provider Contract

`WebsiteDeploymentProvider` receives a validated bounded Website package and returns provider metadata. `LocalMockWebsiteDeploymentProvider` returns a deterministic non-public provider reference, target `TEST`, and no live URL. No cloud credentials or external network are used.

## 6. Persistence and Idempotency

Migration `076_website_deployment_authority.sql` adds `website_deployment_records` with scope checks, Studio FKs, Website/TEST checks, status checks, timestamps, package hash, and an active identity unique index. Repeated requests for the same active delivery/revision/provider/target return the existing deployment. Failed attempts remain historical and can be retried as new attempts.

## 7. API

* `POST /deployments/from-studio-delivery` creates or returns a test deployment.
* `GET /deployments/:deploymentId` reads a scoped deployment.
* `GET /studio/projects/:projectId/deployments` reads scoped project deployment history.
* `POST /deployments/:deploymentId/retry` retries a failed deployment.

All routes require authenticated organization context and deployment permissions. No public URL or Publish UI is introduced.

## 8. Safety Boundaries

Client authority fields are rejected. AI Agents are rejected by the Website deployment contract. Portfolio, Evidence, Completion, Credentials, Registry, and ClientOps are reference-free from deployment mutations. Package validation rejects traversal, absolute paths, secret-shaped files/content, unsafe path forms, and oversized content. Provider failure produces `FAILED`; Studio Delivery remains `FINALIZED`.

## 9. Events and Database Integrity

Successful state changes emit only bounded `deployment.requested`, `deployment.started`, `deployment.live`, and `deployment.failed` outbox events with deployment provenance. Idempotency keys prevent duplicate event consequences. No completion, Evidence, credential, Registry, deployment-publication, or ClientOps events are emitted by this domain.

## 10. Phase 5 Entry Contract

Phase 5 may add the student Website Publish experience, deployment history, safe test/live status presentation, retry/unpublish UX, and a real provider only after a separate provider/security review. It must preserve `Finalized != Deployed`, `Evidence != Deployment`, `Portfolio != Deployment`, and `Completion != Deployment`.

## 11. Phase 4.1 Live Acceptance

Phase 4.1 used `scripts/run-phase8-acceptance-env.mjs --phase9-master-fixture` with a temporary PostgreSQL 16 cluster and the authenticated development-token fixture. The fixture provisions only the existing Studio permissions plus the narrow Website deployment create/view/manage permissions.

The live acceptance covered:

* Website creation through canonical Studio APIs and UI, QA, Review approval, and Delivery finalization.
* `POST /deployments/from-studio-delivery`, `GET /deployments/:deploymentId`, and project deployment history.
* Server-derived Website, Student destination, provider, TEST target, delivery, and exact workspace revision.
* Local mock deployment reaching `LIVE` with `liveUrl: null`.
* Repeated and three-way concurrent create requests returning one deployment identity.
* New workspace revision isolation: the original deployment remained bound to the finalized revision.
* Same-organization other-learner and foreign-organization reads were denied.
* Authority-field injection was rejected.
* Finalized AI Agent delivery was rejected by the Website deployment route before provider use.

The first run exposed a fixture-only omission: the test role did not include the already-required Studio permissions. The fixture was corrected and the same live flow reran successfully. No production defect was found. Provider failure/retry behavior remains covered by injected-provider service tests; no production provider failure mode is exposed through the test-only live route.

Migration replay applied 001-076 with zero pending, drift, or unknown migrations. The live acceptance process used only its temporary database and cleaned it up after completion. No Portfolio, Evidence, Completion, Credential, Registry, or ClientOps side effects were introduced by deployment actions.

## 12. Phase 4.2 Final Failure/Retry and Database Acceptance

Phase 4.2 used the same disposable PostgreSQL 16 acceptance environment and authenticated browser/API harness. Migrations 001-076 replayed on a fresh cluster with 76 applied migrations, no pending migrations, no drift, and no unknown applied migrations.

The live acceptance verified:

* A process-only `SHS_DEPLOYMENT_TEST_FAIL_ONCE=1` provider seam produced one controlled provider failure. The switch is not request-controlled and is disabled when `NODE_ENV=production`.
* A finalized Website deployment persisted as `FAILED`, retained its exact delivery and workspace revision, emitted `deployment.failed`, and emitted no `deployment.live` event.
* Two concurrent authenticated retries resolved to one successful deployment identity. The failed record remained historical and exactly one live consequence was emitted.
* The authenticated organization-context header was used for a mismatched-tenant/org request. Create, read, and retry all failed closed without mutation or success events.
* Before/after live database snapshots showed deployment records and bounded deployment outbox rows as the only deployment-driven changes. Studio project, workspace, QA, review, delivery, Evidence, completion, credential, Portfolio, Registry, and ClientOps counts remained unchanged.
* Outbox rows carried the deployment, project, delivery, revision, organization, tenant, and idempotency context. Failure emitted no live event; duplicate retry emitted no duplicate live consequence.
* Revision N remained independently bound and live after revision N+1 was created and finalized. N+1 did not auto-deploy and required an explicit deployment request; its deployment bound to N+1 while the historical N deployment remained unchanged.
* Both local mock live records retained `liveUrl = null`; no public URL was fabricated.

The live run exposed and fixed one real concurrency defect: concurrent callers could both enter provider work for the same `DEPLOYING` record, allowing a later state transition to conflict. `WebsiteDeploymentService` now claims the state transition transactionally; callers that did not claim the record wait for the scoped terminal state. Focused deployment tests and the complete Phase 4.2 live flow pass after the fix. No migration changes were required.

Phase 4 is certified for its provider-neutral, TEST-only authority scope. Phase 5 remains responsible for student Publish UX and any separately approved real hosting provider. `Finalized != Deployed`, and the local mock is not public hosting.
