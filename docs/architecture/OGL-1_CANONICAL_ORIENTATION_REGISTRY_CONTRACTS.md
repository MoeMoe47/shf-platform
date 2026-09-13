# OGL-1 CANONICAL ORIENTATION REGISTRY & CONTRACTS

**Phase:** OGL-1
**Date:** 2026-09-12
**Repository:** `/Users/mikeslate/Projects/shrv1`
**Branch:** `studio-v1-plus-development`
**Starting HEAD:** `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
**Migration head:** 138

## 1. Executive Result

OGL-1 establishes a static, validated canonical Orientation Contract and
registry foundation. It references the existing Universe destination registry,
uses audience metadata without becoming an authorization source, preserves
DGAL and Companion references, and supplies provider-neutral tour, checklist,
safe-action, accessibility, lifecycle, version, and reorientation metadata.

Four representative contracts validate: Curriculum student, CivicSure
provider, Agent Fabric operator, and Career learner. Both existing tour shapes
map through bounded adapters. No runtime was replaced, no user orientation
state was persisted, and OGL-2 context resolution was not started.

## 2. Repository Baseline

HEAD was the completed DGAL checkpoint `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`,
tagged `dgal-program-complete-2026-09-12`, and remains the current branch tip.
The HEAD is equal to the DGAL checkpoint. Migration 138 remains current.

Pre-existing worktree files were preserved: test-results metadata and snapshot
changes, temporary scripts, `apps/shs-api/var/`, `audit-output/`, and the
OGL-0 report. No pre-existing owner work was reverted.

## 3. OGL-1 Gap IDs

| Gap ID | Severity | Finding | OGL-1 Remediation | Acceptance |
|---|---|---|---|---|
| OGL-GAP-001 | P1 | No canonical Orientation Registry or shared Orientation Contract | Added the typed contract, static registry, destination binding, lifecycle, versioning, ownership, capabilities, references, and validator | Registry and invalid-definition tests pass |
| OGL-GAP-005 | P1 | No persistent cross-route/cross-device orientation state or version-aware reorientation | Added version/change/reorientation metadata and explicit future persistence boundary; durable user state remains OGL-3 scope | Contract retains policy and version without claiming runtime persistence |
| OGL-GAP-014 | P3 | Public vs authenticated orientation policy is not shared | Added PUBLIC/AUTHENTICATED/ROLE_SCOPED visibility and Tier A/B/C declarations | Representative public/authenticated classification validates structurally |

OGL-1 closes the registry/contract portion of OGL-GAP-005. Cross-device
experience state and runtime resume remain intentionally assigned to OGL-3.

## 4. Scope Boundaries

Implemented: canonical static definitions, validation, representative
contracts, compatibility adapters, and documentation. Deferred: server
context resolution, runtime consolidation, durable user state, Guidance Center,
full destination rollout, authoring UI, and analytics dashboards.

## 5. Canonical Ownership

OGL owns presentation definitions and experience metadata only. Authentication,
permissions, organization membership, entitlements, workflow state,
acknowledgments, signatures, Evidence, Truth, Legal, Reporting, retention,
service activation, CivicSure decisions, Studio release, ARAG release, and
Agent Fabric execution remain external canonical authorities.

## 6. Existing Destination Authority

`src/pages/universe-v1/universeDestinationRegistry.js` remains the canonical
destination source. OGL validates `destinationId` against that registry and
stores route/action references by identifier. It does not copy destination
URLs into a competing registry.

## 7. Orientation Contract Specification

The contract is implemented in
`src/system/orientation/orientationContract.js`. It uses explicit fields for
identity, audience, purpose, entry modes, capabilities, tours, guidance,
checklists, DGAL, Companion, safe actions, accessibility, telemetry, versioning,
reorientation, and ownership.

## 8. Identity Model

Each contract has `schemaVersion`, stable `orientationId`, stable `slug`,
canonical `destinationId`, `owningService`, and positive integer `version`.
Orientation identifiers are not workflow identifiers.

## 9. Audience Model

Audience metadata contains canonical role references, permission references,
organization-type constraints, and optional experience targeting. Role and
permission strings are references only. They do not authorize access, and no
OGL-local role enum was introduced.

## 10. Capability Model

The bounded capability vocabulary is orientation, guided tour, contextual
guidance, checklist, Guidance Center, documentation, Companion, and
What's Changed. Unknown capability keys fail validation.

## 11. Lifecycle

The lifecycle is `DRAFT -> ACTIVE -> SUPERSEDED -> ARCHIVED`. Historical
definitions remain addressable. Lifecycle state is not Legal approval, workflow
completion, or publication authority.

## 12. Versioning

Versions are positive integers on immutable contract definitions. The registry
rejects duplicate active contracts for the same destination/audience key.
Activating a future version is a later governance operation; it must not mutate
the historical object.

## 13. Reorientation Metadata

`reorientation.policy` supports `NONE`, `OPTIONAL`, `RECOMMENDED`, and
`REQUIRED`, with explicit change triggers. OGL-1 defines policy metadata only;
runtime state and cross-device reorientation are not implemented.

## 14. Destination Binding

Every representative contract binds to an existing Universe destination:
`curriculum`, `civic`, `agent-fabric`, or `career`. The contract supports
route/action references by `destinationId` and canonical `routeId`.

## 15. Ownership Model

Ownership distinguishes destination owner, OGL presentation owner, content
owner, accessibility review, and optional Legal/DGAL owner references. OGL is
the presentation owner in the examples; the service remains content owner.

## 16. Tour Contract

Tours have stable `tourId`, title, description, restartability, skippability,
dismissibility, resumability metadata, accessible alternative reference, and
ordered canonical steps. Runtime-specific React or DOM APIs are not part of
the contract.

## 17. Tour Step Contract

Each step has `stepId`, order, title, body or bounded content reference,
target, missing-anchor policy, accessibility label, and optional future DGAL,
Companion, and safe-action references.

## 18. Target Locator Contract

Targets support `SEMANTIC_ANCHOR`, `ROUTE_TARGET`, and `UNANCHORED`. Semantic
anchors use stable IDs. Route targets use destination and route references.
Arbitrary CSS selectors, executable code, and arbitrary external URLs are not
accepted by the validator.

## 19. Missing-Anchor Policy

Each step declares `SKIP_STEP`, `SHOW_UNANCHORED`, `PAUSE`, `END_TOUR`, or
`REQUIRE_TARGET`. Runtime behavior remains OGL-3 work; the canonical contract
prevents an undefined fallback.

## 20. Checklist Contract

Checklist items have stable IDs, instructional labels, required/optional
classification, canonical `sourceRef`, explicit `completionSource`, and safe
action references. The contract can present next actions without owning their
completion.

## 21. Completion Source Contract

Allowed completion sources are `DOMAIN_STATE`, `DGAL_REQUIREMENT`,
`DOCUMENT_ACKNOWLEDGMENT`, `SIGNATURE_STATE`, and `USER_EXPERIENCE_STATE`.
The representative checklist uses domain or DGAL sources; experience state is
kept distinct from institutional completion.

## 22. DGAL Reference Contract

DGAL associations are bounded `{ kind, id }` references such as
`DGAL_GUIDANCE`, `DGAL_DOCUMENT`, and `DGAL_REQUIREMENT`. OGL does not copy
DGAL content bodies or redefine DGAL requirements.

## 23. Companion Contract

Companion metadata declares `enabled`, suggested topics, and `readOnly: true`.
It may later receive current orientation, destination, help topic, DGAL
references, and safe action references. It cannot mutate orientation, workflow,
requirement, Evidence, or Truth state.

## 24. Safe Action Contract

Actions are keyed references to semantic targets. Internal navigation requires
destination and route identifiers. The contract has no arbitrary raw internal
URL field, and external links are outside the internal action model.

## 25. Accessibility Contract

Critical experiences explicitly declare keyboard, screen-reader, reduced-motion,
mobile, non-tour alternative, and focus requirements. This is metadata for
OGL-3 runtime acceptance, not a claim that current tours are fully accessible.

## 26. Non-Tour Alternative

Every guided representative contract requires an `accessibleAlternativeRef`.
The reference may point to a guidance article or DGAL guidance item. OGL-3
will implement the equivalent step-list/textual presentation.

## 27. Guidance Center Contract

The contract has a `guidanceCenter` capability and references sufficient for a
future surface containing About, Take/Resume Tour, Next Steps, Documentation,
Common Questions, What's Changed, and Ask Companion. OGL-1 does not build that
surface.

## 28. Public / Authenticated Classification

Contracts declare `PUBLIC`, `AUTHENTICATED`, or `ROLE_SCOPED`. The examples
cover role-scoped and authenticated experiences. Visibility is presentation
metadata and never bypasses route authorization.

## 29. Rollout Tier Model

Contracts declare `TIER_A`, `TIER_B`, or `TIER_C`. Tier A expects the full
orientation/guidance/checklist/DGAL/Companion/alternative stack; Tier B expects
moderate guidance and documentation; Tier C is lightweight orientation/help.
Tier is not security authority.

## 30. Persistence Decision

OGL-1 uses a static module registry. This matches current frontend registry and
tour configuration patterns, avoids a second database authority, and keeps
authoring out of scope. Durable user orientation state and governed authoring
remain later-phase work.

## 31. Database / Migration

No database migration was added. Migration head remains 138. OGL definitions
are not institutional records and do not need a new persistence layer in this
phase.

## 32. API / Registry Surface

The current bounded surface is module-level: `getOrientationContract`,
`listOrientationContracts`, `validateOrientationRegistry`, and
`assertValidOrientationRegistry`. Server context APIs belong to OGL-2; admin
mutation APIs belong to OGL-6.

## 33. Legacy Runtime Adapters

`adaptSharedTourDefinition` maps the shared `TourProvider` step shape. The
`adaptHubTourDefinition` maps Hub page-key/step definitions into the same
provider-neutral shape. Neither runtime was retired or silently changed.

## 34. Registry Validation

Validation checks stable identity, canonical destination, lifecycle, version,
ownership, audience references, capability keys, tier, reorientation policy,
safe targets, tour/step uniqueness, missing-anchor behavior, accessible
alternatives, checklist completion sources, and bounded references. It fails
closed with field-specific errors.

## 35. Representative Contracts

Four contracts were created:

1. Curriculum student dashboard, Tier A, role-scoped.
2. CivicSure provider workspace, Tier A, role-scoped.
3. Agent Fabric operator, Tier A, role-scoped.
4. Career learner, Tier B, authenticated and draft.

They demonstrate distinct roles, services, tiers, DGAL references, Companion
metadata, safe actions, accessible alternatives, tours, and checklist sources.

## 36. Authority Boundaries

Tour completion, orientation state, and checklist presentation cannot update
service workflow completion, DGAL acknowledgment, Evidence, Truth, Legal,
Reporting, retention, entitlements, or execution authority. Audience metadata
does not authorize access.

## 37. Security

The contract rejects arbitrary external URLs in internal target objects and
requires structured semantic/route targets. Copy is plain text or bounded
references; arbitrary executable HTML is not introduced. Organization-scoped
variants are not implemented in OGL-1, avoiding cross-tenant leakage while
leaving explicit org binding for OGL-2/OGL-6.

## 38. Tests

`tests/ogl1OrientationRegistry.test.mjs` contains six focused tests covering
valid contracts, canonical destinations, unsafe target rejection, required
accessible alternatives, both legacy adapters, and experience-state authority
separation. Native `node --test` passed all six tests. The requested
`npx tsx --test` invocation was attempted but blocked before test execution by
the environment's `EPERM` IPC-pipe restriction; this is a harness limitation,
not a product failure.

## 39. Gap Closure Matrix

| OGL Gap ID | Severity | Starting Status | Work Performed | Tests | Final Status |
|---|---|---|---|---|---|
| OGL-GAP-001 | P1 | OPEN | Canonical static registry, contract, destination binding, ownership, lifecycle, and validator | Registry validation; six focused tests | RESOLVED — OGL-1 scope |
| OGL-GAP-005 | P1 | OPEN | Version/change/reorientation metadata and explicit persistence boundary | Version/policy fields validate; authority separation test | RESOLVED — contract foundation; runtime state remains OGL-3 |
| OGL-GAP-014 | P3 | OPEN | Shared visibility and rollout-tier classification | Representative role/tier contract validation | RESOLVED — OGL-1 scope |

OGL-GAP-002 through OGL-GAP-013 except the OGL-1 portion of OGL-GAP-005,
and OGL-GAP-015 remain assigned to later phases and are not marked resolved.

## 40. Files Created

- `src/system/orientation/orientationContract.js`
- `src/system/orientation/orientationRegistry.js`
- `scripts/validate-orientation-registry.mjs`
- `tests/ogl1OrientationRegistry.test.mjs`
- `docs/architecture/OGL-1_CANONICAL_ORIENTATION_REGISTRY_CONTRACTS.md`

## 41. Files Modified

- `package.json` — added the bounded `orientation:validate` script.
- `docs/architecture/OGL-0_SYSTEM_WIDE_ORIENTATION_GUIDANCE_AUDIT.md` — added
  the OGL-1 closure update without changing later-phase statuses.

## 42. Owner Work Preservation

Pre-existing test results, snapshots, temporary scripts, API runtime artifacts,
audit output, and the OGL-0 report were preserved. No reset, clean, stash,
rebase, commit, push, migration edit, runtime replacement, or database change
was performed.

## 43. Validation

Passed:

- `npm run orientation:validate` — 4 contracts.
- `node --test tests/ogl1OrientationRegistry.test.mjs` — 6 passed.
- `npm run manifests:validate`.
- `npm run ui:validate`.
- `npm run check:layers`.
- `npm run check:truth`.
- `npm run check:oracle`.
- `npm run build`.
- `npm run typecheck` where available / API typecheck.
- `git diff --check`.

The exact command results are recorded in the completion response. The `tsx`
test command was attempted and classified as an environment IPC restriction;
the same test file passed with the native Node runner.

## 44. OGL-1 Decision

**COMPLETE.** OGL-GAP-001 and OGL-GAP-014 are closed at OGL-1 scope, and the
registry/version/reorientation contract portion of OGL-GAP-005 is closed. No
OGL-1 P0 or P1 defect remains. OGL-2 context resolution has not started.

## 45. Exact Next Phase

**OGL-2 — CONTEXT & GUIDANCE RESOLVER**
