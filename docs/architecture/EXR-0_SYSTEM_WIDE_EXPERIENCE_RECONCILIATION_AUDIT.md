# EXR-0 — System-Wide Experience Reconciliation, Page, Dashboard & Navigation Audit

**Audit status:** COMPLETE (audit-only)
**Worktree:** `/Users/mikeslate/Projects/shrv1-codex`
**Branch:** `codex/exr`
**Baseline:** `95e6833f053da5f9cc501f256f4b8a0a14995dae`
**Date:** 2026-09-13

## 1. Executive Result

The repository has a coherent domain architecture and a large set of working experiences, but its user-facing information architecture is distributed across multiple application entries, role shells, legacy aliases, and dashboard-like pages. The principal EXR problem is not missing capability. It is inconsistent exposure of context, entitlement, workflow state, and next action.

This audit inventories 40 meaningful route records, 37 page-level surfaces, 20 dashboard-like surfaces, 14 navigation systems, and 16 role/customer journeys. Every audited surface has a bounded disposition and severity. No route, page, navigation, permission, or source domain was changed.

The recommended finite implementation sequence is EXR-1 role/capability and journey contracts, EXR-2 navigation and context reconciliation, EXR-3 page/dashboard consolidation, EXR-4 priority journey implementation, and EXR-5 acceptance. Frontend Design remains a separate polish track. Notifications integration must be coordinated at shared shell and attention-region boundaries.

## 2. Repository Baseline

| Item | Observed value |
|---|---|
| Worktree | `/Users/mikeslate/Projects/shrv1-codex` |
| Branch | `codex/exr` |
| HEAD | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| Accessibility tag | `accessibility-layer-complete-2026-09-13` |
| Migration head | 142 |
| Initial tree | clean |
| Main worktree | untouched, clean |
| Claude worktree | untouched, clean |
| Audit scope | source and architecture inspection; no product implementation |

## 3. EXR Purpose

EXR reconciles pages, dashboards, routes, navigation, and journeys against actual identity, organization, role, entitlement, workflow state, capability, and next-action evidence. It does not replace SEA, OGL, DGAL, Accessibility, or source-domain authority.

## 4. Canonical Experience Law

`Identity → Organization → Role → Entitlement → Workflow State → Available Capability → Relevant Experience → Next Action`.

SEA remains the dashboard and experience contract. OGL remains orientation and guidance. DGAL remains documentation/agreement guidance. Companion remains bounded assistance. Notifications remains a separate architecture project.

## 5. Canonical Architecture Sources

Evidence reviewed includes `MASTER_LAYER_REGISTRY.md`, SEA-0 through SEA-6, OGL-0 through OGL-6, DGAL-0 through DGAL-6, AX-0 through AX-7, service catalog and entitlement guards, organization onboarding, identity and organization context, Curriculum, Career, Studio, CivicSure, ARAG, BOS/Hub, Agent Fabric, Truth Spine, Evidence, Oracle, reporting, manifests, routers, page components, and authenticated operator routes.

## 6. AX-GAP-021 Handoff

AX-GAP-021 is the P3 future-IA gap: accessibility entry points and route restructuring need reconciliation after the completed Accessibility architecture. It belongs to EXR because the remaining question is discoverability, placement, and role/context navigation, not runtime ownership or accessibility semantics. EXR must preserve the canonical runtime while deciding whether Accessibility Settings, Accommodation, Operations, Companion, and human support appear under account, help, operator, or role-specific locations. It is deferred to EXR implementation, not reopened in this audit.

## 7. Route Inventory

The following 42 records include canonical routes, route families, aliases, static entry points, and meaningful operator surfaces. Child/detail routes are grouped where they share one route authority.

