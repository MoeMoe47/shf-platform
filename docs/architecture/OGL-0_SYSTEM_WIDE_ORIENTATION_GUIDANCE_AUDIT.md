# OGL-0 SYSTEM-WIDE ORIENTATION & GUIDANCE AUDIT

**Audit date:** 2026-09-12
**Repository:** `/Users/mikeslate/Projects/shrv1`
**Branch:** `studio-v1-plus-development`
**HEAD:** `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
**Restore point:** `dgal-program-complete-2026-09-12`
**Audit mode:** read-only

## 1. Executive Result

OGL-0 is **COMPLETE** as an audit. The repository has a capable but fragmented
experience layer: two active tour runtimes, several hardcoded step registries,
domain-specific checklists and next-action projections, a read-only Learning
Companion, and a completed DGAL composition/documentation layer. It does not
yet have a canonical Orientation Registry, system-wide context resolver,
versioned reorientation model, persistent cross-service checklist, or distinct
Guidance Center.

The safest future direction is composition. OGL should register and present
orientation experiences, consume canonical role/organization/service/workflow
facts, consume DGAL guidance and documentation, and return users to authorized
workflow locations. It must not become a second workflow, entitlement,
Evidence, Truth, Legal, Reporting, or retention authority.

No runtime implementation, migration, or product page was changed by this
audit. No OGL-1 work was started. No commit or push was performed.

## 2. Repository Baseline

- Repository root: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
- HEAD equals the completed DGAL checkpoint and tag
  `dgal-program-complete-2026-09-12`.
- The working tree contains only pre-existing local/runtime artifacts:
  `test-results/.last-run.json`, a generated UI snapshot, temporary scripts,
  `apps/shs-api/var/`, and `audit-output/`. They were preserved and not
  modified.
- Current repository migration files reach `138_dgal_content_variant_revisions.sql`.
- `git diff --check` passed at audit start.

## 3. OGL Program Scope

The locked experience loop is:

`Arrive -> Orient -> Understand -> Explore -> Practice -> Act -> Verify Progress -> Get Help -> Return -> Reorient`.

The future OGL assistance stack is:

`Orientation -> Contextual Guidance -> Tour -> Checklist / Next Steps -> DGAL Documentation -> Learning Companion -> Canonical Workflow`.

The five required modes are all represented conceptually in the repository,
but not through one contract: first-time orientation, guided tour, contextual
guidance, persistent task guidance, and Guidance Center/self-help.

The three-depth model is partially present:

- Inline: tour copy, page help, tooltips, and Companion hints.
- Guided: the two tour runtimes and guided workflow intent.
- Documentation: DGAL documents, packets, Reporting references, and Document
  Center.

## 4. Existing Orientation/Tour Architecture

### Active runtime systems

1. **Shared `TourProvider` / `useTour` runtime**
   - `src/system/tour/TourProvider.jsx`
   - `src/system/tour/useTour.js`
   - `src/system/tour/TourOverlay.jsx`
   - `src/system/tour/TourStepCard.jsx`
   - `src/system/tour/tourConfig.js`
   - Used by SHF Impact, Exchange command surfaces, Unified Truth, and partner
     growth surfaces.
   - Accepts bounded DGAL context and listens for `dgal:tour-request`.

2. **Hub `HubBusinessTourProvider` runtime**
   - `src/pages/hub/shared/HubBusinessTourProvider.jsx`
   - `src/pages/hub/shared/hubTourSteps.js`
   - Used by workspace, queue, intake, lifecycle, reports, growth, sales,
     bundles, opportunities, intelligence, leadership, and imports pages.
   - Uses `pageKey`, DOM selectors, and a session-only
     `shsHubGuidedWorkflowIntent` to start a route-local tour.

### Fragmentation

The runtimes have separate state machines, overlay CSS, step registries,
missing-target behavior, and route assumptions. Additional page-specific step
files include command surface, Unified Truth, and partner growth tours. Backup
files are historical and are not counted as active runtimes.

### Current strengths

- Native buttons and dialog semantics exist in the active overlays.
- Missing anchors are surfaced as a visible “target not visible” message.
- Targets scroll into view and update on resize/scroll.
- DGAL can request a tour by ID/step through the shared runtime.
- Tour completion is experience state in the current runtime and is not wired
  to acknowledgment, Evidence, Truth, or workflow completion.

### Current weaknesses

- No canonical orientation definition or version registry.
- No common step schema across Hub and shared tours.
- No persisted offer/start/skip/resume/completion history.
- No route-transition resume model.
- No material-change/“What’s Changed” model.
- No centralized role/org/service/workflow resolver.
- Focus trapping, focus restoration, announcements, and reduced-motion tour
  behavior are not proven by dedicated tour tests.

## 5. Existing First-Run / Experience State

| State mechanism | Location | Classification | Finding |
|---|---|---|---|
| Shared tour state | `useTour.js` React state | CLIENT-ONLY / EXPERIENCE STATE | Active step, completed, dismissed; lost on unmount/reload |
| Hub guided intent | `HubBusinessTourProvider.jsx` | CLIENT SESSION / EXPERIENCE STATE | `sessionStorage` carries a start intent and is cleared after launch |
| Companion visibility/focus/preferences | `CompanionProvider.jsx` and `companionConfig.js` | CLIENT-ONLY / EXPERIENCE PREFERENCE | User-controllable presentation preferences, not institutional completion |
| Accessibility preferences | Accessibility profile context/API | SERVER-PERSISTED preference where available | Canonical accessibility state is separate from tour state |
| Domain onboarding | Organization onboarding services/routes | DOMAIN STATE | Institutional onboarding state remains service-owned |
| DGAL completion | DGAL requirement, acknowledgment, signature, document services | SERVER-PERSISTED / DOMAIN-AUTHORITATIVE | Not derived from tour state |

No active `firstRun`, `hasSeen`, or `tourCompleted` persistence key was found
for the active tour runtimes. The principal risk is not an authority bypass;
it is loss of continuity and duplicate/repeated orientation across devices and
routes.

## 6. Existing Next-Action Authorities

| Domain | Existing next-action authority | API/service evidence | OGL reuse potential |
|---|---|---|---|
| DGAL | `ContextualGuidanceService` | `/documentation/context/me`, DGAL-2 report | Primary guidance source; do not duplicate |
| CivicSure | Provider/evidence/finding/corrective-action services | Government assurance provider self-service and DGAL adapter | Adapt source facts and return targets |
| Organization onboarding | Onboarding lifecycle service | `organization-onboarding-service.ts` and routes | Consume lifecycle stage and required agreement state |
| Studio | Studio project/review/release services | Studio route/service modules | Consume handoff/readiness facts only |
| Agent Fabric | Work-order/policy/controlled execution authorities | Agent package, task, policy, WF-040 surfaces | Explain authorized next action; never authorize execution |
| ARAG-1 | Release assurance/work-order policy | `arag` domain routes/services | Consume release state; preserve approval authority |
| Curriculum | Assignment, completion-policy, learner-result services | curriculum routes and completion-policy domain | Consume assignment/lesson next action |
| Career | Career pathway/opportunity/event services | career pathway and career events | Consume pathway guidance; preserve career authority |
| Calendar | Calendar projection/intelligence | Companion context service | Consume recommendations as source facts |
| Companion | Bounded projection over Calendar, Journey, Career, Credentials, and optional DGAL | `companion-context-service.ts` | Reuse as explanation surface, not authority |

## 7. DGAL Integration

DGAL is the strongest reusable foundation for OGL. It provides:

- deterministic, explainable, source-traceable guidance composition;
- role, organization, service, workflow, and resource context;
- safe internal action and return targets;
- required/optional/waiting/blocked/reference/completed categories;
- Document Center, packets, document instances, acknowledgments, manual paper,
  provider-neutral signatures, Evidence references, and retention metadata;
- honest unknown/unavailable behavior and cross-organization scope.

OGL should consume DGAL guidance IDs, requirement IDs, action targets,
documentation IDs, packet/document references, and source explanations. OGL
must not copy DGAL requirement state or create a second Document Center
authority.

## 8. Learning Companion Integration

The Companion is a shared read/explanation runtime mounted in Career and
Curriculum contexts. Its backend aggregates already-entitled Calendar,
Journey, Career Pathway, and Credentials reads with `Promise.allSettled`,
retains source availability, and fails honestly when all sources are down.
DGAL can be requested through bounded service/workflow/resource selectors.

Classification: **REUSE AS-IS for authority and read security; EXTEND through
bounded OGL/DGAL projections later.** The Companion is role-aware through the
authenticated actor, organization-scoped through canonical services, and
source-aware. It remains read-only for institutional state. No direct tour
launch contract is currently exposed from the Companion UI, and the tour does
not currently expose Companion as a coordinated mode.

## 9. Accessibility Integration

Existing global accessibility support includes focus-visible styling, reduced
motion CSS, Accessibility Profile/Effective Accessibility Context, semantic
status/alert patterns, and route focus patterns in major app shells.

Active tours provide dialog labels, native controls, visible progress, and a
missing-target message. However, the audit found no dedicated proof of focus
capture/restoration, `aria-live` step announcements, keyboard escape behavior,
screen-reader spotlight semantics, or a non-tour equivalent for each step.
The Hub overlay and shared overlay are separate accessibility surfaces.

Assessment: **PARTIAL**. OGL-3 should harden a single accessible primitive and
make every tour step optionally express an equivalent inline/help action.

## 10. Routing / Safe Return Architecture

`src/system/tour/tourContext.js` implements bounded internal routes and stores
service, resource, workflow, step, section, guidance, and requirement context.
DGAL uses the same safe action/return-target principles and normal route
authorization remains authoritative after navigation. Hub guided workflow
intent uses hash/session context and strips the query after starting.

Strengths: arbitrary external schemes are rejected; route/resource context can
be carried; DGAL item targets are server-authorized.

Gaps: tour context is not a durable re-entry record; route changes do not
resume a step; stale organization/resource reauthorization is not centralized
inside the tour runtime; Hub intent is session-only and page-key based.

## 11. Destination Registries

The canonical destination anchor is `src/pages/universe-v1/universeDestinationRegistry.js`,
backed by application manifests in `src/apps/manifest/` and route modules in
`src/router/`. The Universe registry contains 23 evidenced destination records
(including planned/unavailable and intentionally hidden records), with route,
production path, destination type, availability, and source evidence.

OGL should reuse the Universe/application registries for destination identity,
then layer orientation metadata on top. It should not create a competing
destination registry.

## 12. Major Destination Inventory

| Family | Evidenced destinations |
|---|---|
| SHF/Foundation | SHF Foundation, Impact, Curriculum, Career, Arcade, Employer, Credit, Debt Clock, Treasury, Store, AI Job Compass, Verifier |
| SHS/Solutions | BOS, BOS Executive Command, Hub/operator surfaces, Studio, service catalog, organization onboarding, Reporting, Document Center |
| CivicSure | CivicSure root, provider self-service, operator/government assurance, public verifier/reference surfaces |
| Governed AI/release | Agent Fabric, ARAG-1 release assurance, work orders, approvals, controlled policy routes |
| Standards/trust | Open Autonomous Standard, Autonomous Registry, planned Autonomous Trust Bureau |
| Platform | Universe, manifests/application registry, Admin, Truth Spine, Oracle, Reporting, DGAL Admin |

The Universe registry is strongest for public/application destinations. Many
authenticated service/workflow routes remain distributed across route modules
and permission maps rather than one experience registry.

## 13. Role Inventory

The API role vocabulary in `security-permissions.ts` includes `super_admin`,
`shs_admin`, `shf_admin`, `partner_org_admin`, `program_worker`,
`reviewer_verifier`, `leadership_funder_viewer`, `auditor`,
`read_only_viewer`, `instructor`, `student`, `org_admin`, `operator`,
`program_manager`, and `reviewer`. Hub presentation tiers separately define
`client`, `client_admin`, and `shs_admin`. CivicSure and other domains add
provider/operator/reviewer distinctions through permissions and source services.

OGL must resolve effective permissions and active organization server-side;
the presentation role labels are not sufficient authority.

## 14. Destination × Role × Guidance Coverage Matrix

| Destination / route | Role(s) | Welcome/orientation | Tour | Checklist / next steps | DGAL | Companion | Accessible alternative | Versioned | Current status |
|---|---|---|---|---|---|---|---|---|---|
| `/universe.html`, Universe | public, authenticated | Universe landing/presentation | No canonical tour found | No | Destination registry | No direct link | Card mode and semantic destination controls | Registry version only | PARTIAL |
| `/foundation.html#reports`, SHF Foundation | public/admin contexts | Page orientation via shell | Core `TourProvider` in command surfaces | Domain panels | Optional DGAL references | No direct integration | Existing shell/a11y primitives | No OGL version | PARTIAL |
| `/curriculum.html#/dashboard` | student, instructor, admin | Curriculum shell/lesson guidance | No unified OGL tour found | Assignments/completion policy | Role documents where assigned | Companion active | Lesson accessibility patterns | Domain/content versions | PARTIAL |
| `/career.html#/` | student/learner, staff | Career shell/pathway copy | No unified OGL tour found | Skills/pathway/checklist components | Career references | Companion active | Career shell controls | Domain/content versions | PARTIAL |
| `/solutions.html#/home`, BOS | client, client_admin, shs_admin | Hub/BOS shell | Hub tours across many pages | Queue/growth/action projections | DGAL available by service | No direct tour link | Native dialog/controls, not unified | Hardcoded step configs | FRAGMENTED |
| `/admin.html#/ops/*`, BOS Ops | shs_admin/operator/auditor | Admin route labels | Hub tours on selected pages | Operational next actions | DGAL admin/documentation | No direct integration | Existing admin a11y varies | No tour version | PARTIAL |
| `/admin.html#/agent-fabric` | operator, reviewer, shs_admin | Route/policy context | No verified destination-specific OGL tour | Work-order/policy state | DGAL reference possible | No direct integration | Route shell only | Policy versions | PARTIAL |
| `/index.html#/civicsure` | provider, operator, reviewer | CivicSure workspace context | No unified OGL tour; DGAL request bridge exists | `DgalNextStepsPanel` provider slice | Strong DGAL integration | Not directly linked | Existing provider surface and panel | DGAL/content versions | PARTIAL |
| `/admin.html#/documentation` | authorized DGAL admin/user | Document Center states | No Document Center tour found | DGAL next steps/history | Canonical DGAL | No direct integration | Responsive/status states | DGAL versions | PARTIAL |
| `/admin.html#/documentation/admin` | DGAL admin/content owner | Registry/version controls | No authoring tour | Admin workflow controls | Canonical registry | No direct integration | Native controls, not tour-equivalent | Template/variant versions | PARTIAL |
| `/admin.html#/ops/reports` | report/admin roles | Reporting shell | No unified OGL tour found | Reporting workflow actions | Reporting-owned references | No direct integration | Existing reports UI | Report versions | PARTIAL |
| `/admin.html#/truth-spine` | truth/auditor/admin | Authority shell | No OGL tour found | Truth workflows | DGAL must not own Truth | No | Route permission boundary | Truth versions | PARTIAL |
| `/admin.html#/oracle` | admin/oracle roles | Authority shell | No OGL tour found | Oracle workflows | DGAL must not own Oracle | No | Route permission boundary | Oracle versions | PARTIAL |
| `/oas.html` | public/standards users | Landing copy | No OGL tour found | No | Optional documentation | No | Public semantic page | OAS versions | PARTIAL |
| `/verifier.html` | public verifier | Page explanation | No OGL tour found | No | Evidence/reference only | No | Public verifier controls | Artifact versions | COMPLETE for lightweight scope |
| `/employer.html#/dashboard` | employer/user | App shell | No unified OGL tour found | Domain actions | Possible DGAL references | No | Existing app patterns | Domain versions | MISSING |
| `/arcade.html#/` | learner/public | Game onboarding varies | Local/game guidance | Game progression | Not a primary DGAL surface | No | Game-specific controls | Content versions | PARTIAL |
| `/treasury.html#/dashboard` | public/operator | Page copy | No OGL tour found | Local workflow | Not primary DGAL | No | Existing page controls | Domain versions | MISSING |
| `/sales.html#/dashboard` | client/admin | Hub/business tours may apply | Hub tours on related pages | Sales pipeline actions | Optional DGAL | No direct integration | Existing controls | Hardcoded tour configs | PARTIAL |
| `/store.html#/catalog` | public/user | Product copy | No OGL tour found | No persistent checklist | Optional docs | No | Existing catalog semantics | Product versions | MISSING |

