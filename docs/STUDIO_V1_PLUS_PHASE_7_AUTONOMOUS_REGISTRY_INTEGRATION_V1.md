# Studio V1+ Phase 7: Autonomous Registry Integration

## 1. Executive Result

Phase 7 adds an explicit, provider-neutral submission boundary for immutable,
validated Studio AI Agent Packages. The repository's existing Registry-looking
surfaces are internal SHF administration and Agent Fabric support; they are not
a student Autonomous Registry authority. This phase therefore uses a separate
`agent_registry_submissions` boundary and a clearly labeled local test adapter.
No external Registry call is made.

## 2. Authority and Eligibility

Registry submission is a Registry-domain concern. It requires a valid Phase 6
package, exact finalized AI_AGENT revision, matching organization and tenant,
and the dedicated submission permission. The server derives all package,
learner, project, revision, validation, and scope facts. The client cannot
submit status, hash, identity, Registry reference, or runtime authority.

Submission binds package ID, package version, and package hash exactly. The
stored Phase 6 package JSON and hash are treated as immutable source authority;
the submission boundary accepts only a valid stored hash shape and structured
package record, so certified historical package hashes are not rewritten.

## 3. Status and History

Submission statuses are `SUBMITTED`, `UNDER_REVIEW`, `CHANGES_REQUIRED`,
`ACCEPTED`, `REJECTED`, `FAILED`, and `WITHDRAWN`. A local test adapter may
return `ACCEPTED`, presented as **Accepted by Test Registry**. This is not
official Registry acceptance, production approval, runtime authorization, or
public listing.

Failed attempts remain historical. Retry creates a new submission linked by
`resubmission_of` and never overwrites the failed record. A package in
`CHANGES_REQUIRED` or `REJECTED` is not silently resubmitted; a new finalized
revision and package are required.

## 4. Persistence and API

Migration `078_agent_registry_submission.sql` adds scoped submission records,
package/project foreign keys, status and provider checks, package hash/version
fields, indexes, and an active-identity uniqueness index. The API is:

* `POST /agent-packages/:packageId/registry-submissions`
* `GET /agent-packages/:packageId/registry-submissions`
* `GET /registry-submissions/:submissionId`
* `POST /registry-submissions/:submissionId/retry`

Repeated active submissions are idempotent. PostgreSQL advisory locking and a
terminal-state recheck bound concurrent delivery and prevent duplicate accepted
events. The only provider in this phase is `local_test_registry`; it returns a
deterministic test reference and no public URL.

## 5. Student Seam

The existing AI Agent Package panel exposes **Submit to Registry** only after
validation is `VALID` and `READY_FOR_REGISTRY`. It displays submitted, changes
requested, rejected, and test-accepted states without presenting raw internal
IDs. Website projects have no Registry controls. Package generation remains
separate from submission.

## 6. Boundaries

Submission and Registry status do not mutate Studio QA, Review, Delivery,
Evidence, Completion, Portfolio, Website Deployment, Credentials, ClientOps,
or runtime permissions. Registry acceptance does not execute an Agent, grant
tools, issue credentials, complete coursework, or publish a marketplace
listing. Package content contains only governed package data; provider secrets,
runtime credentials, and external service credentials are excluded by the
Phase 6 package validator.

## 7. Verification

The Phase 7 contract suite covers deterministic test-provider identity,
cross-scope denial, provider failure persistence, bounded failure events, and
package immutability. The live acceptance uses the existing disposable
PostgreSQL Phase 9 environment, replays migrations through 078, creates a
canonical finalized AI Agent package, submits it explicitly, verifies the
package/hash binding, repeats the request for idempotency, and inspects only
bounded Registry outbox events. Full external Registry acceptance is not
claimed because no external Registry is configured.

## 8. Phase 8 Entry Contract

Phase 8 may integrate Credentials using institutional Evidence, Completion,
Outcome, and Competency eligibility. Registry status may be displayed as a
separate fact, but Registry acceptance must not become credential authority
without an explicit eligibility policy. Credential issuance remains outside
Studio, Agent Package, and Registry submission boundaries.

## 9. Phase 7.1 Final Acceptance

Phase 7.1 adds a process-only local test Registry status selector,
`SHS_TEST_REGISTRY_SCENARIO`. It is not a request field, is ignored when the
API runs in production, and defaults to `ACCEPTED`. Supported test scenarios
are `ACCEPTED`, `CHANGES_REQUIRED`, `REJECTED`, and `FAILED`.