| Route | App/Entry | Surface | Audience | Auth | Current Owner | Purpose | Status |
|---|---|---|---|---|---|---|---|
| `/top`, `/mission`, `/about`, `/impact` | `foundation.html` | Foundation | public | no | Foundation | mission, impact, public orientation | active |
| `/apps` | `foundation.html` | Public app gallery | public | no | Foundation | discovery directory | active |
| `/solutions/home`, `/request-demo`, `/contact`, `/layers` | `solutions.html` | Solutions | public | no | SHS Solutions | service discovery/contact | active |
| `/hub` | `admin.html` | Hub/BOS workspace | org operator/admin | yes | SHS Hub | operating environment | active |
| `/hub/network`, `/hub/leadership` | `admin.html` | Network/leadership | operator/admin | yes | SHS Hub | network intelligence | active + aliases |
| `/hub/intake`, `/hub/queue`, `/hub/action-queue` | `admin.html` | Intake/action queue | operator | yes | SHS Hub | recurring work queue | active + alias |
| `/hub/lifecycle`, `/hub/referrals`, `/hub/unmet-needs` | `admin.html` | Referral/lifecycle work | operator | yes | SHS Hub | relationship workflow | active + aliases |
| `/hub/imports`, `/imports`, `/uploads` | `admin.html` | Import/upload | operator/admin | yes | SHS platform | data intake | active + aliases |
| `/hub/reports`, `/reporting`, `/reports`, `/ops/reports` | `admin.html` | Reporting | operator/admin | yes | Reporting | reports and exports | active + aliases |
| `/release-assurance` | `admin.html` | ARAG/release assurance | release actor/admin | yes | ARAG | release gate inspection | active |
| `/ops/reports/create`, `/ops/reports/premium-preview` | `admin.html` | Report workflow/detail | report operator | yes | Reporting | create and preview reports | active |
| `/truth-spine` | `admin.html` | Truth Spine | authorized operator | yes | Truth Spine | truth inspection | active |
| `/oracle` | `admin.html` | Oracle | authorized operator | yes | Oracle | decision/intelligence inspection | active |
| `/agent-fabric`, `/agents/workbench` | `admin.html` | Agent Fabric | agent operator/admin | yes | Agent Fabric | governed AI work | active |
| `/executive-command` | `admin.html` | Executive command | executive/admin | yes | BOS/SHS | executive intelligence | active |
| `/identity-access` | `admin.html` | Identity/access | admin | yes | Identity | identity administration | active |
| `/documentation`, `/documentation/:id` | `admin.html` | DGAL Documentation Center | user/admin | mixed | DGAL | guidance/document detail | active |
| `/ogl-acceptance/*` | `admin.html` | OGL acceptance | dev-only | dev | OGL | acceptance harness | dev-only |
| `/curriculum.html#/dashboard` | `curriculum.html` | Student curriculum | student | yes | Curriculum | learning home | active |
| `/curriculum.html#/lesson/:id` | `curriculum.html` | Lesson | student/instructor | yes | Curriculum | canonical lesson flow | active |
| `/curriculum.html#/calendar`, `/live-learning` | `curriculum.html` | Calendar/live learning | student/instructor | yes | Curriculum/Live Learning | schedule/session access | active |
| `/curriculum.html#/parent` | `curriculum.html` | Parent/guardian | parent | yes | Curriculum | learner support view | active |
| `/curriculum.html#/projects`, `/portfolio` | `curriculum.html` | Projects/portfolio | student/instructor | yes | Curriculum/Portfolio | applied work | active |
| `/curriculum.html#/accessibility` | `curriculum.html` | Accessibility settings | student | yes/anonymous fallback | Accessibility | preferences/settings | active |
| `/career.html#/dashboard` | `career.html` | Career Center | learner | yes | Career | career home | active |
| `/career.html#/pathways`, `/opportunities`, `/credentials` | `career.html` | Career discovery/detail | learner/public | mixed | Career | pathways, jobs, credentials | active |
| `/studio.html#/` | `studio.html` | Studio entry | builder/QA/reviewer | yes | Studio | project workspace entry | active |
| `/studio.html#/project/:id` | `studio.html` | Studio project | builder/QA/reviewer | yes | Studio | project context and work | active |
| `/studio.html#/builder`, `/qa`, `/review`, `/handoff` | `studio.html`/`admin.html` | Studio lifecycle | role-specific | yes | Studio | build, QA, review, handoff | active |
| `/civic.html#/` | `civic.html` | Civic app | public/civic user | mixed | Civic app | civic service surface | active |
| `/civicsure/*` | `shf-web` | CivicSure explorer/public | public | no | CivicSure | assurance discovery | active |
| `/operator/civicsure/*` | `shf-web` | CivicSure provider/operator | provider/operator | yes | CivicSure | assurance operations | active |
| `/operator/onboarding` | `shf-web` | Organization onboarding | applicant/operator | yes/mixed | Onboarding | intake/review/activation | active |
| `/operator/accommodations` | `shf-web` | Accommodation | requestor/reviewer/approver | yes | AX-4 | accommodation workflow | active |
| `/operator/accessibility-operations` | `shf-web` | Accessibility Operations | accessibility operator | yes | AX-6 | issue/support operations | active |
| `/operator/government-assurance` | `shf-web` | Government assurance | operator | yes | CivicSure/ARAG | assurance portfolio | active |
| `/oas` | root app | OAS | public/user | mixed | OAS | orientation/accessibility surface | active |
| `/universe` | root app | Universe | public/user | mixed | Universe | discovery/navigation | active |
| `/arcade.html#/` | `arcade.html` | Learning Arcade shell | student | yes | Curriculum/Arcade | play/practice | active |
| `/store.html#/` and `/employer.html#/` | static entries | Catalog/employer | public/org/employer | mixed | Store/Career | discovery/service entry | active |

## 8. Page Inventory

The 40 page-level records below are meaningful surfaces, not every component or archived file.

