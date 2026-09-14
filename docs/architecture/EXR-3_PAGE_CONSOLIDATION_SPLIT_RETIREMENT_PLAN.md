# EXR-3 — Page Consolidation / Split / Retirement Plan

## 1. Executive Result
EXR-3 reconciles 37 meaningful page surfaces and 20 dashboard-like surfaces against EXR-1 contracts and the EXR-2 information architecture. It is a declarative implementation plan. No route, page, navigation, permission, or source-domain workflow was changed. There are no EXR-3 P0 or repository-local P1 defects in the plan.

## 2. Repository Baseline
| Item | Value |
|---|---|
| Worktree | `/Users/mikeslate/Projects/shrv1-codex` |
| Branch | `codex/exr` |
| Base | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| Migration head | 142 |
| EXR-2 | Complete |

## 3. EXR-2 Inputs
The plan consumes `exrExperienceContracts.js`, `exrInformationArchitecture.js`, EXR-1 role/capability/journey contracts, and EXR-2’s Foundation, Solutions, Universe, Hub, contextual reporting, Accessibility placement, alias, and notification-slot decisions.

## 4. Consolidation Principles
Consolidate only when actor, authority, job, and lifecycle context align. Split when role goals or authority differ. A route is not retired until replacement, inbound links, deep links, permissions, and compatibility are reviewed. Navigation remains descriptive; server authorization remains authoritative. Frontend Design owns visual polish.

## 5. Master Page Disposition
The complete 37-record declarative registry is `src/system/exr/exrPageConsolidationPlan.js`. Counts: KEEP 7; KEEP_AND_POLISH 10; STREAMLINE 2; REORGANIZE 4; MERGE 1; SPLIT_BY_ROLE 4; MOVE 2; TURN_INTO_WORKFLOW 3; TURN_INTO_DETAIL_PAGE 1; TURN_INTO_QUEUE 3; TURN_INTO_DASHBOARD 0; REPLACE 0; RETIRE 0.

