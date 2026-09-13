# OGL-2 CONTEXT & GUIDANCE RESOLVER

**Phase:** OGL-2
**Date:** 2026-09-12
**Repository:** `/Users/mikeslate/Projects/shrv1`
**Branch:** `studio-v1-plus-development`
**Starting HEAD:** `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
**Migration head:** 138

## 1. Executive Result

OGL-2 adds a deterministic server-side Context & Guidance Resolver and the
authenticated `GET /orientation/context` surface. It resolves the actor and
active organization from authenticated server context, selects OGL-1
orientation metadata by server-held role/permission facts, composes existing
DGAL guidance, accepts bounded domain next-action adapters, and returns a
source-traceable projection for future Tour, Guidance Center, and Companion
consumers.

The resolver is read-only. It does not persist workflow state, create
acknowledgments, write Evidence or Truth, authorize service actions, or replace
domain next-action authorities. No migration was needed.

## 2. Repository Baseline

OGL-2 started at the DGAL checkpoint `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
on `studio-v1-plus-development`; migration 138 remains current. Existing
test-results, snapshots, temporary scripts, API runtime artifacts, audit output,
and OGL documentation work were preserved.

## 3. OGL-2 Gap IDs

| Gap ID | Severity | Finding | OGL-2 Remediation | Acceptance |
|---|---|---|---|---|
| OGL-GAP-002 | P1 | No server-authoritative context resolver | Authenticated resolver derives actor/org/tenant, filters audience, composes DGAL and bounded domain actions | Resolver/API tests and API typecheck |
| OGL-GAP-006 | P1 | No persistent OGL checklist projection | Deterministic checklist projection with explicit completion sources; persistence remains later scope | Checklist/source tests |
| OGL-GAP-009 | P2 | Targets not uniformly reauthorized | Structured safe-action selection, org binding, and server-side scope; execution reauthorization remains runtime scope | Forged-role/org and safe-output tests |
| OGL-GAP-013 | P2 | No bounded experience adaptation | NEW/RETURNING/experience hints and version-aware reorientation projection | Reorientation tests |

OGL-GAP-006, OGL-GAP-009, and OGL-GAP-013 are closed for their OGL-2
composition/resolution portions. Persistent state, runtime target reauthorization,
and system-wide rollout remain assigned to later phases.

## 4. Scope Boundaries

Implemented: deterministic server resolver, source composition, API boundary,
authorization filtering, org scope, partial-source semantics, and focused
acceptance. Deferred: full domain adapter library, persistent experience state,
runtime deep-link execution, Guidance Center UI, Companion runtime integration,
and broad destination rollout.

## 5. Canonical Input Sources

| Context Input | Canonical Owner | Source/API | Resolver Use |
|---|---|---|---|
| Actor identity | Auth middleware / identity | `req.user` | Server actor identity; client cannot replace it |
| Role and permissions | Auth/permission layer | `req.user.roles`, `req.user.permissions` | Audience filtering only; never new authorization |
| Organization/tenant | Organization context middleware | `active_organization_id`, `tenant_id` | Required scope and cache boundary |
| Destination | Universe registry / OGL contract | OGL-1 destination IDs | Selects applicable orientation |
| Route | Current navigation hint | bounded `routeId` query | Context only, not authority |
| Service | OGL contract/domain context | contract service plus bounded hint | Selects DGAL context; contract service wins |
| Workflow | Owning domain | adapter context fields | Presentation context only |
| Requirements | DGAL | `ContextualGuidanceService` | Requirements and guidance |
| Next actions | Owning domains | injected adapter contract | Bounded canonical action projection |
| Companion | Companion contract | OGL-1 metadata | Read-only topics and references |
| Experience state | OGL-1 metadata/client hint | prior version/level hint | Reorientation presentation only |

## 6. Resolver Authority Model

The resolver is a composition and selection authority. It owns no institutional
truth. It may choose which canonical source facts and OGL presentation metadata
to return, but the source domain remains authoritative for every completion,
requirement, document, signature, Evidence, Truth, Legal, Reporting, retention,
activation, review, or execution decision.

## 7. Client Hints vs Server Authority

The client may provide destination, route, service hint, workflow labels,
resource references, requested help topic, experience-level hint, and prior
orientation version. The server ignores client role, permission, organization,
tenant, entitlement, and workflow claims. Actor and organization are derived
from authenticated middleware, and the contract's service context is used for
DGAL resolution.