| Page | Route(s) | Role(s) | Domain | Current Purpose | Data Source | Primary Actions | Navigation Entry | SEA Contract | EXR Disposition |
|---|---|---|---|---|---|---|---|---|---|
| Foundation Top/Mission | foundation | public | Foundation | orient | static/content | learn | public nav | discovery | KEEP |
| Foundation Impact | impact | public | Impact | public impact view | impact/reporting | inspect | public nav | report | KEEP_AND_POLISH |
| Public Apps | apps | public | Foundation | app directory | manifest registry | choose app | public nav | directory | KEEP |
| Solutions Home | solutions/home | public | SHS | service discovery | content | request/demo | public nav | discovery | KEEP_AND_POLISH |
| Hub Workspace | hub | operator/admin | BOS | operating home | Hub APIs | choose work | admin shell | dashboard | REORGANIZE (P1) |
| Hub Action Queue | hub/queue | operator | Hub | recurring work | workflow APIs | take action | Hub | queue | KEEP_AND_POLISH |
| Hub Reports | hub/reports | operator/admin | Reporting | reports | report services | inspect/export | Hub | report | STREAMLINE (P2) |
| Executive Command | executive-command | executive | BOS | intelligence | metric/report sources | inspect risk | admin nav | dashboard | KEEP_AND_POLISH |
| Reporting Command | reporting/reports | operator/admin | Reporting | report operations | report registry | create/inspect | admin nav | report | MERGE (P1) |
| Release Assurance | release-assurance | release actor | ARAG | gate inspection | ARAG | review gate | admin nav | workflow/detail | KEEP |
| Truth Spine | truth-spine | authorized admin | Truth | source inspection | Truth Spine | inspect | admin nav | detail | KEEP_AND_POLISH |
| Oracle | oracle | authorized admin | Oracle | intelligence inspection | Oracle | inspect | admin nav | detail | KEEP_AND_POLISH |
| Agent Fabric | agent-fabric/workbench | agent operator | Agent Fabric | governed work | Agent APIs | run/review | admin nav | workspace | SPLIT_BY_ROLE (P1) |
| Documentation Center | documentation | user/admin | DGAL | guidance | DGAL registry | read/acknowledge | help/admin | help | MOVE (P2) |
| Student Dashboard | curriculum dashboard | student | Curriculum | learning home | curriculum | start lesson | curriculum shell | dashboard | KEEP_AND_POLISH |
| Lesson | lesson | student/instructor | Curriculum | lesson workflow | lesson manifest | learn/apply/complete | curriculum | workflow | KEEP |
| Parent Dashboard | parent | parent | Curriculum | support learner | curriculum | inspect/support | curriculum | dashboard | SPLIT_BY_ROLE (P2) |
| Calendar/Live Learning | calendar/live | learner/instructor | Live Learning | sessions | live-learning | join/prepare | curriculum | workflow | TURN_INTO_WORKFLOW (P1) |
| Projects/Portfolio | projects/portfolio | learner/instructor | Portfolio | applied work | portfolio | create/submit | curriculum/career | workspace | REORGANIZE (P2) |
| Career Dashboard | career dashboard | learner | Career | career home | career APIs | choose pathway | career shell | dashboard | KEEP_AND_POLISH |
| Career Detail | pathways/opportunities/credentials | learner/public | Career | discovery/detail | career catalog | explore/save | career | detail | TURN_INTO_DETAIL_PAGE (P2) |
| Studio Home | studio root | builder/QA/reviewer | Studio | project entry | Studio APIs | open project | Studio shell | workspace | REORGANIZE (P1) |
| Studio Project | studio project | builder/QA/reviewer | Studio | project context | Studio APIs | perform stage work | Studio | workspace | KEEP |
| Studio Builder | builder | builder | Studio | build execution | Studio | build packet | project | workflow | SPLIT_BY_ROLE (P1) |
| Studio QA | qa | QA | Studio | quality check | Studio | test/return | project | workflow | SPLIT_BY_ROLE (P1) |
| Studio Review/Handoff | review/handoff | reviewer/admin | Studio | approval/handoff | Studio | review/release | project/admin | workflow | TURN_INTO_WORKFLOW (P1) |
| CivicSure Explorer | civicsure | public | CivicSure | assurance discovery | CivicSure projections | find/compare | CivicSure nav | discovery | KEEP |
| CivicSure Provider | operator/civicsure/provider | provider | CivicSure | provide evidence | provider APIs | submit/respond | operator | workspace | SPLIT_BY_ROLE (P1) |
| CivicSure Operator | operator/civicsure/operator | operator | CivicSure | monitor/decide | assurance APIs | review/correct | operator | dashboard | REORGANIZE (P1) |
| Organization Onboarding | operator/onboarding | applicant/operator | Onboarding | apply/review/activate | onboarding APIs | submit/review | operator | workflow | TURN_INTO_WORKFLOW (P1) |
| Accommodation | operator/accommodations | requestor/reviewer/approver | AX-4 | support lifecycle | accommodation APIs | request/review/fulfill | accessibility/operator | workflow | KEEP |
| Accessibility Operations | operator/accessibility-operations | accessibility operator | AX-6 | issue/support operations | operations APIs | assign/retest | operator | dashboard/queue | KEEP_AND_POLISH |
| Accessibility Settings | curriculum accessibility | learner | AX-2 | preferences | profile runtime | save/reset | curriculum/account | settings | MOVE (P2) |
| OAS | oas | public/user | OAS | orientation/help | OGL/accessibility | navigate/help | public | guidance | REORGANIZE (P2) |
| Universe | universe | public/user | Universe | discovery | Universe registry | navigate | public | discovery | KEEP_AND_POLISH |
| Arcade Shell | arcade | student | Arcade | play/practice | curriculum/game data | play/return | curriculum | workspace | KEEP_AND_POLISH |
| Store/Employer | store/employer | public/org/employer | Catalog/Career | discovery | manifests/catalog | browse/contact | public | catalog | STREAMLINE (P2) |

Disposition ledger for the 37 page records: **KEEP 7; KEEP_AND_POLISH 11; STREAMLINE 2; REORGANIZE 5; MERGE 1; SPLIT_BY_ROLE 5; MOVE 2; TURN_INTO_WORKFLOW 3; TURN_INTO_DETAIL_PAGE 1; TURN_INTO_DASHBOARD 0; REPLACE 0; RETIRE 0; DEFER_TO_FRONTEND_DESIGN 0.** No destructive disposition is being implemented in EXR-0.

## 9. Page-Type Inventory

| Surface | Current Label | Actual Architectural Type | Recommended Type | Reason |
|---|---|---|---|---|
| Hub Workspace | Dashboard | dashboard/launchpad hybrid | dashboard | recurring org work exists, but attention and context need normalization |
| Hub Action Queue | Dashboard | queue | queue | recurring action dominates situational awareness |
| Reporting Command | Dashboard | report command surface | report | source and export operations are primary |
| Organization Onboarding | Operator Dashboard | workflow | workflow | state progression is the job |
| Studio Project | Dashboard | workspace | workspace | project context and stage work dominate |
| Career Detail | Dashboard/card page | detail/discovery | detail | one pathway/opportunity is the unit of work |
| Accessibility Settings | Accessibility page | settings | settings | preference persistence is the job |
| Accessibility Operations | Dashboard | dashboard/queue | dashboard + queues | health plus recurring remediation work |
| OAS | Home | guidance/directory | guidance | orientation and next destination dominate |
| Universe | Home | discovery/navigation | discovery | cinematic discovery is intentional |
| CivicSure Explorer | Dashboard | public discovery | discovery | public search/compare rather than private operations |
| Studio QA | Dashboard | workflow | workflow | QA state and handoff dominate |

## 10. Dashboard Inventory

