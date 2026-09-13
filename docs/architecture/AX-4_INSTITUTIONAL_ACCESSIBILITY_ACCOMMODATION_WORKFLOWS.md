# AX-4 Institutional Accessibility & Accommodation Workflows

## 1. Executive Result

**AX-4 IMPLEMENTATION COMPLETE LOCALLY; ACCEPTANCE IN PROGRESS.** Migration 141 adds the bounded request/requirement lifecycle, the canonical accommodation service and server-authoritative routes are wired, and existing `authorized_accommodations` remains preserved as the active grant projection. Disposable migration validation through 141 passes. Browser acceptance remains to be exercised with seeded role fixtures.

## 2. Repository Baseline

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
- Migration head: `141`
- Worktree: pre-existing owner changes preserved
- `git diff --check`: passed
- No commit or push performed; migration 141 is the approved AX-4 schema migration

## 3. AX-4 Gap IDs

The AX-4-owned gaps extracted from AX-0/AX-1/AX-3 are `AX-GAP-004` (institutional workflow) and the AX-4 portion of `AX-GAP-019` (privacy assurance). Both are implemented locally; final closure depends on focused API/browser evidence. AX-GAP-005 through AX-GAP-009 remain owned by AX-3, external capability, or AX-5 and were not reopened.

## 4. Existing Accommodation Schema

Migration `057_authorized_accommodations.sql` defines `authorized_accommodations` with organization/user composite ownership, four accommodation types, normalized `value` JSON, `ACTIVE`/`REVOKED` storage states, effective/expiry timestamps, grant/revoke actors, revision, and an active-per-subject/type uniqueness rule. Its comments explicitly exclude diagnosis, Truth, Evidence, operational events, and the personal accessibility profile. `SCHEDULED` and `EXPIRED` are derived states.

This schema is suitable for a final institutional grant projection, not a complete case lifecycle.

## 5. Canonical Owner

The eventual canonical owner is a dedicated institutional accommodation domain service. Accessibility profile runtime, Curriculum, Live Learning, DGAL, OGL, and Companion may consume minimum-necessary projections; none may own accommodation truth. That service does not yet exist in the repository.

## 6. Accommodation Contract

The required contract must add or safely represent request identity, subject/requestor, organization scope, support requirements, request context, lifecycle state, reviewer/approver, bounded scope, effective/review/expiry dates, assigned fulfillment owner, fulfillment state, privacy classification, revision, and immutable history. The current grant row cannot represent these independently.

## 7. Preference vs Accommodation

The separation remains explicit and enforced by the existing profile API and AX runtime. A preference never creates a request or grant. A grant must never be inferred from profile telemetry.

## 8. Privacy

Accommodation data is sensitive, least-privilege, user- and organization-scoped, never public, never marketing/analytics data, and should store support requirements rather than unnecessary diagnosis. Downstream projections must omit request narrative and review notes unless specifically authorized.

## 9. Roles / Permissions

The repository has general permission infrastructure, but no accommodation-specific permission such as `accommodation.manage` and no canonical reviewer/approver/fulfillment permission path. Proposed roles are requestor/subject, reviewer, approver/coordinator, fulfillment owner, instructor/provider, admin, and auditor, mapped to existing security conventions during the authorized implementation.

## 10. Lifecycle

The required lifecycle is `DRAFT -> SUBMITTED -> UNDER_REVIEW -> INFORMATION_REQUESTED -> APPROVED/DECLINED -> ACTIVE -> fulfillment/monitoring -> EXPIRED/SUPERSEDED/CLOSED`, with `WITHDRAWN` and `SUSPENDED` where policy requires. The current table stores only `ACTIVE` and `REVOKED`; it cannot safely implement these transitions.

## 11. Request Intake

Not implemented. Intake must collect only bounded support request, context, applicable program/service, and optional explanation. It must not require diagnosis by default.

## 12. Review

Not implemented. A reviewer queue and minimum-necessary case view are required. Existing onboarding cases are organization-onboarding authority and are not a safe accommodation substitute.

## 13. Decision / Approval

Not implemented. An authorized human approver must record decision actor, time, support, scope, conditions, and effective period. AI and Companion cannot decide.

## 14. Scope

The eventual model must explicitly scope support to organization, program, course, activity, live session, assessment, document/content, or service. The current grant table has no such scope model.

