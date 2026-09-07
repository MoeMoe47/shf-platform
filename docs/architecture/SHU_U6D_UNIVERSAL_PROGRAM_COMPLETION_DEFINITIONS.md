# SHU U6D Universal Program Completion Definitions

## Root Cause

Before U6D, `ProgramCompletionService` had one executable policy: the Data Center specialization pathway. Other seeded programs had identity and certificate profiles but no canonical definition of their completion requirements, so they correctly failed closed.

## Authority Ownership

Completion definitions belong to the Programs/Curriculum program-authority boundary. They configure which existing domain authorities prove completion; they do not own lessons, assessments, evidence, competencies, credentials, or reports. Credential eligibility consumes the completion result. Shared Reporting may display an authorized result but cannot create or alter it.

## Definition Model

Migration 110 adds `program_completion_definitions`, scoped by organization and tenant, with a canonical program reference, immutable version, lifecycle status, bounded completion mode, trusted requirements snapshot, authority reference, and SHA-256 definition hash. Active definitions are unique per scoped program. Existing `program_completion_records` gain definition ID, definition version, and requirements snapshot hash without changing migration 109.

Supported requirement types are currently `LESSON_COMPLETION` and `COMPETENCY_DEMONSTRATED`, matching implemented canonical authorities. Requirements carry canonical references and, for lessons, a canonical curriculum/course reference. Unsupported types are rejected rather than stored as promises.

Completion modes are bounded to `ALL_OF`, `ONE_OF`, and `MINIMUM_COUNT`; there are no Boolean expression strings, SQL, JavaScript, caller evaluators, or arbitrary formulas. The evaluator registry is implemented by the typed requirement dispatch inside `ProgramCompletionService` and queries only canonical lesson-completion and competency-decision records.

## Lifecycle and Authorization

Definitions move `DRAFT -> ACTIVE -> RETIRED`. Activation validates the program, references, requirement types, identifiers, scope, and definition snapshot. Only ACTIVE definitions establish new completion. Retirement stops new evaluations and leaves historical completion and certificate records valid. Definition management reuses the existing `program.course.assign` / `program.update` administration permissions; learners cannot create or activate definitions.

The API surface is:

* `GET /programs/:id/completion-definitions`
* `POST /programs/:id/completion-definitions`
* `POST /programs/:id/completion-definitions/:definitionId/activate`
* `POST /programs/:id/completion-definitions/:definitionId/retire`

## Data Center Parity

The accepted `data-center-specialization-11` policy remains the source of truth. On first evaluation for an active specialization, a trusted Data Center definition is materialized with the existing `grade12-entry-v1:<specialization>` version and the same lesson and demonstrated-competency requirements. The generalized evaluator then evaluates it and persists the definition identity, version, and snapshot hash. U6B remains green.

## Summer STEM and Production Configuration

`program_seed_001` remains intentionally without an ACTIVE definition. Repository evidence provides the program row and report/certificate profiles, but does not provide authoritative course/lesson/assessment/project requirements or an evaluator-owned completion policy. U6D does not fabricate those requirements. Its completion endpoint returns `BLOCKED` with `PROGRAM_COMPLETION_DEFINITION_UNAVAILABLE`, and its certificate remains ineligible. A program owner must author and activate a real version through the definition workflow.

## Generic Second-Definition Proof

The disposable Phase 8 program uses the same program, curriculum, lesson-completion, definition API, activation, and completion endpoint authorities. A test-only `ALL_OF` definition binds `phase8_program_a` to its canonical `phase8_lesson_a`; the learner completes the lesson through the normal Curriculum service and `ProgramCompletionService` reaches `COMPLETED`. This fixture is explicitly non-production and proves the generalized platform, not a fabricated public program.

## Certificate and Reporting Boundaries

Certificate profiles still identify presentation and issuance policy only. Certificate eligibility asks for canonical completion; it does not define requirements. Reporting remains a separate authority and cannot activate definitions, mark learners complete, or issue credentials.

## Integrity and Versioning

Definition snapshots and completion results are hashed. Completion IDs remain deterministic by scoped learner, program, and requirements version. Re-evaluation is idempotent and emits one `program.completed` event per completion identity. New versions coexist without rewriting historical records; retirement does not revoke certificates.

## Validation and Regression Evidence

* Migration replay: 001–110, pending `[]`, drift `[]`, unknown `[]`.
* U6D unit tests: 6/6 passed.
* U6D disposable API acceptance: 2/2 passed.
* Data Center U6B disposable acceptance after migration 110: 1/1 passed.
* API typecheck/build: passed.
* Root production build: passed.
* UI validation/style/snapshot: passed.
* `git diff --check`: passed.

## Revised U6 Acceptance

U6 now distinguishes platform capability from program configuration. The universal completion-definition platform is complete and closes the architectural blocker. Data Center is production-proven. Programs without an authored ACTIVE definition, including Summer STEM, remain correctly blocked until their program authority supplies legitimate requirements. Verified competency credential issuance remains deferred unless a separate canonical credential authority exists.

## U7 Readiness

U7 should recheck Registry compatibility, Solutions compatibility, Legal canonical API authority, and cross-product composition authority. It should not rebuild completion, credential, or reporting foundations.
