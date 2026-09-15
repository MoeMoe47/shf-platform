# MET-5 Runtime Integration + Protected Entry

Status: Implemented

MET-5 moves the Silicon Heartland Metaverse from browser-visible shell behavior into protected runtime entry backed by server-side authority.

The metaverse still projects access only. It does not create identity, organization membership, curriculum completion, assessment pass, verified outcome, credential, civic authority, economy state, employment eligibility, or presence/chat authority.

## Canonical Authority Map

| Fact | Canonical source | MET-5 status |
| --- | --- | --- |
| Authentication/session | `apps/shs-api/src/auth/auth-middleware.ts`, production `Auth0SessionService` | Found |
| Active organization | `apps/shs-api/src/auth/organization-context.ts`, `auth-response.ts` | Found; required for entry |
| Tenant | `apps/shs-api/src/auth/tenant-context.ts` | Found |
| Membership | Auth session memberships plus `apps/shs-api/src/domain/identity/service/membership-service.ts` | Found; active membership required |
| Roles/permissions | `apps/shs-api/src/auth/security-permissions.ts` and scoped auth projection | Found |
| Service entitlements | `apps/shs-api/src/auth/service-entitlement-guard.ts`, service catalog projection | Found |
| Program enrollment/cohorts | `apps/shs-api/src/domain/enrollments` | Found; Data Center lesson mount reads active enrollment facts |
| Curriculum progress | `apps/shs-api/src/domain/curriculum` learner result/completion surfaces | Found; not mutated by metaverse |
| Assignments | `apps/shs-api/src/domain/assignments` | Found |
| Assessments | Curriculum learner results and completion policy adapters | Found |
| Evidence/outcomes | `apps/shs-api/src/domain/verified-evidence`, prepare/prove and portfolio boundaries | Found; not created by metaverse events |
| Credentials | `apps/shs-api/src/domain/credentials` | Found; not created by metaverse |
| Career pathway/milestone | `apps/shs-api/src/domain/careers`, `journey` milestones | Found |
| SHF Civic | Civic routes exist; dedicated SHF Civic eligibility adapter unresolved | P1 unresolved; fail closed |
| Operational events | `apps/shs-api/src/observability/operational-telemetry.ts` | Reused for bounded operational events |
| API routing | Central `apps/shs-api/src/api/router.ts` route registration | Found |
| Frontend API clients | `src/lib/*/api.js` pattern using `VITE_SHS_API_BASE` | Found |

## API Routes / Contracts

Protected entry API:

- `POST /metaverse/entry`
- `GET /metaverse/entry/:scope/:resourceId`

Request scope:

- `city`
- `district`
- `facility`
- `activity`
- `simulation`

The server derives identity, active organization, membership, role, permissions, entitlements, enrollment, and other facts from server context and canonical adapters. Client-submitted authority fields such as `unlock`, `role`, `enrollment`, `credential`, `civicEligibility`, `organization_id`, or `user_id` are rejected or ignored.

Decision semantics reuse MET-3:

- `AVAILABLE`
- `LOCKED`
- `HIDDEN`
- `RESTRICTED`
- `ASSIGNED`
- `COMPLETED_ACCESSIBLE`
- `TEMPORARILY_UNAVAILABLE`

## Runtime Decision Flow

Authenticated identity -> active organization -> active membership -> scoped roles/permissions -> service entitlement/enrollment/fact adapter -> MET-2 resource resolver -> MET-3 requirements evaluator -> protected entry decision -> optional operational event.

Every protected entry request is rechecked. Projections are short-lived and expire after one minute.

## Resource Validation

Resource identity is resolved by `apps/shs-api/src/domain/metaverse/runtime/metaverse-resource-resolver.ts` against `SILICON_HEARTLAND_CITY_REGISTRY`.

Validation covers:

- city exists
- district exists
- facility exists and belongs to district
- activity exists and belongs to facility/district
- civic sessions use `CIVIC_SESSION_ACCESS`
- simulations use simulation access

Unknown IDs and parent mismatches fail safely.

## Frontend Adapter

