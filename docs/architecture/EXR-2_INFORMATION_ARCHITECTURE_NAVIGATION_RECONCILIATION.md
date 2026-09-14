# EXR-2 — Information Architecture & Navigation Reconciliation

**Status:** COMPLETE
**Worktree:** `/Users/mikeslate/Projects/shrv1-codex`
**Branch:** `codex/exr`
**Baseline:** `95e6833f053da5f9cc501f256f4b8a0a14995dae`
**Migration head:** 142

## 1. Executive Result

EXR-2 establishes a canonical information-architecture registry and descriptive navigation resolver over the EXR-1 contracts. It reconciles public destinations, Hub ownership, organization and role context, entitlement/state exposure, onboarding progression, Accessibility placement, reporting entry, Studio/CivicSure role separation, return behavior, and neutral Notifications placement slots.

The resolver is discoverability-only. It does not grant permissions, mutate workflow state, own notification data, or replace SEA, OGL, DGAL, Accessibility, or source-domain authority.

## 2. Repository Baseline

| Item | Result |
|---|---|
| Worktree | `/Users/mikeslate/Projects/shrv1-codex` |
| Branch | `codex/exr` |
| HEAD | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| Migration head | 142 |
| Main worktree | untouched |
| Claude worktree | untouched |
| Implementation scope | IA registry, resolver, validator, tests, report |

## 3. Dependency / Build Environment

The Codex worktree initially lacked `node_modules` but had `package-lock.json`. `npm ci` was run only in this worktree. It completed without changing `package.json` or `package-lock.json`; `node_modules` remains ignored. The root build now passes.

## 4. EXR-1 Contract Inputs

Consumed `src/system/exr/exrExperienceContracts.js`: 12 role contexts, 13 capability exposure contracts, 9 journey contracts, bounded capability states, next-action sources, return targets, public hierarchy, Hub, Accessibility, reporting, and EXR/Notifications ownership contracts. SEA remains the underlying experience architecture.

## 5. Canonical Destination Hierarchy

| Level | Canonical destinations |
|---|---|
| Public | Foundation → Solutions, Impact, Career public, CivicSure public, OAS, Universe, Store |
| Learner | Student → Calendar/Live Learning, Arcade, Projects/Portfolio, Accessibility Settings; Career remains adjacent |
| Organization | Hub → queue, onboarding, first service, reporting, Executive Command |
| Studio | Studio → QA → Review |
| CivicSure | Provider workspace and Operator queue remain separate |
| Administration | Truth/Oracle inspection and Accessibility Operations remain authorized operator/admin surfaces |
| Shared Help | contextual Help/Companion entry, separate from DGAL and human escalation authority |

The registry contains 30 canonical destination records.

## 6. Public IA

Foundation is the institutional public entry. Solutions is the SHS service-discovery entry. Career, CivicSure public, Impact, OAS, and Store are contextual product/discovery destinations. Universe is optional discovery under Foundation and is not the universal home.

## 7. Foundation / Solutions Boundary

Foundation owns institutional identity, mission, impact, and public app discovery. Solutions owns service discovery, layers, contact, and request-demo intent. They remain distinct destinations with a coordinated hierarchy; no route consolidation was performed.

## 8. Universe Role

Universe is an optional public discovery experience under the Foundation hierarchy. It does not replace Foundation, Solutions, OAS, or product-specific destinations.

## 9. Hub IA

Hub is the SHS/BOS organization operating environment. Its projection requires active organization context and is role-scoped to organization operators, organization administrators, and SHS administrators. It is not a generic ecosystem super-dashboard, SHF platform administration surface, or source-domain workflow authority.

## 10. Organization Context

Authenticated Hub, learner, Studio, and CivicSure destinations declare organization requirements. The resolver accepts an active organization context and returns it as descriptive metadata. Organization switching remains owned by existing identity/context infrastructure; changing organization does not grant entitlement or permission.

## 11. Role Context

Role context is expressed through bounded human-readable role contract IDs and surface-kind allowances. The registry does not expose raw internal role strings as a user-facing authorization mechanism and does not add role switching. Existing membership and server permissions remain authoritative.

## 12. Capability Exposure

The resolver uses EXR-1 states:

| State | IA meaning |
|---|---|
| `HIDDEN` | omit from ordinary navigation |
| `LOCKED` | show only a truthful blocked/prerequisite state where appropriate |
| `PENDING` | show status and next action without implying readiness |
| `VISIBLE` | informational discovery only |
| `AVAILABLE` | authorized projection is ready for the canonical next action |

The registry does not enforce API authorization. Visible navigation is never an access grant.

## 13. Workflow-State Exposure

Destinations declare workflow dependencies such as activated organization, onboarding lifecycle, active work, `QA_REQUIRED`, `IN_REVIEW`, scheduled/live session, and assurance work. The resolver consumes a provided workflow/capability projection and does not infer or mutate domain state.

