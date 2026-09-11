# SYS-5D WF-027 Multi-User Studio Lifecycle and Recovery Acceptance Report

## 1. Executive Result
**WF-027 COMPLETE.** Fresh PostgreSQL, authenticated HTTP, and mounted
Studio/Builder acceptance proved the canonical multi-user lifecycle and
recovery contract. No production code or migration changed.

## 2. Repository Baseline
Path `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`;
HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. Baseline: 115 tracked dirty,
172 untracked, 287 total. Migration head `127_studio_release_foundation.sql`.
Fresh DB `shs_sys5d_20260910` used disposable PostgreSQL port 55445; API 8103;
frontend 5179. Owner work was preserved.

## 3. WF-027 Entering Gap
`PARTIAL - ACCEPTANCE GAP`: fresh multi-user scope, restart, and recovery
evidence had not been completed.

## 4. Canonical Lifecycle Authority
Studio owns `projects`, Studio teams, Builder Workspace, project revisions,
Project Resources, and Build Packet. Identity, membership, entitlement, QA,
Review, Artifact, and Release remain separate canonical authorities.

## 5. Actor Model
User A was an authorized team lead/learner; User B an authorized team member;
the same-org nonmember had no project membership; Org B was foreign. Active team
members could read and sequentially mutate the team workspace. Nonmembers,
foreign users, and removed members were forbidden.

## 6. Lifecycle States
Repository transitions were used: `DRAFT`, `PLANNING`, `BUILDING`,
`READY_FOR_CHECK`, `CHANGES_REQUIRED`, `READY_FOR_REVIEW`, `APPROVED`,
`DELIVERY_READY`, `DELIVERED`. Valid transition to `BUILDING` persisted;
illegal `DRAFT -> DELIVERED` returned 400.

## 7. Project Start
The fresh acceptance fixture created the Studio team and project through real
authenticated APIs after loading canonical identity prerequisites.

## 8. Second User Access
User B was added through the Studio Team API and resolved the same project and
workspace. No duplicate project/workspace was created.

## 9. Unauthorized User
Same-org nonmember access returned `403 TEAM_MEMBERSHIP_REQUIRED`.

## 10. Wrong Org
Org B access was denied at the protected Studio boundary with
`403 SERVICE_ENTITLEMENT_REQUIRED`; no Org A data was returned.

## 11. Revoked Membership
After User B’s team membership was removed, subsequent protected workspace
access failed closed.

## 12. Project Resources
Authorized API read returned 200 and remained organization/tenant scoped.

## 13. Build Packet
Authorized API read returned 200 for the same project, with honest project and
resource/requirements projection and no completion claim.

## 14. Builder Workspace
One canonical workspace resolved for the team project, with persisted project,
organization, tenant, and current revision.

## 15. Multi-User Read
User A’s saved state was read by User B from backend persistence before removal;
the API suite confirmed identical current revision/state.

## 16. Multi-User Write
Both active team members made sequential authorized writes. No collaborative
merge semantics were added; removal revoked User B’s write access.

## 17. Revision Monotonicity
The run recorded revisions 1 through 4. Revision numbers advanced only through
the server compare-and-set path.

## 18. Stale Revision
Stale save returned HTTP 409 `WORKSPACE_REVISION_CONFLICT`; stale content did
not overwrite the winner.

## 19. Concurrent Update
Near-concurrent saves produced one 200 and one 409, with no silent lost update.

## 20. Replay
Repeated idempotency key returned the same revision response and one persisted
revision row.

## 21. History
Revision history preserved parent links, prior content, attribution, and SHA-256
content hashes.

## 22. Interruption
The API was stopped after state persistence; no process-memory state was used as
authority.

## 23. Restart Recovery
After API restart, HTTP reads reconstructed the same project, workspace, current
revision 4, lifecycle state `BUILDING`, and saved content.

## 24. Partial Failure
Invalid payloads and invalid transitions failed before changing canonical state;
workspace/revision writes use the existing transactional contract.

## 25. API Failure / Recovery
The browser contract showed `Saved` only after a successful response and exposed
a bounded recoverable alert for a simulated API/context failure. Reload after
restart restored the saved server state.

## 26. Fresh Session
Fresh browser contexts and reloads reconstructed state from the API at desktop,
tablet, and mobile widths.

## 27. Second-User Fresh Session
The live API suite proved User B’s authenticated shared-project read before
canonical membership removal, followed by denial after removal.

