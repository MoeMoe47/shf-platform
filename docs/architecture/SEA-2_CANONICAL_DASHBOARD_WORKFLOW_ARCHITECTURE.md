# SEA-2 — CANONICAL DASHBOARD & WORKFLOW ARCHITECTURE

## 1. Executive Result
SEA-2 is complete as a machine-readable dashboard and workflow projection architecture. It translates SEA-1 service contracts into role-specific Context, Attention, Work, Progress, Intelligence, Help, and canonical Next Action projections. It does not grant domain authority, redesign dashboards, create mocks, or alter service state.

## 2. Repository Baseline
| Item | Value |
|---|---|
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| HEAD | `c775466f5de6f86a7e4d4230434e0d56c17c0a7f` |
| Migration head | 140 |
| SEA-1 authority | `src/system/sea/serviceExperienceContracts.js` |
| SEA-2 authority | `src/system/sea/dashboardArchitecture.js` |
| Scope | Architecture, validator, tests, documentation; no broad UI implementation |

## 3. SEA-2 Gap IDs
| Gap ID | Severity | Service | Finding | SEA-2 Remediation | Acceptance |
|---|---|---|---|---|---|
| SEA-GAP-001 | P1 | Student | Dashboard composition needed a reusable structure | Learner projection defined; implementation remains SEA-4 | Validator and focused tests pass |
| SEA-GAP-002 | P1 | Instructor | Role-specific decision model was not standardized | Instructor projection separated from learner | Role separation test passes |
| SEA-GAP-004 | P1 | CivicSure | Provider/operator attention semantics needed a shared model | Distinct Provider and Operator projections | Role and authority tests pass |
| SEA-GAP-005 | P1 | Studio | Handoff states needed explicit role presentation | Builder, QA responsibility, and Reviewer projections | Authority and variant tests pass |
| SEA-GAP-006 | P1 | Agent/ARAG | Governed work and human gate needed projection structure | Governed AI and release-assurance projections | WF-040/release boundary tests pass |
| SEA-GAP-007 | P1 | Reporting | Metric provenance needed presentation semantics | Reporting/Truth projection and source status model | Evidence/Truth tests pass |
| SEA-GAP-009 | P1 | Cross-service | Action, waiting, blocked, and risk states were inconsistent | Canonical attention vocabulary and source semantics | Validator and focused tests pass |
| SEA-GAP-011 | P2 | Notifications | Notification meanings were fragmented | Notification categories project into attention/work/next action | Architecture documented; implementation SEA-4/5 |
| SEA-GAP-015 | P2 | Shared shell | Dashboard IA semantics were not standardized | Pattern library, action hierarchy, and section obligations | Validator passes |
| SEA-GAP-016 | P2 | Legacy routes | Canonical ownership needed explicit projection bindings | Projection IDs reference service contracts, not route-local authority | Registry validation passes |
| SEA-GAP-018 | P3 | Companion | Context permissions were not uniform | Help projection defines bounded read-only Companion placement | Authority tests pass |

## 4. Canonical Dashboard Principle
Dashboards are decision-oriented projections, not database views. The canonical order is `CONTEXT -> ATTENTION -> WORK -> PROGRESS -> INTELLIGENCE -> HELP`, with a role-specific priority order and one dominant canonical next action.

## 5. Workflow-to-Dashboard Projection
`DOMAIN STATE -> EXPERIENCE PROJECTION -> CONTEXT -> ATTENTION -> WORK -> PROGRESS -> INTELLIGENCE -> HELP -> CANONICAL NEXT ACTION`. The projection may prioritize and explain state, but eligibility and transitions remain owned by the service contract and domain.

## 6. Dashboard Projection Schema
`DASHBOARD_PROJECTIONS` contains 19 projections for 15 Tier A services. Each projection has a service and SEA-1 contract version, authorized role, responsibility variant, section obligations, source-backed state fields, action hierarchy, help composition, notification categories, source status, responsive priority, density, and authority notes.

## 7. Context
Context identifies service, role, organization/tenant where applicable, current work object, workflow stage, and status. It orients the user and is not a KPI dump.

## 8. Attention
Supported types are `ACTION_REQUIRED`, `WAITING`, `BLOCKED`, `AT_RISK`, `DEADLINE`, `REVIEW_REQUIRED`, and `APPROVAL_REQUIRED`. Items must carry reason, source, responsible actor, urgency, and only a domain-authorized safe action.