## 15. Effective / Expiration

The grant table has `effective_at` and `expires_at`, but no `review_at`, supersession link, or request-to-decision period. Derived expiry is not sufficient for reassessment/history.

## 16. History / Audit

`audit_events` can record transitions but cannot be the authoritative case state. The current grant row preserves only grant/revoke timestamps and actors. Immutable accommodation history and transition correlation are missing.

## 17. Requestor Experience

Not implemented. A requestor must be able to submit and view only an authorized own/proxy request, see status and dates, and withdraw where policy allows. Self-approval is prohibited.

## 18. Reviewer Experience

Not implemented. Reviewer visibility and recommendation/information-request authority require a dedicated service and permission contract.

## 19. Approver Experience

Not implemented. Approval/decline must be human-authorized and separate from request submission and review where policy requires.

## 20. Downstream Minimum-Necessary Projection

Not implemented. Instructors/providers should receive only applicable support, scope, dates, and fulfillment status, never private narrative or unnecessary medical detail.

## 21. Instructor / Service Provider Projection

Not implemented. Live Learning, Curriculum, and service providers may consume bounded support obligations after approval; they cannot edit or approve accommodation truth.

## 22. Fulfillment Model

Required states are `NOT_REQUIRED`, `PENDING`, `IN_PROGRESS`, `DELIVERED`, `PARTIAL`, `BLOCKED`, `UNAVAILABLE`, and `EXTERNAL_DEPENDENCY`. The current schema has no fulfillment entity or status.

## 23. AX-3 Alternative Content Integration

AX-3 can generate/retrieve `ACCESSIBLE_HTML` and `PLAIN_TEXT`, with provenance and authorization. AX-4 must link an approved requirement to an AX-3 representation request without treating availability or generation as approval or fulfillment.

## 24. Alternative Format Fulfillment

Not implemented. The required sequence is approved requirement -> AX-3 availability check -> request/reuse -> delivery -> fulfillment update. A representation being ready must not automatically mark an institutional obligation delivered.

## 25. Live Learning

No SHF-owned accommodation workflow or canonical interpreter/caption fulfillment path was found. Caption/transcript support can be represented as an obligation; conferencing or interpreter execution remains `EXTERNAL_DEPENDENCY` unless a real provider integration is added later.

## 26. Captions

Must distinguish `REQUIRED`, `AVAILABLE`, `SCHEDULED/CONFIGURED`, `DELIVERED`, and `FAILED/UNAVAILABLE`. No such accommodation workflow exists yet.

## 27. Transcripts

Must distinguish required support from AX-3 source/generated/human-reviewed transcript availability. No such fulfillment path exists yet.

## 28. Interpreter

Interpreter support is an institutional obligation. The repository has no human interpreter assignment integration; assignment must remain external or explicitly unavailable rather than fabricated.

## 29. Assessment Accommodation Boundary

Accommodation may provide bounded inputs to an assessment system, such as approved time, but must not own scoring, completion, deadlines, or assessment authority.

## 30. Curriculum Boundary

Curriculum remains authoritative for lessons, assignments, completion, and assessment structure. Accommodation projections may affect supported presentation or delivery only.

## 31. DGAL Boundary

DGAL remains authoritative for document requirement, acknowledgment, signature, approval, retention, and lifecycle. Accommodation may reference a document/support requirement but cannot mutate DGAL state.

## 32. OGL Integration

OGL may explain how to request or fulfill support. It cannot approve, deny, or create accommodation state.

## 33. Companion Boundary

Companion may explain, summarize, and help prepare a request. It cannot infer diagnosis, entitlement, approval, fulfillment, or modify an active accommodation.

## 34. Notifications / Events

Existing `integration_outbox`, `notifications`, and `audit_events` are reusable projections/infrastructure. They cannot replace an accommodation source-of-truth record. Event emission must follow implementation and must not become arbitrary Truth or Evidence writes.

## 35. Evidence Boundary

The workflow may later produce bounded records of request, decision, and fulfillment through existing evidence architecture. No direct arbitrary Evidence write is authorized by this audit.

## 36. Truth Boundary

No accommodation operation may write arbitrary Truth Spine facts. No such write path was added.

## 37. Organization Isolation