## 15. Orientation Contract Readiness

Identity, destination, audience, permissions, DGAL IDs, source owner, and safe
action targets are available in pieces. Purpose and tour step content are
hardcoded in JSX/config. Entry modes, resume, reorientation, versioning,
admin lifecycle, and analytics are not represented by a shared contract.

Readiness by contract area:

| Area | Readiness |
|---|---|
| Identity/owner/destination | PARTIAL; destination registry and route modules exist |
| Audience/permission/org | PARTIAL; canonical auth exists, tour configs do not resolve it |
| Purpose/outcomes | PARTIAL; content exists in step definitions |
| First/return/changed entry | WEAK; auto-start intent exists, no durable model |
| Tours/anchors | PARTIAL; multiple runtimes and selectors |
| Guidance/checklist/DGAL | PARTIAL; DGAL exists, checklist is fragmented |
| Companion | PARTIAL; bounded read projection exists |
| Actions/return | STRONG for DGAL safe targets; incomplete for legacy Hub tours |
| Accessibility | PARTIAL |
| Telemetry | WEAK for OGL-specific lifecycle events |
| Versioning | WEAK; domain versions exist, tour definitions are not versioned |

## 16. Existing Checklist / Task Guidance

There is no single persistent OGL checklist. Existing task guidance includes
Career `SkillsChecklist`, Curriculum assignments/completion policy, Hub action
queues, guided workflow intents, CivicSure/DGAL `Your next steps`, and domain
work-order/release panels. Most are domain-owned or route-local. DGAL provides a
reusable projection but does not persist a separate checklist state.