## 9. Work
Work represents current domain objects: assignments, applications, evidence submissions, review queues, workspaces, work orders, documents, reports, or release-assurance packets. Raw tables are not a required representation.

## 10. Progress
Progress is a domain state or projection such as lesson stage, onboarding lifecycle, verification stage, QA/review state, document state, or release gate. Invented percentages are prohibited.

## 11. Intelligence
Intelligence is decision-useful source-backed information, including verified metrics, exceptions, freshness, readiness, and risk signals. Decorative KPI strips do not satisfy this obligation.

## 12. Help
Help composes the canonical OGL Guidance Center, orientation/tour, accessible guide, DGAL documents, bounded Companion, and related workflow help. SEA does not duplicate those authorities.

## 13. Canonical Next Action
Every projection declares an authorized source: `DOMAIN_SERVICE`, `DOMAIN_PROJECTION`, `WORKFLOW_STATE_MACHINE`, or `OGL_RESOLVER`. The action includes label, priority, safe action reference, explanation, blocked behavior, waiting behavior, and honest fallback behavior. A dashboard cannot invent eligibility or action authority.

## 14. Action Hierarchy
Actions are `PRIMARY`, `SECONDARY`, and `REFERENCE`. There is normally one dominant primary action; secondary actions support it; reference/help actions do not compete with required work.

## 15. Action Required vs Waiting
`ACTION_REQUIRED` means the current actor owns the next meaningful action. `WAITING` means another actor, system, or external dependency owns it. Waiting identifies that owner and is never presented as unfinished user work.

## 16. Blocked
`BLOCKED` identifies a canonical blocked object, reason, owner, prerequisite, safe remediation if available, help, and source status. It does not infer a remediation from a missing UI field.

## 17. At Risk
`AT_RISK` is reserved for supported signals such as overdue requirements, failed QA, policy violations, verification issues, release-gate issues, or deadline risk. Arbitrary low metrics cannot create risk.

## 18. Source Status
Sections support `AVAILABLE`, `PARTIAL`, `UNAVAILABLE`, `STALE`, and `NOT_APPLICABLE`. The dashboard must distinguish source failure from an empty result.

## 19. Empty / Partial / Error States
“No action required” is valid only when an available source confirms it. Partial and unavailable sources remain visible as such, and optional source failure does not make the whole dashboard unusable. Loading is section/source scoped where implementation permits.

## 20. Recent Activity
Recent activity is `REQUIRED`, `OPTIONAL`, or `NOT_APPLICABLE` by projection. It is not a universal feed requirement and must remain source-backed.

## 21. Notification Integration
Notification categories such as `ACTION_REQUIRED`, `STATE_CHANGED`, `BLOCKER`, and `RESOLVED` project into Attention, Work, and Next Action. Existing notification/domain authorities remain canonical; SEA creates no notification authority.

## 22. Role-Specific Architecture
Roles and responsibility variants are distinct where jobs differ. A responsibility variant may share a server-authorized role when repository authority does so, as with Studio QA under the reviewer permission.

## 23. Student
Learner context includes program, course, and learning stage. Work is assignment, lesson, or active project; progress is domain learning state; help is OGL/DGAL/Companion. Student is mobile/tablet priority and cannot certify learning or issue credentials.

## 24. Instructor
Instructor context includes course and cohort. Work is assignment review, preparation, and cohort work; attention includes review and deadlines; progress is cohort/learner projection. It does not reuse learner-only actions or expose unauthorized private data.

## 25. Onboarding Applicant
Applicant projection covers application tasks and documents through the domain lifecycle. Missing information is action-required or blocked; reviewer-owned work is waiting. It cannot approve, activate, suspend, exit, or grant entitlements.

## 26. Onboarding Reviewer
Reviewer projection covers queue and active case, with review-required attention and workflow-state next action. It is not the applicant projection and does not grant activation authority.

## 27. CivicSure Provider
Provider work is evidence submission and correction response. Progress is verification status visible to the provider. It cannot verify, decide, publish, or act as payment/accounting authority.

## 28. CivicSure Operator
Operator work is verification queue and active review case. Attention includes review, exceptions, corrective action, and assurance risk. Human verification authority remains in CivicSure; the projection does not automate consequential decisions.

## 29. Studio Builder
Builder work is workspace and Build Packet, with build blockers and readiness for QA. Builder cannot QA-approve, review, or release.