## 14. Onboarding IA

Onboarding is a workflow/case destination, not a generic dashboard:

`Discovery → Application → Submitted → Under Review → Approved → Activated → First Service Use → Operating`.

Applicant, reviewer, and operator exposure remains role-specific. The first-service destination is `PENDING` before activation and `AVAILABLE` only when the organization is activated and entitled. Full Hub operating work is not exposed prematurely.

## 15. Accessibility Placement / AX-GAP-021

AX-GAP-021 is resolved at IA level without reopening Accessibility:

| Capability | Placement |
|---|---|
| Personal Accessibility | learner account/settings context |
| Institutional Accommodation | learner support or organization workflow |
| Accessibility Help / Companion | shared Help |
| Accessibility Operations | authorized operator/admin navigation |

These remain distinct authorities and are not collapsed into a giant Accessibility destination.

## 16. Reporting IA

Reporting is context-specific: personal progress stays in Curriculum; operational reporting is reached from Hub/Reporting; Executive Command owns executive intelligence; Foundation and CivicSure own public impact/transparency; funder reporting remains in authorized funding contexts; Truth and Oracle remain source-authority inspection surfaces.

## 17. Student IA

Student is the learner dashboard and remains the primary learning entry. Current work, assignment/lesson progress, Career connection, Arcade, Projects, Portfolio, Accessibility Settings, and Help are subordinate/contextual destinations. The resolver does not bury learner work under public or operator navigation.

## 18. Instructor IA

Instructor uses the learner organization context but receives role-specific queue/workflow/detail surfaces. Instructor operations are not treated as learner-only controls or public discovery.

## 19. Career IA

Career remains a recurring learner dashboard. Pathways, opportunities, credentials, skills, projects, and career connections remain contextual destinations; individual pathway/opportunity records are detail surfaces rather than dashboards.

## 20. Studio IA

Studio is a project workspace. QA is a role/state-specific queue and Review is a role/state-specific workflow. Builder, QA, reviewer, and release authority remain distinct. The registry preserves Studio domain authority and does not merge these actions.

## 21. CivicSure IA

CivicSure public is discovery. CivicSure Provider is an assigned evidence workspace. CivicSure Operator is an assurance queue. The resolver projects them to separate actor roles and does not expose provider actions to operators or operator decisions to providers.

## 22. BOS / ARAG / Agent Fabric IA

BOS/Hub is the organization operating context. Agent Fabric is governed operator work. ARAG is a release-assurance workflow/detail surface for authorized actors. Neither becomes an unrestricted launcher or autonomous release authority.

## 23. Help / OGL / Companion

Help is a neutral shared destination. OGL remains orientation/guidance, DGAL remains documentation/agreement guidance, Companion remains bounded assistance, and human support remains escalation. The IA registry places them without merging their authority.

## 24. Notification Placement Slots

The registry defines neutral slots only:

- `NOTIFICATION_BELL_SLOT`
- `ATTENTION_PROJECTION_SLOT`
- `INBOX_DESTINATION_SLOT`

No notification state, persistence, recipient resolution, delivery logic, or notification content was implemented. Notifications later owns those concerns and projects them into EXR-defined slots.

## 25. Alias / Duplicate Route Classification

| Route | Classification | Canonical Target | EXR-3 Action |
|---|---|---|---|
| `/hub/action-queue` | ALIAS_KEEP | `/hub/queue` | usage review before redirect |
| `/hub/referrals` | ALIAS_KEEP | `/hub/lifecycle` | usage review before redirect |
| `/request-demo` | ALIAS_KEEP | Solutions | preserve CTA semantics |
| `/contact` | ALIAS_KEEP | Solutions | preserve CTA semantics |
| `/transparency` | ALIAS_KEEP | blockchain transparency | verify public links |
| `/reports` | DEFER_TO_EXR_3 | `/reporting` | audience/source review |
| `/ops/reports` | DEFER_TO_EXR_3 | `/reporting` | operator acceptance |
| `/admin.html#/builder` | DEFER_TO_EXR_3 | Studio builder | preserve authority during consolidation |
| `/civic.html#/civicsure` | ALIAS_KEEP | `/civicsure` | verify public boundary |
| `/curriculum.html#/accessibility` | CANONICAL | same route | add contextual entry only |

No active route was retired.

## 26. Navigation Registry

`src/system/exr/exrInformationArchitecture.js` is the single EXR-2 IA registry. It contains destination, parent, actor, shell, route, surface kind, navigation group, organization requirement, capability, exposure rule, workflow dependency, Help slot, notification slot, and alias policy. It is an adapter over SEA and existing authority systems.

## 27. Navigation Resolver

