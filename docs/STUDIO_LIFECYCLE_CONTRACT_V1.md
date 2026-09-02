# Studio Lifecycle Contract V1

Status: Phase 1 contract-only scaffolding. Durable Studio persistence and runtime routes are Phase 2 work.

## 1. Purpose

Studio is one user-facing product containing project types such as WEBSITE and AI_AGENT. This contract fixes ownership, lineage, lifecycle boundaries, and student-facing orchestration before a project workspace is built.

## 2. Phase 0 findings inherited

SHRV1 owns durable curriculum, assignments, entitlements, activity results, Project, Evidence, Truth, reporting, identity, organization enforcement, and journey projections. SHF-Next Website Studio is static template browse/preview UI. Its Sales, Production Project, Development Library, Build Packet, QA, Delivery, and ClientOps state is localStorage/in-memory/demo-backed. ClientOps remains commercial. Durable Assignment-to-Studio handoff and student Studio objects are absent.

## 3. Domain ownership

SHRV1 remains authoritative for identity, organization/tenant, curriculum Releases, assignments, entitlements, activity results, Completion Policy, completion, Evidence, Truth, metrics, and reporting. Studio owns only its project workflow artifacts and orchestration boundaries. It must not create competing completion, progress, Evidence, Truth, metric, report, assignment, or agent-runtime domains.

## 4. Studio project types

The initial vocabulary is WEBSITE and AI_AGENT. They share Handoff, Project, version, Build Packet, QA, Delivery, and destination concepts. Type-specific requirements and workspaces are extensions of the shared contract. GAME, APP, DATA, and other types are not production values in Phase 1.

## 5. Project origins

Origins are ASSIGNMENT, STUDENT_IDEA, and PROGRAMMATIC. Assignment-origin records preserve canonical assignment, learner, enrollment, cohort, program, course, unit/lesson, Release, completion policy, reviewer, due date, requirements, organization, and tenant references where present. A student idea has no fabricated assignment or curriculum context.

## 6. Canonical lifecycle

The mutable Studio project lifecycle is:

    DRAFT -> PLANNING -> BUILDING -> READY_FOR_CHECK -> READY_FOR_REVIEW -> APPROVED -> DELIVERY_READY -> DELIVERED

CHANGES_REQUIRED returns the project to BUILDING. VERIFIED is deliberately not a mutable Studio project status: verified completion is an Evidence/Completion Policy/Truth result owned by existing SHRV1 domains.

QA, review, and delivery are separate facets:

- QA: NOT_RUN, IN_PROGRESS, PASSED, FAILED.
- Review: NOT_REQUESTED, PENDING, CHANGES_REQUIRED, APPROVED.
- Delivery: NOT_READY, READY, DELIVERED.
- Student presentation: orientation, actionable, in-progress, blocked, and ready-to-continue. This is derived UI state, not institutional truth.

## 7. Handoff contract

The Phase 1 StudioHandoff contract contains stable handoff ID, organization/tenant, learner, origin, project type, optional curriculum references, requirements, reviewer/due date, and destination. Assignment origin requires assignment and Release references. Independent origin does not require them and rejects fabricated assignment context.

The Handoff references existing curriculum identifiers. It does not copy or replace Assignment, Enrollment, Release, or Completion Policy records.

## 8. Project contract

The Phase 1 StudioProject contract contains project identity, organization/tenant, learner, type, origin/reference, optional assignment/Release/policy lineage, status, current version pointer, destination, and separate QA/review/delivery statuses. Future persistence should separate versions, packets, QA results, artifacts, and delivery records where their ownership/lifecycle differs.

## 9. Build Packet boundary

Build Packet is the structured contract between assigned/planned work and what must be built, checked, and proven. It includes project/version, assignment and Release lineage, project type, requirements, QA requirement keys, evidence requirement keys, and later type-specific detail. Website detail may cover pages, features, content, accessibility, responsive requirements, resources, deliverables, and evidence. AI_AGENT detail may cover identity, purpose, instructions, capabilities, permissions, knowledge/resources, safety, Agent Standard, and Registry readiness. A generated Markdown string or browser download is not canonical persistence.

## 10. QA boundary

QA requirement definitions, QA runs, individual results, blockers, and readiness projections are distinct. A student label such as Check My Project is a presentation of a server-owned check; clicking it cannot equal passing QA. Website checks may cover pages, links, responsive behavior, accessibility, assignment requirements, unsafe scripts, artifacts, and packet completeness. Agent checks include governed identity, permissions, safety, approval, and Registry requirements.

## 11. Delivery boundary

Delivery represents successful transfer, publication, or submission of an eligible version/artifact. It is not project completion, assignment completion, Evidence verification, Portfolio publication, or ClientOps conversion. Delivery must be canonical, idempotent, scoped, and lineage-preserving.

## 12. Destination Policy

The initial destinations are STUDENT and COMMERCIAL. Destination is server-authoritative or constrained by canonical origin/ownership policy; it is never a privileged browser choice.

    STUDENT -> Evidence / Portfolio linkage / existing Completion Policy and Truth path
    COMMERCIAL -> ClientOps / maintenance / upgrades

Student projects must never create ClientOps records. Existing commercial behavior remains eligible for ClientOps. Both destinations require canonical Delivery before dispatch.

## 13. Student vs Commercial branching

The shared workflow may converge through Delivery. Destination dispatch is the separation point. It must carry organization, actor, project, learner, assignment, Release, and artifact lineage and emit one durable operational event/outbox record when downstream work is required. ClientOps remains independent and is not renamed or repurposed.

