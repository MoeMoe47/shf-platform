# SYS-4C5 Curriculum Catalog / Import Final Consumer Acceptance Report

## 1. Executive Result

**COMPLETE for WF-018.** Fresh disposable PostgreSQL, authenticated API, and
the mounted StudentUnit consumer proved one structured source through import,
publication, assignment, learner API, and browser rendering. A small additive
schema fix was required because imported lesson payload was previously retained
only in import candidates and lost during canonical execution/publication.

## 2. Scope and Baseline

Path: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD: `0441aa4`  
Fresh database: `shs_sys4c5_20260910`, PostgreSQL port `55443`  
Migration head: `125_curriculum_lesson_content.sql`; applied `001–125` with
pending/drift/unknown all empty. Owner worktree changes were preserved.

WF-026 career visibility closure, SYS-4D, SYS-5, Azure, and production Agent
Fabric execution were out of scope. Azure is **N/A — NO AZURE-BACKED SYS-4
WORKFLOW PRESENT**. WF-040 remains **BLOCKED — SAFETY/POLICY**.

## 3. Canonical Acceptance Fixture

The fixture used two organizations, scoped admin/student roles and
memberships, a Program, Cohort, active Enrollment, Curriculum service
entitlement, and no seeded learner completion. Source key was
`sys4c5-20260910`; the disposable source file was a structured JSON lesson.

## 4. End-to-End Chain

`POST /curriculum/import-jobs` returned `READY` with three valid candidates
(Course, Unit, Lesson). Preview returned the candidate tree without catalog
rows. Execute returned `COMPLETED` and created Course
`course_f893b6cf42b9ee393372c301`, Unit `unit_5e2752ab758179be7a626c44`, and
Lesson `lesson_98974e991123b4d326016fed`.

The course then traversed `DRAFT → IN_REVIEW → APPROVED → PUBLISHED`, producing
release `release_f589a9ad0d35d7d36764cb6c` (version 4). Assignment
`asmt_37ca7062-96e4-4282-93e6-8c67e1806547` bound the published release and
lesson to Student A.

Student API calls returned the imported lesson title, objective, sections,
vocabulary, practice prompt, and reflection prompt. The mounted route was
`/curriculum/lessons/lesson-imported` in `curriculum.html`; a fresh Playwright
browser context displayed `SYS4C5 Imported Lesson Final` and the imported
objective. Network capture showed `/assignments` and
`/activity-domains/assignments/.../lessons/...` calls, with no static fallback
used for the canonical learner state.

## 5. Job Lifecycle and Safety

Invalid source creation returned `422 INVALID_REQUEST`. A stale completed-job
replay returned a bounded execution failure after the source had been
superseded; the current completed job replay returned `200` with
`alreadyCompleted: true`. Job history contained four `COMPLETED` and one
`FAILED` jobs. Existing repository suites cover execution rollback, retry,
cancellation, document processing, resource/Arcade linkage, and cross-tenant
job access; their fresh-DB harness assumes default identities and therefore
returned `401` before route assertions when run unchanged. This is classified
as **HARNESS**, not a product defect.

Cross-organization job access and Student B access to Student A's assignment
returned `404` fail-closed responses. Student A's learner API returned only
the organization-scoped assigned release. No completion, Evidence, Truth, or
institutional result was seeded or manufactured by import.

## 6. Concrete Remediation

Added migration 125, `curriculum_lessons.content JSONB NOT NULL DEFAULT '{}'`,
propagated through the canonical catalog model/repository/import execution, and
included in immutable release snapshots. This preserves source provenance and
makes imported instructional content available to the existing StudentUnit
activity-state API without creating a second content or learner-state authority.

## 7. Performance and Regression

The import path performed bounded Course/Unit/Lesson persistence and the
learner load used indexed organization/course/release and assignment lookup
paths. No new N+1 or unbounded history behavior was observed. API typecheck and
build, root build, manifest validation, UI validation, migration status, schema
integrity, and `git diff --check` passed. Existing Vite chunk-size warnings are
non-blocking and pre-existing.

## 8. Final Consumer Matrix

| Path | Canonical final consumer | Live proven | Terminal outcome |
|---|---|---:|---|
| Structured import | Import job/API | YES | `COMPLETED` |
| Published catalog | Student catalog/activity API | YES | Published release read |
| Assigned lesson | Mounted StudentUnit | YES | Imported title/objective rendered |
| Invalid source | Import API/job boundary | YES | `422`, no catalog mutation |
| Cross-organization access | Scoped API | YES | `404` fail closed |

## 9. Remaining SYS-4 Work

WF-026 Career event/opportunity visibility remains a separate
`PARTIAL — ACCEPTANCE GAP` from the re-audit. No other SYS-4 implementation was
started or changed by this phase.

## 10. Files

Modified production files: curriculum catalog model, repository, catalog
service, and import-job service. Added migration
`apps/shs-api/migrations/125_curriculum_lesson_content.sql`, this report, and
the disposable source fixture used during acceptance. Systemwide artifact
status updates were limited to WF-018 and the current SYS-4 re-audit evidence.

## 11. Decision

**SYS-4C5 CURRICULUM CATALOG / IMPORT FINAL CONSUMER ACCEPTANCE COMPLETE**

Next dependency-ranked work is the separate WF-026 Career visibility closure
acceptance phase. Do not begin it here.
