# SEA-1 — SERVICE CAPABILITY & EXPERIENCE CONTRACTS

## 1. Executive Result
SEA-1 is complete. A single code-owned registry now describes all 40 SEA-0 service records using one normalized Service Capability & Experience Contract shape. Fifteen priority services are Tier A and carry explicit capabilities, non-capabilities, roles, jobs, workflows, states, transition authority, actions, next-action source, dashboard obligations, metrics, DGAL/OGL/Companion boundaries, Evidence/Truth boundaries, responsive/accessibility requirements, visual authority, and acceptance obligations.

The registry constrains future experience work without becoming a CMS, workflow engine, permission authority, Evidence store, Truth store, or dashboard implementation. SEA-2 owns information architecture; SEA-3 owns approved visual contracts; SEA-4/5 own implementation.

## 2. Repository Baseline
| Item | Evidence |
|---|---|
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| HEAD | `c775466f5de6f86a7e4d4230434e0d56c17c0a7f` |
| Migration head | 140 |
| Prior phase | SEA-0 complete |
| OGL | OGL-0 through OGL-6 complete |
| Changes | Registry, validator, focused tests, this report, package script |

## 3. SEA-1 Gap IDs
SEA-1 resolves the contract-definition portion of SEA-GAP-001 through SEA-GAP-008 and supplies contract input for SEA-GAP-009 through SEA-GAP-018. Dashboard architecture, visual mocks, service implementation, broad rollout, and final UX acceptance remain assigned to later SEA phases.

## 4. Contract Authority
The canonical authority is `src/system/sea/serviceExperienceContracts.js`. It is code-owned, version-controlled, deterministic, and validated. The service/domain backend remains authoritative when a contract describes a state or action. OGL, DGAL, Companion, Evidence, Truth, and permission authorities are referenced rather than redefined.

## 5. Storage / Registry Decision
No database persistence or migration was added. SEA-1 contracts are architectural/configuration authority and benefit from reviewable source control. Runtime/domain state remains in its existing owners. The registry exports `SEA_SERVICE_EXPERIENCE_CONTRACTS`; `npm run sea:contracts:validate` is the single structural validation command.

## 6. Contract Schema
Every record has `schemaVersion`, identity, purpose, audience, capabilities, explicit non-capabilities, jobs, workflow/state model, actions, next action, dashboard obligations, metrics, DGAL, OGL, Companion, notifications, Evidence, Truth, responsive/accessibility, visual authority, and acceptance fields. Tier A additionally requires every section to be present and a non-`NONE` canonical next-action source.

## 7. Contract Tiering
| Tier | Count | Meaning |
|---|---:|---|
| A | 15 | Full service/operator experience contract |
| B | 16 | Bounded service/platform contract |
| C | 8 | Public/lightweight/infrastructure contract |
| NOT_PRODUCTIZED | 1 | No active product surface; readiness metadata only |

## 8. Service Identity
Identity is `serviceId`, `canonicalName`, `domainOwner`, `destinationId`, routes, lifecycle, and immutable version. Routes are references, not authority. `trust-bureau` has no active route and no fabricated action. `bos` remains the canonical authenticated BOS/Hub destination identity; public Universe discovery remains separately owned.

## 9. Capability Model
Capabilities describe supported service behavior from domain and route evidence. Backend-only, frontend-only, missing-connection, and mature end-to-end states remain visible in SEA-0. A contract never promotes a mock, page, or projection into a domain capability.

## 10. Explicit Non-Capabilities
All contracts inherit presentation and authority boundaries. Tier A adds service-specific boundaries: Student does not certify learning; CivicSure does not provide payment or verification authority to providers; Studio does not collapse builder/QA/reviewer/release authority; Agent Fabric is not a superuser; ARAG does not approve or release autonomously; DGAL does not own service completion; Reporting does not create Truth or Evidence; Hub does not become every downstream domain authority.

## 11. Audience / Role Model
The registry uses repository role vocabulary and bounded experience groups: learner, instructor, parent, provider, operator, reviewer_verifier, org_admin, shs_admin, builder, reviewer, agent_operator, approver, auditor, analyst, admin, applicant, employer, finance, public, user, and guidance_admin. Server permissions and entitlement checks remain authoritative; audience metadata cannot grant access.