Recommendation: OGL-2/OGL-4 should compose a checklist projection from these
authorities and persist only experience state such as viewed/resumed, never
completion.

## 17. Existing Self-Help / Help Center

Many pages have local `Help.jsx`, `CoachDrawer`, `CoachPanel`, `CoachSlideOver`,
and Companion surfaces. These are fragmented presentation components with no
shared searchable topic registry. DGAL Document Center is a durable
institutional document surface, not a generic help center.

Recommendation: build a distinct OGL Guidance Center that shares layout and
safe-target primitives with DGAL, consumes DGAL documents, and does not merge
its presentation index into DGAL authority.

## 18. Existing Admin Authoring

DGAL Admin provides registry/template/version/requirement controls and variant
metadata. Tour and Hub step content is primarily hardcoded in frontend modules.
No general tour/guidance authoring lifecycle, preview/version/publish workflow,
or role-scoped orientation authoring surface was found. Existing app manifests
and Universe registry are configuration/source registries, not guidance
authoring systems.

## 19. Versioning / Reorientation

DGAL templates, requirements, documents, packets, and content variants are
versioned. Tour definitions and Hub step registries are not versioned as
experience contracts. No “What’s Changed” registry, material-change trigger,
or dismissed-version record was found. This is a central OGL-1/OGL-6 gap.