## 8. Resolver Input Contract

`OrientationResolverHints` is a bounded TypeScript interface. `OrientationActor`
is a server-context interface containing user, organization, tenant, roles, and
permissions. `ResolverDependencies` receives canonical DGAL and domain
next-action readers, making domain adapters injectable without moving their
decision logic into OGL.

## 9. Resolver Pipeline

1. Require authenticated actor and valid organization/tenant scope.
2. Read bounded navigation hints.
3. Select active OGL-1 server-readable contract metadata.
4. Apply server-held role and permission audience matching.
5. Bind the canonical contract service and active organization.
6. Call `ContextualGuidanceService` for DGAL requirements/guidance.
7. Call the relevant domain next-action adapter when supplied.
8. Apply deterministic ordering, deduplication, and responsibility mapping.
9. Apply prior-version and reorientation policy.
10. Return safe structured actions, documentation, Companion, and trace metadata.

## 10. Resolver Output Contract

`OrientationResolution` includes status, scoped context, orientation,
contextual guidance, checklist, documentation, Companion, next actions,
reorientation, source status, and trace. It is semantic data, not JSX or a
component payload.

## 11. Source Traceability

Orientation output retains orientation ID/version and source domain. Guidance
retains DGAL/domain source references. Checklist items retain completion source
and source reference. The trace is safe diagnostic metadata and does not expose
protected document bodies.

## 12. Required / Optional / Waiting / Blocked States

The resolver preserves `REQUIRED`, `OPTIONAL`, `REFERENCE`, `WAITING`,
`BLOCKED`, and `COMPLETED` in checklist projections. DGAL categories are mapped
only at the presentation boundary; no domain status is rewritten.

## 13. Responsibility Model

Domain actions may provide responsibility such as `YOU`, `REVIEWER`, or
`OPERATOR`. Missing responsibility remains absent rather than invented. A
waiting reviewer action is not presented as an action the user must complete.

## 14. Priority / Ordering

The deterministic order is blocked, required, waiting, optional, reference,
then completed, followed by numeric priority and stable ID. Guidance is capped
at 12 items and checklist output at 8 items to prevent a platform-wide dump.

## 15. Audience Resolution

An orientation is selected when the authenticated actor matches a declared
server-held role or permission reference (or the contract has no audience
restriction). Permission checks remain canonical access gates; audience
metadata only selects content. An unmatched role/permission returns `403` at
the API boundary.

## 16. Organization Scope

The active organization and tenant must be present and satisfy
`tenant:<organizationId>`. Invalid or mismatched scope fails closed. The client
cannot select another organization through resolver hints.

## 17. Service Scope

The selected OGL contract owns the service context used for DGAL resolution. A
client service hint is retained only as context input and cannot replace the
contract's service. Multi-service shell resolution remains a later adapter
expansion.

## 18. Workflow Context

Workflow type, stage, resource type, and resource ID are bounded context labels
passed to canonical DGAL/domain readers. OGL does not normalize or persist a
universal workflow state machine.

## 19. Domain Next-Action Adapters

`resolveNextActions(actor, context)` is an injected adapter contract. The
resolver sorts and projects returned facts but never computes student,
onboarding, CivicSure, Studio, Agent Fabric, ARAG, Career, or Curriculum
workflow decisions itself.

## 20. DGAL Integration

The API invokes the existing `ContextualGuidanceService`, preserving DGAL's
requirement resolution, deduplication, safe target handling, and organization
scope. DGAL content and requirement logic are not copied into OGL.

## 21. Companion Projection

The resolver returns current destination/orientation purpose, suggested Companion
topics, documentation references, next actions, status, and safe structured
actions. Companion remains read-only and cannot invoke an untrusted URL or
mutate resolver/domain state.

## 22. Checklist Composition

Checklist output combines injected domain next actions and DGAL guidance. Items
retain required/optional/waiting/blocked state, responsibility, action target,
and source reference. OGL experience-only checklist items are supported by the
contract but are not used to claim institutional completion.

## 23. Completion Sources

Domain actions map to `DOMAIN_STATE`; DGAL guidance maps to
`DGAL_REQUIREMENT`. The resolver does not mark either source complete. OGL
experience completion remains separate and is not persisted in this phase.