## 12. Jobs-to-Be-Done
Tier A jobs are concrete and role-relative. Examples include finding the current assignment, reviewing a cohort, submitting evidence, identifying a verification blocker, completing a build/QA handoff, locating an operational next action, checking policy constraints, understanding an approval gate, finding the applicable document, and interpreting a source-qualified report.

## 13. Workflow Model
| Service | Canonical workflow |
|---|---|
| Student | Assign -> Prepare -> Learn -> Practice -> Apply -> Reflect -> Demonstrate -> Verify/Report |
| Instructor | Prepare -> Assign -> Monitor -> Review -> Intervene |
| Onboarding | Apply -> Review -> Documents -> Agreements -> Activate -> Operate |
| CivicSure | Fund -> Deliver -> Verify -> Measure -> Detect -> Correct -> Decide -> Learn/Prove |
| Studio | Plan -> Build -> QA -> Submit -> Review -> Approve -> Release/Handoff |
| Hub/BOS | Context -> Triage -> Service Action -> Follow-up |
| Agent Fabric | Work Order -> Governed AI Work -> Evidence -> Policy Check -> Human Approval -> Release Gate |
| ARAG-1 | Work Order -> AI Work -> Evidence -> Policy Evaluation -> Human Approval -> Release Gate -> Evidence Packet |
| DGAL | Requirement -> Document/Packet -> Acknowledgment/Signature -> Evidence -> Retention |
| Reporting | Source -> Validate -> Compose -> Review -> Authorize -> Distribute |

## 14. State Model
Each Tier A contract declares domain-specific states plus common experience mappings for action required, waiting, blocked, at risk, in progress, and complete. Terminal states remain owned by the domain. OGL experience state is never substituted for domain state.

## 15. Transition Authority
Transitions are owned by Curriculum, Organization Onboarding, CivicSure Verification, Studio, Hub’s owning service, Agent/ARAG governance, DGAL, or Reporting/Metric Registry as appropriate. Human approval points are explicitly listed for verification, activation, QA/review/release, agent execution, signatures, and report publication.

## 16. Primary / Secondary Actions
Every contract separates `actions.primary`, `actions.secondary`, and `actions.reference`. Actions use structured route objects with no arbitrary URLs. Primary actions are the service’s most important authorized next step; reference actions cannot be mistaken for mutations.

## 17. Canonical Next Action
Tier A sources are `DOMAIN_PROJECTION`, `WORKFLOW_STATE_MACHINE`, or `OGL_RESOLVER`; none uses `NONE`. No contract declares a hardcoded business next action. OGL-2 may project context, but the domain remains the source for domain decisions.

## 18. Attention / Waiting / Risk Model
Contracts distinguish `ACTION_REQUIRED`, `WAITING`, `BLOCKED`, `AT_RISK`, `IN_PROGRESS`, and `COMPLETE`. Responsibility is domain-derived. Waiting on an operator, reviewer, signer, approver, or system must not be presented as the user’s unfinished task.

## 19. Dashboard Information Obligations
Every Tier A contract declares `CONTEXT`, `ATTENTION`, `WORK`, `PROGRESS`, `INTELLIGENCE`, and `HELP` as `REQUIRED`, `OPTIONAL`, or `N/A`. This defines information obligations only; it does not prescribe layout, card count, navigation, or visual styling.

## 20. Metrics
Metrics are limited to decision-useful, source-qualified values. Each includes label, source, relevance, verification class, and Metric Registry reference where applicable. Decorative counts and unqualified progress indicators are SEA-2/4 risks, not authority.

## 21. DGAL Relationships
Contracts identify contextual guidance, required/optional documents, agreements, packets, acknowledgment, signature, and retention relationships. DGAL remains authoritative for document and agreement state. Opening or displaying a document never implies acknowledgment, signature, completion, or Evidence acceptance.

## 22. OGL Relationships
Contracts reference existing OGL orientation IDs, Guidance Center, tours, contextual guidance, and accessible alternatives. No SEA contract duplicates OGL content or changes OGL authority.

## 23. Companion Boundaries
Companion may explain, summarize, contextualize, and help navigate within authorized projections. It may not approve, verify, sign, publish, release, alter workflow, or write Evidence/Truth. Every contract marks Companion read-only and source-bounded.

