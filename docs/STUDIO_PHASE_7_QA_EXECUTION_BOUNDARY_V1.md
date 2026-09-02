# SHF Studio Phase 7 — QA / Check My Project Execution Boundary

## Purpose

Phase 7 adds a bounded QA authority for deterministic checks over durable Studio Builder Workspace revisions. QA describes structural/content checks for saved student work; it does not approve, complete, deliver, verify, credential, report institutional achievement, or create Evidence/Portfolio records.

## Inputs and persistence

`POST /studio/projects/:projectId/qa` authenticates through the existing Studio project permission, resolves organization/tenant from the actor, authorizes the project, loads the canonical Build Packet and current durable workspace, and evaluates that exact workspace revision. Each result is stored in `studio_qa_runs` with project, scope, type, revision, ruleset, summary, findings, actor, and timestamps. `GET /studio/projects/:projectId/qa/current` returns the latest run only as current when its workspace revision equals the current workspace revision; otherwise it returns `STALE`.

## Ruleset v1

Website checks: supported workspace shape, Home page title, Home page content, and absence of unsupported secret fields. AI Agent checks: supported workspace shape, agent name, instructions, and absence of unsupported secret fields. The project row selects the checker family. Missing saved work fails the saved-work check. Overall logic is ERROR if any check errors, FAILED if any check fails, otherwise PASSED. Warnings and not-applicable results remain separate counts.

## Boundaries

QA runs are historical and revision-bound. Saving workspace work does not run QA or mutate lifecycle, Build Packet, requirements, resources, review, delivery, Evidence, Portfolio, completion, credentials, Truth, or reporting. QA does not execute arbitrary Website code or Agent tools, use an LLM as an authority, submit to the Registry, or create review decisions. The browser sends no project type, scope, revision override, findings, or expected result; it only invokes the project-scoped action. Operational `studio.qa.completed` events identify the QA operation and are not completion events.

## Student presentation

The shared builder renders `Check My Project` with truthful states: Not checked yet, Checking, Looks good, Needs changes, Project changed — check again, and Check could not finish. Findings show student-safe messages and guidance. A saved edit makes an older result stale by revision comparison. Beginner presentation hides rule IDs and technical payloads; no separate QA truth model is created.

## Security and limitations

Project authorization and organization/tenant scope are enforced before reads or writes. Foreign projects fail closed. QA is synchronous and creates a historical run per invocation. No project lifecycle transition is performed. Execution-based Website/Agent QA, human review, deployment, Evidence, Portfolio, completion, credentials, and advanced rubric evaluation remain deferred.

## Phase 8 entry contract

Phase 8 may consume Build Packet, durable Builder Workspace, and the current revision-bound QA result to introduce human/institutional review. It must preserve the distinction between QA findings and review decisions and must not reinterpret stale QA as current.

## Acceptance evidence

The official disposable environment applied migrations 001 through 071 with no pending, drift, or unknown migrations. The final authenticated Chromium run used API `http://127.0.0.1:56119`, frontend `http://127.0.0.1:56126`, disposable database `shs_phase8_acceptance_1788374253348_wozfdg`, and the repository development-only fixture identity boundary. `tests/phase7-qa-browser.spec.mjs` passed 3/3.

The Website flow saved incomplete work, invoked `Check My Project` through the real project-scoped POST endpoint, rendered deterministic failed findings, saved a new revision, marked the prior result stale, rechecked, and rendered `Looks good`. The AI Agent flow verified Agent-specific checks, corrected missing instructions, rechecked successfully, and denied foreign-organization QA reads. Browser request inspection verified an empty trigger body. The mobile check passed at 390x900 with no horizontal overflow. Downstream counts for Evidence, lesson completion, credentials, and Truth facts were unchanged by QA.

Focused Studio verification passed 22/22 backend tests and 21/21 frontend tests. API typecheck/build, frontend build, UI validation, manifest validation, and `git diff --check` passed. No production authentication, screen-reader conformance, execution-based QA, review, delivery, Evidence, Portfolio, or completion behavior was introduced or claimed.