## 24. First-Visit Logic

Without a prior version hint, output presentation is
`FIRST_TIME_ORIENTATION`. Resolution itself never records that the user saw or
completed the orientation.

## 25. Returning-User Logic

With the current version already seen, output presentation is
`CONTEXTUAL_GUIDANCE`. The resolver does not force a welcome tour or reduce
required actions.

## 26. Reorientation / Version Logic

An older prior version yields `REORIENTATION` and applies the OGL-1 policy.
`NONE` suppresses the prompt; optional/recommended/required policies affect
presentation priority only. No acknowledgment or workflow requirement is
created.

## 27. What's Changed Projection

When a version changed, the resolver returns prior/current versions, change
classification, policy, and a bounded "What's changed" guidance item. OGL-3/OGL-4
will supply presentation and content details.

## 28. Experience-Level Adaptation

The resolver accepts transparent `NEW`, `EARLY`, `EXPERIENCED`, and `RETURNING`
labels as bounded hints, with first-visit/returning derived from prior version
when no label is supplied. It does not infer competence or create sensitive
behavioral profiles.

## 29. Safe Action Filtering

Only structured contract actions and DGAL's existing safe targets are returned.
The resolver does not construct arbitrary internal URLs. The output is a
projection, not authorization; the destination/action must be reauthorized at
execution.

## 30. Safe Return Targets

Route and resource context is retained in the resolver input and DGAL projection.
OGL-1 route IDs are returned for canonical actions. Runtime route transition and
org-switch reauthorization remain OGL-3 work.

## 31. Deduplication

Items deduplicate by canonical key, then guidance/source ID, preferring lower
priority numbers and retaining related source references where available. A
DGAL/domain duplicate therefore produces one preferred item rather than a
second competing instruction.

## 32. Conflict Resolution

The resolver prefers canonical DGAL/domain source items over presentation-only
duplicates. Material DGAL conflicts remain visible through DGAL's existing
status/unresolved contract; OGL does not silently invent a winner.

## 33. Public vs Authenticated Resolution

The current endpoint is authenticated and requires active organization scope.
Public lightweight orientation is intentionally deferred until a public-safe
resolver contract is added; role-scoped metadata is never returned to an
unauthenticated caller.

## 34. Partial / Unavailable Sources

DGAL failure returns a `PARTIAL` result with documentation status `UNAVAILABLE`
and retains safe orientation metadata. It never renders an empty-success claim.
Missing optional next-action adapters are `NOT_APPLICABLE`; adapter failures
are `PARTIAL`. Invalid auth/org scope fails closed before resolution.

## 35. Caching

No resolver cache was introduced. This avoids stale organization, permission,
workflow, and version projections while context resolution is still small.

## 36. Performance / Fan-Out

The resolver calls only DGAL and an explicitly supplied domain adapter. It does
not fan out across every service or fetch document bodies. Output is bounded to
12 guidance items and 8 checklist items.

## 37. Experience-State Decision

No durable experience-state table was added. The resolver accepts a prior
version hint but does not treat client/session state as authority. Cross-device
resume, durable tour state, and analytics persistence remain OGL-3/OGL-6 work.

## 38. API Surface

`GET /orientation/context` is authenticated and accepts bounded query hints:
destination, route, service/workflow context, resource references, experience
level, requested help topic, and prior orientation version. Actor, org, tenant,
roles, and permissions come from `req.user`.

## 39. Representative Service Slices

The production catalog exposes Curriculum student, CivicSure provider, and
Agent Fabric operator active slices plus a Career draft contract. Tests also
exercise an onboarding contract projection through the same resolver interface.
Studio and DGAL Admin are intentionally deferred to their later rollout/admin
phases rather than invented as new requirements.

## 40. Cross-Role Acceptance

Student, provider, operator/reviewer, and org-admin mismatch cases are covered
by audience filtering tests. A role or permission supplied outside authenticated
server context cannot widen the result.

## 41. Cross-Org Acceptance

The resolver requires organization/tenant consistency and never accepts an org
hint from the client. A mismatched tenant fails with `ORG_CONTEXT_REQUIRED`;
the output always carries the authenticated active organization.

## 42. Permission / Security Acceptance