## 24. Notifications
Tier A notification categories are `ACTION_REQUIRED`, `STATE_CHANGED`, `REVIEW_COMPLETE`, `DOCUMENT_REQUIRED`, `APPROVAL_REQUIRED`, `DEADLINE`, `BLOCKER`, and `RESOLVED`. Notification delivery and authority remain domain/service concerns; SEA defines the semantic categories only.

## 25. Evidence Relationships
Contracts identify consumed and produced Evidence references without owning Evidence acceptance. Evidence is never conflated with telemetry, UI status, OGL completion, or a dashboard metric.

## 26. Truth Boundaries
Truth projections may be displayed when authorized and source-qualified. Every contract has `truth.writeAuthority: false`; no SEA contract grants Truth mutation. Reporting and OGL analytics remain projections/experience measures, not Truth Spine facts.

## 27. Authority Matrix
| Service | User action | Domain authority | Human approval | DGAL/OGL role | Evidence impact |
|---|---|---|---|---|---|
| CivicSure | Submit/review evidence | CivicSure domain | Operator/reviewer decision | DGAL docs; OGL guidance | Evidence domain only |
| Onboarding | Submit/review application | Onboarding domain | Reviewer/activation authority | DGAL requirements; OGL guidance | Domain-defined |
| Studio | Build/QA/submit | Studio domain | QA/reviewer/release roles | OGL orientation | Artifact/evidence domains |
| Agent/ARAG | Governed work/approval request | Agent/ARAG governance | Required human gate | OGL help; Companion explanation | Evidence/policy domains |
| DGAL | Open/ack/sign where authorized | DGAL/legal/service owners | Authorized signer | OGL discovery only | DGAL/Evidence authorities |
| Reporting | Compose/export/publish | Reporting/Metric Registry | Publication authority | OGL help only | No Evidence/Truth mutation |

## 28. Responsive Requirements
Student, Onboarding, CivicSure Provider, Career, Parent, and field-oriented workflows are `MOBILE_REQUIRED` and `TABLET_REQUIRED`. Hub, Studio, Agent, ARAG, DGAL, and reporting are responsive with desktop-primary expectations. Public surfaces retain their visual mode and must not inherit private dashboard assumptions.

## 29. Accessibility Dependencies
Contracts preserve keyboard-critical actions, non-visual equivalents, semantic status, reduced motion, accessible forms/tables, focus behavior, zoom/readability, and non-overlay alternatives where required. The future Accessibility project is not started.

## 30. Visual Authority References
The registry records `APPROVED_MOCK`, `LOCKED_DIRECTION`, `EXISTING_IMPLEMENTATION`, or `NONE`. Existing directions include OAS, Universe, Foundation/Career, and selected SHS command surfaces. SEA-3 must approve visual contracts before implementation when `NONE` or drift is material.

## 31. Student Contract
Student is Tier A with learner jobs, Curriculum workflow, assignment/progress domain projection, learning metrics, Career/portfolio relationships, DGAL contextual guidance, OGL orientation `orientation:curriculum:student-dashboard`, read-only Companion, mobile/tablet requirements, and accessible guidance. Student cannot certify learning or replace instructor/reviewer authority.

## 32. Instructor Contract
Instructor is Tier A with cohort, assignment, learner-progress, intervention, and review jobs. Its next action comes from the Instructor Operations projection. It is separate from Student, protects learner-private data, references `orientation:curriculum:instructor-operations`, and requires keyboard/mobile-aware operational work.