`src/system/metaverse/metaverseRuntimeClient.js` is the production runtime adapter. It calls `POST /metaverse/entry` with `credentials: "include"` and no client authority facts.

`MetaverseCityPage` now requests server authority before entering districts, facilities, or activities. Spatial hotspots, list navigator, keyboard flow, and direct route handling use the same protected decision path.

## Dev / Production Behavior

The MET-4 fixture remains only as a development-only rendering fallback:

- disabled when `import.meta.env.PROD` or `MODE === "production"`
- disabled when `VITE_METAVERSE_ENABLE_DEV_UNLOCK_FIXTURE=0`
- cannot grant credentials, mastery, civic eligibility, job eligibility, or production access
- production mode requires the protected API and fails closed if unavailable

## Protected Entry Boundaries

Direct frontend deep links such as `/metaverse/...` mount the metaverse shell only. They do not render activity content without a protected server decision.

Direct API calls are checked by the backend service; route visibility is not treated as security.

## First Activity Mount

Mounted activity:

- District: Data Center
- Facility: Data Center Training Lab
- Activity: `data-center-foundations-introduction`
- Canonical content: `src/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json`
- Mount: `src/components/metaverse/MetaverseActivityMount.jsx`

The mount is read-only and preserves curriculum ownership. It emits operational activity start/exit events only. It does not self-declare completion.

## Activity Boundary

Locked:

- Metaverse entry != activity start
- activity start != completion
- activity completion != assessment pass
- assessment pass != verified outcome
- verified outcome != credential
- credential != employment eligibility

## Operational Events

MET-5 reuses operational telemetry for:

- `metaverse.resource.viewed`
- `metaverse.resource.entered`
- `metaverse.activity.started`
- `metaverse.activity.exited`
- `metaverse.unlock.denied`
- `metaverse.next_action.selected`

These events do not create evidence, verified outcomes, credentials, employment eligibility, civic authority, or economy state.

## Revalidation / Invalidation

MET-5 uses entry-time recheck plus short-lived projections. Required invalidation hooks are documented in the response contract:

- membership revoked
- role revoked
- entitlement revoked
- org suspended
- user suspended
- enrollment removed
- cohort/team change
- assignment change
- course progress update
- assessment result
- credential issuance/revocation
- civic eligibility change

Richer event-driven cache invalidation remains P1.

## SHF Civic

Dedicated SHF Civic eligibility remains unresolved. Civic protected entry fails closed unless a canonical SHF Civic eligibility fact is proven.

CivicSure is not used as civic authority.

## Career Simulation Boundary

Career-related resources remain educational simulations. MET-5 creates no employment claim, payroll state, hiring state, licensure claim, or job eligibility.

## Accessibility

Protected entry works through:

- spatial hotspot selection
- list navigator
- keyboard activation
- screen-reader announced status/notice regions
- reduced-motion shell

Authorization is independent of navigation method.

## Security Coverage

Tests cover forged user/org/role-like client authority, client unlock override, camera state, cross-org attempts, revoked membership, revoked entitlement, org/user suspension, stale projection recheck, direct API request, direct deep link behavior, unknown IDs, parent mismatch, CivicSure exclusion, and unresolved civic fail-closed behavior.

## Browser Acceptance

Run with local API on `8123` and Vite on `5187`.

Verified:

- `/metaverse` loads
- Data Center district enters through the protected API
- Data Center Training Lab enters through the protected API
- Data Center Foundations intro activity remains locked without active enrollment
- no activity content renders without authorization
- direct deep link `/metaverse/data-center/northstar/test` fails closed
- mobile width shell remains visible
- expected 403 for locked activity is handled as a safe locked state

## Migration

Migration created?: No

No durable unlock projection persistence is needed. MET-5 uses stateless server decisions plus short-lived projection expiry.

## P0 / P1 Gaps

P0 gaps: None identified in implemented scope.

P1 gaps:

- Dedicated SHF Civic eligibility adapter
- Richer production cache invalidation/event subscriptions
- Additional protected activity mounts
- Production presence/chat from MET-2B
- Browser acceptance run