## 30. Studio QA
The QA responsibility variant uses the repository-authorized reviewer role and a distinct `studio:qa` projection. Work is QA queue, run, and findings; QA cannot bypass review or release authority.

## 31. Studio Reviewer
Reviewer context is an immutable submission and review state. Work is review queue/detail, and it does not confer builder or QA mutation authority.

## 32. Hub / BOS
Hub/BOS is an operational entry/workspace: organization context, attention, active services, operational work, next action, recent state, and help. It is not an “everything dashboard” or universal domain authority.

## 33. Agent Fabric
Agent Fabric projects work order, session, policy, constraints, approval, and incident state. It explicitly prohibits unrestricted execution and preserves WF-040.

## 34. ARAG-1
ARAG projects work order, AI work, Evidence readiness, policy evaluation, human approval, release gate, and packet state. AI assistance is separate from human release authority.

## 35. DGAL User
DGAL user projection emphasizes applicable requirements, required documents, packet state, acknowledgment/signature state, and safe next action. Generated, viewed, acknowledged, and signed remain distinct states.

## 36. DGAL Admin / Operator
Admin/operator projection covers document lifecycle, requirement status, review/publish readiness, and health. It does not transfer service completion or legal authority.

## 37. Reporting / Truth Operations
Reporting projection includes report, metric, scope, provenance, freshness, and readiness. Truth and Evidence values are source-qualified; presentation cannot create Truth or Evidence.

## 38. Executive Command
Executive Command is a bounded summary and referral view. It may surface critical attention and verified high-level metrics, but every action routes to owning services and it is not a superuser control plane.

## 39. Career
Career uses learner pathway/profile context, supported progression signals, and domain next action. It does not invent labor-market or job data.

## 40. Parent Pattern
Parent is a bounded authorized learner-context pattern with progress summary, action-needed communication, and help. It does not reuse Student actions or expose private learner detail.

## 41. Curriculum Management Pattern
Curriculum management may use course/program context, assignment/content coverage, and issues requiring attention where the domain authorizes them. Publishing authority is not inferred.

## 42. Dashboard Pattern Library
The registry defines `LEARNER`, `INSTRUCTOR`, `APPLICANT`, `REVIEWER_OPERATOR`, `PROVIDER`, `BUILDER`, `QA_REVIEW`, `EXECUTIVE`, `GOVERNED_AI_OPERATOR`, `DOCUMENT_REQUIREMENT`, `ANALYST_REPORTING`, and `PUBLIC`. Patterns provide required/optional sections, density, and prohibited assumptions, not fixed visual templates.

## 43. Information Density
Density classes are `LOW`, `MODERATE`, and `HIGH`. Learner/applicant/executive/public patterns are low or moderate; instructor/provider/builder are moderate; operator, QA, governed AI, and reporting patterns are high where evidence supports it.

## 44. Metric Placement
Metrics belong in Progress or Intelligence only when they support a decision. Each needs a source, verification class, role relevance, and intended decision use.

## 45. Evidence / Truth Display Semantics
Operational, source-stated, verified, public-approved, estimated, and unknown values must remain distinguishable. OGL analytics and dashboard completion are not Evidence, Truth, learning outcomes, compliance outcomes, or service completion.

## 46. DGAL Integration
DGAL requirements may project into Attention, Work, or Help according to requirement state. DGAL remains authoritative for documents, acknowledgments, signatures, packets, and retention.

## 47. OGL Integration
Applicable projections reserve Help for Guidance Center, orientation/tour, accessible guide, and contextual guidance. OGL remains presentation and experience-state infrastructure.

## 48. Companion Integration
Companion is permitted only for authorized, source-traceable explanation, summarization, contextualization, and navigation/help. It cannot approve, verify, sign, publish, release, alter workflow, or write Evidence/Truth.

## 49. Mobile / Tablet Structure
Default responsive order is `CONTEXT -> ATTENTION -> NEXT ACTION -> WORK -> PROGRESS -> HELP -> INTELLIGENCE`. Student, applicant, provider field work, Calendar, Career, and Arcade receive strong mobile/tablet priority; operator and reporting views are higher-density desktop-first with responsive reflow.

## 50. Accessibility Structural Requirements
Future implementations must preserve logical headings, keyboard order, visible focus, non-color-only status, meaningful screen-reader status, accessible forms/tables, responsive reflow, reduced-motion safety, and stable semantic OGL anchors. This is not the separate Accessibility Upgrade.