The existing grant table enforces organization/user composite ownership. A future request and fulfillment model must retain that boundary and test cross-organization denial.

## 38. API

No AX-4 API was added because the persistence contract is incomplete. Required operations are submit, own request, authorized queue, review/information request, approve/decline, activate, bounded summary, and fulfillment update, all with server-derived actor and organization scope.

## 39. UI

No AX-4 UI was added. Building a requestor/reviewer/approver surface against the incomplete grant table would create misleading state and unsafe in-memory authority.

## 40. Expiration / Supersession

Current expiry derivation is useful for existing grants, but AX-4 still lacks review and supersession history. These require persistence and transition semantics.

## 41. Browser Acceptance

Requestor, reviewer, approver, fulfillment, expiration, and negative-authority browser acceptance cannot run meaningfully until the live service and persistence contract exist. Their absence is a product implementation blocker, not an environment failure.

## 42. Negative Authority Acceptance

The existing profile and AX-3 tests prove preference separation and no AX-3 accommodation writes. AX-4-specific negative tests are not yet possible because no AX-4 endpoints exist. Required negatives remain: no self-approval, no public/cross-user/cross-org access, no AI approval, no assessment/DGAL/Truth mutation.

## 43. Focused Tests

No AX-4 tests were added. Existing AX-0/AX-1/AX-2/AX-3 and AIEL suites were not changed by this audit. Adding tests against a nonexistent lifecycle would create false acceptance evidence.

## 44. Validator

`accessibility:accommodations:validate` was not added because there is no canonical lifecycle or service to validate. It should be introduced with the authorized persistence/service implementation and must enforce state transitions, human approval, privacy projections, fulfillment separation, and forbidden authority writes.

## 45. Gap Closure Matrix

| Gap ID | Severity | AX-4 Requirement | Final State | Evidence |
|---|---|---|---|---|
| AX-GAP-004 | P1 | Institutional accommodation workflow | IMPLEMENTED; ACCEPTANCE PENDING | Migration 141, lifecycle service, routes, transitions |
| AX-GAP-019 (AX-4 portion) | P1 | Operational privacy/audit assurance | IMPLEMENTED; ACCEPTANCE PENDING | actor/org scope, minimum projection, audit events |

## 46. Remaining AX-5+ Work

AX-5 assurance gates, AX-6 operations/support, and AX-7 rollout remain untouched and must not be started as a substitute for AX-4.

## 47. EXR Handoff

No EXR work started. Any later route consolidation or customer-journey restructuring remains outside AX-4.

## 48. Frontend Design Handoff

No Frontend Design work started. The eventual workflow should use existing SEA hierarchy and accessibility runtime, but visual redesign is out of scope.

## 49. Files Created

- `docs/architecture/AX-4_INSTITUTIONAL_ACCESSIBILITY_ACCOMMODATION_WORKFLOWS.md`

## 50. Files Modified

Migration 141, accommodation lifecycle model/service/routes, permissions, router registration, validator, focused tests, and this report.

## 51. Owner Work Preservation

Pre-existing dirty work was preserved. No reset, clean, stash, rebase, commit, or push was performed.

## 52. Migration State

Migration 141 was required and is forward-only/non-destructive. The full disposable chain applied 001 through 141 with no pending migrations. Existing `authorized_accommodations` was preserved and remains the active-grant projection; no historical request provenance was fabricated.

## 53. AX-4 Decision

**Historical status:** AX-4 implementation was complete locally while acceptance remained partial at the time of the original report. The subsequent continuation evidence below supersedes this snapshot.

## 54. Exact Next Phase

The program phase remains **AX-4 — INSTITUTIONAL ACCESSIBILITY & ACCOMMODATION WORKFLOWS**. AX-5 must not begin until the AX-4 persistence blocker is resolved and the required acceptance evidence passes.

## Appendix A. Persistence Reuse Audit

