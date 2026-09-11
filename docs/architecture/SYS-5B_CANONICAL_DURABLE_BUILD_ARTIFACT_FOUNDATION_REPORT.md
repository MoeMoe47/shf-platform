# SYS-5B Canonical Durable Build Artifact Foundation Report

## 1. Executive Result

COMPLETE for WF-028 repository-local artifact authority. Release execution,
public deployment, rollback, and production Registry work remain out of scope.

## 2. Repository Baseline

Path `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`;
HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. The worktree contained
owner changes before this phase and they were preserved. The disposable
PostgreSQL cluster was `/tmp/wf026-pgdata` on port 55445 using mmap shared
memory. API was run on port 8102. No production database, cloud resource,
commit, reset, stash, or cleanup was used.

## 3. WF-028 Entering Gap

SYS-5A identified the absence of a durable object shared by Builder, QA,
Review, and later Release. Workspace revision and Build Packet alone did not
identify an immutable built output.

## 4. Duplicate Authority Audit

| Existing Primitive | Domain | Meaning | Durable? | Immutable? | Reusable for WF-028? |
|---|---|---|---|---|---|
| Builder Workspace | Studio | Mutable current working state | Yes | No | Input only |
| Workspace Revision | Studio | Immutable saved source snapshot | Yes | Yes | Source lineage |
| Build Packet | Studio | Requirements/resources projection | Yes/derived | Snapshot-bound | Provenance input |
| Project Resources | Studio | Assignment/resource context | Yes | Source-specific | Reference only |
| Agent Package | Registry/Agent | Provider-specific package submission | Yes | Yes | No, provider-specific |
| Delivery Record | Studio | Finalized delivery record | Yes | Yes | Downstream only |

No generic reusable artifact authority existed. A Studio-owned artifact table is
therefore the single new authority, separate from all listed primitives.

## 5. Canonical Ownership Decision

Studio owns `studio_build_artifacts` and `BuildArtifactService`. Workspace owns
editable state and revisions; QA and Review retain their own authorities;
Evidence, Truth, Registry, and Release remain separate consumers.

## 6. Build Artifact Semantics

An artifact is an immutable, bounded materialization of one exact workspace
revision. It is not a workspace, Build Packet, QA result, Review submission,
Evidence record, delivery record, or deployment.

## 7. Workspace Revision Relationship

Each artifact stores project, workspace, `workspace_revision`, and
`studio_revision_id`. Revision 1 and revision 2 are retained independently.

## 8. Artifact Identity

`artifact_id` is a stable UUID-backed Studio identifier. The unique source
identity is `(project_id, workspace_revision)` within the scoped project.

## 9. Immutability

There are no artifact update routes. A later workspace revision creates a new
row; the prior row, manifest, hash, and downstream references remain unchanged.

## 10. Artifact Manifest

The bounded JSON manifest contains artifact version/type, project scope,
workspace ID/revision/revision ID, validated work, and source revision hash and
timestamp. Materializer actor and database creation time are metadata, not
identity inputs.

## 11. Integrity / Hash

The manifest receives a SHA-256 content hash. Live acceptance recomputed the
hash from the stored canonical manifest and confirmed stable replay for the
same source revision and a different fingerprint for revision 2.

## 12. Storage Boundary

Current repository-local content is the bounded manifest in PostgreSQL. No
binary/blob provider or Azure dependency was introduced. A future physical
storage locator can be added without changing artifact authority.

## 13. Organization / Tenant Scope

Rows have organization and tenant scope, tenant/org checks, scoped foreign-key
lineage, and scoped queries. Cross-organization reads are fail-closed.

## 14. Producer Authority

Materialization requires Studio project update permission and project owner,
active team membership, or admin scope. The API does not accept arbitrary
artifact metadata from clients.

## 15. Agent Fabric Boundary

Agent Fabric is not enabled or used as the producer. Any future agent-assisted
build must call the canonical Studio materializer under its own approved
authority.

## 16. Artifact Materialization

`POST /studio/projects/:projectId/artifacts` validates project/workspace/revision,
loads the immutable revision snapshot, validates work, persists the manifest,
and returns the stable artifact identity.

## 17. Stale Revision Semantics