## 20. Telemetry / Analytics

The repository contains broad operational and product analytics patterns, but
no canonical OGL lifecycle event contract for offered, started, skipped,
resumed, completed, abandoned, help opened, documentation opened, Companion
invoked, or next-action reached. Existing operational/audit events must not be
reused as experience telemetry without classification. OGL telemetry should be
tenant-scoped, privacy-aware, and separate from Evidence/Truth.

## 21. Error / Resilience

The shared tour reports missing anchors and continues. Hub waits for an anchor
for bounded retries, then starts with a missing-target state. This is better
than crashing but is not a full route-aware resilience contract. No central
handling was found for permission-hidden targets, org switch, stale version,
route replacement, or a feature becoming unavailable after tour start.

## 22. User Control

Shared tours expose start, Back, End, Finish, and an internal dismiss function;
Hub tours expose Start, Back, End, and Finish. There is no durable “do not show
again”, replay history, restart-from-step, or version-aware reoffer. Tours are
not institutionally mandatory in the inspected runtime. This is appropriate;
mandatory workflow requirements belong to DGAL/domain authorities.

## 23. Experience-Level Adaptation

Role exists in User/permission contexts and Companion, but active tour step
selection is not resolved by experience level, prior orientation, or proficiency.
Hub `pageKey` and guided intent are coarse adaptations. Curriculum lessons have
progressive content patterns, but they are not a shared OGL adaptation engine.

## 24. Mobile / Tablet

Tour cards use viewport-constrained width and the Hub overlay calculates a
mobile-safe card width. Targets scroll into view and resize/scroll listeners
reposition the spotlight. Static CSS evidence supports a reasonable baseline,
but no system-wide tour-specific 320/375/tablet acceptance suite was found.
Potential risks are focus loss, scroll lock/keyboard obstruction, and card
placement around off-screen anchors.

## 25. Public vs Authenticated Guidance

Public destinations should receive lightweight explanation and orientation only:
Universe, OAS, Verifier, public Foundation/Career/Curriculum shells, and public
learning/civic surfaces. Authenticated destinations should receive role,
organization, entitlement, workflow, DGAL, and Companion-aware guidance:
onboarding, CivicSure provider/operator, Hub/BOS, Studio, Agent Fabric/ARAG,
Reporting, Document Center, and admin surfaces.

## 26. Authority / Security Risks

No current OGL P0 authority bypass was found. DGAL safe targets and server
permissions provide a sound boundary. Risks to address in future phases:

- legacy tours rely on DOM presence rather than an explicit authorization-aware
  target contract;
- Hub session intent carries page/goal context but is not a server-authoritative
  authorization mechanism;
- tour completion is local React state and must never be projected as workflow
  completion;
- multiple local help/checklist components can describe state inconsistently;
- Companion client storage is appropriate for preferences but must not store
  institutional completion;
- raw route and resource context must continue to be reauthorized after org
  switches and stale deep links.

## 27. Duplication Findings

| Concern | Current systems | Classification |
|---|---|---|
| Tour runtime | Shared `TourProvider`; Hub `HubBusinessTourProvider`; page configs | CONSOLIDATE behind one OGL runtime |
| Help | Page-local Help, Coach drawers/panels, Companion | REUSE primitives; consolidate topic contract later |
| Checklist | Career, Curriculum, Hub, DGAL, service-specific panels | KEEP domain authorities; compose via OGL |
| Next action | Domain resolvers, DGAL, Companion recommendations | REUSE canonical owners; no universal duplicate |
| Destination identity | Universe registry, manifests, routers | REUSE/ADAPT; do not create another registry |
| Experience preferences | Accessibility profile plus local UI preferences | REUSE canonical accessibility state; scope OGL state separately |

## 28. Market-Quality Benchmark

| Capability | Rating | Evidence |
|---|---|---|
| Contextual guidance | PARTIAL | DGAL strong; not system-wide |
| Persistent self-help | WEAK | Many local Help/Coach components; no Guidance Center |
| Replayable/resumable tours | WEAK | Manual replay; no durable resume |
| Route-aware guidance | PARTIAL | DGAL safe targets; legacy tours route-local |
| Role-aware guidance | PARTIAL | Auth/Companion aware; tour configs mostly not |
| Workflow-state-aware guidance | PARTIAL | DGAL/domain panels; not shared OGL |
| Persistent next-step checklist | WEAK | Domain checklists only |
| Searchable contextual help | MISSING | No canonical topic/search registry found |
| Documentation integration | STRONG | DGAL Document Center and safe references |
| AI/Companion explanation | PARTIAL | Read-only Companion with source-aware projection |
| Accessible alternative | PARTIAL | General accessibility primitives; tour equivalent not universal |
| Versioned/reorientation experience | WEAK | Domain versioning, no tour version/reoffer model |
| Governed authoring | PARTIAL | DGAL authoring; no OGL content authoring |
| Guidance effectiveness telemetry | WEAK | No OGL lifecycle event contract |
| Broken-tour health detection | WEAK | Local missing-anchor handling only |

## 29. Reuse Map