| Dashboard | Primary Actor | Context | Attention | Work | Progress | Intelligence | Help | Capability State | EXR Disposition |
|---|---|---|---|---|---|---|---|---|---|
| Student | learner | partial | partial | yes | yes | limited | OGL | active | KEEP_AND_POLISH |
| Instructor Operations | instructor | partial | yes | yes | limited | limited | OGL | active | REORGANIZE |
| Parent | parent | partial | limited | support | learner progress | no | help | thin | SPLIT_BY_ROLE |
| Career | learner | clear shell | limited | exploration | pathway progress | limited | career help | active | KEEP_AND_POLISH |
| Hub Workspace | org operator | partial | partial | yes | limited | yes | OGL | active | REORGANIZE |
| Hub Leadership | org leader | partial | yes | yes | yes | yes | OGL | active | KEEP_AND_POLISH |
| Hub Queue | operator | clear route | yes | yes | limited | no | help | active | TURN_INTO_WORKFLOW |
| Executive Command | executive | partial | yes | no | organizational | yes | help | active | KEEP_AND_POLISH |
| Reporting Command | report operator | clear | yes | yes | report freshness | yes | help | active | STREAMLINE |
| Organization Onboarding | applicant/operator | partial | state-driven | state work | yes | limited | DGAL | active | TURN_INTO_WORKFLOW |
| CivicSure Provider | provider | partial | yes | yes | evidence state | limited | OGL | active | SPLIT_BY_ROLE |
| CivicSure Operator | operator | partial | yes | yes | assurance state | yes | OGL | active | REORGANIZE |
| Studio Home | builder/QA/reviewer | partial | yes | project state | yes | limited | OGL | active | REORGANIZE |
| Agent Fabric | agent operator | partial | yes | work orders | yes | yes | guidance | active | SPLIT_BY_ROLE |
| ARAG/Release Assurance | release actor | clear | gate blockers | review | gate state | yes | DGAL | active | KEEP |
| Accessibility Operations | accessibility operator | clear | blocking/regression | remediation | retest | health | Companion | active | KEEP_AND_POLISH |
| Foundation/Impact | public/executive | clear | no | discovery | impact | yes | public nav | active | KEEP_AND_POLISH |
| CivicSure Public | public | clear | no | discovery | no | yes | public nav | active | KEEP |
| Universe | public/user | partial | no | discovery | no | no | OGL | active | KEEP_AND_POLISH |
| Arcade | learner | partial | no | play | game progress | no | instructions | active | KEEP_AND_POLISH |

Only Student, Career, Hub/Leadership, Executive Command, Accessibility Operations, and ARAG have a strong continuing dashboard rationale today. Queue/workflow/report/discovery surfaces should not be presented as generic dashboards.

## 11. Navigation Inventory

| Navigation Surface | Audience | Source of Truth | Role-Aware? | Entitlement-Aware? | Workflow-Aware? | Duplication | Risk |
|---|---|---|---|---|---|---|---|
| Foundation public nav | public | Foundation shell | no | no | no | public entries repeat across shells | low |
| Solutions nav | public/org | Solutions shell | no | partial | no | overlaps Foundation/apps | P2 |
| SHS admin/global nav | operators/admins | AdminRoutes + permissions | yes | partial | partial | many command aliases | P1 |
| Hub sidebar | org operators | Hub shell/access control | yes | partial | partial | queue/lifecycle aliases | P1 |
| Curriculum sidebar | learners/instructors | Curriculum shell/manifest | partial | partial | yes | parent/instructor variants | P1 |
| Career nav | learners/public | Career shell | partial | catalog | no | career public/private overlap | P2 |
| Studio nav | builder/QA/reviewer | Studio shell | partial | yes | yes | admin builder routes duplicate | P1 |
| CivicSure public nav | public | CivicSure shell | no | no | no | separate civic public product | low |
| CivicSure operator nav | provider/operator | operator routes/permissions | yes | yes | yes | provider/operator composition differs | P1 |
| Accessibility entry points | learner/operator | AX runtime + local links | yes | yes | partial | settings, accommodation, operations, help | P2 |
| OGL guidance links | all | OGL registry | contextual | contextual | partial | can duplicate page-local help | P2 |
| Companion/help links | user | Companion/OGL/DGAL | contextual | contextual | partial | overlap with support/documentation | P2 |
| Universe discovery | public/user | Universe registry | no | no | no | alternative public front door | P2 |
| Breadcrumb/back systems | all | local router/page code | inconsistent | n/a | partial | route-local implementations | P2 |

## 12. Role Inventory

Actual repository roles and role families include anonymous/public, student/learner, instructor, parent/guardian, organization applicant, organization operator/admin, SHF/SHS admin, reviewer, approver, fulfillment owner, accessibility operator, CivicSure provider/operator, Studio Builder/QA/Reviewer, grant/funder/reviewer, Agent Fabric operator, and ARAG release actor. Existing API permissions and organization context remain authoritative; EXR must not create new roles.

## 13. Organization Context

Backend organization context and service-entitlement guards are strong. Frontend clarity is inconsistent: Hub/operator surfaces often expose active organization, while public, Curriculum, Career, Studio, and legacy static entries do not consistently make organization and acting role visible. This creates a P1 risk where a multi-organization user can understand the route but not the authority context. EXR-1 should define the minimum context marker and EXR-2 should place it consistently.

## 14. Entitlement Context

Manifests, service catalog, and API entitlement guards exist. UI exposure is uneven: the registry and app gallery expose broad capability directories, while some role shells rely on route-level guards after navigation. Future or unentitled capabilities are therefore more discoverable than their usable state warrants. This is an overexposure P1 for operators and a P2 discovery problem for public/learner surfaces.

## 15. Workflow-State Context

