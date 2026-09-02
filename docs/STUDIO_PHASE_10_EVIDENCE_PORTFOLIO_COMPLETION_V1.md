# Studio Phase 10 — Evidence + Portfolio + Completion Integration

## Purpose

Phase 10 connects an exact, finalized student Studio delivery to SHRV1's existing institutional Evidence and completion architecture. It does not create a second Evidence, Portfolio, completion, Truth Spine, reporting, credential, or celebration system.

## Inherited contracts

Phase 1–9 contracts remain authoritative: project ownership and assignment/release lineage, tenant scope, Build Packet, durable revisioned Website/AI Agent work, deterministic QA, immutable review submissions, exact-revision Delivery finalization, Beginner/Advanced presentation modes, read-only Companion context, and the exclusion of ClientOps, public deployment, Evidence, Portfolio, completion, and credentials from Studio-owned state.

## Authority audit findings

`prepare_prove_evidence` and `curriculum_truth_facts` are the active SHRV1 Evidence/Truth stores. `verified-evidence-service.ts` is the canonical projection service and the trusted-reporting dispatcher is its internal event boundary. `CurriculumCompletionService` and `completion-evaluator.ts` own completion policy evaluation and completion writes. Journey milestones read canonical facts. No durable Portfolio service/table was found; current Portfolio UI and lesson helpers use browser-local/demo state and are not promoted to institutional truth.

## Evidence ownership and eligibility

Studio does not own Evidence. The existing Evidence rule registry must contain an active `STUDIO_DELIVERY` rule with an `evidence_type` before a finalized student delivery is projected. A delivery is source-eligible only when its server-side row is `FINALIZED`, its project destination is `STUDENT`, and the delivery already binds the exact approved submission, QA run, review decision, and workspace revision. Commercial deliveries are excluded.

## Projection, provenance, and idempotency

`studio.delivery.finalized` is recognized by the existing outbox projector as `STUDIO_DELIVERY`. The source row is resolved by joining the delivery to its canonical Studio project under organization scope. Projection inserts into `prepare_prove_evidence` using the existing deterministic source/rule identity and the existing unique source index. The Evidence status is always `REVIEWABLE` for Studio; Studio review approval is not Evidence verification. Provenance carries the delivery ID, project ID, source rule, and exact workspace revision. Studio outbox projection suppresses direct Truth-fact creation; Truth remains downstream of canonical Evidence verification/completion paths.

Repeated events are idempotent. A newer workspace revision cannot retarget an older delivery or Evidence record. A later revision requires its own QA, review, and finalization chain.

## Portfolio ownership

No Portfolio write is implemented. The existing Portfolio surface is not a durable canonical domain in this repository, so Studio reports `NOT_CONNECTED` rather than manufacturing a Portfolio artifact. A future Portfolio integration may consume a finalized Studio artifact/Evidence reference through its own authority. Website records will not imply hosting; AI Agent records will not imply Registry acceptance, certification, or production execution.

## What You Proved

Studio exposes a read-only status surface backed by canonical Evidence and `DEMONSTRATED` competency decisions. It does not infer skills from project type, page visits, saves, or UI activity. With no verified competency decision it truthfully shows that Evidence is being processed or that no verified outcomes exist.

## Completion policy

`STUDIO_PROJECT` is an explicit completion-policy requirement type. Its adapter reads only a finalized, student-destination Studio delivery joined to the learner's exact assignment and organization/tenant scope. It can satisfy only a policy requirement that explicitly targets that Studio project. It does not directly write assignment or lesson completion and does not bypass other required CONTENT, ASSESSMENT, REFLECTION, PRACTICE, ATTENDANCE, or verification requirements. The existing completion evaluator remains the only authority that can determine full policy eligibility; `CurriculumCompletionService` remains the only completion writer.

## Truth, reporting, credentials, milestones, and Companion

Studio does not write Truth Spine, reporting facts, credentials, or completion events. The Evidence projection uses the existing trusted outbox and existing Truth adapter only for non-Studio sources; Studio Evidence remains reviewable. Existing milestone infrastructure may later consume verified canonical facts; no new Studio celebration trigger was added. Companion may read the status read model and explain pending Evidence or assignment requirements, but cannot verify Evidence, change Portfolio state, complete curriculum, or mutate Truth.

## APIs and student UI

