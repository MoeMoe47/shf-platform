# FE-0 Application Destination & Navigation Assignment Report

## 1. Executive Result

FE-0 is complete for repository-local destination assignment and navigation wiring. The existing Universe destination registry remains the single navigation authority. OAS was promoted from a stale planned record to its existing public `/oas.html` application entry, and the existing Agent Fabric admin control surface was added as an admin-only Universe Directory destination. No new application, backend authority, or frontend redesign was introduced.

CivicSure remains an existing but disconnected `apps/shf-web` package whose explorer pages are explicitly frame/mock surfaces and are not mounted by the active root. It is documented as an orphaned consumer rather than linked as a false live destination.

## 2. Repository Baseline

Repository: `/Users/mikeslate/Projects/shrv1`

Branch: `studio-v1-plus-development`

Starting HEAD: `6320eb4c577b3dba0d6b2c8fcbbc2f1c0611c9fa` (`systemwide-backend-complete-2026-09-11`). The worktree contained seven pre-existing generated/local artifacts; they were not cleaned or staged. The focused browser test also refreshed two tracked local test-result artifacts; those generated files are excluded from FE-0 scope. Intended FE-0 changes are limited to the destination registry, its focused Universe regression, the canonical Universe status note, and this report.

The root Vite build contains the existing multi-page entries, including `index.html`, `universe.html`, `foundation.html`, `solutions.html`, `admin.html`, the learner/product entries, and the OAS pages. The root application has one canonical Universe implementation mounted by both `/` and `/universe.html`.

## 3. Existing App Inventory

| Existing App | Path / Entry | Route or Base | Purpose | Status |
|---|---|---|---|---|
| Universe | `src/pages/universe-v1/UniverseApp.jsx`, `index.html`, `universe.html` | `/universe`, `/` | Ecosystem gateway and directory | LIVE |
| Foundation | `src/entries/foundation.main.jsx` | `/foundation.html` | SHF public and impact surfaces | LIVE |
| SHS / BOS | `src/entries/solutions.main.jsx` | `/solutions.html` | SHS public solutions and operating entry | LIVE |
| SHS Admin / BOS Ops | `src/entries/admin.main.jsx` | `/admin.html` | Authenticated operator/control center | LIVE, AUTHENTICATED |
| Curriculum | `src/entries/curriculum.main.jsx` | `/curriculum.html` | Learning and instructor experience | LIVE |
| Career | `src/entries/career.main.jsx` | `/career.html` | Career planning and opportunities | LIVE |
| Studio | Curriculum entry and `src/router/CurriculumRoutes.jsx` | `/studio` in the curriculum shell | Project, Builder, QA, Review, Release sub-destinations | LIVE, ROLE/ORG SCOPED |
| Civic Lab | `src/entries/civic.main.jsx` | `/civic.html` | Civic learning and participation | LIVE |
| OAS | `src/entries/oas.main.jsx` | `/oas.html` | Open Autonomous Standard public working draft | LIVE, PUBLIC |
| Agent Fabric | `src/pages/admin/agent-fabric/AgentFabricPage.jsx` | `/admin.html#/agent-fabric` | Governed admin/control surface | LIVE, ADMIN ONLY |
| Autonomous Registry | External repository reference | Configured external origin | Registration/provenance authority | EXTERNAL |
| CivicSure explorer package | `apps/shf-web/` | Separate package, not root-mounted | Frame-only public/operator explorer | DISCONNECTED / FRAME ONLY |
| Product apps | `src/entries/*.main.jsx` and matching HTML | Individual MPA entries | Career, curriculum, arcade, civic, finance, employer, treasury, sales, store, AI, allocation, verifier | LIVE |

## 4. Program / Domain Classification

Existing applications are distinguished from programs and shared infrastructure. Studio, Builder, QA, Review, and Release are program/sub-destinations inside the canonical Studio route tree, not duplicate apps. Identity, organizations, relationships, entitlements, Evidence, Truth Spine, Metric Registry, policy, and operational events remain shared infrastructure or admin surfaces and receive no standalone public app.

## 5. Current Destination Map