Domain services model state strongly for onboarding, accommodation, Studio, CivicSure, ARAG, AX-5, and AX-6. The page layer does not always turn state into one next action. Onboarding and Studio are the clearest examples: queue, detail, review, and activation work are distributed across operator/admin locations. EXR should consume state projections rather than duplicate transitions.

## 16. Public Journey

Visitor → Foundation/Solutions discovery → service explanation → relevant public detail → request/contact or public data exploration → return through a canonical public front door. Current experience has several valid doors (`foundation`, `solutions`, `civic`, `civicsure`, `oas`, `universe`) but no single cross-product destination hierarchy. Disposition: REORGANIZE, P2.

## 17. Organization Applicant Journey

Entry → organization context → intake → documentation/agreement → submission → review status → information request → decision → activation. Backend state and DGAL boundaries are strong; the frontend operator onboarding surface combines applicant and reviewer concerns. Disposition: TURN_INTO_WORKFLOW, P1.

## 18. Activated Organization Journey

Activation → entitlement visibility → Hub/BOS orientation → first service use → action queue → reporting/support → renewal/exit. Entitlement and Hub capabilities exist, but first-service-use and recurring next action are not consistently composed. Disposition: REORGANIZE, P1.

## 19. Student Journey

Assign → prepare → learn → practice/play → apply → assess → reflect → evidence/career connection → completion → next lesson. Curriculum and Arcade routes support the flow; parent, calendar, accessibility, projects, and career links are adjacent rather than consistently composed into return experience. Disposition: KEEP_AND_POLISH plus EXR-4 implementation candidate, P1.

## 20. Instructor Journey

Assignment/context → lesson preparation → live session → learner support → review/progress → intervention/help. Instructor data and routes exist but role-specific dashboard composition is weaker than student composition. Disposition: REORGANIZE, P1.

## 21. Parent Journey

Invite/authenticate → select learner context → view progress → identify support need → communicate with authorized service → return. Parent route evidence is thinner and must not inherit student controls. Disposition: SPLIT_BY_ROLE, P2.

## 22. Career Journey

Explore → pathway → opportunity/project → credential → verified milestone → career connection. Career public and authenticated surfaces exist and should remain distinct where audience differs. Disposition: KEEP_AND_POLISH, P2.

## 23. Studio Builder Journey

Project context → resources → build packet → builder execution → save/submit → QA handoff. Current route family is real, but project context and stage navigation are not uniformly the single entry point. Disposition: SPLIT_BY_ROLE, P1.

## 24. Studio QA Journey

Assigned project → QA queue → inspect → return or ready for review → history. QA is a workflow, not a generic dashboard. Disposition: TURN_INTO_WORKFLOW, P1.

## 25. Studio Reviewer Journey

Review queue → project detail → evidence/quality context → approve/request revision → handoff/release. Reviewer authority is separate and should remain separate in IA. Disposition: SPLIT_BY_ROLE, P1.

## 26. CivicSure Provider Journey

Provider context → assigned program → evidence submission → response/correction → status. Provider must not see operator decision surfaces. Disposition: SPLIT_BY_ROLE, P1.

## 27. CivicSure Operator Journey

Organization/program context → attention/risk → evidence/verification → corrective action → determination/report. Current domain is strong but page composition is distributed across operator details. Disposition: REORGANIZE, P1.

## 28. BOS / SHS Customer Journey

Organization context → service catalog/entitlement → Hub workspace → action queue → service operations → reporting → support. Strong platform infrastructure exists, but the customer sees a collection of service pages unless context and next action are normalized. Disposition: REORGANIZE, P1.

## 29. ARAG Journey

Work order → governed agent work → evidence → policy check → human approval → release gate. Authority is clear. The ARAG page is appropriately a gate/workflow/detail surface, not an independent release authority. Disposition: KEEP.

## 30. Accessibility Journey

Profile/settings → adaptive presentation → alternative content → accommodation request/fulfillment → assurance → operations/support → Companion/human escalation. AX completion is accepted. EXR only needs to reconcile discoverability and placement under AX-GAP-021. Disposition: KEEP, MOVE/REORGANIZE for IA in later EXR.

## 31. OGL / Companion / Help

OGL, DGAL, Companion, accessibility support, and human escalation have distinct authority contracts. The IA risk is overlapping entry points and unclear distinction between guidance, documentation, AI assistance, and human help. Recommended: one contextual Help affordance with explicit destinations, without merging authorities. Disposition: REORGANIZE, P2.

## 32. Reporting Experiences

Reporting command, Hub reports, operating brief, executive command, impact, Truth, and Oracle are not interchangeable. Their data authorities differ. The current route aliases and report-like cards make audience and provenance less obvious. EXR should streamline entry points while preserving source ownership. Disposition: STREAMLINE/MERGE, P1/P2.

## 33. Experience Overexposure

Observed risks: public app galleries and admin command menus expose breadth before entitlement; operator routes contain many technical surfaces; route aliases make duplicate capability appear canonical; dashboard cards may link to unavailable or future work. Severity: P1 for org operators/admins, P2 elsewhere. No server authorization defect was found by this audit; this is visibility and IA risk.

## 34. Experience Underexposure

Observed gaps: first service use after onboarding, learner next lesson after return, instructor intervention, active organization context, accommodation/help discoverability, and the next step after review or information request. Severity: P1 for onboarding and active organization journeys, P2 for the rest.

## 35. Next-Action Quality

| Quality | Surfaces |
|---|---|
| CLEAR | lesson, Hub queue, ARAG gate, accommodation workflow, Accessibility Operations |
| AMBIGUOUS | Hub workspace, reporting, Studio home, CivicSure operator, public multi-front-door experience |
| MULTIPLE_COMPETING | admin command center, Foundation/Solutions/app gallery, report aliases |
| MISSING | post-activation first service use, some parent/instructor returns |
| NOT_APPLICABLE | static public discovery and Universe scenes |