An authorized actor may materialize any retained, scoped revision by explicit
revision number. A missing or invalid revision fails closed; current workspace
mutation is never used as a substitute for historical source.

## 18. Duplicate Materialization

The same project revision returns the existing artifact with `idempotent: true`.
A conflicting identity cannot overwrite the source artifact.

## 19. Artifact History

Live PostgreSQL retained Artifact A for revision 1 and Artifact B for revision
2, with both manifests and hashes intact.

## 20. Build Packet Relationship

Build Packet remains the requirements/resource projection used by QA. Artifact
materialization does not copy or replace its authority; artifact provenance is
the exact workspace revision used alongside that context.

## 21. Project Resources Relationship

Resources remain governed by the existing Studio resource boundary. The artifact
does not embed unrestricted resource content.

## 22. QA Integration

`studio_qa_runs.artifact_id` is populated by the existing QA workflow. Live QA
on revision 2 returned and persisted the exact Artifact B identity.

## 23. QA Immutability

QA remains revision-bound and historical. Changing the workspace does not alter
the prior run or its artifact reference.

## 24. Review Integration

`studio_review_submissions.artifact_id` now copies the artifact bound to the
passed QA run. Live Review submission returned and persisted Artifact B.

## 25. Review Immutability

Review submissions remain immutable and revision-bound. A later artifact cannot
rewrite an existing submission.

## 26. Rejection / Remediation Seam

Existing rejection/remediation semantics create a later workspace revision and
therefore a new artifact without overwriting the rejected artifact. Full WF-029
rejection acceptance remains separate.

## 27. Evidence Boundary

No Evidence record is created by artifact materialization. Future Evidence may
reference the artifact through its own authority; no Evidence schema was
duplicated.

## 28. Artifact Security

Workspace validation rejects unsupported authority-shaped fields and known
secret-shaped fields in the existing Studio model. Manifest size is constrained
to 300,000 PostgreSQL bytes and content is validated before persistence.

## 29. Database / Migration

Additive migration `126_studio_build_artifacts.sql` created the artifact table
and QA/Review references. Migrations 001-125 were not rewritten.

## 30. Uniqueness / Indexes

The schema enforces artifact primary identity, project/revision uniqueness,
scoped lineage, bounded manifest size, and indexes for scope/revision, QA, and
Review artifact lookup.

## 31. API

Added authenticated create, list, and metadata-read routes. No release or
deployment route was added.

## 32. Authorization

Live API acceptance proved authorized owner access, same-organization admin
access, wrong-student denial, wrong-organization entitlement/scope denial, and
revoked-membership 401 denial.

## 33. Idempotency

Replay of revision-1 materialization returned the original artifact ID and
`idempotent: true`; no second row was created.

## 34. Happy Path

Fresh fixture: project/workspace/revision 1 -> Artifact A -> revision 2 ->
Artifact B -> QA B -> Review B. PostgreSQL and API responses agreed.

## 35. Revision Path

Revision 1 produced `studio_artifact_e60c38d0-6542-4899-b743-b6a41ec7d9d3`.
Revision 2 produced `studio_artifact_5527a595-6c24-4aa7-803f-6882439f97cb`.
Artifact A remained unchanged and QA/Review B referenced Artifact B.

## 36. Wrong Org

Org B access returned `403 SERVICE_ENTITLEMENT_REQUIRED`; scoped artifact lookup
cannot cross organization or tenant boundaries.

## 37. Revoked Membership

After revoking the disposable Student A membership, artifact read and
materialization both returned HTTP 401 `AUTH_REQUIRED`.

## 38. Replay

Replay was stable despite a new request timestamp because the content identity
contains only immutable source material.

## 39. Integrity Proof

Stored manifest, source revision ID/hash, artifact hash, and downstream QA/Review
IDs were queried from PostgreSQL. Hash recomputation is a supported verifier
operation; PostgreSQL acceptance did not require the optional `pgcrypto`
extension.

## 40. Release Contract

WF-030 can consume artifact ID, project, workspace revision, QA reference,
Review approval reference, content hash, and provenance. No release execution
was implemented.

## 41. ARAG-1 Contract