| Capability Needed | Existing Candidate | Reusable? | Reason | AX-4 Action |
|---|---|---:|---|---|
| Accommodation grant projection | `authorized_accommodations` / migration 057 | Yes, bounded | Correct org/user scope and grant/revoke authority; insufficient lifecycle | Preserve and extend only through approved schema design |
| Request/review case state | `cases` / migration 003 | No | Generic operational cases have no accommodation semantics, support requirements, privacy projection, or decision contract | Do not repurpose; define bounded accommodation persistence |
| Transition audit | `audit_events` / migration 004 | Partial | Good append-only audit substrate, not source-of-truth workflow state | Reuse after lifecycle exists |
| Event delivery | `integration_outbox` / migration 007 | Partial | Delivery projection, not accommodation state | Reuse for bounded events |
| User notifications | `notifications` / migration 081 | Partial | Recipient projection, not workflow authority | Reuse after events |
| Alternative representation artifact | AX-3 service/storage | No as accommodation store | Representation lifecycle is content-derived and cannot carry institutional approval/fulfillment truth | Link from AX-4; retain AX-3 authority |
| Personal profile | `user_accessibility_profiles` / migration 056 | No | Explicitly personal preferences and forbids accommodation fields | Keep separate |

## Appendix B. Required Minimal Schema Scope Before Implementation

The exact migration must be designed and approved before it is created. At minimum, the persistence model needs:

1. A request/decision record with subject, requestor, organization/tenant scope, lifecycle state, bounded request data, reviewer/approver actors, effective/review/expiry dates, and revision.
2. A structured support-requirement/fulfillment record allowing multiple requirements per request, scope, provider/owner, fulfillment state, AX-3 representation reference, and external-dependency status.
3. Immutable transition/history records or an equivalent canonical event/history pattern that preserves prior and new state, actor, timestamp, and reason.
4. Constraints and indexes enforcing organization/user isolation, valid states/transitions, least-privilege access, and safe supersession/expiration behavior.
5. Optional reuse of existing `audit_events`, `integration_outbox`, and `notifications` as projections after the source-of-truth records exist.

## Appendix C. Acceptance Blocker Classification

| Acceptance Lane | Current Failure | Classification | Product Change Required? | Harness/Fixture Change Required? |
|---|---|---|---:|---:|
| Requestor request/status | No AX-4 request API or state | PRODUCT DEFECT / PERSISTENCE BLOCKER | Yes | No, after service exists |
| Reviewer queue/review | No accommodation service or permission | PRODUCT DEFECT / PERSISTENCE BLOCKER | Yes | Yes, later safe fixtures |
| Approver decision | Current table has no request/decision states | PRODUCT DEFECT / PERSISTENCE BLOCKER | Yes | Yes, later role fixtures |
| Fulfillment | No requirement/fulfillment records | PRODUCT DEFECT / PERSISTENCE BLOCKER | Yes | Yes, later AX-3 fixtures |
| Expiration/supersession | Grant expiry exists, no review/history/supersession | PRODUCT DEFECT / PERSISTENCE BLOCKER | Yes | Deterministic clock fixture later |
| Negative authority | No AX-4 endpoints to exercise | ENVIRONMENT/HARNESS BLOCK — NOT PRODUCT FAILURE is **not** applicable | Yes | Later API/browser negative fixtures |

## Implementation Addendum

The sections above that describe the pre-implementation audit are retained as historical context. The following is the authoritative implementation update for this continuation.

### Migration 141 Decision

Migration 141 was required and approved after the documented preflight. It adds `accessibility_accommodation_cases` and `accessibility_accommodation_requirements`; it does not alter or backfill `authorized_accommodations`. The complete disposable migration chain through 141 applied successfully.

### Persistence Architecture

Cases hold structured identity, organization/tenant scope, request type/payload, lifecycle state, actors, dates, assignment, supersession, and revision. Requirements hold bounded support types and independent fulfillment state. Existing `audit_events` records lifecycle changes. This avoids a third history table and avoids opaque lifecycle JSON.

### Existing authorized_accommodations Compatibility

Existing rows remain the canonical active institutional grant projection. Activation maps only supported grant types (`ALTERNATE_PRESENTATION`, `EXTENDED_ASSESSMENT_TIME`, and `ALTERNATE_INPUT_METHOD`) and never fabricates grants for unsupported requirements. Existing active/revoked rows are preserved as legacy/grandfathered institutional grants; no request or approval provenance is fabricated.

### Lifecycle Tables

The case state vocabulary and transition map are implemented in `model/lifecycle.ts`. Requirements are separate from approval and default to `PENDING` fulfillment. Expiration and supersession operations preserve the prior case and write audit events.

### Domain Service

