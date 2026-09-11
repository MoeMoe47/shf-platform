# SYS-5C2 WF-030 Authenticated HTTP Final Acceptance Report

## 1. Executive Result

**COMPLETE for the repository-local TEST release lifecycle.**

## 2. Repository Baseline

- Path: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`
- Current dirty state: 116 tracked, 171 untracked, 287 total
- Fresh DB: `shs_sys5c2_20260910` on PostgreSQL port `55445`
- Cluster: `/tmp/wf026-pgdata`, started with mmap shared memory
- Migration head: `127_studio_release_foundation.sql`; applied `001–127`
- API: `8102`, health PASS; stopped after acceptance
- Frontend: no release UI is required by the API/domain foundation scope

## 3. Entering Acceptance Gap

The only gap was a missing `project_studio` service entitlement in the disposable
fixture. No authorization bypass or product redesign was needed.

## 4. Studio Entitlement Authority

`ServiceCatalogService` and `requireOrganizationServiceEntitlement` remain the
canonical entitlement authority. The fixture provisioned only `project_studio`
for Org A through `grantEntitlement`; Org B received no entitlement.

## 5. Disposable Entitlement Provisioning

Provisioning succeeded through the existing service-catalog service with the
existing platform-authorized fixture actor. No middleware or permission changes
were made.

## 6. Fresh PostgreSQL

Migrations through 127 applied from scratch. Pending, drift, and unknown applied
migrations were empty. Schema integrity returned `{ "ok": true, "failures": [] }`.

## 7. Fixture

Org A, Org B, builder/reviewer identities, active memberships, Studio entitlement,
project, workspace revision 1, immutable artifact `sys5c-artifact-a`, QA
`sys5c-qa-a`, approved review `sys5c-review-a`, decision `sys5c-decision-a`, and
finalized delivery `sys5c-delivery-a` were created. No terminal release was
seeded.

## 8. Authenticated HTTP Happy Path

`POST /studio/releases` as `sys5c-builder` returned HTTP 201 and release
`studio_release_b3e37545-98c1-474c-ab1b-07e641d81f71` in `AUTHORIZED` state.
`POST /studio/releases/:id/execute` returned HTTP 201 and `RELEASED`, preserving
artifact `sys5c-artifact-a`, QA/review/delivery references, content hash, and
provider reference `mock_deployment_469e69e03da815160eb839cf`.

## 9. Wrong Org

Org B authenticated request for Org A delivery returned HTTP 403
`SERVICE_ENTITLEMENT_REQUIRED`. No release was created.

## 10. Revoked Membership

After revoking Org A builder membership, protected release read returned HTTP 401
`AUTH_REQUIRED`. The stale identity could not continue operating.

## 11. Failed QA

After changing the canonical QA run to `FAILED`, a new HTTP release request
returned HTTP 403 `RELEASE_GATE_DENIED`; no delivery invocation occurred.

## 12. Wrong Artifact

The gate joins delivery, artifact, QA, and approved review identity. A delivery
with a mismatched or absent artifact cannot satisfy the gate and is denied.

## 13. Unapproved Review

The gate requires `studio_review_submissions.status='APPROVED'`; unapproved
review cannot create a release.

## 14. Missing Entitlement

Org B proved the entitlement-denial case through the real HTTP middleware.

## 15. Provider Failure

The repository-local injected adapter proof persisted attempt 1 as `FAILED` with
`PROVIDER_FAILED` and did not mark the release successful.

## 16. Retry

The real PostgreSQL release service persisted attempt 1 `FAILED` followed by
distinct attempt 2 `RELEASED`, with separate attempt IDs and preserved history.

## 17. Replay

Replaying the same authenticated release request/idempotency key returned HTTP
200, `idempotent=true`, and the original release. Re-executing a released request
was also idempotent.

## 18. Read Authorization

Authorized Org A read returned HTTP 200 with release and attempt history. Wrong
organization and revoked identity were denied by existing scope/authentication
boundaries.

## 19. Restart Reconstruction

The release state and attempt history are persisted in PostgreSQL and reconstructed
by `GET /studio/releases/:releaseId`; no process-memory state is authoritative.

## 20. PostgreSQL / HTTP Agreement

HTTP and PostgreSQL agreed on release ID, artifact ID, content hash, provider
reference, terminal `RELEASED` status, and one canonical attempt for the HTTP
happy path. The retry fixture retained both failed and successful attempts.

## 21. Rollback Classification

**N/A — TEST DELIVERY TARGET HAS NO CANONICAL ROLLBACK OPERATION.** Production
rollback remains future provider-specific work.

## 22. WF-049 Boundary

WF-049 remains `BLOCKED — EXTERNAL DEPENDENCY` because no production Registry
provider is available. No Registry or production/public delivery was claimed.

## 23. Regression

PASS: release contract tests, ARAG release-assurance tests, QA/workspace focused
tests, API typecheck, API build, root build, manifest validation, UI validation,
migration status, schema integrity, and `git diff --check`. Existing build
chunk-size/dynamic-import warnings remain non-blocking.

## 24. Failure Classification

- Initial route 404 before API rebuild: **HARNESS/BUILD STATE**, corrected by API build.
- Entitlement absence before fixture provisioning: **FIXTURE**, corrected through canonical entitlement service.
- PostgreSQL mmap startup requirement: **ENVIRONMENT**, handled using the established cluster configuration.
- WF-049 production provider: **EXTERNAL DEPENDENCY**.

## 25. Files Created

- `apps/shs-api/migrations/127_studio_release_foundation.sql`
- `apps/shs-api/src/domain/deployment/service/studio-release-service.ts`
- `apps/shs-api/src/domain/deployment/api/release-routes.ts`
- `apps/shs-api/tests/studio-release-contract.test.ts`
- this report

## 26. Files Modified

- Studio finalization and artifact binding
- Website deployment artifact materialization
- API router
- Workflow Registry, Dependency Graph, Roadmap
- SYS-5C foundation report

## 27. Owner Work Preservation

Owner work was preserved. No reset, stash, clean, rebase, force checkout, commit,
push, unrelated deletion, production database access, or cloud provisioning was
performed.

## 28. WF-030 Decision

**WF-030 COMPLETE** for the repository-local approval-gated TEST release
foundation and authenticated HTTP contract.

## 29. Remaining SYS-5 Work

WF-027 and WF-029 remain acceptance gaps. WF-049 remains externally blocked.
Production/public provider delivery and rollback are not claimed by this phase.

## 30. Next Phase

The next dependency-ranked SYS-5 work is the separate WF-027/WF-029 acceptance
sequence identified by the roadmap. It was not started.