## 51. Machine-Readable Architecture
Canonical file: `src/system/sea/dashboardArchitecture.js`. It references SEA-1 by `serviceId` and contract version. It contains the schema enums, pattern library, 19 projections, action hierarchy, source status, density, and responsive metadata.

## 52. Validation
`npm run sea:dashboard:validate` validates service/role references, section obligations, attention/source enums, authorized next-action sources, action mappings, authority notes, OGL help, mobile priorities, Tier A coverage, and architecture consistency. Focused tests cover role separation, waiting/blocked semantics, source honesty, governed AI/release boundaries, and responsive priorities.

## 53. Gap Closure Matrix
| SEA Gap | SEA-2 result | Remaining owner |
|---|---|---|
| 001, 002, 004, 005, 006, 007 | Projection architecture and role boundaries defined | SEA-4/5 implementation |
| 009 | Shared attention/state semantics defined and validated | SEA-4/5 implementation |
| 011 | Notification projection categories defined | SEA-4/5 |
| 015 | Pattern/action/section architecture defined | SEA-3/4 |
| 016 | Projection identity is contract-based; route implementation remains | SEA-5 |
| 018 | Bounded Companion placement defined | SEA-5 |
| 003, 008, 010, 012, 013, 014, 017 | Not SEA-2 closure items | SEA-1/3/4/5/6 or N/A per SEA-0 |

## 54. Files Created
- `src/system/sea/dashboardArchitecture.js`
- `scripts/validate-sea-dashboard-architecture.mjs`
- `tests/sea2DashboardArchitecture.test.mjs`
- `docs/architecture/SEA-2_CANONICAL_DASHBOARD_WORKFLOW_ARCHITECTURE.md`

## 55. Files Modified
- `package.json` adds `sea:dashboard:validate`.
- No React dashboard, route, style, migration, or domain-authority implementation was changed for SEA-2.

## 56. Owner Work Preservation
Pre-existing owner changes and generated acceptance assets remain untouched. No reset, clean, stash, commit, or push was performed.

## 57. SEA-2 Decision
**SEA-2 COMPLETE.** The canonical dashboard projection architecture, role boundaries, state semantics, action hierarchy, source honesty, pattern library, and SEA-3 handoff are implemented and validated. No broad dashboard implementation or visual mock work was performed.

## 58. Exact Next Phase
**SEA-3 — MOCK / VISUAL EXPERIENCE CONTRACTS**

## Required Matrices

### DASHBOARD PROJECTION MATRIX
| Service | Role | Context | Attention | Work | Progress | Intelligence | Help | Canonical Next Action |
|---|---|---|---|---|---|---|---|---|
| Student Learning | learner | program/course/stage | due, blocked, waiting | assignment/lesson/project | learning state | progress/career signal | OGL/DGAL/Companion | DOMAIN_PROJECTION |
| Instructor | instructor | course/cohort | review/deadline | assignments/lessons/cohort | cohort projection | instructional signals | OGL/DGAL/Companion | DOMAIN_PROJECTION |
| Onboarding | applicant/reviewer | application/case | required/review/blocked | tasks/queue | lifecycle/review state | readiness | DGAL/OGL | WORKFLOW_STATE_MACHINE |
| CivicSure | provider/operator | provider/program/case | due/review/correction | evidence/review queue | verification state | assurance/risk | OGL/DGAL/Companion | DOMAIN_PROJECTION |
| Studio | builder/QA/reviewer | project/workspace/revision | blocker/finding/review | workspace/QA/submission | handoff state | readiness/findings | OGL/DGAL | WORKFLOW_STATE_MACHINE |
| Hub/BOS | org_admin | organization/services | operational attention | service work/queue | service state | bounded operational summary | OGL/DGAL | OGL_RESOLVER |
| Agent Fabric / ARAG | operator/approver | work order/policy/release | policy/approval/blocker | governed work/evidence packet | gate state | bounded risk | OGL/DGAL | DOMAIN_PROJECTION |
| DGAL | user/admin | requirement/document/packet | required/signature/review | document lifecycle | document state | freshness/status | OGL | DOMAIN_PROJECTION |
| Reporting/Truth | analyst/auditor | report/metric/scope | stale/verification gap | report/projection | readiness | source-qualified metrics | OGL/docs | DOMAIN_PROJECTION |
| Executive Command | shs_admin | critical attention | priority/blocker | referral review | optional | verified summary | OGL | OGL_RESOLVER |