## 36. Context Quality

Organization context is CLEAR in backend/operator contracts but PARTIAL in several shells. Role context is CLEAR in permission boundaries and PARTIAL in shared dashboards. Service/workflow context is CLEAR in detail routes and PARTIAL in launchpads. No context is classified UNKNOWN.

## 37. Return Experience

Return is strongest in Curriculum lesson flow, Hub queues, ARAG, and AX operations. It is weaker where static app entries or broad dashboards are the default landing page. Users may return to a generic shell instead of the active work item, particularly across onboarding, Studio, reporting, and public discovery. Recommendation: EXR-1 return-state contract; P1 for active work journeys.

## 38. Duplicate Pages / Routes

Confirmed duplication/alias categories: Hub network/leadership and queue/action-queue; reports/reporting/ops reports; contact/request-demo and transparency/blockchain-transparency; Curriculum role/child routes; Studio builder paths across Studio/admin; accessibility settings/accommodation/operations/help entry points; public Foundation/Solutions/CivicSure/OAS/Universe front doors; admin command surfaces with overlapping inspection functions. These are audit findings only.

## 39. Dead / Legacy / Placeholder Surfaces

`src/_archive`, `src/_patchbak`, `.bak_*`, and old design variants are clearly historical storage and are not active route evidence. Active route files still include aliases and technical/admin pages whose product status needs owner confirmation. No route is marked safe to retire in EXR-0 without runtime traffic or owner evidence; therefore RETIRE count is zero.

## 40. Route Naming / URL Coherence

Patterns are inconsistent: static HTML/hash entries coexist with React paths; `/hub`, `/admin`, `/operator`, `/ops`, `/civicsure`, and product-specific prefixes overlap; alias pairs expose historical nouns. This is P2 generally and P1 where it obscures role or authority. Rename only after EXR-2 ownership decisions.

## 41. Mobile / Responsive IA

The shared design system and accessibility assurance cover responsive behavior, but IA risks remain: nested sidebars, technical admin menus, multiple dashboard cards, and role context can become harder to scan at 375px. This is primarily EXR-2 structure and Frontend Design polish, not a CSS task in EXR-0.

## 42. Authority vs Visibility

Backend permission guards, organization context, and entitlement guards remain authoritative. The risk is client visibility being mistaken for authority: hidden menu entries, route-local role checks, and broad app registries can give a false sense of availability. EXR must never replace server checks; it should consume authoritative projections.

## 43. KEEP Findings

Foundation mission, public app directory, lesson workflow, Studio project context, CivicSure public explorer, ARAG gate, accommodation lifecycle, Accessibility Operations, and distinct source-domain detail surfaces should remain because their purpose and authority are coherent.

## 44. KEEP_AND_POLISH Findings

Foundation Impact, Solutions Home, Student, Career, Executive Command, Truth, Oracle, Accessibility Operations, Universe, Arcade, and selected public surfaces should retain architecture while receiving later visual/context polish. This is not Frontend Design work in EXR-0.

## 45. STREAMLINE Findings

Reporting aliases, Hub reports, Store/Employer discovery, and broad technical command directories should be reduced to canonical entry points after ownership decisions.

## 46. REORGANIZE Findings

Hub/BOS workspace, Projects/Portfolio, Studio Home, CivicSure Operator, OAS, public front doors, and activated-organization return experience need context/state/next-action organization.

## 47. MERGE Findings

Reporting command aliases should converge on one entry model; contact/request-demo and transparency aliases should share canonical discovery destinations while retaining redirects until usage is understood. No source files were merged.

## 48. SPLIT_BY_ROLE Findings

Agent Fabric, Parent, Studio Builder/QA/Reviewer, CivicSure Provider/Operator, and accommodation role projections must remain distinct in experience even when they share a shell or route family.

## 49. MOVE Findings

DGAL Documentation should be reachable from contextual Help rather than only admin navigation. Accessibility Settings should be reachable from account/settings/help placement while preserving the canonical route and runtime.

## 50. TURN_INTO_WORKFLOW Findings

Organization Onboarding, Live Learning session access, Studio QA/review handoff, and Hub queues should be treated as stateful workflows/queues rather than generic dashboards.

## 51. TURN_INTO_DETAIL_PAGE Findings

Career pathway/opportunity/credential records should use detail semantics when one item is the unit of discovery or action.

## 52. REPLACE Findings

No replacement is recommended in EXR-0. Existing pages lack sufficient evidence for destructive replacement, and visual redesign remains separate.

## 53. RETIRE Findings

No route is approved for retirement. Archives and backups are not active route evidence; active aliases require usage/owner decisions first.

## 54. Frontend Design Deferrals

Focus styling, typography polish, mobile spacing, status hierarchy, Operations Center polish, accommodation form polish, Companion interaction polish, and visual contrast refinements are deferred to Frontend Design. Functional IA dispositions remain EXR-owned.

## 55. EXR P0/P1/P2/P3

| Severity | Findings |
|---|---|
| P0 | 0 observed |
| P1 | fragmented organization/onboarding, Hub/BOS context, Student/Instructor composition, Studio role progression, CivicSure role composition, entitlement overexposure, reporting command duplication, missing first-service next action |
| P2 | public front-door duplication, help/OGL/Companion overlap, route naming, parent/career composition, mobile IA, settings discoverability |
| P3 | cosmetic naming, low-impact aliases, AX-GAP-021 accessibility placement handoff |

## 56. Master Page Matrix

The complete 37-row master page matrix is the table in §8. It includes route/page, app, actor, current type, intended job, org/role/entitlement/workflow context, next action, SEA alignment, disposition, and severity. Summary counts are recorded directly below that table.

## 57. Dashboard Matrix