| Capability | Existing implementation | Owner | Quality | OGL decision |
|---|---|---|---|---|
| Destination identity | Universe registry + app manifests | Experience/platform | Strong | REUSE AS-IS / ADAPT |
| Shared tour primitives | `TourProvider`, `useTour`, overlay/card | Experience | Partial | EXTEND then CONSOLIDATE |
| Hub tours | `HubBusinessTourProvider` and step registry | SHS Hub | Partial | ADAPT into shared contract |
| DGAL guidance | `ContextualGuidanceService` | DGAL/domain owners | Strong | REUSE AS-IS |
| Document Center | DGAL Document Center | DGAL | Strong | CONSUME, do not merge authority |
| Companion | Companion context service/provider | Learning/Companion | Strong read boundary | EXTEND via projection |
| Accessibility | Accessibility Profile/Effective Context | Accessibility layer | Strong platform base | REUSE AS-IS |
| Domain checklists | Career/Curriculum/Hub/service panels | Domain owners | Mixed | CONSOLIDATE presentation, preserve authority |
| Help panels | page-local Help/Coach components | Individual domains | Fragmented | ADAPT/CONSOLIDATE |
| Experience telemetry | scattered analytics/operational events | Platform/domain | Mixed | BUILD OGL contract, separate storage semantics |

## 30. Authority Map

| Concern | Current canonical owner | OGL future relationship |
|---|---|---|
| Authentication | SHS identity/auth runtime | Consume server identity |
| Permissions | SHS permission guard/security permissions | Filter and reauthorize; never infer authority |
| Organization context | Identity/org/tenant services | Consume active authorized context |
| Entitlements | Service Catalog | Suppress or explain inaccessible service guidance |
| Workflow state | Owning service domain | Read/projection only |
| Next action | Owning domain and DGAL composition | Order/present, do not invent |
| Documentation | DGAL registry/instances/Document Center | Link and explain |
| Acknowledgments | DGAL-4 | Present status only |
| Signatures | DGAL-5/provider adapter | Present status only |
| Evidence | Evidence domain/DGAL reference links | Link, never verify |
| Truth | Truth Spine/domain authorities | Never write from guidance |
| Reporting | Reporting registry/renderer | Reference artifacts only |
| Legal | Legal/service agreement authority | Present approved content only |
| Retention | PR-2 | Surface metadata/hold state only |
| Service completion | Service/workflow domain | Never infer from tour |
| Orientation experience | Future OGL | Own definitions and experience state |
| Experience telemetry | Future OGL analytics contract | Keep separate from institutional records |

## 31. OGL Gap Register

| Gap ID | Severity | Finding | Affected areas | Recommended phase | Acceptance requirement |
|---|---|---|---|---|---|
| OGL-GAP-001 | P1 | No canonical Orientation Registry or shared Orientation Contract | All destinations | OGL-1 | Registry schema covers destination, audience, versions, modes, DGAL/Companion links, safe targets, accessibility, and owner |
| OGL-GAP-002 | P1 | No server-authoritative context resolver composing actor/org/service/route/permissions/workflow/experience state | All authenticated destinations | OGL-2 | Deterministic scoped context output; client claims cannot widen context |
| OGL-GAP-003 | P1 | Two active tour runtimes and incompatible step contracts | Hub, SHF command, Exchange, growth | OGL-3 | One reusable runtime/adaptor contract preserves existing consumers and safe missing-anchor behavior |
| OGL-GAP-004 | P1 | Tour accessibility is partial and lacks dedicated focus/announcement/equivalent tests | All active tours | OGL-3 | Keyboard/focus/screen-reader/reduced-motion/mobile/non-tour equivalent acceptance |
| OGL-GAP-005 | P1 | No persistent cross-route/cross-device orientation state or version-aware reorientation | All returning users | OGL-1/OGL-3 | Durable experience state is distinct from domain completion; resume/replay/version migration works |
| OGL-GAP-006 | P1 | No persistent OGL checklist projection over DGAL and domain next-actions | CivicSure, onboarding, Curriculum, Career, Hub | OGL-2/OGL-4 | Required/optional/waiting items compose without duplicating completion authority |
| OGL-GAP-007 | P1 | No Guidance Center/self-help topic registry or search contract | System-wide | OGL-4 | Authorized searchable help links inline/guided/document depths and safe fallback |
| OGL-GAP-008 | P1 | Companion, Tour, DGAL, and Guidance Center do not share one presentation contract | Career, Curriculum, CivicSure, all services | OGL-4 | Shared source/action/return/explanation projection; Companion remains read-only |
| OGL-GAP-009 | P2 | Tour/action targets are not uniformly route-transition and org-switch reauthorized | Legacy Hub and page tours | OGL-2/OGL-3 | Stale, unauthorized, hidden, and cross-org targets fail safely |
| OGL-GAP-010 | P2 | No governed OGL authoring lifecycle for tour/guidance content | Admin/content owners | OGL-6 | Draft/preview/validate/publish/supersede/archive with owner and permission controls |
| OGL-GAP-011 | P2 | No OGL lifecycle telemetry/effectiveness model | All experiences | OGL-6 | Offer/start/skip/resume/complete/help/docs/Companion events are scoped and non-institutional |
| OGL-GAP-012 | P2 | No broken-tour health detection or content/anchor validation pipeline | All tours | OGL-6 | CI/admin validation detects missing selectors, stale routes, inaccessible steps, and version mismatch |
| OGL-GAP-013 | P2 | No progressive guidance adaptation based on experience/prior orientation | Curriculum, Career, service onboarding | OGL-2/OGL-5 | Experience-level policy reduces repetition without hiding required guidance |
| OGL-GAP-014 | P3 | Public vs authenticated orientation policy is not expressed as a shared contract | Universe/public apps | OGL-1/OGL-5 | Lightweight public orientation and role-aware authenticated orientation are explicitly classified |
| OGL-GAP-015 | P3 | Destination coverage is not system-wide; many major routes have no guidance contract | Employer, Store, Treasury, Reporting, Agent/ARAG, etc. | OGL-5 | Coverage matrix reaches agreed tier with owner and acceptance evidence per destination |

No P0 was identified. The P1 gaps are architectural foundations or accessibility/continuity blockers, not evidence of current institutional authority bypass.

## 32. Gap-to-Phase Mapping

| Phase | Assigned gaps | Scope |
|---|---|---|
| OGL-1 | 001, 005, 014 | Canonical registry, contracts, audience/destination/version model, durable experience-state boundary |
| OGL-2 | 002, 006, 009, 013 | Context resolver, checklist projection, reauthorization, experience adaptation inputs |
| OGL-3 | 003, 004, 005 | Unified accessible tour runtime, focus/resume/replay primitives, route-safe behavior |
| OGL-4 | 007, 008 | Guidance Center, DGAL/Companion integration, three-depth presentation contract |
| OGL-5 | 015 | System-wide destination rollout and tiered acceptance |
| OGL-6 | 010, 011, 012 | Admin authoring, analytics, validation/health, micro-gaps, final acceptance |