ARAG-1 remains the release assurance authority. It may evaluate the artifact
identity and its QA/Review lineage; it does not own artifact persistence.

## 42. Final Handoff Contract

Later delivery can state unambiguously: artifact X is the exact materialized
workspace revision referenced by the QA and Review records that approved it.

## 43. Browser Decision

**DEFERRED TO SYS-5 UI/ACCEPTANCE — BUILD ARTIFACT FOUNDATION IS API/DOMAIN
CANONICAL.** No artifact-management UI was required to establish WF-028; the
existing Builder/QA/Review UI remains unchanged.

## 44. Performance

Queries use scoped project/revision indexes and bounded JSON. Artifact lookup is
single-row, history is explicitly ordered, and QA/Review references are
indexed. No unbounded payload or query-per-artifact path was introduced.

## 45. Regression

API typecheck and build passed; existing Studio, QA, delivery, deployment, and
ARAG focused contracts passed except one review test blocked by the known
`tsx` IPC `EPERM` harness issue in reviewer routing. The direct rebuilt API
Review path passed. `git diff --check` passed.

## 46. Failure Classification

The PostgreSQL shared-memory startup issue and `tsx` IPC failure are
`ENVIRONMENT/HARNESS`, not product defects. The API authorization and Review
artifact omission found during acceptance were `PRODUCT DEFECT`s and were fixed
with the smallest service changes.

## 47. Files Created

- `apps/shs-api/migrations/126_studio_build_artifacts.sql`
- `apps/shs-api/src/domain/studio/service/studio-build-artifact-service.ts`
- `docs/architecture/SYS-5B_CANONICAL_DURABLE_BUILD_ARTIFACT_FOUNDATION_REPORT.md`

## 48. Files Modified

- `apps/shs-api/src/domain/studio/api/studio-project-routes.ts`
- `apps/shs-api/src/domain/studio/model/studio-qa.ts`
- `apps/shs-api/src/domain/studio/model/studio-review.ts`
- `apps/shs-api/src/domain/studio/service/studio-project-service.ts`
- systemwide Registry, Dependency Graph, Completion Roadmap

## 49. Owner Work Preservation

All pre-existing dirty and untracked owner work was preserved. No commit, reset,
stash, clean, rebase, push, unrelated deletion, production database access,
Azure provisioning, WF-030, or SYS-6 work occurred.

## 50. Workflow Completion Matrix

| Workflow | Trigger | Final Consumer | Success Terminal | Failure Terminal | Live Proven |
|---|---|---|---|---|---|
| WF-028 | Authorized workspace revision materialization | QA/Review artifact reference | Immutable artifact with stable hash | Scoped/invalid/revoked denial | YES, fresh PostgreSQL/API |

## 51. Remaining SYS-5 Work

WF-027: fresh multi-user lifecycle/recovery acceptance. WF-029: full QA/review
rejection/remediation/delivery acceptance. WF-030: production/public release,
rollback, and delivery foundation. WF-049: production Registry provider remains
external.

## 52. Remaining Risks

CRITICAL: none. HIGH: none for WF-028. MEDIUM: artifact browser surfacing and
full downstream QA/Review acceptance remain in later phases. LOW: no Azure-backed
WF-028 workflow exists.

## 53. WF-028 Decision

**WF-028 COMPLETE**

## 54. Next Phase

**SYS-5C — Release Gate / Delivery / Failure / Rollback Foundation** is the
dependency-ranked next phase for WF-030, after the separately scoped WF-027 and
WF-029 acceptance work as ordered by the current roadmap. It was not started.

## Final Verdict

1. Canonical durable artifact authority: YES
2. Distinct Workspace and Build Packet: YES
3. Immutable exact revision/provenance: YES
4. Bounded manifest and verifiable integrity: YES
5. Scope, authorization, revocation, replay: PASS
6. QA and Review exact artifact binding: PASS
7. Evidence, Release, ARAG-1 boundaries: PRESERVED
8. Fresh migration/schema/API acceptance: PASS
9. Browser: deferred to later UI acceptance; not required for this API/domain foundation
10. WF-028: COMPLETE

**SYS-5B CANONICAL DURABLE BUILD ARTIFACT FOUNDATION COMPLETE**