## 33. Organization Onboarding Contract
Onboarding is Tier A with the explicit lifecycle `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `DECLINED`, `ACTIVATED`, `SUSPENDED`, `EXITED`, `GRADUATED`. Applicant/reviewer responsibilities, DGAL documents/agreements, activation authority, waiting/blockers, and domain state-machine next actions are explicit. The experience contract cannot activate an organization or grant entitlements.

## 34. CivicSure Provider Contract
Provider supports evidence submission, correction response, status, deadlines, and required guidance. Its next action is domain-projected. Provider does not receive operator verification, payment, accounting, or publication authority. DGAL and OGL references remain contextual and Companion is read-only.

## 35. CivicSure Operator Contract
Operator/reviewer supports queue triage, evidence inspection, corrective action, readiness, and authorized decision context. Verification authority remains CivicSure and human. Provider and operator contracts are separate; no contract grants automated consequential decision authority.

## 36. Studio Contract
Studio preserves Plan/Build/QA/Submit/Review/Approve/Release handoffs. Builder, QA, reviewer, and approver responsibilities remain distinct. Next action comes from the workflow state machine, with explicit blockers and human approval points. No contract escalates QA/review/release authority.

## 37. Hub / BOS Contract
Hub/BOS is the operational environment for organization context, triage, navigation, and safe referral to owning service actions. Its next action may use the OGL-2 resolver projection. It is not a universal workflow authority. Authenticated identity remains `bos` and orientation remains `orientation:hub:workspace`.

## 38. Agent Fabric Contract
Agent Fabric supports governed work orders, policy/resource constraints, approval and incident state. Agent operators can inspect and initiate only bounded actions. WF-040, human approval, policy, and resource controls remain authoritative; Agent Fabric is not a superuser or unrestricted executor.

## 39. ARAG-1 Contract
ARAG-1 describes AI-assisted work, Evidence readiness, policy evaluation, human approval, release gate, and Evidence packet relationships. AI work is explicitly separate from release authority. No autonomous publish, release, approval, or permission bypass is implied.

## 40. DGAL Contract
DGAL exposes contextual requirements and canonical document/packet/agreement flows. Its state distinctions remain required, available, viewed, awaiting acknowledgment/signature, completed, expired, and superseded. DGAL owns document/agreement authority, not service completion or Truth.

## 41. Reporting / Truth Operations Contract
Reporting/Metric Registry describes source, validation, composition, review, authorization, distribution, freshness, and verification status. Truth Spine projections are consumed only when authorized. Reports do not become Truth or Evidence merely because an admin page displays them.

## 42. Career / Parent Contracts if applicable
Career is represented as Tier A because SEA-0 identified it as a flagship candidate; its bounded contract covers learner exploration, pathways, skills/profile, career connections, and supported opportunities without inventing labor-market authority. Parent is Tier B: only authorized learner-support context is allowed; it is not a simplified Student dashboard and does not expose private learner data.

## 43. Platform / Public Contract Summary
Tier B contracts cover Service Catalog, Legal, Treasury, Employer, Sales, Projects/Portfolio, Credentials, Shared Services, and related platforms. Tier C contracts cover OAS, Universe, Foundation/public, CivicSure public, Registry, Verifier, Arcade, and lightweight/public surfaces. Trust Bureau is `NOT_PRODUCTIZED`; no active contract or workflow is fabricated.

## 44. Contract Completeness Matrix
| Service set | Tier | Identity | Capabilities | Non-capabilities | Roles/jobs/workflow | Next action | Authority/integrations | Status |
|---|---|---|---|---|---|---|---|
| Student, Instructor, Curriculum, Career | A | Complete | Explicit | Explicit | Complete | Domain projection | DGAL/OGL/Companion/Truth bounded | PASS |
| Onboarding, CivicSure Provider/Operator | A | Complete | Explicit | Explicit | Complete | Domain projection/state machine | DGAL/OGL bounded | PASS |
| Studio, Hub/BOS, Agent Fabric, ARAG-1 | A | Complete | Explicit | Explicit | Complete | State machine/projection/OGL | Human authority preserved | PASS |
| DGAL, Truth/Reporting, Executive Command | A | Complete | Explicit | Explicit | Complete | Domain/OGL projection | Evidence/Truth bounded | PASS |
| All Tier B/C and Trust Bureau | B/C/N/A | Explicit | Bounded | Explicit | Bounded | Explicit, or NONE if not productized | Public/platform boundaries | PASS |

## 45. Service Ownership Matrix
| Service | Canonical domain owner | Experience owner | Destination | Primary roles | Authority note |
|---|---|---|---|---|---|
| Student/Instructor/Curriculum | SHF Curriculum | Curriculum product | curriculum | learner, instructor | Curriculum owns learning state |
| CivicSure | CivicSure | CivicSure product | civic | provider, operator | Verification remains CivicSure/human |
| Studio | SHS Studio | Studio product | studio | builder, reviewer | Release authority remains governed |
| Hub/BOS | SHS | SHS Hub | bos | org_admin, shs_admin | Refers to owning service actions |
| Agent/ARAG | SHS Governance | Governed AI product | agent-fabric / command | operator, approver | WF-040/human gate intact |
| DGAL | DGAL | DGAL product | documentation | user, admin | Document/agreement authority |
| Truth/Reporting | Truth/Reporting | Reporting product | bos | auditor, analyst, admin | Source and publication authority |

## 46. Role Experience Matrix
| Role | Primary jobs | Primary actions | Waiting states | Attention states | Prohibited actions |
|---|---|---|---|---|---|
| Learner | learn, submit, progress | open assignment/lesson | instructor review | assignment/blocker | certify own learning |
| Instructor | teach, monitor, review | open cohort/assignment | domain/system | learner intervention | access unauthorized private data |
| Provider | submit/correct | provider evidence action | operator review | correction/deadline | verify/approve/payment |
| Operator/Reviewer | inspect/decide | review queue/action | provider/system | queue/blocker | automate consequential decision |
| Builder/QA/Approver | build, test, handoff | workflow-owned action | next role | QA/review/release risk | collapse role authority |
| Agent operator/approver | govern work | bounded work/approval | human gate | policy/incident | unrestricted execution |

## 47. Workflow Contract Matrix
The workflows in sections 13 and 31–41 are the canonical matrix. Each records states, transition owner, human approval points, and terminal states in the machine-readable registry; no SEA contract creates a transition.

## 48. Dashboard Obligation Matrix
Tier A requires context, attention, work, and help. Progress is required for Student and useful for most workflow services. Intelligence is required only where source-qualified decision support exists. Reporting/Truth surfaces require source and verification context; public surfaces do not inherit private dashboard obligations.

## 49. Authority Boundary Matrix
The machine registry enforces `truth.writeAuthority: false`, `evidence.notOwned: true`, read-only Companion, structured actions, domain transition authority, and explicit human approval. OGL/DGAL/Companion can explain or route; they cannot approve, verify, sign, publish, release, complete, acknowledge, or write Truth/Evidence.

## 50. Validation
`npm run sea:contracts:validate` passes with 40 services: A=15, B=16, C=8, NOT_PRODUCTIZED=1. Focused SEA tests pass 3/3. Existing orientation, OGL rollout, manifests, UI, Layer, Truth, Oracle, API typecheck, build, and `git diff --check` validations pass. Migration head remains 140.

## 51. Gap Closure Matrix
| Gap ID | SEA-1 result | Remaining owner |
|---|---|---|
| SEA-GAP-001..008 | Contract-definition requirements resolved; implementation/IA gaps remain explicitly represented | SEA-2/4 |
| SEA-GAP-009 | Attention vocabulary and responsibility mappings defined | SEA-2 |
| SEA-GAP-010..011 | DGAL/notification obligations defined, placement not implemented | SEA-2/4 |
| SEA-GAP-012..013 | Public boundary and responsive obligations defined | SEA-3/5 |
| SEA-GAP-014..015 | Visual authority and shared-system obligations defined | SEA-3/2 |
| SEA-GAP-016 | Route/legacy ownership represented, cleanup deferred | SEA-2/5 |
| SEA-GAP-017..018 | Bounded public/Companion contract expectations defined | SEA-5/6 |

## 52. Files Created
`src/system/sea/serviceExperienceContracts.js`, `scripts/validate-sea-contracts.mjs`, `tests/sea1Contracts.test.mjs`, and this report.

## 53. Files Modified
`package.json` only, adding `sea:contracts:validate`. No service, dashboard, mock, migration, OGL, DGAL, or accessibility implementation was modified for SEA-1.

## 54. Owner Work Preservation
Existing owner work and dirty worktree changes were preserved. No reset, clean, stash, rebase, commit, push, migration, CMS, dashboard redesign, mock creation, Accessibility work, or Frontend Design work was performed.

## 55. SEA-1 Decision
**SEA-1 COMPLETE.** The canonical contract architecture and validated Tier A contract set are ready to drive SEA-2 without requiring a frontend designer or engineer to invent service behavior or authority.

## 56. Exact Next Phase
`SEA-2 — CANONICAL DASHBOARD & WORKFLOW ARCHITECTURE`.

SEA-2, SEA-3, SEA-4, SEA-5, SEA-6, Accessibility, and Frontend Design / Visual Implementation have not started.