| Surface | Route | Actor | Current Type | Canonical Type | Disposition | Target | Priority | NCA Dependency | Frontend Design |
|---|---|---|---|---|---|---|---|---|---|
| Foundation Top/Mission | `/top` | public | landing | landing | KEEP | Foundation | P2 | No | No |
| Foundation Impact | `/impact` | public | report | report | KEEP_AND_POLISH | Impact | P3 | No | Yes |
| Public Apps | `/apps` | public | directory | directory | KEEP | Public apps | P2 | No | No |
| Solutions Home | `/solutions/home` | public | discovery | discovery | KEEP_AND_POLISH | Solutions | P2 | No | Yes |
| Hub Workspace | `/hub` | org operator/admin | dashboard | dashboard | REORGANIZE | Hub | P1 | Yes | No |
| Hub Action Queue | `/hub/queue` | operator | dashboard | queue | TURN_INTO_QUEUE | Hub queue | P1 | Yes | No |
| Hub Reports | `/hub/reports` | org operator/admin | report | report | STREAMLINE | Reporting | P2 | Yes | No |
| Executive Command | `/executive-command` | executive | dashboard | dashboard | KEEP_AND_POLISH | Executive | P2 | Yes | Yes |
| Reporting Command | `/reporting` | org/admin | dashboard | report | MERGE | Reporting | P1 | Yes | No |
| Release Assurance | `/release-assurance` | ARAG actor | workflow | workflow | KEEP | ARAG | P1 | No | No |
| Truth Spine | `/truth-spine` | authorized admin | detail | detail | KEEP_AND_POLISH | Truth | P2 | No | Yes |
| Oracle | `/oracle` | authorized admin | detail | detail | KEEP_AND_POLISH | Oracle | P2 | No | Yes |
| Agent Fabric | `/agent-fabric` | agent operator/admin | workspace | workspace | SPLIT_BY_ROLE | Agent workbench | P1 | No | No |
| Documentation Center | `/documentation` | user/admin | help | guidance | MOVE | Shared Help | P2 | No | Yes |
| Student Dashboard | `curriculum#/dashboard` | student | dashboard | dashboard | KEEP_AND_POLISH | Student | P1 | No | Yes |
| Lesson | `curriculum#/lesson/:id` | student/instructor | workflow | workflow | KEEP | Lesson | P1 | No | No |
| Parent Dashboard | `curriculum#/parent` | parent | dashboard | detail | SPLIT_BY_ROLE | Parent support | P2 | No | Yes |
| Calendar/Live Learning | `curriculum#/calendar` | learner/instructor | workflow | workflow | TURN_INTO_WORKFLOW | Sessions | P1 | No | No |
| Projects/Portfolio | `curriculum#/projects` | learner/instructor | workspace | workspace | REORGANIZE | Applied work | P2 | No | No |
| Career Dashboard | `career#/dashboard` | learner | dashboard | dashboard | KEEP_AND_POLISH | Career | P1 | No | Yes |
| Career Detail | `career#/pathways` | learner/public | dashboard | detail | TURN_INTO_DETAIL_PAGE | Career detail | P2 | No | No |
| Studio Home | `studio#/` | builder/QA/reviewer | workspace | workspace | REORGANIZE | Studio | P1 | Yes | No |
| Studio Project | `studio#/project/:id` | builder/QA/reviewer | workspace | workspace | KEEP | Project | P1 | No | No |
| Studio Builder | `studio#/builder` | builder | workflow | workflow | SPLIT_BY_ROLE | Builder | P1 | No | No |
| Studio QA | `studio#/qa` | QA | dashboard | queue | TURN_INTO_QUEUE | QA queue | P1 | No | No |
| Studio Review/Handoff | `studio#/review` | reviewer/admin | workflow | workflow | TURN_INTO_WORKFLOW | Review/handoff | P1 | Yes | No |
| CivicSure Explorer | `/civicsure` | public | dashboard | discovery | KEEP | CivicSure public | P2 | No | No |
| CivicSure Provider | `/operator/civicsure/provider` | provider | workspace | workspace | SPLIT_BY_ROLE | Provider | P1 | No | No |
| CivicSure Operator | `/operator/civicsure/operator` | operator | dashboard | queue | TURN_INTO_QUEUE | Operator queue | P1 | Yes | No |
| Organization Onboarding | `/operator/onboarding` | applicant/operator | dashboard | workflow | TURN_INTO_WORKFLOW | Onboarding | P1 | Yes | No |
| Accommodation | `/operator/accommodations` | requestor/reviewer | workflow | workflow | KEEP | Accommodation | P1 | No | No |
| Accessibility Operations | `/operator/accessibility-operations` | accessibility operator | dashboard | dashboard | KEEP_AND_POLISH | Operations | P1 | Yes | Yes |
| Accessibility Settings | `curriculum#/accessibility` | learner | settings | settings | MOVE | Account settings | P2 | No | No |
| OAS | `/oas` | public/user | guidance | guidance | REORGANIZE | OAS | P2 | No | No |
| Universe | `/universe` | public/user | discovery | discovery | KEEP_AND_POLISH | Universe | P2 | No | Yes |
| Arcade Shell | `arcade#/` | student | workspace | workspace | KEEP_AND_POLISH | Arcade | P2 | Yes | Yes |
| Store/Employer | `store#/` | public/org/employer | catalog | catalog | STREAMLINE | Catalog | P2 | Yes | No |

## 6. Dashboard Reclassification
Seven remain true dashboards: Student, Career, Hub Workspace, Hub Leadership, Executive Command, ARAG, and Accessibility Operations. Three become queues: Hub Queue, Studio QA, and CivicSure Operator. Five become workflows: Instructor Operations, Organization Onboarding, CivicSure Provider, Studio Review, and Agent Fabric. Two become landings: Parent and Studio Home. Two become reports: Reporting Command and Foundation Impact. One becomes discovery: CivicSure Public. The remaining dashboard-like entry is Universe discovery; the registry records all 20 explicitly.

| Classification | Count | Surfaces |
|---|---:|---|
| TRUE_DASHBOARD | 7 | Student, Career, Hub, Leadership, Executive, ARAG, Accessibility Operations |
| QUEUE | 3 | Hub, Studio QA, CivicSure Operator |
| WORKFLOW | 5 | Instructor, Onboarding, CivicSure Provider, Studio Review, Agent Fabric |
| LANDING | 2 | Parent, Studio Home |
| REPORT | 2 | Reporting Command, Foundation Impact |
| DISCOVERY | 1 | CivicSure Public |

## 7. Onboarding Consolidation
One stateful composition: public discovery → application → applicant case/status → reviewer queue/detail → approval → activation → first-service transition → entitled operating environment. Applicant status is a workflow/detail view, reviewer work is queue/detail, and full Hub navigation appears only after activation and entitlement.