No gap requires OGL-7.

## 33. Recommended Canonical OGL Architecture

```text
Universe / App Registry / Route Manifests
        |
        v
OGL Orientation Registry and Versioned Contracts
        |
        v
Server-authoritative Context Resolver
        |
        +--> Orientation entry/reorientation
        +--> Unified accessible Tour Runtime
        +--> Contextual Guidance and persistent experience checklist
        +--> Guidance Center / self-help
        |
        +--> DGAL requirements, documents, packets, safe actions
        +--> Companion explanation projection
        +--> Domain next-action/readiness facts
        |
        v
Canonical service workflow and authority
```

The smallest safe implementation keeps OGL as composition/presentation plus
experience-state. It uses the existing Universe registry for destination identity,
DGAL for documentation/requirements, service domains for workflow facts,
Companion for explanation, and existing route/permission guards for access.

## 34. OGL Data Ownership

OGL may persist:

- orientation and tour definitions;
- destination/role/audience associations;
- definition and content versions;
- user experience state: offered, started, skipped, resumed, completed,
  dismissed, replayed, and last step;
- reorientation/version acknowledgement state;
- bounded experience telemetry and health results.

OGL must not persist as authority:

- workflow completion;
- service requirements or entitlements;
- acknowledgments, signatures, or Evidence acceptance;
- Truth, Legal approval, Reporting state, retention/hold decisions, or service
  activation.

## 35. Experience-State Recommendation

Keep active step and overlay geometry ephemeral client state. Add a durable,
server-scoped OGL experience-state record in a future phase for cross-device
resume, dismissed-version handling, replay history, accessibility preferences,
and analytics. Key it by actor, organization/tenant, orientation ID, and
orientation version. Reauthorization must apply on every resume. Domain state
remains separate.

## 36. Guidance Center Recommendation

Build a distinct OGL Guidance Center that shares shell, filters, status, safe
target, and accessibility primitives with the DGAL Document Center. It should
consume DGAL documents/requirements and service guidance but should not merge
with DGAL persistence or become a second Document Center/workflow authority.

## 37. Tour Runtime Recommendation

Harden and consolidate the existing runtimes rather than replace them
immediately. Introduce an adapter from Hub/page step configs into one versioned
step contract, then retire duplicate overlay/state implementations after
parity. Required hardening: focus management, escape/close semantics, reduced
motion, route transitions, missing-anchor validation, authorization-aware
targets, resume/replay, mobile placement, and telemetry hooks.

## 38. System-Wide Rollout Tiers

| Tier | Destinations | Recommended stack |
|---|---|---|
| Tier A — full | Organization onboarding, CivicSure provider/operator, Studio, Agent Fabric/ARAG, DGAL Document Center/admin, BOS operator workflows, Curriculum learner/instructor | Orientation, guided tour, contextual guidance, persistent checklist, DGAL, Companion, safe return, reorientation |
| Tier B — moderate | Career, SHF Foundation/Impact, Reporting, Hub growth/sales, Employer, service catalog, OAS | Orientation, selected tours, contextual guidance, DGAL/help links, Companion where entitled |
| Tier C — lightweight | Universe, Verifier, Store, Treasury, Arcade, public CivicSure/public Foundation views, Credit/Debt public views | Inline explanation, short orientation/help, accessible static documentation; no workflow checklist by default |

Tier decisions are based on workflow complexity, role sensitivity, and need for
return guidance, not product prestige.

## 39. External Dependencies

- human/content-owner approval for institutional orientation copy;
- accessibility review and assistive-technology validation;
- analytics/privacy approval for OGL experience telemetry;
- real organization/user UAT for role/org-specific guidance;
- production deployment and route availability across separately built apps;
- external translation/locale approval where language variants are used.

These are future operational/content dependencies, not OGL-0 audit blockers.

## 40. Validation

Read-only/non-destructive validation performed:

- repository baseline and DGAL checkpoint relationship inspected;
- active tour, Companion, DGAL, routing, manifest, permission, and Universe
  registry sources inspected;
- `npm run manifests:validate` passed (17 manifests);
- `npm run ui:validate` passed (1 UI contract set);
- `npm run check:layers` passed (57 official registry rows/layers);
- `npm run check:truth` passed (Truth Spine V1 freeze checks);
- `npm run check:oracle` passed (Oracle Layer V1 checks);
- `git diff --check` passed;
- the new report has no trailing whitespace;
- no runtime or migration file was modified.

No build, migration, or broad acceptance suite was run because this phase is
audit-only and changed documentation only.

## 41. OGL-0 Decision

**COMPLETE**.

The audit coverage is sufficient: current orientation/tour systems, first-run
state, next-action authorities, DGAL and Companion relationships, accessibility,
routing/safe returns, registries, destinations, roles, help/checklist systems,
authoring, versioning, telemetry, resilience, duplication, authority risks,
reuse decisions, gap register, phase assignments, architecture, ownership,
state recommendation, and rollout tiers are documented.

## 42. Exact Next Phase

**OGL-1 — CANONICAL ORIENTATION REGISTRY & CONTRACTS**

OGL-1 has not started.

### OGL-1 Closure Update (2026-09-12)

The OGL-1 registry/contract portion is now implemented in the static
`src/system/orientation/` registry. The following findings are closed only at
their OGL-1 scope; later-phase work remains assigned as originally mapped:

| Gap ID | OGL-1 status | Evidence |
|---|---|---|
| OGL-GAP-001 | RESOLVED | Canonical Orientation Contract, destination binding, ownership, lifecycle, versioning, and fail-closed validator |
| OGL-GAP-005 | OGL-1 CONTRACT PORTION RESOLVED | Version/change/reorientation metadata exists; durable user resume state remains OGL-3 |
| OGL-GAP-014 | RESOLVED | Shared PUBLIC/AUTHENTICATED/ROLE_SCOPED visibility and TIER_A/B/C classification |

OGL-2 through OGL-6 findings remain open for their assigned phases. No OGL-2
implementation has started.