## 14. Evidence / Completion boundary

Studio produces project, artifact, QA, review, and delivery facts. Existing authoritative domains and SHRV1 outbox/projection infrastructure produce Evidence/Truth where rules permit. Existing Completion Policy evaluates authoritative records server-side. Studio cannot mark assignment or lesson completion and cannot write Truth or verified Evidence directly.

## 15. Student Experience Contract

The Student Experience Layer is presentation/orchestration above canonical domains. It owns:

1. GUIDE: explain the recommended next action.
2. TRANSLATE: present student-friendly language.
3. ASSIST: provide contextual Companion help without changing truth.
4. REFLECT PROGRESS: explain complete, remaining, blocked, and why from server data.
5. BRIDGE: connect Lesson -> Assignment -> Studio -> Evidence -> Portfolio -> Career/Progress.

It answers what the student is building, why, what happens next, how to get help, and how completion is determined. It does not own any institutional fact.

## 16. Student terminology mapping

| Internal concept | Student presentation |
|---|---|
| StudioHandoff / Handoff | Start Project |
| StudioProject | My Project |
| Development Library | Project Resources |
| Build Packet | Project Plan / Requirements |
| QA | Check My Project |
| Delivery | Submit / Publish / Finish |
| Evidence | What You Proved |

These are labels only. They do not rename backend concepts or alter authority.

## 17. Beginner vs Advanced Mode boundary

The same canonical project is presented in BEGINNER or ADVANCED mode. Beginner mode hides raw source trees, manifests, keys, environment/provider configuration, terminals, complex permission matrices, and Agent Fabric internals. Advanced controls require explicit access and policy. No separate project truth model is permitted.

## 18. Learning Companion boundary

The existing Companion architecture may consume a read-only STUDIO context containing project, type, assignment, packet, unmet requirements, lifecycle stage, QA blockers, and recommended next action. It may explain, coach, hint, suggest, and help revise. It may not pass QA, approve a project, create verified Evidence, complete an assignment, bypass permissions, or register an agent without validation and approval. No new chatbot/runtime is created here.

## 19. Accessibility contract

Future Studio surfaces consume the existing SHRV1 accessibility/inclusive-experience architecture. They must support keyboard access, screen-reader semantics, visible focus, reduced motion, usable contrast, non-color-only status, accessible AI feedback, and accessible QA explanations. Phase 1 adds no second accessibility system.

## 20. Celebration / milestone boundary

Studio may present milestones only from canonical server facts. It may not create achievements from clicks, screen time, localStorage, demo data, browser percentages, or unverified activity. Existing Journey milestone projections and celebration presentation remain the reuse point; Studio does not create a competing achievement truth system.

## 21. Agent Fabric / AI Layer boundary

AI_AGENT is a Studio project type, not a second agent engine. Future Studio editing compiles student intent into governed Agent Fabric/AI Layer structures, approvals, permissions, safety checks, audit records, and Registry-ready packages. Students should not normally edit raw internal manifests or execution infrastructure. Agent execution remains in approved infrastructure.

## 22. Autonomous Registry boundary

Autonomous Registry remains independent. Studio may eventually prepare and submit a governed package through an explicit adapter. Studio does not absorb Registry identity, approval, registration, or execution.

## 23. Persistence ownership

SHRV1 PostgreSQL and its domain services own institutional data. Future Studio persistence should be durable for Handoff, project linkage, versions, packets, QA runs/results, artifacts, review, delivery, and destination dispatch. SHF-Next localStorage remains prototype UX state until a controlled migration exists. Browser drafts/caches may be recoverable UX state but never institutional truth.

## 24. Event ownership

Domain transitions that require downstream behavior use the existing durable operational event/outbox boundary. Browser OpsActivityEvent is not an institutional event. Event payloads must preserve organization/tenant, actor, project, learner, assignment, Release, artifact, and destination lineage.

## 25. Security / authorization expectations

All Studio routes and services derive identity, active organization, tenant, roles, and resource scope from SHRV1 canonical authorization. Cross-app bridges may carry safe navigation context only. LocalStorage identity bridge values are local-development hints, not production authorization. Students see own entitled projects; staff see authorized scope; cross-organization and direct-ID access fails closed.

## 26. Prohibited shortcuts

Do not use localStorage as durable lifecycle truth, client role/org claims, frontend formulas for completion or progress, direct browser Truth/Evidence/metric/report writes, synthetic QA success, automatic ClientOps conversion for students, a second agent engine, fabricated assignment context, or demo data as an achievement.

## 27. Phase 2 entry contract

Phase 2 may implement the Durable Studio Project + Handoff Domain. It may add repositories, persistence, API routes, authorization, idempotent transitions, and lineage-preserving adapters from these contracts. It must not redesign the lifecycle, replace existing Assignment/Release/Completion/Evidence/Truth/Reporting domains, or route student Delivery to ClientOps. Phase 2 must provide migration/rollback design, contract tests, tenant/IDOR tests, and a disposable fixture before UI work consumes the new APIs.

## 28. Unresolved issues

The exact durable owner between SHRV1 and SHF-Next remains to be decided. Portfolio’s durable backend boundary needs an explicit artifact/Evidence contract. External Autonomous Registry submission is not proven. The student AI Agent execution contract is not proven. These are Phase 2+ design inputs, not reasons to create parallel systems in Phase 1.