Fresh disposable PostgreSQL acceptance proved the `CHANGES_REQUIRED` flow:
Package N is submitted explicitly and remains immutable; Registry feedback is
stored without reopening Studio or changing Evidence, Completion, Credentials,
runtime permissions, or listing state; a new Studio revision creates a distinct
Package N+1 after its own QA, Review, and Finalization; and the new submission
gets server-derived `resubmission_of` lineage. Package N+1 can then be
explicitly submitted and accepted while Package N remains historical.

The `REJECTED` flow proved rejected submissions remain Registry-only historical
records. A later submission is a separate bounded historical attempt, matching
the existing policy that terminal rejected submissions are not active
idempotency identities. No fake acceptance is shown.

Both live runs replayed migrations 001 through 078 with zero pending
migrations, drift, or unknown applied migrations. Database inspection showed
only Registry submission records and bounded Registry outbox events changing
as a result of Registry actions. No Studio, Evidence, Completion, Portfolio,
Deployment, Credential, ClientOps, runtime, or marketplace authority was
written. Full focused Studio, Agent Package, Portfolio, Website Deployment, and
Completion regressions remain separate authority checks.

The local test Registry is not an external Registry. `Accepted by Test Registry`
does not mean production approval, runtime authorization, credential issuance,
or public listing. Existing responsive and accessibility checks cover the
Registry status panel at supported breakpoints; full assistive-technology
certification remains deferred.

## 10. Phase 7.2 Final Certification

Phase 7.2 completed the remaining acceptance work in the disposable Phase 9
PostgreSQL environment. The assignment-origin AI Agent flow used the canonical
assignment handoff, learner, organization, QA, Review, Delivery, and package
boundaries. Registry submission and `ACCEPTED`/`FAILED`/retry actions did not
change assignment, lesson, course, or pathway completion state. The established
Completion/Assignment browser regression passed 3/3 in the same disposable
environment, including verified completion, incomplete-requirement behavior,
and assignment lineage.

The process-only `FAILED_ONCE` Registry scenario proved a persisted failed
submission, truthful failure handling, explicit authenticated retry, preserved
failed history, and a successful accepted retry with server-derived lineage.
Foreign learner access remained denied. The Registry UI was exercised at
1440x900, 768x1024, and 390x900 with no horizontal overflow; status text,
alerts, headings, buttons, and history state remain programmatically exposed.
Keyboard focus was verified, and failed state uses `role=alert`. These checks
are an accessibility baseline only, not full VoiceOver/NVDA certification.

Fresh migration replay through 078 remained clean with zero pending, drift, or
unknown migrations. Before/after checks confirmed Registry actions changed only
Registry submission records and bounded Registry outbox events. No Studio,
Evidence, Completion, Portfolio, Deployment, Credential, ClientOps, runtime,
or marketplace records were written by Registry status transitions. Legacy
browser state is not Registry authority. Website Deployment, Portfolio, Agent
Package, and Studio regressions remain passing.

The Autonomous Registry initiative is certified for the local test Registry
scope only. It does not claim external Registry acceptance, production runtime
authorization, credential issuance, or marketplace publication.

## 11. Phase 7.3 Final Certification Closure

Phase 7.3 used the disposable Phase 9 PostgreSQL acceptance harness and added
the remaining live boundary checks without changing the Registry schema. An
authenticated learner with a valid Package A was sent through the real HTTP
API with an unauthorized `x-shs-organization-id` for Organization B. Submit,
detail, history, and retry all failed closed with no Registry mutation or
provider consequence. The repository derives tenant from the authorized active
organization, so an independently supplied tenant value is not an accepted
HTTP input; the unauthorized organization context is the supported live
equivalent of a mismatched tenant request, while the service scope contract
continues to reject inconsistent actor tenant values.

Three near-simultaneous retries against one failed submission were exercised
against live PostgreSQL. Advisory locking and the active identity boundary
kept the result bounded at the original failed record plus at most one retry
record; package ID, version, hash, project, scope, and failed history were
preserved. No duplicate terminal Registry consequence was produced.