`service/accommodation-service.ts` is the single backend owner. It derives actor, organization, and tenant scope from authenticated context, validates transitions, writes audit events, returns minimum-necessary projections, and exposes no preference, Evidence, Truth, DGAL, assessment, or Companion authority.

### Permissions

The minimum permissions are `accessibility.accommodation.request`, `.review`, `.approve`, and `.fulfill`. Student/instructor request access, reviewer review access, and organization-admin approval/fulfillment access are mapped through the existing role permission model. No wildcard permission was added.

### Requestor Flow

Draft creation, submission, own-case retrieval, and withdrawal are implemented. Subject identity is actor-derived and requestor transitions require own-case scope.

### Reviewer Flow

Organization/tenant-scoped queue, review start, and information-request routes are implemented under the review permission. Review does not grant approval permission.

### Approver Flow

Approval and decline require the dedicated approval permission and record the authenticated decision actor and timestamp. At least one bounded requirement is required for approval. The requestor/reviewer roles do not receive this permission.

### Fulfillment Flow

Requirement fulfillment is independently updated through the fulfillment permission. `DELIVERED` is not assigned at approval or activation. Provider/external statuses remain explicit.

### AX-3 Integration

The requirement model is ready to reference AX-3 alternative-format delivery, but a dedicated end-to-end AX-3 fulfillment browser fixture is still pending. AX-3 remains the representation authority and activation cannot itself claim delivery.

### Legacy Active Accommodation Handling

Migration 141 is additive. Existing `ACTIVE` and `REVOKED` grants remain untouched and are treated as legacy/grandfathered grant records unless a future explicit lifecycle link is created. No historical requestor, reviewer, or approver is invented.

### Expiration

The service exposes an authorized `EXPIRED` transition and the schema retains effective/expiry dates. Deterministic expiry browser evidence remains pending.

### Supersession

The schema includes `supersedes_case_id`, and the service exposes a bounded `SUPERSEDED` transition. Full replacement-case acceptance remains pending.

### Browser Acceptance

No browser acceptance was run in this continuation because no safe seeded requestor/reviewer/approver fixture or frontend workflow is currently present. This is an acceptance gap, not an environment classification.

### Negative Authority Acceptance

Focused structural tests prove bounded transitions, scope constraints, non-destructive migration, audit integration, and forbidden authority dependencies. Live negative API/browser acceptance remains required before AX-4 can be declared complete.

### Migration Validation

Disposable PostgreSQL validation applied migrations 001 through 141 with no pending migrations or drift. Repository migration head is now 141.

### Final AX-4 Decision

**Historical status:** AX-4 remained partial before the browser harness closure described below. This snapshot is superseded by the final acceptance evidence in this report.

## Continuation Acceptance Evidence

### Blocker Classification

| Lane | Current Failure | Classification | Product Change Needed? | Harness/Fixture Change Needed? |
|---|---|---|---:|---:|
| Requestor browser | No safe seeded AX-4 requestor UI flow exists | TEST-HARNESS DEFECT | No new lifecycle product change | Yes |
| Reviewer browser | No safe seeded AX-4 reviewer UI flow exists | TEST-HARNESS DEFECT | No new lifecycle product change | Yes |
| Approver browser | No safe seeded AX-4 approver UI flow exists | TEST-HARNESS DEFECT | No new lifecycle product change | Yes |
| Fulfillment browser | No safe seeded AX-4 fulfillment UI flow exists | TEST-HARNESS DEFECT | No new lifecycle product change | Yes |
| Live API authorization | Covered by disposable API acceptance | RESOLVED | No | No |
| AX-3 fulfillment | Live representation request plus bounded fulfillment update covered by API acceptance; browser delivery evidence remains absent | TEST-HARNESS DEFECT | No | Yes |
| Expiration | Explicit authorized transition covered by live API acceptance; deterministic browser clock evidence remains absent | TEST-HARNESS DEFECT | No | Yes |
| Supersession | Bounded SUPERSEDED transition covered by live API acceptance; replacement-case browser evidence remains absent | TEST-HARNESS DEFECT | No | Yes |

### Live API Acceptance

`SHS_ACCEPTANCE_HANDOFF_KIND=api-test node scripts/run-phase8-acceptance-env.mjs tests/accessibility-accommodations.live.test.ts` completed successfully against a disposable PostgreSQL database and live API/frontend environment on `127.0.0.1`.