The canonical map is `src/pages/universe-v1/universeDestinationRegistry.js`. It currently contains 23 evidenced destination records, 22 visible in the directory, and two intentionally unavailable narrative records: AOS and Autonomous Trust Bureau. Lord of Outcomes remains hidden from the public Universe directory because its current public entry is dormant and not a canonical Universe destination.

## 6. Canonical Destination Decisions

The Universe Directory is the ecosystem launcher. Existing product HTML entries remain the primary application homes. Same-origin MPA destinations use hard navigation through `resolveDestinationHref`; independent applications use their configured origin. No competing application registry was created.

## 7. OAS Destination

OAS is an existing public application with `oas.html` and additional OAS-1/control-domain/purpose-boundary/risk pages. Its canonical Universe destination is `open-autonomous-standard`, production path `/oas.html`, public access, and live status. This assignment does not merge OAS authority with SHS, Agent Fabric, Autonomous Registry, or Trust Bureau.

## 8. CivicSure Destination

The existing CivicSure code is in `apps/shf-web`, with public explorer routes such as `#/explorer` and detail routes beneath `#/explorer/...`. Its pages and mock data modules are explicitly frame-only, and the package is not mounted by the active root entry. The canonical currently mounted assurance consumers remain the repository-local Foundation/admin/API surfaces established by SYS-8; FE-0 does not create a broken link or promote the disconnected package to production authority.

## 9. Agent Fabric Destination

Agent Fabric has an existing admin destination at `/admin.html#/agent-fabric`, backed by `src/pages/admin/agent-fabric/AgentFabricPage.jsx` and protected by the existing admin permission gate. It is registered as `agent-fabric` in the Universe Directory with `admin-only` access. Discoverability does not grant execution, approval, MCP, or domain authority.

## 10. Studio Destination

Studio is one canonical application destination at `/studio`, implemented in the curriculum route tree. Builder is `/studio/projects/:projectId/build`; QA, Review, and Release remain domain-owned downstream workflow surfaces and are not promoted to separate top-level apps.

## 11. SHF Destinations

Foundation is `/foundation.html#/top`, with public impact at `/foundation.html#/impact` as the current existing entry. Curriculum, Career, Civic Lab, Arcade, Employer, Treasury, and the other public product entries remain separate existing applications reachable from the directory and Foundation app gallery where already listed.

## 12. SHS / BOS Destinations

The public SHS entry is `/solutions.html#/home`. The authenticated SHS/BOS operating destination is `/admin.html#/ops/executive-command`; shared operator capabilities remain under `/admin.html`, including reporting, identity, Agent Fabric, release assurance, and operational controls.

## 13. Career Destination

Career Center is the existing `/career.html#/` entry. Public discovery, pathways, and opportunities remain inside that application; personal dashboard/planner routes remain authenticated or role-scoped according to the existing Career router.

## 14. Universe / Directory Role

`/universe` is the canonical ecosystem experience and `/universe/directory` is its accessible, fast gateway. Both use the same destination registry. The cinematic Universe was not redesigned.

## 15. Destination Hierarchy

Universe / Directory → Foundation, SHS/BOS, OAS, Autonomous Registry, Agent Fabric (admin-only), Studio, Career, Curriculum, Civic Lab, and the existing product applications. Domain internals remain below their owning app or admin console.

## 16. Entry-Point Classification

Public entries: Universe, Foundation, OAS, Career, Curriculum, Civic Lab, and other existing public product homes. Authenticated/role-scoped entries: Studio, SHS/BOS operations, Agent Fabric, reporting, release assurance, and organization/admin surfaces. Independent external entry: Autonomous Registry, using its configured origin.

## 17. Route Ownership

| Route | App | Owner | Auth |
|---|---|---|---|
| `/universe` | Universe | Universe registry/application | Public |
| `/oas.html` | OAS | OAS | Public |
| `/foundation.html` | Foundation | SHF | Public / route-specific |
| `/solutions.html` | SHS/BOS | SHS | Public or authenticated by route |
| `/admin.html#/agent-fabric` | Agent Fabric | SHS Agent Fabric | Admin permission |
| `/studio` | Studio | Studio/Curriculum | Organization/role scoped |
| `/career.html` | Career | SHF Career | Route-specific |