The live acceptance captured Registry and completion counts before and after
the action matrix, and verified Registry-only mutations. The canonical schema
inventory covered Studio projects, workspaces, QA, Review, Delivery, Agent
Packages, Registry submissions, Evidence, Completion, Portfolio, Website
Deployment, and Credentials. No Registry action changed the Studio,
Evidence, Completion, Portfolio, Deployment, Credential, runtime, ClientOps,
or marketplace authorities. The local test environment does not contain
separate runtime or marketplace tables; those boundaries remain explicit
non-owned authorities.

The Registry panel was checked at 1440x900, 768x1024, and 390x900. Playwright
ARIA snapshots exposed the Registry heading, package status, status/alert
semantics, and interactive controls; a keyboard tab-cycle check found no body
focus trap. Failed state remains an alert with an explicit retry control.
These are automated semantic and keyboard baselines, not full
VoiceOver/NVDA certification.

Phase 7.3 regressions remained green: Registry, Agent Package, Studio,
Portfolio, Website Deployment, and disposable Completion acceptance. Fresh
migration replay through 078 reported zero pending, drift, or unknown
migrations. The Autonomous Registry initiative is complete for the local test
Registry scope only. It does not claim external Registry acceptance, runtime
authorization, credentials, or marketplace publication.

## 12. Phase 7.4 Accessibility Activation Final Closure

Phase 7.4 completed the remaining acceptance work using fresh disposable
PostgreSQL environments and the existing authenticated Playwright harness.
The validated-package state was submitted with keyboard focus and Enter in
the `ACCEPTED` scenario, and with Space in the `CHANGES_REQUIRED` scenario.
The failed-provider state was retried with Enter in `FAILED_ONCE` and with
Space in `FAILED`; canonical API responses and rendered status were verified
after each action. Focus was placed on the invoking control before
activation, and keyboard traversal continued through the resulting document
without a trap.

ARIA snapshots covered the Registry section and package/status controls in
the exercised states. Ready, submitted, changes requested, accepted,
rejected, and failed states are exposed as text and semantic status/alert
content rather than color-only indicators. Failed state exposes the bounded
failure message and `Retry Registry Submission` control. The Registry panel
remained within the viewport at 1440x900, 768x1024, and 390x900 with
reduced-motion emulation enabled.

The closure run also found and repaired a real concurrency defect: concurrent
retries previously created multiple retry rows because a row lock conflicted
with the nested retry transaction's foreign-key lock. The unnecessary row
lock was removed; the per-submission PostgreSQL advisory lock remains the
serializer. Three simultaneous retries now resolve to the original failed
record plus one bounded retry identity, with no uncontrolled duplicate retry
history.

No migration or backend authority change was introduced. Registry, Agent
Package, Studio, Completion, Portfolio, and Website Deployment regressions
remain passing. The local Registry adapter transitions synchronously except
for the process-only `SUBMITTED` scenario, and all six canonical states were
independently exercised in fresh disposable environments.

## 13. Phase 7.5 Registry History UX and State Accessibility Closure

Phase 7.5 added the smallest student-facing history surface to the existing
Agent Package panel. It reuses the durable submission list endpoint for every
package, renders a newest-first semantic ordered list, and keeps the latest
submission as the primary Registry status. History entries are read-only and
show package version, status, safe feedback, and submitted time. No local
state is used as Registry authority.

The local test provider gained a process-only `SUBMITTED` scenario, ignored in
production, so a durable submission can remain observable before terminal
handling. Independent disposable PostgreSQL runs captured ARIA snapshots and
history assertions for `READY_FOR_REGISTRY`, `SUBMITTED`,
`CHANGES_REQUIRED`, `ACCEPTED`, `REJECTED`, and `FAILED`. Changes Requested
history preserved Package N beside accepted N+1; rejected and failed attempts
remained distinct historical rows.

Keyboard acceptance covered Submit with Enter and Space, Retry with Enter and
Space, focus before activation, and tab traversal through the Registry
section. Static history content remains semantic list content in document
order without artificial tabindex. The history list remained usable at
1440x900, 768x1024, and 390x900 with reduced-motion emulation. Reloads read
history from the durable API, and cross-scope and side-effect checks remained
passing.

No migration was added. API typecheck/build, frontend build, UI validation,
manifest validation, focused regressions, and migration replay through 078
remain green. Phase 7 is complete for the local test Registry scope; external
Registry acceptance, runtime authorization, credentials, and marketplace
publication remain outside this initiative.