### ROLE SEPARATION MATRIX
| Service | Role A | Role B | Shared Context | Different Responsibilities | Prohibited Cross-Role Actions |
|---|---|---|---|---|---|
| Curriculum | learner | instructor | course/program | learn vs teach/review | learner cannot review; instructor cannot receive learner-only assumptions |
| CivicSure | provider | operator | program/provider/status | submit/correct vs verify/assure | provider cannot verify; operator cannot inherit provider self-service |
| Onboarding | applicant | reviewer | application | submit vs review | applicant cannot approve/activate |
| Studio | builder | QA/reviewer | project/revision | build vs QA/review | builder cannot approve; QA cannot release |
| Agent/ARAG | operator | approver | work order/policy | governed work vs human gate | agent cannot release; approver cannot bypass policy |

### ATTENTION MATRIX
| Service | Action Required | Waiting | Blocked | At Risk | Deadline | Approval / Review |
|---|---|---|---|---|---|---|
| Student | due assignment | instructor review | prerequisite | overdue/feedback | assignment due | instructor verification |
| Onboarding | missing application item | reviewer/activation | missing prerequisite | stale case | document deadline | reviewer decision |
| CivicSure | evidence/correction | operator | evidence/requirement | verification issue | submission deadline | operator review |
| Studio | build/QA work | reviewer/release | failed QA | handoff risk | submission/release | QA/review/approval |
| Agent/ARAG | safe operator step | human approval | policy/tool gate | security/release risk | gate deadline | human approval |
| Reporting/DGAL | required document/report | source/reviewer | generation/requirement | stale source | due date | publish/signature/review |

### ACTION HIERARCHY MATRIX
| Service / Role | Primary Action | Secondary Actions | Reference Actions | Next-Action Source |
|---|---|---|---|---|
| Student / learner | open current assignment | continue lesson, view progress | help, career context | DOMAIN_PROJECTION |
| Instructor | review instructional work | open course/cohort | documentation/help | DOMAIN_PROJECTION |
| Applicant | complete next requirement | open document, view stage | guidance | WORKFLOW_STATE_MACHINE |
| CivicSure provider/operator | submit/correct or review case | inspect status/queue | DGAL/OGL help | DOMAIN_PROJECTION |
| Studio builder/QA/reviewer | build, inspect QA, or review submission | open workspace/findings | workflow help | WORKFLOW_STATE_MACHINE |
| Hub/BOS | open owning service action | inspect service queue | Guidance Center | OGL_RESOLVER |
| Agent/ARAG | review governed work/gate | inspect policy/evidence | documentation | DOMAIN_PROJECTION |

### METRIC PLACEMENT MATRIX
| Service / Role | Metric | Section | Source | Verification Class | Decision Use |
|---|---|---|---|---|---|
| Student | learning progress | PROGRESS | Curriculum projection | SOURCE_STATED | choose next learning step |
| Instructor | cohort progress | INTELLIGENCE | Curriculum projection | SOURCE_STATED | identify instructional attention |
| CivicSure operator | assurance readiness | INTELLIGENCE | CivicSure projection | VERIFIED_WHEN_STATED | prioritize review |
| Studio QA | findings/pass state | PROGRESS | Studio QA domain | SOURCE_STATED | resolve QA blockers |
| Reporting analyst | report readiness | PROGRESS | Metric Registry | SOURCE_STATED | validate/report |
| Executive | critical verified summary | INTELLIGENCE | authorized projection | VERIFIED/PUBLIC_APPROVED when stated | refer to owning service |

### RESPONSIVE PRIORITY MATRIX
| Service / Role | Mobile Priority Order | Tablet Priority | Desktop Density |
|---|---|---|---|
| Student | context, attention, next action, work, progress, help | same with richer progress | LOW/MODERATE |
| Parent | context, attention, progress, help | progress and communication | LOW |
| Instructor | context, attention, next action, work, progress, help | cohort/work split | MODERATE |
| CivicSure provider | context, attention, next action, work, help | evidence/review split | MODERATE |
| CivicSure operator | context, attention, next action, work, progress, help | queue/detail split | HIGH |
| Studio | context, attention, next action, work, progress, help | workspace/detail split | MODERATE/HIGH |
| Agent/ARAG | context, attention, next action, work, progress, help | policy/work split | HIGH |
| Reporting/Truth | context, attention, work, intelligence, help | report/detail split | HIGH |