### OGL-2 Closure Update (2026-09-12)

The OGL-2 resolver scope is now implemented in
`apps/shs-api/src/domain/orientation/` with authenticated organization scope,
server-held audience filtering, DGAL composition, bounded next-action
projection, source status, and reorientation metadata:

| Gap ID | OGL-2 status | Evidence |
|---|---|---|
| OGL-GAP-002 | RESOLVED | Deterministic `/orientation/context` resolver and focused actor/org/audience tests |
| OGL-GAP-006 | OGL-2 PROJECTION RESOLVED | Checklist composition and explicit completion-source projection; persistence/UI remain later scope |
| OGL-GAP-009 | OGL-2 SELECTION RESOLVED | Structured safe-action selection and organization/permission filtering; runtime execution reauthorization remains OGL-3 |
| OGL-GAP-013 | OGL-2 PROJECTION RESOLVED | Experience hints and version-aware reorientation output; system-wide rollout remains OGL-5 |

OGL-3 through OGL-6 findings remain open for their assigned phases. OGL-3
runtime work is recorded below; OGL-4 through OGL-6 remain unstarted.

### OGL-3 Final Fixture Closure (2026-09-12)

OGL-GAP-003, OGL-GAP-004, OGL-GAP-005, and the OGL-3 execution scope of
OGL-GAP-009 are CLOSED at OGL-3 scope. The development-only acceptance shell
at `src/system/orientation/acceptance/OglAcceptanceRoutes.jsx` proves canonical
Route A -> Route B continuation and deterministic delayed semantic-target
readiness in authenticated Chromium. The test-only catalog entries are gated
by the existing development identity fixture and are excluded from production.
HubWorkspaceDashboard regression remains green for durable state, resume,
replay, Step list, focus/Escape, and 375 px behavior. No OGL-4/OGL-5/OGL-6
scope was closed by this update.

### OGL-3 Closure Update (2026-09-12)

OGL-3 runtime scope is implemented around the shared `TourProvider`/`useTour`
path. Durable experience state is organization-scoped and bound to exact
orientation/tour versions through migration 139 and bounded experience APIs.
The Hub runtime remains adapter-backed and is not deleted until OGL-5 rollout
parity is complete. Accessible primitives, semantic target handling, missing
anchor policies, reduced-motion behavior, focus restoration, safe telemetry,
and native accessible step-list components are present:

| Gap ID | OGL-3 status | Evidence |
|---|---|---|
| OGL-GAP-003 | RESOLVED at runtime-consolidation scope | Shared runtime consumes canonical step contracts; Hub definitions remain mapped through the OGL-1 adapter pending OGL-5 consumer migration |
| OGL-GAP-004 | RESOLVED at primitive scope | Focus restoration, Escape handling, ARIA dialog/status semantics, reduced-motion behavior, semantic targets, and accessible step-list primitives |
| OGL-GAP-005 | RESOLVED | Migration 139 and `/orientation/experience` persist exact versioned, organization-scoped UX state; workflow completion remains outside OGL |
| OGL-GAP-009 | RESOLVED at runtime scope | Canonical targets are structured, missing anchors recover deterministically, and experience actions remain bounded presentation actions |

The TypeScript test runner was blocked before test load by the known macOS
tsx IPC-pipe `EPERM` harness condition; native Node tests, API typecheck, and
static/build validation were used where compatible. OGL-4, OGL-5, and OGL-6
remain assigned to their original phases.

## Appendix A — Final Answers to OGL-0 Verdict Questions

1. **Distinct systems:** Two active tour runtimes, plus fragmented step/config registries and many local help/checklist components.
2. **Canonical Tour runtime:** No single canonical runtime; shared `TourProvider` is the closest base, while Hub has a separate active runtime.
3. **Tour state:** Client React state; Hub also has session-only guided intent. No durable tour completion state.
4. **Role-aware:** Partially through caller context/route shells, not a shared resolver.
5. **Organization-aware:** No shared tour-level organization resolution.
6. **Service-aware:** Partially through page keys and DGAL context, not system-wide.
7. **Workflow-state-aware:** Only through guided intent/domain pages; not a common tour contract.
8. **Permission-aware:** Route permissions are authoritative, but tour definitions do not centrally resolve permissions.
9. **DGAL integration:** Yes, bounded context and `dgal:tour-request` bridge exist.
10. **Companion integration:** No direct coordinated launch/exposure contract today.
11. **Safe return targets:** Yes, `tourContext.js` and DGAL safe targets.
12. **Resume across route changes:** No durable/common resume; session intent can start a Hub tour.
13. **Replayable:** Manual replay while the page/runtime is mounted.
14. **Versioned:** No shared tour definition/version model.
15. **What’s Changed:** Not supported as a canonical OGL capability.
16. **Persistent checklist:** No system-wide OGL checklist; domain checklists exist.
17. **Checklist canonical derivation:** Partially; DGAL and domain projections are canonical, local checklists vary.
18. **Guidance/Resource Center:** DGAL Document Center exists; no general OGL Guidance Center.
19. **Contextual documentation:** Yes through DGAL and service/document references.
20. **Companion source-aware:** Yes.
21. **Companion read-only:** Yes for institutional state.
22. **Tour accessible:** Partially; semantic controls exist, focus/announcement proof is missing.
23. **Non-tour equivalent:** Not universal; page help and DGAL provide partial alternatives.
24. **Mobile/tablet:** Partially supported by responsive CSS and viewport calculations; no complete tour suite.
25. **Missing anchors:** Safely surfaced/skipped locally; no central validation pipeline.
26. **Duplicated orientation state:** Yes, fragmented local/session/config state and multiple runtimes.
27. **Tour as institutional completion:** No current direct misuse found; boundary must remain explicit.
28. **P0 risks:** Zero identified.
29. **P1 gaps:** Eight: OGL-GAP-001 through OGL-GAP-008.
30. **Major destinations inventoried:** 23 Universe records plus authenticated service/workflow route families.
31. **Roles inventoried:** 15 API roles plus 3 Hub presentation tiers and domain-specific provider/operator/reviewer distinctions.
32. **Reuse:** Universe/manifests, DGAL, Companion, accessibility context, service next-action authorities, safe route contracts.
33. **Consolidate:** Tour runtimes, step contracts, help topic presentation, checklist projection, OGL telemetry.
34. **Retire:** Duplicate tour overlay/state implementations after parity; historical backups are not active systems.
35. **Guidance Center boundary:** Separate OGL surface consuming DGAL, sharing primitives but not authority.
36. **Tour runtime:** Harden and consolidate the existing runtime; do not replace immediately.
37. **Necessary OGL persistence:** Versioned definitions, audience associations, actor/org experience state, reorientation state, and bounded telemetry.
38. **Canonical architecture:** Registry -> server context resolver -> orientation/tour/guidance/checklist/Guidance Center -> DGAL/Companion/domain workflow.
39. **OGL-0 status:** COMPLETE.
40. **Next phase:** OGL-1 — Canonical Orientation Registry & Contracts.