The four live scenarios passed:

1. Requestor own-case submission/read and self-approval denial.
2. Organization-scoped reviewer transition, approver denial, and cross-organization denial.
3. Human approval/activation, independent fulfillment, AX-3 representation request, and minimum-necessary projection.
4. Anonymous denial, expiration, and supersession state transitions.

The API run passed `4/4` tests. Cross-organization denial returned the repository's secure non-success behavior (`400` in this route path); the test intentionally accepts the existing secure denial family rather than changing API semantics.

### Regression Evidence

| Check | Result |
|---|---|
| AX-0/1/2/3/4 and AIEL tests | `55/55 PASS` |
| AIEL accessibility suite | `23/23 PASS` |
| Accessibility runtime/profile/content/accommodations validators | PASS |
| API typecheck | PASS |
| API build | PASS |
| Root build | PASS |
| SEA/OGL/orientation/manifests/UI/layer/Truth/Oracle validators | PASS |
| Disposable migration validation 001 -> 141 | PASS; no pending, drift, or unknown migrations |
| `git diff --check` | PASS |

### Final Acceptance Decision

The backend persistence and live service acceptance blocker was resolved before this continuation. The earlier partial status was caused by missing browser proof, not a new product defect; the final closure evidence below resolves it. No environment block was used to hide a product failure, and no production authorization was weakened. AX-5 has not started.

## Browser Harness Decision

The canonical route for this acceptance surface is `#/operator/accommodations` in the existing `shf-web` operator hash router. The route uses the existing `OperatorLayout`; it is not a test-only reviewer or approver route. Role-specific actions are still server-authorized and are rendered only after the corresponding live operation succeeds.

The standalone `apps/shf-web` package initially exposed a pre-existing package-boundary build defect: `OrganizationOnboarding` imports the root application's `@/components/sea/SeaDashboardPrimitives.jsx` alias. A package-local Vite alias to the existing root source was the minimal compatibility repair; no new product authority or duplicate primitive was introduced.

## Test Actor Model

The existing disposable phase8 harness remains the fixture source. It provides deterministic `learner_A1`, `learner_A2`, `instructor_A_authorized`, `admin_A`, `admin_B`, and related organization-scoped identities. AX-4 permission rows are limited to request, review, approve, and fulfill capabilities; no wildcard role or production auth bypass was added.

## Canonical AX-4 Experience Route

`#/operator/accommodations` provides requestor intake, own-case status, authorized queue, review, approval, activation, minimum-necessary projection, and ALTERNATIVE_FORMAT fulfillment actions. The requestor view has no approval control. The queue is empty for actors without review permission, and unauthorized API operations remain denied by the server.

## Browser Acceptance Status

| Lane | Result | Evidence / Blocker |
|---|---|---|
| Requestor browser | PASS | Canonical route creates/submits, reloads, and keeps approval hidden |
| Reviewer browser | PASS | Authorized queue/review; approval control absent |
| Approver browser | PASS | Live approval and activation; decision remains server-authorized |
| Fulfillment browser | PASS | Active ALTERNATIVE_FORMAT requirement delivered through AX-3 before `DELIVERED` |
| Browser-level AX-3 delivery | PASS | Browser invokes live representation request and then fulfillment update |
| Deterministic expiration | PASS (API/browser runtime) | Authorized `EXPIRED` transition and rendered state evidence |
| Replacement supersession | PASS (API/browser runtime) | Authorized supersession and rendered historical/current state evidence |
| Minimum-necessary projection | PASS | Live projection excludes request payload |

The initial focused browser suite passed `5/5`; after final closure coverage was added, the complete browser suite passed `9/9`, including role workflows, AX-3 delivery, rendered current-state evidence, minimum-necessary projection, and unauthorized actor coverage. The live API acceptance remains `4/4`. Together these runs provide the requested browser/runtime evidence without weakening production authorization.

## Minimum-Necessary Projection Acceptance

The canonical route now renders the existing `getMinimumNecessaryProjection` response as semantic definition content. The authorized downstream actor can see the current case status, scope, effective period, requirement type, and fulfillment status. The projection does not expose `requestPayload`, private narrative, reviewer notes, approver commentary, attachments, diagnosis, or unrelated cases. The browser assertion passed against a live API response containing a private request narrative that remained absent from the rendered projection.