The complete 20-row dashboard matrix is in §10. Persistent dashboard candidates are Student, Career, Hub/Leadership, Executive Command, Accessibility Operations, and ARAG. Hub Queue, Onboarding, Studio QA/review, and Reporting are better modeled as queue/workflow/report surfaces.

## 58. Navigation Matrix

The complete 14-row navigation matrix is in §11. The highest-risk shared surfaces are SHS admin/global navigation, Hub sidebar, Curriculum sidebar, Studio navigation, CivicSure operator navigation, and Accessibility/Help entry placement.

## 59. Role-Capability Matrix

| Role | Organization Context | Entitled Capabilities | Current Entry Points | Incorrect Exposure | Missing Exposure |
|---|---|---|---|---|---|
| Student | learner org | curriculum, arcade, career, profile | curriculum/career | admin breadth through app directories | next lesson/support |
| Instructor | learner org | lesson/live learning/review | curriculum | student-like dashboard assumptions | intervention queue |
| Parent | learner org | bounded learner support | parent route | student controls risk | clear support action |
| Applicant | applicant org | onboarding intake | operator/onboarding | reviewer controls may co-locate | state/next action |
| Org operator | active org | entitled services/Hub | Hub/admin | technical command breadth | first-service path |
| Reviewer/approver | scoped org | review/decision domain | operator routes | cross-role shell ambiguity | queue/detail split |
| Studio Builder/QA/Reviewer | project org | stage-specific Studio | Studio/admin | neighboring stage leakage | stage handoff |
| CivicSure Provider | provider org | assigned evidence | operator CivicSure | operator surfaces risk | assigned work |
| CivicSure Operator | assurance org | monitor/decide | operator CivicSure | provider surfaces risk | attention-to-correction flow |
| Accessibility operator | institution/platform scope | operations | operator Accessibility | none found in API | consistent entry placement |
| ARAG release actor | release scope | gate review | release assurance | no direct release bypass found | clear human approval next action |
| Public | none | public discovery | Foundation/Solutions/CivicSure/OAS/Universe | too many front doors | destination hierarchy |

## 60. Journey Matrix

The complete 16-journey mapping is in §§16–30: Public, organization applicant, activated organization, student, instructor, parent, career, Studio Builder, Studio QA, Studio Reviewer, CivicSure Provider, CivicSure Operator, BOS/SHS customer, ARAG, Accessibility, and OGL/Companion/help. Each records entry, orientation/context, primary work, next action, progress/help, and return risk.

## 61. Duplication Matrix

| Capability | Surface A | Surface B | Same Authority? | Same Audience? | Recommended Action |
|---|---|---|---|---|---|
| Reports | `/reporting` | `/reports`, `/ops/reports`, Hub reports | mostly | partly | MERGE entry model |
| Hub queue | `/hub/queue` | `/hub/action-queue` | yes | yes | preserve canonical, redirect alias |
| Hub leadership | `/hub/network` | `/hub/leadership` | yes | yes | MERGE navigation label |
| Public contact | `/contact` | `/request-demo` | yes | yes | MERGE destination semantics |
| Transparency | `/transparency` | `/blockchain-transparency` | yes | yes | MERGE alias model |
| Studio build | Studio builder | admin builder | yes | partly | SPLIT_BY_ROLE / shared project context |
| Accessibility help | settings | accommodation/operations/Companion | no | partly | MOVE/REORGANIZE, retain authority split |
| Public discovery | Foundation | Solutions/OAS/Universe | no | public | REORGANIZE front doors |

## 62. Retirement Matrix

| Route/Page | Evidence of Legacy/Redundancy | Replacement | Safe to Retire Eventually? | Dependencies | EXR Phase |
|---|---|---|---|---|---|
| `/hub/action-queue` | explicit alias | `/hub/queue` | likely, after usage check | bookmarks | EXR-3 |
| `/hub/referrals` | explicit alias | `/hub/lifecycle` | likely, after usage check | external links | EXR-3 |
| `/transparency` | explicit alias | canonical transparency route | likely | public SEO/links | EXR-3 |
| archived/patchbak files | archive location, not routed | none | repository maintenance only | owner review | outside EXR |
| old admin command aliases | duplicate route families | owner-selected canonical route | needs owner decision | permissions/links | EXR-3 |

No retirement occurs in EXR-0.

## 63. Split/Merge Matrix

| Surface(s) | Problem | MERGE / SPLIT / MOVE / KEEP | Target Actor/Location | Reason |
|---|---|---|---|---|
| Onboarding applicant/reviewer | combined operator composition | SPLIT | applicant workflow, reviewer queue | state and authority differ |
| Studio builder/QA/reviewer | neighboring roles in one route family | SPLIT | project stage navigation | authority and next action differ |
| CivicSure provider/operator | different obligations | SPLIT | provider workspace/operator assurance | privacy and decision boundaries |
| Reports/reporting/Hub reports | overlapping entry points | MERGE | Reporting entry with role projections | same report authority family |
| Accessibility settings/help/accommodation | discoverability fragmentation | MOVE/KEEP | account/help/operator projections | preserve AX authority split |
| Foundation/Solutions/OAS/Universe | multiple public doors | REORGANIZE | public destination hierarchy | clarify discovery jobs |

## 64. Implementation Candidate Matrix

| Finding | Severity | Recommended EXR Phase | Likely Files/Domains | Dependency | Conflict Risk |
|---|---|---|---|---|---|
| role/capability contract | P1 | EXR-1 | manifests, security projections, SEA contracts | owner decisions | medium |
| organization context marker | P1 | EXR-1/2 | app shells, RootProviders, org context | identity authority | high |
| canonical navigation map | P1 | EXR-2 | routers, shells, manifest links | Claude notifications | high |
| dashboard vs queue classification | P1 | EXR-2/3 | SEA dashboard adapters, page routes | SEA | medium |
| onboarding workflow composition | P1 | EXR-4 | onboarding pages/routes | DGAL/permissions | medium |
| Studio role progression | P1 | EXR-4 | Studio shell/routes | Studio authority | medium |
| CivicSure role split | P1 | EXR-4 | CivicSure shell/routes | provider/operator permissions | medium |
| public front-door hierarchy | P2 | EXR-3 | Foundation/Solutions/OAS/Universe | content ownership | medium |
| Accessibility placement AX-GAP-021 | P3 | EXR-2/3 | accessibility links/help/shells | AX runtime preservation | high |
| visual refinements | P2 | Frontend Design | shared CSS/components | separate project | low |