## 8. Hub / BOS Consolidation
Hub is the SHS/BOS organization operating environment. Hub Workspace retains situational awareness, Hub Queue owns recurring work, Reporting is contextual, and executive/agent/release surfaces remain role-projected. SHF administration and unrestricted ecosystem discovery do not enter Hub.

## 9. Student / Curriculum Consolidation
Student remains a current-work dashboard. Lesson remains a workflow; calendar/live learning remains a workflow; projects/portfolio remains applied-work workspace. Arcade is a practice workspace. Distinct learning functions are not merged.

## 10. Instructor Consolidation
Instructor work is organized around review, sessions, and intervention queues. Student-facing dashboard assumptions are not reused as instructor authority.

## 11. Parent Consolidation
Parent is a bounded learner-support landing/detail experience, not a copy of Student or Instructor operations.

## 12. Career Consolidation
Career remains a dashboard for recurring progression. Pathways, opportunities, and credentials are detail/discovery surfaces.

## 13. Studio Consolidation
Studio keeps one project context with stage-specific role projections: Builder workspace → QA queue → Review/Handoff workflow. Builder, QA, and Reviewer authority remains separate.

## 14. CivicSure Consolidation
CivicSure Public is discovery; Provider is assigned evidence workspace; Operator is assurance queue. No surface mixes public, provider, and operator authority.

## 15. Accessibility Consolidation
Personal Accessibility moves to account/settings; Accommodation remains learner/support or organization workflow; Help/Companion remains shared Help; Accessibility Operations remains authorized operator navigation. AX-GAP-021 is resolved structurally without reopening AX.

## 16. Reporting Consolidation
Reporting is contextual: student progress in Curriculum, organization operations in Hub/Reporting, executive intelligence in Executive Command, public impact in Foundation/CivicSure, funding reports in authorized funding context, and Truth/Oracle in authorized inspection. No generic reports dump is proposed.

## 17. OGL / Help / Companion Consolidation
OGL remains orientation, DGAL remains documentation/agreement guidance, Companion remains bounded assistance, and human support remains escalation. Documentation moves into contextual Help; authorities do not merge.

## 18. Public Page Consolidation
Foundation is institutional entry, Solutions is service discovery, Universe is optional discovery, and Career/CivicSure/OAS/Impact/Store retain distinct public jobs. No competing universal home is introduced.

## 19. Notification-Like UI Handoff
Store, Arcade, CivicSure, Hub, Studio, and operations surfaces with bell/attention-like affordances are marked for later NCA integration. EXR-3 defines placement only; NCA owns state, recipients, content, persistence, and delivery.

## 20. Alias / Redirect Plan
The ten EXR-2 aliases remain explicit: seven `ALIAS_KEEP`/`CANONICAL` routes and three `REDIRECT_CANDIDATE` routes (`/reports`, `/ops/reports`, `/admin.html#/builder`). No alias is removed.

## 21. Duplicate Entry-Point Plan
Primary entries are contextual Hub, Curriculum, Studio, CivicSure, Help, and Reporting destinations. Secondary cards and deep links may remain while usage, permissions, and inbound links are measured. Reporting and report-like Hub entries converge on the governed Reporting target in EXR-4/EXR-5.

## 22. Page-Type Corrections
Dashboard → queue: Hub Action Queue, Studio QA, CivicSure Operator. Dashboard → workflow: Onboarding, Studio Review, Agent Fabric. Dashboard → report: Reporting Command. Dashboard → detail: Career Detail and bounded Parent support. Home → guidance: OAS. Home/dashboard → discovery: CivicSure Explorer and Universe.

## 23. Merge Decisions
| Source Surface(s) | Target Surface | Actor | Reason | Dependency | EXR-4? |
|---|---|---|---|---|---|
| Hub Reports, Reporting Command, `/reports`, `/ops/reports` | Governed Reporting | org/admin/report operator | one registry, contextual entries | report permissions and inbound links | Yes |

## 24. Split Decisions
| Current Surface | Actor Splits | Target Surfaces | Reason | EXR-4? |
|---|---|---|---|---|
| Agent Fabric | agent operator / SHS admin | workbench / oversight | distinct governance and actions | Yes |
| Parent Dashboard | parent | support landing / learner detail | bounded projection | No |
| Studio Builder | builder / neighboring roles | Builder / QA / Review | stage authority | Yes |
| CivicSure Provider | provider / operator | Provider / Operator | evidence vs assurance authority | Yes |