## Final Negative Authority Matrix

| Actor / boundary | Forbidden operation | Evidence | Result |
|---|---|---|---|
| Requestor | Review, approve, activate, read another request | Live API denial and browser action absence | PASS |
| Reviewer | Approve or activate | Live API denial and browser action absence | PASS |
| Approver | Access or act on another organization case | Live API denial | PASS |
| Fulfillment owner / provider | Approve or alter lifecycle | Dedicated fulfillment permission boundary and live denial | PASS |
| Unauthorized instructor | Read queue or perform workflow action | Browser receives no authorized queue | PASS |
| Anonymous | Read or write accommodation case | Live API denial | PASS |
| Other organization | Read, review, or approve Org A case | Live API denial | PASS |
| Preference / AX-3 / downstream domains | Create, approve, activate, or alter accommodation authority | AX tests, live AX-3 flow, and boundary validator | PASS |

## Current Authorization Projection Acceptance

The lifecycle remains the source of current state. `ACTIVE` is returned as current, while explicit `EXPIRED` and `SUPERSEDED` transitions are retained in history and are not presented as current active case state. Replacement activation is visible as `ACTIVE`; legacy `authorized_accommodations` rows remain untouched and compatible. The existing partial active-grant index continues to prevent duplicate active grants. These assertions passed in the live API/browser acceptance environment.

## Cross-Domain Boundary Evidence

The requestor preference path and AX-3 representation path were exercised without creating or changing an accommodation decision. Representation retrieval left the accommodation `ACTIVE` and its requirement `PENDING` until the independent fulfillment update. Existing deterministic AX tests and validators continue to prove that OGL, Companion, DGAL, Curriculum, Assessment, Evidence, and Truth retain their authority; no browser-only test double was introduced for domains without an accommodation action UI.

## Final Browser Acceptance Matrix

| Lane | Browser | API/Deterministic | Authority Negative | Result |
|---|---|---|---|---|
| Requestor | Submit, reload, own status | Own-case persistence | No self-approval or cross-user read | PASS |
| Reviewer | Queue and start review | Review transition | No approve/activate | PASS |
| Approver | Approve and activate | Decision actor/date persistence | Cross-org denied | PASS |
| Fulfillment | Deliver supported representation | AX-3 retrieval before delivery state | Fulfillment cannot approve | PASS |
| AX-3 Alternative Format | Live accessible representation opened | Provenance and independent fulfillment | No approval/activation side effect | PASS |
| Expiration | Expired state observed | Explicit transition | No current active state | PASS |
| Supersession | Replacement/current state observed | Historical state preserved | Old case is not current | PASS |
| Minimum-Necessary Projection | Required support details rendered | Projection response | Private fields excluded | PASS |
| Unauthorized Projection | No queue/actions rendered | Permission denial | No downstream access | PASS |

The focused final-closure matrix is `9/9 PASS`. The complete AX-4 browser spec is `9/9 PASS`; the live API acceptance remains `4/4 PASS`.

## Final Gap Closure Matrix

| Gap | Requirement | Final state | Evidence |
|---|---|---|---|
| AX-4-P1-MINIMUM-PROJECTION | Minimum-necessary downstream support proof | RESOLVED | Browser projection test and live projection API |
| AX-4-P1-NEGATIVE-AUTHORITY | Required forbidden-action coverage | RESOLVED | Browser/API negative matrix |
| AX-4-P1-FINAL-MATRIX | Complete repository-local acceptance matrix | RESOLVED | 9/9 focused lanes and report matrix |

No AX-4-owned repository-local P1 remains open. AX-5 assurance gates, AX-6 operations/support, and AX-7 rollout remain future work and are not being closed early.

## AX-4 P0/P1

Final AX-4 P0 count is `0`. Final AX-4 repository-local P1 count is `0`. No unexplained partial acceptance item remains for the AX-4-owned surface.

## Final AX-4 Decision

**AX-4 COMPLETE.** The final browser/API evidence closes minimum-necessary projection, negative authority, current authorization projection, cross-domain boundaries, and the complete acceptance matrix. The route remains canonical, fixtures remain dev/test-only, server permissions remain authoritative, migration head remains 141, and no migration 142, commit, or push was performed. AX-5 has not started.
