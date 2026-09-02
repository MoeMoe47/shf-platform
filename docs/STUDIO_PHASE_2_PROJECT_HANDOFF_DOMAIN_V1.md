# Studio Phase 2: Durable Project + Handoff Domain

## 1. Purpose

Phase 2 makes Assignment-to-Studio handoffs and independent Student Idea projects durable in SHRV1. It establishes the authenticated, organization-scoped API boundary that later Studio UI phases consume.

## 2. Phase 1 contract inheritance

The Phase 1 lifecycle vocabulary remains authoritative: `WEBSITE` and `AI_AGENT` are project types; `ASSIGNMENT`, `STUDENT_IDEA`, and `PROGRAMMATIC` are origins; `STUDENT` and `COMMERCIAL` are destinations; lifecycle, QA, review, and delivery are separate facets. Studio does not use `VERIFIED` as a project status.

## 3. Database schema

Migration `069_studio_handoff_project.sql` adds nullable Studio facets to the canonical `projects` table and creates `studio_handoffs`. Existing generic projects remain valid. Organization/tenant indexes, user/assignment/release/policy references, lifecycle checks, and assignment idempotency are durable.

## 4. Studio Handoff model

`studio_handoffs` records the origin, learner, organization, tenant, project type, destination, assignment/curriculum lineage, due date, requirements snapshot, creator, and resulting canonical `projects.project_id`. Assignment handoffs are consumed atomically with project creation.

## 5. Studio Project model

The canonical project identity is `projects.project_id`. Studio metadata is represented by `studio_*` columns, including learner owner, origin, type, destination, assignment/release/policy lineage, and independent lifecycle facets. Build Packets, QA runs, Delivery, Evidence, and agent manifests remain later domain entities.

## 6. Project origin model

Assignment origin must reference a published, organization-matching assignment with a release and eligible learner. Student Idea origin belongs to the authenticated student and carries no fabricated curriculum lineage. Programmatic origin is schema-supported but not publicly created by this phase's routes.

## 7. Project type model

Only `WEBSITE` and `AI_AGENT` are accepted. Both use the same project persistence and lifecycle. Type-specific workspaces and governed agent execution are later phases.

## 8. Destination enforcement

New projects default to `STUDENT`. Student Idea creation is learner-only and rejects any non-Student destination. `COMMERCIAL` requires the explicit `studio.project.destination.commercial` permission. Phase 2 has no delivery dispatcher, so no student project can create or enter ClientOps.

## 9. Assignment lineage

The handoff references the canonical assignment, release, completion policy, course, and due date. Eligibility is resolved through the existing Assignment service and canonical assignment targets plus active enrollments. No assignment fields are copied into a competing assignment model.

## 10. Independent project behavior

Student Ideas use `STUDENT_IDEA`, `STUDENT`, the authenticated learner, and a generated durable handoff/project identity. Assignment, lesson, release, and completion policy fields remain null.

## 11. Idempotency model

The idempotency boundary is `(organization_id, tenant_id, learner_id, assignment_id, project_type)`. Repeated Start Project requests return the existing canonical project; concurrent creation is protected by a partial unique index and transaction.

## 12. Authorization model

Studio uses existing request authentication, organization context, permissions, assignment entitlement, enrollment, cohort staff, and admin-tier conventions. Students read/update only their own projects. Admins can read organization projects. Staff reads require the existing assignment access boundary.

## 13. Tenant isolation

Every query includes organization and tenant scope. Active context is validated as `tenant:<organization_id>`. Cross-organization and missing-context reads/mutations fail closed as not found or forbidden.

## 14. API endpoints

- `POST /studio/handoffs/assignment` creates or returns an eligible assignment-origin project.
- `POST /studio/projects` creates an authenticated student's independent project.
- `GET /studio/projects` lists authorized projects.
- `GET /studio/projects/:projectId` retrieves one authorized project.
- `PATCH /studio/projects/:projectId/status` performs only Phase 1 transition-map status changes.

All use the repository response envelope and permission guard.

## 15. Lifecycle initialization

Creation initializes Studio `DRAFT`, QA `NOT_RUN`, review `NOT_REQUESTED`, and delivery `NOT_READY`. No QA pass, approval, delivery, Evidence, Truth, completion, or ClientOps state is asserted.

## 16. Event/audit behavior

Actual creation emits existing `integration_outbox` events `studio.handoff.created` and `studio.project.created`, with organization, actor, subject, correlation, and idempotency fields. Duplicate handoff requests emit no duplicate creation event.

## 17. ClientOps boundary

ClientOps is untouched. Phase 2 does not implement Delivery dispatch. The future destination policy remains `STUDENT -> Evidence/Portfolio/Completion` and `COMMERCIAL -> ClientOps`, with server-side authorization required before commercial routing.

## 18. Evidence/completion boundary

Project creation does not create Evidence, Truth, completion, metrics, or reports. Later integration must consume canonical project events and existing Evidence/Completion/Truth services.

## 19. Security tests

Focused tests cover type/origin/destination validation, missing context, student destination escalation, initial non-authoritative facets, and event behavior. PostgreSQL-backed integration tests should exercise assignment eligibility, idempotency, IDOR, cross-org read/mutation, and outbox rows in the repository's configured disposable database environment.

## 20. Migration details

Migration 069 is additive, ordered after 068, uses explicit checks/FKs/indexes, and does not import SHF-Next localStorage. It extends `projects` rather than creating `studio_projects`.

## 21. Known limitations

Phase 2 does not implement versioning, Build Packets, resource library, Build Workspace, QA execution, Delivery, Evidence integration, Portfolio, Completion integration, or ClientOps dispatch. Instructor listing currently includes projects created from assignments the instructor created; broader cohort-staff project listing can be expanded without changing the persistence contract.

## 22. Phase 3 entry contract

Phase 3 may build the authenticated Studio shell and student routes against these endpoints. It must consume canonical project IDs and response fields, preserve organization headers/context, and keep presentation labels separate from lifecycle truth. It must not introduce browser project persistence, a second project model, or a ClientOps path for Student projects.