No implementation was started, no OGL-1 work was performed, and no commit or
push was performed.

### OGL-4 Closure Update (2026-09-12)

OGL-GAP-007 and OGL-GAP-008 are closed at OGL-4 representative-integration
scope. `src/system/guidance/GuidanceCenter.jsx` is the canonical contextual
shell mounted in the canonical Hub runtime. It consumes the authenticated
OGL-2 projection, exposes bounded tour/next-step/documentation/Companion/help
sections, preserves DGAL and service authority, and uses structured safe route
targets. Focus/close behavior and authenticated browser launch acceptance are
covered by `tests/ogl4GuidanceCenter.test.mjs` and
`tests/ogl4-guidance-center.spec.mjs`. Broader destination rollout remains
OGL-5; no OGL-5 or OGL-6 gap is closed here.

| Gap ID | OGL-4 status | Evidence |
|---|---|---|
| OGL-GAP-007 | CLOSED at representative Guidance Center scope | Guidance Center shell, contextual sections, topic projection, source-status handling, and authenticated browser acceptance |
| OGL-GAP-008 | CLOSED at integration scope | OGL-2 projection, OGL-3 tour launch, DGAL references, and read-only Companion integration |

### OGL-5 Rollout Update (2026-09-12)

OGL-GAP-015 remains OPEN at OGL-5 scope. The derived rollout manifest in
`src/system/orientation/rolloutCoverage.js` accounts for all 23 canonical
Universe destinations and assigns each an explicit tier, audience group,
contract binding where available, and status. The static registry now includes
the Hub contract, and the shared Guidance Center is mounted for active
Curriculum and CivicSure entry points. Remaining partial, missing, and blocked
destinations are documented in
`docs/architecture/OGL-5_SYSTEM_WIDE_DESTINATION_ROLLOUT.md`; no later-phase
gap was closed.

| Gap ID | OGL-5 status | Evidence |
|---|---|---|
| OGL-GAP-013 | PARTIAL at rollout scope | OGL-2 experience projection remains canonical; destination rollout is still incomplete |
| OGL-GAP-014 | RESOLVED at classification scope | Universe access/status fields and explicit coverage audience groups are validated |
| OGL-GAP-015 | OPEN | 23-destination coverage validator passes, but 11 partial, 2 blocked, and 2 missing contract entries remain |

### OGL-5 Continuation Update (2026-09-12)

The OGL-5 inventory now uses only the precise machine-readable final statuses
`COMPLETE`, `NOT_APPLICABLE`, and
`EXTERNAL_OR_PRODUCT_DEPENDENCY_BLOCKED` across all 23 Universe records. The
current counts are 1 complete, 14 not applicable, and 8 explicitly blocked;
there are no `PARTIAL` or `MISSING` records. Agent Fabric received its narrow
repository-local Guidance Center mount and stable semantic anchor. OGL-GAP-015
remains open because active Tier A role variants, destination-specific browser
acceptance, legacy consumer migration, and BOS identity ownership still lack
repository evidence sufficient for system-wide closure. No OGL-6 gap was
closed.

| Gap ID | OGL-5 continuation status | Evidence |
|---|---|---|
| OGL-GAP-013 | PARTIAL at rollout scope | OGL-2 projection remains canonical; destination rollout remains incomplete |
| OGL-GAP-014 | RESOLVED at classification scope | Precise 23-record status vocabulary and audience groups validate |
| OGL-GAP-015 | OPEN | Rollout validator passes with explicit dependency blocks; active Tier A coverage and browser acceptance remain open |

### OGL-5 Final Closure Update (2026-09-12)
The CivicSure Operator and Executive Command repository-local OGL contract/mount work is now represented in the registry, server catalog, protected routes, and semantic anchors. OGL-GAP-015 remains OPEN because BOS identity ownership, active Sales compatibility consumers, and destination-specific authenticated browser fixtures are unresolved; no later-phase gap is changed.

### OGL-5 Final Remediation Update (2026-09-12)
OGL-GAP-015 is closed for this remediation: authenticated BOS aliases normalize to `bos`, the active Sales Pipeline uses the canonical runtime, and the disposable authenticated fixture proves Student, Instructor, CivicSure Operator, Agent Fabric, Admin/Executive Command, and Studio browser routes. AOS and Trust Bureau remain precisely blocked by underlying product availability, not unfinished OGL work. Migration 139 applies cleanly in the disposable environment. No OGL-6 gap is changed.

### OGL-6 Final Closure Update (2026-09-12)
OGL-GAP-010, OGL-GAP-011, and OGL-GAP-012 are CLOSED at final OGL scope. Migration 140 adds organization/tenant-scoped presentation-only authoring versions, bounded authoring audit events, and allowlisted OGL telemetry. The existing admin shell exposes permission-gated draft/preview/publish/version-history and health views; `npm run ogl:validate` checks final registry/rollout/alternative/migration invariants. Analytics remain aggregate OGL experience metrics and never become Evidence or Truth. AOS and Trust Bureau remain external/product dependency classifications. OGL-0 through OGL-6 are complete; the next project is the separate Accessibility Layer Upgrade, which has not started.

| Gap ID | OGL-6 final status | Evidence |
|---|---|---|
| OGL-GAP-010 | CLOSED | Migration 140, bounded authoring service/API/UI, safe validation, lifecycle/versioning tests |
| OGL-GAP-011 | CLOSED | Allowlisted scoped telemetry table/API and aggregate health projection |
| OGL-GAP-012 | CLOSED | `npm run ogl:validate`, orientation/rollout validators, semantic/accessibility/fixture checks |