## 28. Lifecycle Transition
The valid transition to `BUILDING` persisted and was visible in later reads.

## 29. Invalid Transition
`DRAFT -> DELIVERED` was denied with `INVALID_STUDIO_LIFECYCLE_TRANSITION`.

## 30. Authorization Change
Removing team membership immediately changed the next protected request from
allowed to denied. No authorization weakening was used.

## 31. Direct-ID Protection
Direct project IDs did not bypass project, team, organization, entitlement, or
permission checks.

## 32. Build Artifact Non-Regression
WF-028 focused contracts and current artifact routes remained green; artifact
work was not reopened.

## 33. Release Non-Regression
WF-030 release contract tests remained green; no release execution was performed.

## 34. QA / Review Boundary
QA and Review remained separate. The revision suite confirmed review snapshots
stay bound to their submitted revision; WF-029 was not started.

## 35. Events / Handoffs
Existing outbox events included `studio.project.created`,
`studio.handoff.created`, `studio.revision.created`, and
`studio.workspace.updated`, with stable idempotency keys. Team events remain
owned by Studio Team service.

## 36. Suspension / Resume
**N/A — no suspension/resume transition exists in the WF-027 lifecycle model.**

## 37. Terminal Closure
`DELIVERED` exists in the shared lifecycle model, but terminal delivery proof is
owned by completed WF-030 and broad QA/Review closure remains WF-029.

## 38. Fresh PostgreSQL
DB `shs_sys5d_20260910` applied migrations 001-127 with pending, drift, and
unknown all empty. Schema integrity returned `ok: true` with no failures.

## 39. API Acceptance
Project/workspace/resources/packet reads were 200 for authorized User A;
User B was 200 while active; same-org nonmember was 403; foreign org was 403;
removed member was denied. Valid mutation/transition succeeded; stale and
invalid operations were rejected.

## 40. Browser Acceptance
Mounted route: `curriculum.html#/studio/projects/:projectId/build`.
`tests/phase6.2-builder-browser.spec.mjs` passed 7/7, covering save/reload,
type-specific work, stale conflict, mobile/tablet layout, keyboard operation,
and bounded failure UI. `tests/phase12-collaborative-revision-live.spec.mjs`
passed 1/1 against the same fresh DB.

## 41. Browser Recovery
Reload restored saved values from the API. Stale save presented conflict text,
not a false Saved state.

## 42. PostgreSQL / API / Browser Agreement
All layers agreed on project
`studio_project_37b8e483-c2dc-4dc7-8c30-4d751e908d7c`, organization
`phase8_org_a`, workspace
`studio_workspace_c3517340-4a8a-4223-aa1a-60e0f5693902`, `BUILDING`, and
revision 4. PostgreSQL recorded four revision rows.

## 43. Performance
Current workspace/revision queries use scoped indexed predicates. No structural
N+1, unbounded payload, or organization-wide scan defect was observed.

## 44. Accessibility
Labeled controls, keyboard save, semantic status/alert behavior, and mobile and
tablet widths passed. No keyboard trap or color-only lifecycle assertion was
introduced.

## 45. Regression
Passed: multi-user 1/1; Builder browser 7/7; Studio project/workspace/QA/
delivery/release contracts; entitlement regression 9/9 against the migrated
database; API typecheck/build; root build; manifests; UI validation; migration
status; schema integrity; and `git diff --check`. Existing root dynamic-import
and chunk-size warnings remain non-blocking.

## 46. Failure Classification
Initial socket `EPERM` and default-database entitlement test failure were
`ENVIRONMENT`/`HARNESS`; rerun against the fresh migrated DB passed. No product
defect was found.

## 47. Remediation
No production remediation. The disposable `project_studio` service and
entitlement were provisioned through the existing Service Catalog service.

## 48. Files Created
This report.

## 49. Files Modified
Workflow Registry, Dependency Graph, and Completion Roadmap status/addendum.

## 50. Owner Work Preservation
No reset, stash, clean, rebase, checkout, commit, push, migration rewrite,
production access, cloud provisioning, or unrelated deletion occurred.

## 51. WF-027 Decision
**WF-027 COMPLETE**

## 52. Remaining SYS-5 Work
WF-029 remains `PARTIAL - ACCEPTANCE GAP`. WF-049 remains
`BLOCKED - EXTERNAL DEPENDENCY` because the production Registry provider is
unavailable.

## 53. Next Phase
The exact next dependency-ranked phase is **WF-029 QA / Review / Delivery /
Finalize acceptance**. It was not started.