## 18. Route Collisions

No new collision was introduced. Existing aliases remain: `ledger.html` is a Treasury duplicate entry, `launch.html` reuses Lord of Outcomes components, and `credit.html#/verifier` reuses the Verifier component. These are not separate canonical destinations.

## 19. Legacy Route / Alias Decisions

Preserve existing aliases and deep links. The Universe registry remains the only place where ecosystem destination href resolution is defined. No legacy route was removed.

## 20. Auth Boundaries

Navigation only discovers a destination; it does not authorize access. The Agent Fabric destination remains admin-gated, Studio remains organization/role-scoped, and private admin routes remain under `admin.html`. Public links do not expose private payloads.

## 21. Cross-App Return Paths

Universe destinations carry the existing `returnPath: /universe` contract. OAS and Agent Fabric now use the same return metadata. Existing app-specific return controls were not broadly rewritten.

## 22. Current Navigation Gaps

The material FE-0 gap was stale OAS registry status and missing discoverability for the existing Agent Fabric admin surface. Both are now wired. CivicSure remains a documented disconnected package because no safe mounted production destination exists for it.

## 23. Orphaned Apps

`apps/shf-web` is the only material orphaned/disconnected application package found. It builds independently and has routes, but its explorer is explicitly frame/mock and is not mounted by the active root. It is not safe to expose as a canonical live assurance app in FE-0.

## 24. Orphaned Programs

No repository-local program with a canonical active consumer was left without a destination. OAS and Agent Fabric were resolved. CivicSure's frame-only package remains intentionally unassigned to a live root destination pending a future mounting/consumer decision.

## 25. Shared-Infrastructure Decisions

Identity, organizations, memberships, relationships, entitlements, Evidence, Truth Spine, Metric Registry, policy, events, and audit remain shared infrastructure/admin capabilities. No standalone public apps were created for them.

## 26. Admin Console Decision

The existing admin console is the canonical control center for SHS/BOS operations, Agent Fabric, reporting, Truth, Oracle, release assurance, identity, and audit. Agent Fabric is discoverable as a route within that console, not a new app shell.

## 27. Public Portal Decision

Foundation remains the SHF public portal. OAS remains an independent public standards portal. CivicSure's public explorer package is not promoted because it is not an active canonical consumer. Existing public assurance API/projection paths remain authoritative.

## 28. Naming Consistency

Visible names are preserved from existing applications. The new labels use `Open Autonomous Standard` and `Agent Fabric Control Center`, matching their existing page identities. No broad code rename was attempted.

## 29. Canonical Destination Registry

`universeDestinationRegistry.js` is the canonical ecosystem destination registry. It centralizes availability, access, production paths, return paths, source evidence, and hard-navigation behavior. The separate product manifest registry remains product build metadata, not a competing Universe destination authority.

## 30. Build Manifest Alignment

All newly assigned same-origin paths resolve to existing build inputs: `oas.html` and `admin.html`. The root Vite input already includes both. No new HTML entry or cloud deployment was added.

## 31. User Journey Map

| User | Entry | App | Primary Workflow |
|---|---|---|---|
| Public visitor | `/universe/directory` | Foundation/OAS/product app | Explore public information |
| Student | Curriculum/Career | Curriculum or Career | Learn, practice, plan |
| Instructor | Authenticated Curriculum | Curriculum | Teach and review learning |
| Parent | Existing role route | Curriculum/Career | View permitted learner context |
| SHF admin | Admin link | Foundation/admin | Operate programs and reporting |
| SHS operator | Universe or direct admin | SHS/BOS | Coordinate operations |
| CivicSure operator | Existing operator/API consumer | Current canonical assurance surfaces | Governed assurance workflows |
| Agent Fabric admin | Universe → Agent Fabric | Admin | Inspect bounded governance/control state |
| OAS visitor/developer | Universe → OAS | OAS | Read standards and OAS-1 materials |
| Grant/investor reviewer | Foundation/admin/reporting | Existing report consumer | Review permitted reporting |

