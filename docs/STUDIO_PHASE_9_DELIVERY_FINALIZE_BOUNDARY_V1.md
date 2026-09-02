# Studio Phase 9: Delivery / Finalize Boundary v1

## Purpose

Phase 9 adds a narrow, durable authority for finalizing the exact Studio revision that passed QA and received human approval. In this phase, finalization is an institutional lock of an approved revision, not public deployment.

## Inherited contracts

Phase 9 preserves the Phase 1 lifecycle and destination separation, Phase 2 canonical Studio projects, Phase 3 shell/routing, Phase 3.5 derived student experience, Phase 4 read-only Project Resources, Phase 5 derived Build Packet, Phase 6 durable revisioned workspaces, Phase 7 revision-bound deterministic QA, and Phase 8 immutable review submissions and decisions.

## Authority and persistence

There was no reusable Studio delivery authority. The new `studio_delivery_records` table is the smallest Studio-owned authority. Each record references one project, review submission, review decision, QA run, and exact workspace revision. The database enforces a unique submission and the tenant convention `tenant:<organization_id>`. Finalization history is append-only at the submission level.

## Eligibility and exact revision

`POST /studio/projects/:projectId/finalize` derives project, organization, tenant, current workspace, QA, and approved review from the authenticated request. Eligibility requires a saved current workspace, a `PASSED` QA run for the current revision, an `APPROVED` review submission for that same revision, and an authorized project owner or admin-tier actor. Browser input cannot select the revision, QA result, review, destination, organization, or final status.

An approved revision is not inherited by newer work. `GET /studio/projects/:projectId/delivery/current` reports a historical record as `STALE` when its revision differs from the current workspace. Finalizing newer work requires new QA and human review.

Repeated finalization for the same approved submission returns the existing record; the unique submission constraint prevents duplicate finalization facts under concurrent requests.

## Website and AI Agent semantics

For `WEBSITE`, `FINALIZED` means the approved Website snapshot is locked as the final Studio revision. No hosting, public URL, deployment, or publication occurs. For `AI_AGENT`, `FINALIZED` means the approved Agent configuration revision is locked for a future authorized registry/release workflow. It is not Registry approval, standards certification, production execution, or deployment.

The record preserves the canonical project destination (`STUDENT` or `COMMERCIAL`) but performs no destination dispatch. ClientOps is not called or exposed.

## Lifecycle and downstream boundaries

Finalization does not write the project lifecycle, workspace, Build Packet, QA run, or review decision. It does not create Evidence, Portfolio entries, completion facts, credentials, Truth claims, reporting facts, or delivery to a customer. The existing lifecycle service remains the only lifecycle authority; no Phase 9 transition is invoked because the current contract does not define an automatic finalization transition.

The operational event `studio.delivery.finalized` is emitted through the existing Studio outbox convention. It describes the delivery record only and is not a completion or Evidence event.

## APIs and presentation

* `GET /studio/projects/:projectId/delivery/current` returns current revision, eligibility, and the latest delivery record with current/stale presentation state.
* `POST /studio/projects/:projectId/finalize` performs the explicit authorized finalization action with an empty body.

Beginner Mode uses `Ready to Finish`, `Finalize Project`, `Finalized`, and `Earlier version`. Advanced metadata remains presentation-only. The student panel does not claim published, delivered, verified, completed, credentialed, or portfolio status. Companion remains read-only and may explain readiness but cannot finalize.

## Security

Both routes use canonical authentication, active organization/tenant context, Studio project authorization, and server-derived project type. A foreign organization or unauthorized project fails closed. A Website/Agent type cannot be selected by request data. No secret or downstream authority fields are accepted.

## Deferred work

Public Website deployment, custom domains, Agent runtime and Registry submission, standards certification, Evidence/Portfolio/completion bridges, credentials, notifications, customer handoff, billing, and ClientOps delivery are deferred. Phase 10 should audit the separate Evidence, Portfolio, and Completion authorities and define their consumption of approved QA, review, and finalization facts without merging them.

## Verification record

Migration 073 was added after migration 072. The repository disposable acceptance harness replayed migrations 001–073 on fresh PostgreSQL with `pending: []`, `drift: []`, and `unknownApplied: []`. The Phase 9 browser suite ran against the real local API and Vite frontend with the isolated fixture and passed 2/2: Website approval/finalization/stale-version flow and AI Agent approval/finalization/mobile/cross-organization denial flow. The existing Phase 8 authenticated regression passed 15/15.

The focused Studio backend contract suite passed 33/33, including finalization eligibility, stale revision denial, cross-organization denial, exact project type, idempotency, and historical delivery status. The focused Studio frontend suite passed 21/21. API typecheck/build, frontend build, UI validation, manifest validation, and `git diff --check` passed. Downstream count assertions over Evidence, lesson completion, credentials, Truth facts, and legacy project submissions remained unchanged across the Website finalization flow. No migration was modified after 073 and no protected database was used.

## Phase 10 entry contract

Phase 10 should audit the separate Evidence, Portfolio, and Completion authorities and define the smallest read-only bridge from the approved QA/review/finalization facts. It must not infer proof or completion from this delivery record alone and must not merge those authorities into Studio Delivery.