`resolveExrNavigation(context)` deterministically projects entries from actor, organization context, capability conditions, capability states, workflow state, and entitlements. It returns descriptive exposure state and an explicit `SERVER_AUTHORITATIVE` marker. It does not check or grant permissions.

## 28. Return / Resume

The resolver preserves the EXR-1 rule: current organization → current role → current work → highest-priority next action. Contextual return targeting remains `CURRENT_WORK`, `ROLE_QUEUE`, `ROLE_DASHBOARD`, or `PUBLIC_DISCOVERY` depending on supplied state.

## 29. Next Action

Next-action authority remains in domain projections, workflow state machines, OGL, or SEA projections. The IA registry only references the source and never infers action from a menu item, notification, route presence, or card.

## 30. Mobile IA

The hierarchy has bounded depth, explicit parent chains, grouped navigation, contextual Help, and a single primary operating destination per role. This provides a viable 375px/tablet/desktop IA structure without changing CSS or performing visual redesign. Responsive polish remains Frontend Design work.

## 31. Accessibility Preservation

Navigation changes are represented semantically through surface kinds, labels, Help slots, and bounded status states. No accessibility runtime or profile architecture changed. Existing keyboard, focus, text-scale, reduced-motion, and semantic contracts remain dependencies for later browser acceptance.

## 32. Authorization Boundary

The resolver is descriptive only. Tests prove public projections omit Hub, unentitled organization capability is hidden, and the result declares server-authoritative authorization. Existing API and route guards remain the actual security boundary.

## 33. EXR / Notifications Boundary

EXR owns shell IA, navigation hierarchy, context placement, page composition, and neutral slots. Notifications owns notification state, recipient projection, bell/inbox behavior, delivery state, and attention data. The branches remain independent; no Claude files were inspected or modified.

## 34. Frontend Design Deferrals

Typography, branding, spacing, focus styling, visual status hierarchy, mobile polish, and component-library redesign remain deferred. EXR-2 made structural IA decisions only.

## 35. Browser Acceptance

No new browser suite was run in EXR-2. The resolver and hierarchy were validated deterministically because this phase changes registry logic, not route implementations. Browser acceptance remains an EXR-5 concern; the full root build passed after dependency installation.

## 36. Focused Tests

`node --test tests/exr-1-experience-contracts.test.mjs tests/exr-2-information-architecture.test.mjs` passed **11/11**. EXR-2 coverage includes public hierarchy, Hub context, capability exposure, Accessibility placement, notification slot boundaries, alias classification, and parent-chain resolution.

## 37. Validator

`npm run exr:ia:validate` passed:

- 30 canonical destinations
- 10 alias classifications
- 6 shell contracts
- public/Hub exposure checks
- notification slot checks
- parent and surface-kind consistency
- Accessibility and reporting placement checks

## 38. P0 / P1 Findings

| Severity | Result |
|---|---|
| P0 | 0 |
| P1 | 0 repository-local EXR-2 implementation defects; later EXR-3/4 work remains planned for consolidation and priority journey implementation |

## 39. EXR-3 Handoff

EXR-3 should apply the alias classifications and approved page dispositions: reporting consolidation, Hub alias cleanup, Studio entry reconciliation, and other merge/split/retirement decisions. No active route should be deleted without usage, ownership, redirect, and browser evidence.

## 40. Files Created

| File | Purpose |
|---|---|
| `src/system/exr/exrInformationArchitecture.js` | canonical IA registry, shell contracts, aliases, resolver |
| `scripts/validate-exr-information-architecture.mjs` | IA validator |
| `tests/exr-2-information-architecture.test.mjs` | focused IA tests |
| `docs/architecture/EXR-2_INFORMATION_ARCHITECTURE_NAVIGATION_RECONCILIATION.md` | phase report |

## 41. Files Modified

| File | Change |
|---|---|
| `package.json` | added `exr:ia:validate` |

No route, navigation component, shell, permission, migration, or notification implementation file was modified.

## 42. Main / Claude Worktree Preservation

Main `/Users/mikeslate/Projects/shrv1` and Claude `/Users/mikeslate/Projects/shrv1-claude` were not modified. Claude’s branch was not inspected for implementation content.

## 43. Migration State

No migration was added. Migration head remains 142.

## 44. EXR-2 Decision

**EXR-2 COMPLETE.** The canonical destination hierarchy, public hierarchy, Hub IA, context model, capability exposure, workflow gating, onboarding composition, Accessibility placement, reporting strategy, Studio/CivicSure role separation, Help placement, neutral notification slots, alias policy, IA registry, navigation resolver, and return contract are implemented and validated.

## 45. Exact Next Phase

**EXR-3 — PAGE CONSOLIDATION / SPLIT / RETIREMENT PLAN**

Do not begin EXR-3 in this run.
