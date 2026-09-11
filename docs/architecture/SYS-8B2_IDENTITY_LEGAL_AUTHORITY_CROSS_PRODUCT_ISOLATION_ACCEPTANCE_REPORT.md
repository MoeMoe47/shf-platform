# SYS-8B2 Identity / Legal Authority / Cross-Product Isolation Acceptance

## 1. Executive Result
WF-001, WF-044, and WF-050 passed the current repository-local acceptance contract. No production code or migration was changed.

## 2. Repository Baseline
- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`
- Dirty baseline: 124 tracked files and 190 untracked files; owner work preserved.
- Migration filename and applied head: `130_agent_task_approval_incident_control.sql`, 130.
- PostgreSQL: existing disposable cluster on `127.0.0.1:55445`, accepting connections.
- API: real SHS API on disposable database, port 8108; restarted during acceptance.
- Frontend: existing manifests/build available; no targeted browser consumer is required by these API/domain contracts.

## 3. WF-001 Contract
Authenticated principal and active organization membership resolve through canonical identity middleware; scoped authenticated consumers receive the correct session or denial. Success is an active scoped session; failure is authentication, organization, permission, or revocation denial. The entering gap was live cross-app/session/scope proof.

## 4. WF-044 Contract
A scoped legal authority request creates and transitions a durable legal artifact/decision for an authorized organization actor. Success is a persisted authorized legal state; failure is denied, not found, or revoked/invalid authority. The entering gap was live approve/revoke/audit and cross-domain scope proof.

## 5. WF-050 Contract
An authenticated cross-product composition request resolves only canonical organization-scoped source definitions and consumers. Success is a correctly scoped composition lifecycle; failure is safe denial/not-found. The entering gap was live route/session/data isolation proof.

## 6. Identity Authority
`auth-middleware.ts`, `organization-context.ts`, `permission-guard.ts`, `IdentityRepo`, and `ProductionIdentityRepo` remain canonical. Database-backed development identities were enabled only for this disposable acceptance database; production still requires the production identity provider path.

## 7. Active Organization
`x-shs-organization-id` is checked against active memberships. A user requesting another organization without platform authority received `403 ORG_CONTEXT_FORBIDDEN`.

## 8. Membership
Active membership was required. A revoked identity received `401 AUTH_REQUIRED`; an inactivated same-organization membership was rejected after revocation and did not retain API access.

## 9. Roles / Permissions
Permission guards denied the same-org actor without `identity.view` or `organization.manage` with `403 FORBIDDEN`. Legal and composition writes required `organization.manage`.

## 10. Service Entitlements
The canonical Service Catalog API granted a reporting entitlement to Org B through the provider actor, returned it to Org B, and persisted its `REVOKED` transition. Entitlement state is additive to membership and permission; it does not substitute for either.

## 11. Organization Relationships
The existing relationship authority remained bounded. Source and target organizations may inspect a relationship because they are named parties; an unrelated organization is concealed. Relationship lifecycle transitions are explicit and audited by the existing service.

## 12. Legal / Governance Authority
Legal artifact creation, activation, and decision creation were performed by the scoped Org A actor. The API derives `created_by_user_id`, `approved_by_user_id`, and `actor_user_id` from the authenticated request context; payload authority substitution was not used.

## 13. Owner / Operator / Accountable Org
Existing stewardship tests passed and preserve distinct owner/operator/accountable organization fields. A relationship does not automatically grant unrelated program authority.

## 14. Cross-Product Authority
Composition definitions are owned by the cross-product service and store source references/policies, not source-domain authority. Identity, legal, entitlement, relationship, and composition services each recheck their own scope.

## 15. Global Admin Boundary
No platform-global role was used for the happy path. Ordinary organization actors could not select another organization by request header or query. No new bypass was introduced.

## 16. Org A / Org B Fixture
Fresh database fixture used `sys3a5-org-a`, `sys3a5-org-b`, active users A/B, an unauthorized same-org user, a revoked user, scoped roles, a reporting service, and the canonical entitlement tables. A same-org revocation case was added through the disposable fixture only.

## 17. List Isolation
Org A identity and composition lists contained only Org A records. Org B lists contained only Org B records or an explicitly granted Org B entitlement.

## 18. Direct-ID Isolation
Org B legal lookup of the Org A legal artifact returned `404 LEGAL_ARTIFACT_NOT_FOUND`. The relationship contract intentionally allows a named target party to read its relationship; unrelated-organization concealment is covered by focused tests.

## 19. Create / Update Isolation
Org B could not activate Org A's legal artifact or composition definition. Same-org authorized creation and lifecycle transitions succeeded.

## 20. Tenant Isolation
The active context derives `tenant:<organization_id>` and rejects mismatched tenant/org context. Separate tenant values were not applicable beyond the canonical one-to-one repository mapping.

## 21. Organization ID Substitution
Supplying Org B in the organization header for an Org A identity returned `403 ORG_CONTEXT_FORBIDDEN`; services did not trust the requested organization as authority.

## 22. Actor ID Substitution
The tested write APIs derive actor IDs from `req.user`; no client actor ID was accepted as the acting principal.

## 23. Legal Authority Substitution
Legal decision provenance and actor fields are server-derived from the authenticated user. A cross-org decision attempt was not accepted as an Org A decision.

## 24. Entitlement Substitution
Entitlement grant authority is checked against the service provider/platform authority. Client-provided grant actor fields are rejected by the service contract.

## 25. Membership Revocation
The existing revoked membership returned `401`. A live same-org membership was revoked through `PATCH /identity/memberships/:id/revoke`; a fresh request from that user then returned `401` for `/auth/me` and protected composition access.

## 26. Entitlement Revocation
`POST /organizations/:organizationId/service-entitlements` returned `201`, and the canonical transition endpoint returned `200` with status `REVOKED`. The revoked direct endpoint was not mounted; state remains available through the scoped organization entitlement list and persisted database record.

## 27. Relationship Revocation
Relationship transition to `ENDED` is supported and was exercised. Because both source and target organizations are canonical relationship parties, target-party access is not treated as an isolation failure.

## 28. Role Change
The unauthorized role lacked protected permissions and received `403`. Existing role-permission tests cover removal/absence semantics; no role mutation was needed in this acceptance fixture.

## 29. Fresh Session
Requests used new authenticated HTTP requests with dev-only database-backed identities. Authorization was resolved from PostgreSQL on each request.

## 30. Restart Reconstruction
After API stop/start, `/auth/me`, `/legal/artifacts`, and `/cross-product/compositions` reconstructed persisted state. PostgreSQL retained 5 legal artifacts, 4 composition records, 1 revoked entitlement, and 3 audit events in the disposable scenario.

## 31. Authenticated HTTP
The real API passed the identity, legal, relationship, composition, entitlement, wrong-org, unauthorized, and revoked-member matrix. Representative statuses were 200/201 for allowed operations and 401/403/404 for protected denials.

## 32. Browser Acceptance Decision
`API/DOMAIN ACCEPTANCE IS CANONICAL — BROWSER N/A`. WF-001, WF-044, and WF-050 current registry contracts name authenticated application/domain consumers, not a mounted legal or composition browser workflow. Existing root build and UI validation passed.

## 33. SHF / SHS Boundary
Existing role and organization-context tests preserve separation; this fixture used organization-scoped roles and no SHS platform privilege.

## 34. Studio Boundary
No Studio authority was granted by generic organization access. Studio workspace, QA, review, artifact, and release authorities remain domain-specific.

## 35. Agent Fabric Boundary
No Agent Fabric execution or approval authority was enabled. WF-040 remains intentionally blocked.

## 36. CivicSure Boundary
CivicSure/GPA authority remains in its existing bounded services; cross-product source references do not create CivicSure decisions.

## 37. Funding Boundary
Generic organization and composition access did not grant funding award, obligation, payment, or disbursement authority.

## 38. Education Boundary
Generic identity/organization authority did not grant Outcome, Mastery, Credential, or grade authority.

## 39. Reporting / Public Boundary
Private legal and organization metadata remained authenticated and scoped. Public disclosure authority remains separate from organization administration.

## 40. Evidence Boundary
Identity and authorization outcomes remain operational/audit facts and do not self-create verified Evidence.

## 41. Truth Boundary
No generic identity, legal, or composition route writes arbitrary Truth facts.

## 42. Audit
Membership and entitlement transitions wrote canonical audit records. Legal and composition state remained durable with actor/timestamp fields. Existing legal runtime is metadata-only and does not claim legal advice or external enforceability. The legal decision scope check now prevents an actor from attaching a decision to an artifact outside the active organization/tenant.

## 43. Denial Audit
Denied requests returned bounded error envelopes/codes without payload leakage. Existing audit helper coverage records material membership, entitlement, and relationship transitions.

## 44. Error Safety
Wrong-org legal direct-ID returned a safe not-found response. Permission and organization-context responses exposed only bounded denial codes/messages.

## 45. Replay
Repeated entitlement grant returned `200` replay semantics rather than a duplicate active entitlement. Composition uniqueness rejected duplicate key/version records; lifecycle replay behavior is constrained by current state.

## 46. Concurrency / Current Authority Recheck
Focused organization-relationship tests passed atomic/CAS transition checks and stale/spoofed transition denial. Identity is resolved from current membership state on each request.

## 47. Fresh PostgreSQL
Database: `shs_sys8b2_20260911`. Migrations 001–130 applied from scratch; pending, drift, and unknown applied migrations were empty. Schema integrity returned `{ "ok": true, "failures": [] }`.

## 48. WF-001 Acceptance
PASS. `/auth/me` resolved User A and organization context; wrong-org context, unauthorized role, revoked membership, and cross-org membership query failed closed; restart reconstruction passed.

## 49. WF-044 Acceptance
PASS for the current scoped legal runtime contract. Legal artifact create/read/activate, durable decision creation, wrong-org direct-ID/activation, revoked actor denial, and organization-scoped legal history passed.

## 50. WF-050 Acceptance
PASS. Cross-product composition create/list/activate/retire remained organization-scoped; wrong-org context, wrong-org lifecycle mutation, unauthorized writes, direct relationship misuse, entitlement boundaries, and revoked membership failed closed or followed the named-party relationship contract.

## 51. Regression
Passed after remediation: API typecheck, API build, root build, manifest validation, UI contract validation, focused identity/provider/relationship tests, fresh migration status, schema integrity, and `git diff --check`. The same-org/wrong-org legal decision probe was rerun and passed.

## 52. Failure Classification
The initial cross-org legal decision probe exposed a genuine repository-local authorization defect: `createDecision` did not scope the referenced artifact. Classified PRODUCT DEFECT and fixed with the smallest service-level scope lookup. The service-catalog integration test suite was also run without its required `SHS_TEST_DATABASE_URL` and failed at setup with missing tables in its default database; classified `ENVIRONMENT DEFECT / ACCEPTANCE-HARNESS DEFECT`. One relationship concurrency test skipped for the same missing variable. Root `npm run typecheck` is `N/A — STALE/UNAVAILABLE ROOT CONTRACT`; API typecheck passed.

## 53. Remediation
Added one canonical scope validation in `legal-authority-service.ts`: when a decision references an artifact, the artifact must belong to the actor's active organization and tenant. Cross-org attachment now fails closed. Disposable fixture permissions were corrected to reach the intended identity contract; no migration was added.

## 54. Files Created
`docs/architecture/SYS-8B2_IDENTITY_LEGAL_AUTHORITY_CROSS_PRODUCT_ISOLATION_ACCEPTANCE_REPORT.md`.

## 55. Files Modified
`apps/shs-api/src/domain/legal/service/legal-authority-service.ts`; Workflow Registry, Dependency Graph, Completion Roadmap, and SYS-8B0 closure ledger received current SYS-8B2 status/evidence updates. No migration was added.

## 56. Owner Work Preservation
All pre-existing tracked and untracked owner work was preserved. Temporary acceptance fixture/script files were not treated as repository product changes and are excluded from the status certification.

## 57. WF-001 Decision
`COMPLETE`.

## 58. WF-044 Decision
`COMPLETE` for the current repository-local legal authority/runtime contract after the minimal cross-org artifact-binding remediation and rerun.

## 59. WF-050 Decision
`COMPLETE`.

## 60. Remaining Partial Count
Exactly 11: WF-006, WF-013, WF-014, WF-015, WF-016, WF-017, WF-042, WF-045, WF-046, WF-047, and WF-048.

## 61. Locked Burn-Down
The locked plan remains `15 → 14 → 11 → 8 → 2 → 0`; SYS-8B2 moves the count from 14 to 11.

## 62. Exact Next Phase
`SYS-8B3 — Evidence / Truth / Input Security Acceptance`, targeting WF-015, WF-013, and WF-042. It was not started.