## 32. Dead-End Analysis

Live destinations have a stable home and return metadata. The two unavailable narrative records remain visibly unavailable. The disconnected CivicSure package is documented rather than linked. No FE-0 P0 dead-end was introduced.

## 33. Priority Classification

P0: none. P1: stale OAS discoverability and missing Agent Fabric discoverability, resolved in this phase. P2: CivicSure package mounting/consumer assignment and legacy alias cleanup, deferred because they require a separate consumer decision. P3: visual/navigation polish, deferred.

## 34. Implementation Plan

| Change | Files | Why | Risk |
|---|---|---|---|
| Promote OAS to live existing destination | `universeDestinationRegistry.js` | Make real mounted app discoverable | Low |
| Register Agent Fabric admin destination | `universeDestinationRegistry.js` | Make existing control surface discoverable without changing auth | Low |
| Update focused Universe regression | `tests/ui/universe-canonical.spec.mjs` | Assert current unavailable count and directory count | Low |
| Record destination decisions | This report and Universe architecture note | Keep route/source decisions auditable | Low |

## 35. Changes Implemented

OAS now uses same-origin hard navigation to `/oas.html` with public status and return metadata. Agent Fabric now uses same-origin hard navigation to `/admin.html#/agent-fabric` with admin-only status and return metadata. No page designs, domain services, migrations, or backend contracts changed.

## 36. Route Acceptance

Static registry evaluation confirms 23 evidenced records, 22 visible records, OAS production path `/oas.html`, and Agent Fabric production path `/admin.html#/agent-fabric`. Existing route files and Vite inputs contain both targets.

## 37. Universe Directory Acceptance

The focused regression was updated for 22 visible directory records and two unavailable records. Directory entries use the existing registry and hard-navigation helper.

## 38. OAS Acceptance

OAS is an existing public Vite entry with an existing landing page. The Universe destination now opens that entry instead of presenting a planned/unavailable state. Its internal OAS links remain unchanged.

## 39. CivicSure Acceptance

The existing `apps/shf-web` package and its explorer routes were inspected. It remains frame-only/disconnected and is not falsely linked as a live production destination. Current canonical assurance consumers remain separate and authoritative.

## 40. Agent Fabric Acceptance

Agent Fabric is reachable from the Universe Directory as an admin-only destination. The target route is protected by the existing `SHS_SECURITY_PERMISSIONS.AUDIT_VIEW` gate. No execution or approval authority is granted by the navigation entry.

## 41. Studio Acceptance

Studio remains at `/studio` with Builder and workflow subroutes in the existing curriculum router. No route collision or alternate Studio home was introduced.

## 42. SHF Acceptance

Foundation remains reachable through its existing `/foundation.html` entry and Universe destination. Its public app gallery remains a separate existing consumer and was not replaced.

## 43. SHS Acceptance

SHS/BOS remains reachable through `/solutions.html#/home`; internal BOS and Agent Fabric controls remain under the protected admin MPA. No public link was changed into an admin bypass.

## 44. Career Acceptance

Career remains reachable through `/career.html#/` and its existing Universe destination. No personal route was made public by FE-0.

## 45. Browser Acceptance

The repository's focused Universe spec is the applicable browser contract. It was updated for the two current unavailable destinations, the current directory count, and FE-0 destination wiring. Static source tests pass. Live browser execution was attempted, but Chromium could not launch in this environment (`bootstrap_check_in ... Permission denied`); this is an environment/harness limitation, not a product failure. Generated browser artifacts remain excluded from FE-0 scope.

## 46. Responsive Sanity

No responsive layout code changed. Existing Universe gateway responsive behavior and application shells remain protected by the existing UI validation/build contracts.

## 47. Accessibility Sanity

New destination records carry explicit accessible labels. Existing keyboard directory controls and focus behavior remain unchanged. No accessibility-excellence program was started.

## 48. Build / Manifest Validation

The route assignments target existing Vite inputs and existing manifest/application entries. Manifest validation, UI validation, root build, the focused static Universe regression, and `git diff --check` pass. Live browser execution remains environment-blocked as recorded in section 45.