Added read-only `GET /studio/projects/:projectId/institutional-status` and an explicit, server-authorized `POST /studio/projects/:projectId/evidence` projection request. Browser bodies are empty and cannot provide project, learner, organization, lineage, verification, or completion authority. The Studio builder displays `What You Proved`, Evidence processing status, verified outcomes when canonical decisions exist, assignment policy status, and an honest Portfolio-not-connected state. Beginner Mode keeps internal IDs and projection terminology hidden; Advanced Mode remains presentation-only.

## Accessibility and responsive behavior

The new panel uses a semantic heading, text status, alert handling, keyboard-accessible action, and readable empty/error states. It uses existing Studio layout and accessibility conventions; it does not add a second preference or celebration system. Mobile layout relies on existing wrapping rules and the panel has no fixed-width content.

## Verification

Focused contract tests were added in `apps/shs-api/tests/studio-phase10-contract.test.ts`. API typecheck passed. The frontend build and repository validations remain the required next checks. Database/browser acceptance requires the repository's disposable PostgreSQL and authenticated browser harness with an active Studio Evidence rule; no migration was added in Phase 10. Migration 069/070/073 replay evidence from prior phases remains unchanged.

Phase 10 browser acceptance subsequently ran against a fresh disposable PostgreSQL database with the real API and Vite frontend. The authenticated `learner_A1` Website flow saved work, ran QA, submitted for review, received an authenticated reviewer approval, finalized the exact revision, prepared Evidence through the new Studio endpoint, and observed `REVIEWABLE` Evidence at 390x900 with no Portfolio, completion, deployment, or verification claim. The first run reproduced a stale pre-finalization status panel; the minimal fix dispatches a delivery-finalized refresh event, and the rerun passed. The Phase 9 two-test browser regression also passed. The acceptance fixture cleaned up its database and processes.

## Known limitations

There is no durable Portfolio authority to connect yet. Studio Evidence remains `REVIEWABLE` until the existing Evidence reviewer/verifier records a canonical competency decision. Completion status is evaluative/read-only from Studio and full assignment completion remains dependent on every declared policy requirement. No public Website deployment, Agent Registry submission, credentialing, or new celebration behavior is included.

## Phase 10.1 independent acceptance

Phase 10.1 repeated the unresolved acceptance paths using the disposable
PostgreSQL/API/Vite/Chromium harness. Each run replayed migrations 001 through
074, used isolated organization and learner fixtures, and cleaned up its
database and processes.

- Authenticated AI Agent flow: PASS. Agent work was saved, checked, reviewed,
  finalized, and projected through canonical Evidence. The result was
  `REVIEWABLE` and Student-destination scoped; Portfolio remained
  `NOT_CONNECTED`, with no Registry, credential, ClientOps, or completion
  claim.
- Assignment-origin flow: PASS. The handoff and project retained the exact
  assignment and release IDs. The assignment completion endpoint evaluated the
  sole `STUDIO_PROJECT` requirement and wrote completion only through
  `CurriculumCompletionService`.
- Evidence idempotency and stale revision: PASS. Repeated projection returned
  the deterministic existing Evidence record. A later workspace revision left
  the finalized delivery and Evidence provenance unchanged, and the browser
  reported that the Evidence came from an earlier version.
- Cross-organization and cross-learner Evidence status/projection requests:
  PASS, denied with existing fail-closed authorization responses.
- PostgreSQL migration replay: PASS through 074, with no pending, drift, or
  unknown migrations.

Two defects were reproduced and repaired during this pass:

1. The completion-policy database check constraint rejected the already
   registered `STUDIO_PROJECT` requirement type. Additive migration 074 now
   reconciles the constraint without rewriting historical migrations.
2. Assignment handoff used a conflict target that did not match the existing
   partial unique index, and its project insert omitted server-derived
   organization/tenant fields. The service now uses the matching predicate and
   passes the derived scope.

The standalone completion-policy DB suite still fails in the restricted
environment during PostgreSQL cleanup with `EPERM`; it is not reported as a
passing suite. The assignment-origin flow above provides isolated PostgreSQL
coverage of the Studio requirement through the actual API.

## Phase 11 entry contract

Phase 11 may refine assignment and teacher review integration using the existing Studio Review authority. It can add teacher visibility, assignment authoring, reviewer routing, feedback, resubmission, and completion-policy presentation without duplicating Studio Review, Evidence, Portfolio, or Completion domains. A future Portfolio phase must first establish its canonical persistence and ownership before Studio adds any write path.
