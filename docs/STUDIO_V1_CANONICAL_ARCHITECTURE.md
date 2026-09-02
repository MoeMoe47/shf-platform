# SHRV1 Studio V1 Canonical Architecture

## 1. Purpose

Studio is the SHRV1 student work product for turning an assignment or student idea into durable, reviewable work. Studio V1 supports Website and AI Agent projects through a single project lifecycle and keeps creation state separate from institutional judgment.

## 2. Student and Teacher Experience

Students choose or receive a project, describe it, build durable work, run Check My Project, submit an exact revision, respond to feedback, finalize an approved revision, and view What You Proved. Teachers see derived assignment progress, exact submitted snapshots, QA context, review history, and remaining assignment requirements.

## 3. Canonical Flow

```text
Assignment or Student Idea
  -> Studio Handoff
  -> Studio Project
  -> Project Resources / Project Plan
  -> Builder Workspace Revision
  -> QA
  -> Human Review
  -> Delivery / Finalization
  -> Evidence
  -> Completion Policy
```

Build, QA, Review, Delivery, Evidence, and Completion are separate authorities.

## 4. Domain Ownership

- Studio owns handoffs, projects, workspaces, revisions, Build Packets, QA facts, review facts, and delivery/finalization facts.
- Assignment and Curriculum own assignment targeting, release lineage, and requirements.
- Evidence owns institutional proof and provenance.
- Completion Policy owns assignment and lesson completion evaluation.
- Truth Spine, metrics, reporting, credentials, Portfolio, Registry, and ClientOps remain separate.

## 5. Project Types, Origins, and Destinations

`WEBSITE` and `AI_AGENT` are the shared canonical project types. Origins are `ASSIGNMENT` and `STUDENT_IDEA`. Student projects use the `STUDENT` destination. Commercial destinations require an explicit server permission and never arise from ordinary student flows.

## 6. Handoff and Project

Assignment handoff validates entitlement, organization, tenant, assignment, release, and project-type requirements. Handoff creation is idempotent. Student ideas create independent student projects without fabricated assignment lineage.

## 7. Resources and Build Packet

Project Resources are read-only projections from canonical curriculum release snapshots. The Build Packet projects project identity, lineage, requirements, resources, tools/templates, and current context. Neither is mutable through builder or student presentation APIs.

## 8. Workspace and Revisions

`studio_builder_workspaces` is the durable backend-owned student work store. Writes are project-scoped, tenant-aware, type-specific, bounded, and revision-checked. A workspace save is not completion, QA, review, delivery, Evidence, or Portfolio truth.

## 9. Website and AI Agent Semantics

Website V1 stores bounded page work and does not host or deploy public sites. AI Agent V1 stores bounded agent configuration and does not execute agents, certify standards, or submit to a Registry. Both use the same project shell and authorization boundary.

## 10. QA

QA is deterministic, revision-bound, and triggered explicitly by Check My Project. It reports check results and student guidance only. A QA pass is not approval, completion, delivery, Evidence, or credentialing.

## 11. Review

Review begins only through explicit Submit for Review. Review submissions contain immutable exact-revision snapshots. Authorized reviewers may approve or request changes. Students cannot self-approve. Review approval remains distinct from delivery and completion.

## 12. Delivery / Finalization

Finalization requires matching current workspace revision, QA pass, approved review, and authorized action. The record binds to the exact approved submission. Finalization does not imply public deployment, Registry approval, Evidence, Portfolio, completion, or credentials.

## 13. Evidence and Completion

Finalized student deliveries may enter the existing Evidence source boundary with exact project, delivery, revision, QA, review, learner, organization, tenant, and assignment provenance. Evidence is not completion. Assignment and lesson completion are produced only by the canonical Completion Policy evaluator, which considers all declared requirements.

## 14. Assignment Integration

Assignments declare Studio requirements through the existing assignment/completion policy model. Project type is server-enforced. Teacher progress is a derived assignment-scoped read model. A satisfied Studio requirement does not satisfy unrelated reflection, assessment, attendance, Arcade, or verification requirements.

## 15. Student Experience Layer and Companion

The Student Experience Layer translates canonical facts into next actions and simple status language. Beginner is the default presentation; Advanced exposes safe provenance only. Companion receives bounded read-only context and cannot mutate project, QA, review, delivery, Evidence, completion, Truth, credentials, Registry, or ClientOps state.

## 16. Authorization and Tenant Model

The server derives active organization, tenant, learner, project type, assignment lineage, and authority identity. Project, workspace, QA, review, delivery, Evidence status, and teacher progress routes fail closed for foreign organizations, tenants, learners, projects, submissions, and assignments.

## 17. Events and Truth Spine

Studio emits bounded operational events through existing outbox conventions. It does not write Truth directly. Canonical Evidence and Completion services may feed existing projections according to their own authority contracts.

## 18. Accessibility and Responsive Behavior

Studio uses semantic headings and landmarks, labeled fields, visible focus, keyboard-operable controls, readable textual status and alert regions, and non-color-only state language. Verified browser coverage includes desktop, tablet, and 390px mobile layouts. Full screen-reader certification remains deferred.

## 19. Canonical Routes

Student routes are mounted under the curriculum shell:

```text
/studio
/studio/new
/studio/projects
/studio/projects/:projectId
/studio/projects/:projectId/build
/studio/assignments
/studio/assignments/:assignmentId/progress
/studio/review/:projectId/:submissionId
/studio/templates
```

## 20. Canonical APIs

Handoff: `POST /studio/handoffs/assignment`
Projects: `POST/GET /studio/projects`, `GET/PATCH /studio/projects/:projectId`
Resources and Build Packet: `GET /studio/projects/:projectId/resources`, `GET /studio/projects/:projectId/build-packet`
Workspace: `GET/PATCH /studio/projects/:projectId/workspace`
QA: `GET/POST /studio/projects/:projectId/qa/current`, `/qa`
Review: `GET /review/current`, `POST /review-submissions`, `GET/POST /review-submissions/:submissionId`
Delivery: `GET /delivery/current`, `POST /finalize`
Institutional status: `GET/POST /institutional-status`, `/evidence`
Teacher progress: `GET /studio/assignments/:assignmentId/progress`.

Each route uses existing permission, organization, tenant, learner, assignment, and project authorization.

## 21. Canonical Database Entities

Studio-specific persistence is provided by migrations `069` through `074`: handoffs/projects, builder workspaces, QA runs, human review, delivery/finalization, and Studio completion requirement linkage. Existing Assignment, Curriculum, Evidence, Completion, Outbox, and Truth tables remain authoritative for their domains.

## 22. Deferred V1+ Capabilities

Portfolio authority, public Website deployment, Agent Registry submission/certification, production Agent execution, credential issuance, real-time collaboration, notifications redesign, and ClientOps student integration are explicitly deferred or prohibited.

## 23. Maintenance Rules

Preserve one Studio project vocabulary and one lifecycle. Additive migrations only. Keep browser payloads non-authoritative. Bind every downstream fact to exact revisions and source records. Extend canonical Assignment, Evidence, Completion, and Truth services rather than creating Studio duplicates. Treat legacy prototypes and localStorage as non-canonical until separately reconciled.