## 49. Backend Regression Protection

No backend files, migrations, authority models, or workflow contracts were changed. SYS-0 through SYS-8 backend/foundation completion remains preserved, including WF-040 safety policy and WF-049 external dependency constraints.

## 50. Files Created

`docs/architecture/FE-0_APPLICATION_DESTINATION_NAVIGATION_ASSIGNMENT_REPORT.md`

## 51. Files Modified

`src/pages/universe-v1/universeDestinationRegistry.js`, `tests/ui/universe-canonical.spec.mjs`, and `docs/architecture/universe/SILICON_HEARTLAND_UNIVERSE_CANONICAL_LANDING_V1.md`.

## 52. Owner Work Preservation

The seven pre-existing generated/local worktree artifacts were left untouched and unstaged. No reset, clean, stash, rebase, force checkout, commit, push, deletion, backend rewrite, or cloud operation was performed.

## 53. Final Destination Matrix

| Program / App | Canonical Destination | Route | Entry Point | Audience | Status |
|---|---|---|---|---|---|
| Universe | Universe | `/universe` | Universe / Directory | Public | ALREADY ASSIGNED |
| SHF Foundation | Foundation | `/foundation.html#/top` | Universe / public site | Public | ALREADY ASSIGNED |
| SHS/BOS public | Solutions | `/solutions.html#/home` | Universe / public site | Public | ALREADY ASSIGNED |
| SHS/BOS operations | Executive Command | `/admin.html#/ops/executive-command` | Admin console | Admin/operator | ALREADY ASSIGNED |
| OAS | Open Autonomous Standard | `/oas.html` | Universe Directory | Public | WIRED |
| Agent Fabric | Agent Fabric Control Center | `/admin.html#/agent-fabric` | Universe Directory | Admin | WIRED |
| Studio | Studio | `/studio` | Curriculum/app shell | Authorized org users | ALREADY ASSIGNED |
| Career | Career Center | `/career.html#/` | Universe / Foundation | Public and authenticated users | ALREADY ASSIGNED |
| Curriculum | Curriculum Hub | `/curriculum.html#/dashboard` | Universe / Foundation | Learners and staff | ALREADY ASSIGNED |
| CivicSure package | No safe active root destination | `apps/shf-web/#/explorer` (separate package) | None in active root | Public/operator package | DISCONNECTED / DEFERRED |
| Evidence / Truth / Metrics | No standalone app | Owning admin/API surfaces | Domain consumers | Authorized operators | SHARED INFRASTRUCTURE |

## 54. Remaining Destination Gaps

No P0 destination gaps remain. No P1 gap remains for the active repository-local application set. CivicSure's disconnected package remains a documented P2 consumer/mounting decision, not a fabricated live destination. The package should be revisited only when a canonical mounted consumer and live data contract are authorized.

## 55. Deferred Frontend Work

Deferred: FE-1 shared design system/application shell, page redesign, broad responsive work, accessibility excellence, UX micro-interactions, and any CivicSure package mounting/consumer decision. FE-0 did not begin those programs.

## 56. Recommended Next Phase

**FE-1 — SHARED DESIGN SYSTEM / APPLICATION SHELL**, after this FE-0 destination assignment is reviewed. No next phase was started in this work.

## Final Verdict

Actual existing shells include the root Universe/product MPA set, protected admin/control center, OAS, and the separate `apps/shf-web` package. OAS and Agent Fabric were the concrete destination/navigation assignments completed here. Shared infrastructure remains without standalone apps. The Universe Directory is the canonical ecosystem launcher, destination paths correspond to existing mounted/build entries for the wired changes, auth boundaries remain intact, and no new app or backend authority was created.

OAS navigation acceptance is structurally wired. Agent Fabric navigation acceptance is structurally wired with its existing admin gate. Studio, SHF, SHS/BOS, and Career destination assignments remain valid. CivicSure is intentionally not promoted from its disconnected frame-only package. FE-0 preserves the completed backend authority/workflow state and is complete for its repository-local assignment scope.