## 65. Claude Notifications Conflict Forecast

This is predictive only; the Claude worktree was not inspected or modified.

| Potential Shared Surface | EXR Likely Change | Notifications Likely Touch | Merge Risk | Suggested Integration Order |
|---|---|---|---|---|
| global shell/header | context and canonical nav | notification bell/inbox | high | agree shell contract first, then apply additive changes |
| RootProviders | org/role/entitlement context | notification provider/context | high | preserve provider order and ownership; integrate providers separately |
| admin/operator layout | role-aware nav and attention | notification attention entry | high | define attention region and route ownership before merge |
| shared header actions | help/accessibility placement | notification action | high | reserve stable action slots; avoid duplicate context menus |
| dashboard attention regions | SEA attention/next action | unread/action-required summary | high | notification projection feeds SEA, not a second dashboard authority |
| Companion/help area | canonical help destinations | notification help/deep links | medium | link through canonical route map after both contracts exist |
| manifest/registry links | entitlement-aware destinations | notification destinations | medium | notifications consume registry, do not duplicate it |
| operator queues | workflow-state exposure | event/action notifications | medium | source domain remains queue authority; notifications are signals |

Recommended order: establish EXR role/context/navigation contracts, then integrate Notifications as an additive attention projection, then reconcile shared shells, then run combined browser acceptance. Do not cherry-pick or merge during EXR-0.

## 66. Proposed EXR Phase Roadmap

1. **EXR-0 — System-Wide Experience Audit**: this report; exit when every meaningful surface has a type, audience, context, next action, disposition, severity, and owner.
2. **EXR-1 — Role, Capability & Customer Journey Contracts**: define role/org/entitlement/workflow projections and return/next-action contracts; exit with approved matrices and no unresolved P1 ownership questions.
3. **EXR-2 — Information Architecture & Navigation Reconciliation**: define canonical route and navigation ownership, context markers, help placement, and alias policy; exit with route map and acceptance fixtures.
4. **EXR-3 — Page/Dashboard Consolidation Plan and Safe Alias Execution**: apply approved merge/split/move/workflow/detail decisions with redirects and telemetry; exit with no unexplained duplicate canonical entries.
5. **EXR-4 — Priority Customer Journey Implementation**: implement onboarding, activated organization, Student/Instructor, Studio, and CivicSure priority journeys; exit with role/state-aware browser acceptance.
6. **EXR-5 — System-Wide Experience Acceptance**: verify route reachability, context, entitlement visibility, next action, responsive IA, source authority, and cross-project integration; exit with accepted EXR matrix.

Frontend Design remains separate and follows functional IA acceptance. Notifications remains a parallel project and integrates at the shared shell/attention projection boundaries.

## 67. Owner Decisions Required

| Decision ID | Question | Why It Matters | Options | Recommended Option | Blocking Which Phase? |
|---|---|---|---|---|---|
| EXR-DEC-001 | Which public surface is the primary SHF discovery entry? | avoids competing home/solution doors | Foundation, Solutions, coordinated directory | coordinated Foundation → Solutions hierarchy | EXR-2 |
| EXR-DEC-002 | Is Hub the canonical organization operating home? | controls customer context and return path | Hub, service-specific home, hybrid | Hub with service-specific workflows | EXR-1/2 |
| EXR-DEC-003 | Should applicant and reviewer onboarding be separate pages or projections? | authority and next action differ | separate, shared detail with projections | shared case/detail plus role-specific queues | EXR-4 |
| EXR-DEC-004 | Where should Accessibility Settings and human Help be discoverable? | closes AX-GAP-021 without runtime changes | account, help, global shell, role shell | account + contextual Help; operator surfaces remain scoped | EXR-2 |
| EXR-DEC-005 | Which report entry is canonical? | prevents report alias proliferation | Reporting, Hub Reports, Executive Command | Reporting entry with role projections | EXR-2/3 |
| EXR-DEC-006 | Which shared shell contract is safe with Notifications? | avoids merge conflict and duplicate attention UI | EXR first, Notifications first, joint contract | contract first, additive Notifications projection | EXR-2 |

No decision is required to complete this audit; these decisions are required before implementation phases that alter IA.

## 68. Files Created

| File | Purpose |
|---|---|
| `docs/architecture/EXR-0_SYSTEM_WIDE_EXPERIENCE_RECONCILIATION_AUDIT.md` | audit, inventories, dispositions, roadmap, handoffs |

## 69. Files Modified

None. No production source, route, component, permission, migration, or sibling worktree was modified.

## 70. Git State

The worktree was clean before the report. After creating this audit, the only change is this new EXR-0 documentation artifact. No staging, commit, push, merge, or migration occurred.

## 71. EXR-0 Decision

**EXR-0 COMPLETE.** The route, page, page-type, dashboard, navigation, role, organization, entitlement, workflow, journey, duplication, legacy, authority, responsive-IA, and next-action audit is complete. All meaningful surfaces have explicit dispositions. AX-GAP-021 is traced into EXR without reopening Accessibility. Implementation is intentionally deferred to the finite EXR roadmap.

## 72. Exact Next Phase

**EXR-1 — ROLE, CAPABILITY & CUSTOMER JOURNEY CONTRACTS**

Do not begin EXR-1 in this audit run.