## 25. Move Decisions
| Surface | Current Location | Target Location | Reason |
|---|---|---|---|
| Documentation Center | admin/help mixed | contextual Shared Help | guidance is not admin work |
| Accessibility Settings | Curriculum route | Account/Settings entry | personal preference discoverability |

## 26. Workflow Conversion Decisions
Onboarding, Calendar/Live Learning, and Studio Review/Handoff become state-driven workflows. Their pages expose canonical next actions from domain/workflow projections.

## 27. Detail / Queue Conversion Decisions
Hub Action Queue, Studio QA, and CivicSure Operator become queues. Career Detail and bounded Parent support become detail views. Queue/detail conversion does not alter source authority.

## 28. Retirement Candidates
No page has `RETIRE` disposition. Four route families are future retirement candidates after replacement and compatibility review: `/reports`, `/ops/reports`, `/admin.html#/builder`, and `/hub/action-queue`. Safe phase is EXR-5 or a later approved compatibility window; no physical deletion occurs in EXR-3.

## 29. Frontend Design Deferrals
Twelve records carry a visual deferral: typography, focus styling, spacing, contrast polish, Operations Center, public, Student, Career, Executive, Truth/Oracle, Universe, Arcade, and documentation surfaces. Their architecture is not replaced for visual reasons.

## 30. EXR-4 Priority Tiers
P1_JOURNEY covers nine journeys: organization applicant, activated organization, student, instructor, Studio, CivicSure provider, CivicSure operator, BOS customer/operator, and accessibility support user. P2_STRUCTURAL covers consolidation and context work. P3_POLISH remains primarily Frontend Design.

## 31. Priority Journey Handoff
Highest priority is Organization Applicant because it is the entry path into activation and first entitled service. Activated Organization follows immediately; Student, Instructor, Studio, CivicSure, BOS, and Accessibility follow as bounded journey implementations.

## 32. NCA Integration Dependencies
Twelve surfaces are flagged `NCA_INTEGRATION_REQUIRED`: Hub, Hub Queue, Hub Reports, Executive Command, Reporting Command, Studio Home, Studio Review/Handoff, CivicSure Operator, Organization Onboarding, Accessibility Operations, Arcade, and Store/Employer. Integration is limited to neutral shell slots.

## 33. Consolidation Registry
`src/system/exr/exrPageConsolidationPlan.js` is the single declarative source for page dispositions, dashboard classification, aliases, NCA flags, retirement prerequisites, and EXR-4 backlog.

## 34. Validator
`npm run exr:consolidation:validate` validates 37 pages, 20 dashboard records, ten aliases, valid vocabularies, role-split dependencies, P1 backlog ownership, retirement prerequisites, and NCA boundaries.

## 35. Tests
`tests/exr-3-page-consolidation.test.mjs` covers page counts, dashboard classification, onboarding/Hub/Studio/CivicSure/Student boundaries, contextual Accessibility/reporting/help, aliases, retirement, NCA, and EXR-4 priorities.

## 36. P0 / P1 Findings
| Severity | Result |
|---|---|
| P0 | 0 |
| Repository-local P1 | 0; all P1 implementation items have EXR-4 owners |
| P2/P3 | Planned structural or visual work only |

## 37. Files Created
`src/system/exr/exrPageConsolidationPlan.js`, `scripts/validate-exr-page-consolidation.mjs`, `tests/exr-3-page-consolidation.test.mjs`, and this report.

## 38. Files Modified
`package.json` adds only `exr:consolidation:validate`; prior EXR-0/1/2 artifacts remain part of the Codex branch. No production route, page, shell, permission, or migration file was modified.

## 39. Git State
The branch remains uncommitted and unpushed. Main and Claude worktrees were not touched.

## 40. EXR-3 Decision
**EXR-3 COMPLETE.** All 37 page surfaces and all 20 dashboard-like surfaces have explicit structural dispositions. No active route is physically retired. NCA and Frontend Design boundaries are explicit, and the EXR-4 implementation backlog is finite.

## 41. Exact Next Phase
**EXR-4 — CANONICAL CUSTOMER JOURNEY IMPLEMENTATION.** Do not begin EXR-4 in this run.
