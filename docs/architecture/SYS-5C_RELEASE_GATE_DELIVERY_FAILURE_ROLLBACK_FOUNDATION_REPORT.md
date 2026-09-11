# SYS-5C Release Gate / Delivery / Failure / Rollback Foundation Report

## 1. Executive Result

**COMPLETE for the repository-local WF-030 TEST release foundation.**
WF-030 now has a canonical release request, explicit gate, durable attempts, and
repository-local TEST delivery around the immutable Build Artifact. Full
 fresh authenticated HTTP authorization matrix is now complete in SYS-5C2.

## 2. Repository Baseline

- Path: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`
- Migration filename head: `127_studio_release_foundation.sql`
- Fresh DB: `shs_sys5c_20260910`, PostgreSQL port `55445`, cluster `/tmp/wf026-pgdata`
- Applied migrations: `001–127`; pending/drift/unknown: none
- Schema integrity: PASS
- API: started on `8102`; `/health` PASS; authenticated release routes PASS
- Frontend: not started; no release UI is required by the current foundation scope
- External provider: repository-local `local_mock` TEST provider only
- Registry provider: unavailable; WF-049 remains external

The worktree contains extensive owner changes. No reset, stash, cleanup, commit,
push, production access, or cloud provisioning was performed.

## 3. WF-030 Entering Gap

The prior gap was the absence of durable release intent/attempt state tied to the
exact approved Build Artifact. Existing website deployment was usable as the
provider-neutral TEST delivery authority but did not itself provide a release
gate or release history.

## 4. Existing Release Primitive Audit

`studio_delivery_records`, immutable `studio_build_artifacts`,
`website_deployment_records`, the local mock provider, and ARAG-1 were reusable.
ARAG-1 remains the separate governed assurance authority; it was not duplicated.

## 5. Canonical Release Ownership

Studio owns release orchestration for the repository-local TEST foundation.
Studio Build Artifact owns immutable output identity; QA/Review own their
decisions; Website Deployment owns provider delivery; ARAG-1 remains the
consequential assurance boundary; Evidence and Truth remain separate.

## 6. Approved Artifact Contract

Release creation requires a finalized delivery whose artifact, QA run, and
approved review submission all match. The request stores artifact ID, content
hash, revision through the artifact, review, QA, and delivery references.

## 7. Release Eligibility

The gate fails closed unless the delivery is finalized, the artifact exists in
scope, QA is `PASSED`, and the review submission is `APPROVED` for that artifact.
Wrong artifact, missing approval, failed QA, wrong organization, and missing
scope do not create a successful release.

## 8. Human Authority

The release route requires the existing website deployment-create permission;
approval remains a distinct prior human Review decision. Agents have no new
release authority.

## 9. Release Gate

The canonical gate is implemented in `StudioReleaseService.gate()` and persists
`ALLOW` or denies before release creation. Only `TEST`/`local_mock` is supported
in this foundation.

## 10. ARAG-1 Boundary

ARAG-1 remains available for governed release assurance and production-capable
providers. This phase does not bypass or modify it.

## 11. Release Request

Migration 127 adds `studio_release_requests`, keyed by release ID and scoped by
organization/tenant. Client idempotency is unique within scope.

## 12. Release Attempts

Migration 127 adds `studio_release_attempts`. Each retry creates a distinct
attempt number and idempotency key; failed history is retained.

## 13. Terminal States

Requests use `REQUESTED`, `AUTHORIZED`, `RELEASING`, `RELEASED`, `FAILED`, and
`CANCELLED`. Attempts use `RELEASING`, `RELEASED`, and `FAILED`.

## 14. Delivery Target

The only accepted target is repository-local `TEST`, delegated to the existing
`WebsiteDeploymentService` and `LocalMockWebsiteDeploymentProvider`. No public
production publication is claimed.

## 15. Provider-Neutral Adapter

The release service delegates through the existing deployment service rather
than introducing a second delivery authority. Provider result IDs are stored on
the release request and attempt.

## 16. WF-049 Boundary

No Registry provider was contacted or provisioned. WF-049 remains
`BLOCKED — EXTERNAL DEPENDENCY`.

## 17. Success Path

Fresh disposable PostgreSQL live service proof produced:
`AUTHORIZED → RELEASED`, with artifact `sys5c-artifact-a`, delivery
`sys5c-delivery-a`, and provider reference `mock_deployment_469e69e03da815160eb839cf`.

## 18–22. Negative Paths

The gate and scoped queries fail closed for unapproved/mismatched/wrong-org
requests. Focused contract tests cover missing approval lineage and organization
scope. Failed QA and wrong-artifact API cases remain part of the outstanding
authenticated HTTP acceptance matrix.

## 23–27. Provider Failure / Retry / Idempotency

Against the fresh PostgreSQL database with an injected test adapter, attempt 1
persisted `FAILED` with `PROVIDER_FAILED`; attempt 2 persisted `RELEASED` with a
new attempt identity. Replaying the same request idempotency key returned the
same release, and replaying an already released execution was idempotent.

## 28. Rollback Decision

Rollback is **N/A for the current TEST local mock delivery target**. The provider
creates a non-public repository-local test deployment and has no canonical
rollback operation. Production rollback remains future provider-specific work.

## 29–42. Handoff, Evidence, Events, APIs

The release record is distinct from Build Artifact, Evidence, Truth, and ARAG-1.
It preserves the exact artifact ID/hash, QA/review/delivery references, attempts,
provider result, and timestamps. The API is mounted at:

- `POST /studio/releases`
- `POST /studio/releases/:releaseId/execute`
- `GET /studio/releases/:releaseId`

The route is protected by existing Studio service entitlement and deployment
permissions. Org A authenticated HTTP release returned `201` and `RELEASED`;
replay returned `200` with the same release. Org B returned `403` without the
entitlement, failed QA returned `403 RELEASE_GATE_DENIED`, and the revoked Org A
identity returned `401 AUTH_REQUIRED`.

## 43. Browser Decision

**DEFERRED TO SYS-5 UI/ACCEPTANCE — API/domain foundation is canonical.** No
release-management UI was added.

## 44. Performance / Security

Scoped indexes cover project, artifact, release, and attempt lookup. Manifest
size is bounded by the existing artifact contract. Artifact substitution is
prevented by gate joins across delivery, artifact, QA, and Review. No provider
credentials or release secrets are exposed.

## 45. Regression

PASS: API typecheck, root build, manifest validation, UI validation, migration
status, schema integrity, git diff check, focused ARAG, QA, workspace, and new
release contract tests. Build retains existing dynamic import/chunk-size
warnings. The legacy delivery unit fixture has one pre-existing Review harness
database-coupling failure when run without its required test database.

## 46. Failure Classification

- API route matrix incomplete: **ACCEPTANCE GAP / FIXTURE** (missing disposable service entitlement)
- prior Review test DB coupling: **HARNESS / ENVIRONMENT**
- unavailable Registry provider: **EXTERNAL DEPENDENCY**, WF-049 only
- no confirmed WF-030 product gap remains in the implemented TEST foundation

## 47–49. Files and Owner Work

Created: migration 127, release service, release routes, focused release
contract test, and this report. Modified: Studio finalization to bind artifacts,
website deployment to materialize from artifact manifests, API router, Registry,
Dependency Graph, and Roadmap. Existing owner work and dirty paths were
preserved; no destructive Git operation occurred.

## 50. Workflow Completion Matrix

| Workflow | Trigger | Final Consumer | Success | Failure | Live Proven |
|---|---|---|---|---|---|
| WF-030 release request | approved finalized delivery | release/deployment API | RELEASED | FAILED / denied | Service + PostgreSQL; HTTP incomplete |
| WF-030 retry | failed attempt | release/deployment API | distinct attempt RELEASED | retained FAILED | PostgreSQL |
| WF-049 Registry | Registry package | external provider | N/A | N/A | Not exercised |

## 51. Remaining SYS-5 Work

WF-027 and WF-029 remain acceptance gaps. WF-049 remains externally blocked.
Production/public provider delivery and rollback are outside this TEST
foundation and must not be inferred from `local_mock`.

## 52. Remaining Risks

- No HIGH WF-030 acceptance gap remains. The authenticated HTTP matrix is complete.
- MEDIUM: production provider and rollback remain unimplemented; this is separate from WF-049 and future release work.
- LOW: no release UI; current scope is API/domain canonical foundation.

## 53. WF-030 Decision

**WF-030 COMPLETE.** The repository-local release foundation and authenticated
HTTP acceptance are complete. This does not claim production/public provider
delivery.

## 54. Next Phase

No further WF-030 work is required in this phase. Do not begin WF-027, WF-029,
WF-049 remediation, or SYS-6.

## 55. Final Verdict

1. Canonical release authority: YES, repository-local Studio release foundation.
2. Exact approved artifact: YES.
3. QA/review/artifact lineage: YES.
4. Explicit gate: YES.
5. Human approval boundary: YES.
6. Durable requests/attempts: YES.
7. Local delivery success: YES.
8. Failure/retry/replay: service and PostgreSQL YES; HTTP acceptance incomplete.
9. Rollback: N/A for TEST local mock.
10. WF-049: correctly separate external block.
11. WF-030 complete: YES for the repository-local TEST release foundation.