Tests cover forged role/permission context, unavailable destination, invalid
tenant scope, and structured action output. No arbitrary URL, document body,
protected route metadata, or workflow mutation is emitted.

## 43. Accessibility Metadata Projection

Orientation output carries the OGL-1 accessible alternative reference and
Companion topic references. Keyboard, screen-reader, reduced-motion, mobile,
and focus declarations remain on the canonical OGL-1 contract for OGL-3.

## 44. Telemetry Boundary

The resolver does not emit or persist telemetry. OGL-1 event definitions remain
available for future runtime use and cannot be treated as Evidence or Truth.

## 45. Observability

The result contains bounded source status, selected orientation ID/version, and
source trace. Raw content, sensitive identity details beyond scoped actor ID,
document bodies, and secrets are not logged or returned as diagnostics.

## 46. Tests

`apps/shs-api/tests/ogl2-orientation-context.test.ts` contains eight focused
tests: student composition, forged audience filtering, invalid organization
scope, DGAL degradation, deterministic deduplication/reorientation, and a
test-only onboarding projection, CivicSure provider selection, and Agent
Fabric operator selection. All eight pass with
`npx tsx --test apps/shs-api/tests/ogl2-orientation-context.test.ts`.

## 47. Gap Closure Matrix

| OGL Gap ID | Severity | Starting Status | Work Performed | Tests | Final Status |
|---|---|---|---|---|---|
| OGL-GAP-002 | P1 | OPEN | Server actor/org context, audience filtering, DGAL composition, resolver endpoint | Six resolver tests; API typecheck | RESOLVED — OGL-2 scope |
| OGL-GAP-006 | P1 | OPEN | Bounded checklist projection with canonical source references and completion-source mapping | Composition/checklist tests | RESOLVED — resolver projection; persistence/UI later |
| OGL-GAP-009 | P2 | OPEN | Structured action selection, scope binding, and filtered targets | Forged audience/org/action tests | RESOLVED — resolver selection; runtime reauthorization later |
| OGL-GAP-013 | P2 | OPEN | Transparent experience hints and version-aware reorientation output | Reorientation test | RESOLVED — bounded resolver scope; rollout later |

## 48. Files Created

- `apps/shs-api/src/domain/orientation/model/orientation-resolver.ts`
- `apps/shs-api/src/domain/orientation/service/orientation-context-service.ts`
- `apps/shs-api/src/domain/orientation/api/routes.ts`
- `apps/shs-api/tests/ogl2-orientation-context.test.ts`
- `docs/architecture/OGL-2_CONTEXT_GUIDANCE_RESOLVER.md`

## 49. Files Modified

- `apps/shs-api/src/api/router.ts` — registered the bounded resolver endpoint.
- `src/system/orientation/orientationRegistry.js` — corrected representative
  permission references to existing canonical permission vocabulary.
- `docs/architecture/OGL-0_SYSTEM_WIDE_ORIENTATION_GUIDANCE_AUDIT.md` — added
  OGL-2 closure status without closing later-phase portions.

## 50. Owner Work Preservation

Pre-existing test results, snapshots, temporary scripts, API runtime artifacts,
audit output, and earlier DGAL/OGL documents were preserved. No reset, clean,
stash, rebase, commit, push, migration, database, or runtime replacement was
performed.

## 51. Validation

Passed:

- `npx tsx --test apps/shs-api/tests/ogl2-orientation-context.test.ts` — 8 passed.
- `npm --prefix apps/shs-api run typecheck`.
- `npm run orientation:validate`.
- `npm run manifests:validate`.
- `npm run ui:validate`.
- `npm run build`.
- `npm run check:layers`.
- `npm run check:truth`.
- `npm run check:oracle`.
- `git diff --check`.

No migration was added; migration head remains 138.

## 52. OGL-2 Decision

**COMPLETE at OGL-2 scope.** The deterministic server resolver, canonical input
map, source traceability, organization/permission filtering, DGAL composition,
bounded next-action adapters, checklist sources, reorientation metadata, and
honest partial-source behavior are implemented. No OGL-2 P0 or P1 defect
remains. OGL-3 runtime/accessibility implementation has not started.

## 53. Exact Next Phase

**OGL-3 — PREMIUM TOUR RUNTIME & ACCESSIBLE GUIDANCE PRIMITIVES**
