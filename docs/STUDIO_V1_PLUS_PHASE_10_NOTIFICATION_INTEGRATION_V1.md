# Studio V1+ Phase 10 Notification Integration

## 1. Executive result

Phase 10 adds the smallest durable in-app Notification projection for canonical institutional events. Notifications inform users; they do not establish or mutate institutional truth.

## 2. Current-state audit

The audited repository had no canonical notification table, consumer, API, or inbox. The curriculum header contained a placeholder unread dot and empty popover. `integration_outbox` was the existing durable event source and was reused.

## 3. Authority and source events

Notification authority owns `notifications` records, recipient-scoped read state, templates, and safe destination paths. Source domains remain authoritative. Supported mappings use existing events: `studio.review.routed`, `studio.review.reassigned`, `studio.review.decision_recorded`, `credential.issued`, `credential.revoked`, `deployment.live`, `deployment.failed`, `registry.submission.accepted`, `registry.submission.changes_requested`, `registry.submission.rejected`, `registry.submission.failed`, and `lesson.completed`.

## 4. Policy and recipients

Recipients are resolved server-side from event payloads or scoped source-table lookups. Routed/reassigned work goes to the assigned reviewer. Review outcomes, Credentials, Deployment, Registry, and Completion go to the canonical learner/project owner. Client recipient, learner, organization, tenant, or status claims are never used.

## 5. Persistence and lifecycle

Migration `081_notification_integration.sql` creates `notifications`, scoped foreign keys/checks, bounded title/message fields, recipient/status indexes, and a unique source-event/recipient/type identity. Lifecycle is `UNREAD`, `READ`, or `ARCHIVED`; the current API uses unread/read. Read timestamps are durable and idempotent.

## 6. Event consumption and reliability

`IntegrationOutboxRepo.enqueue` invokes the deterministic notification policy using the same executor/transaction. The notification insert is idempotent and source-event scoped, so duplicate enqueue/delivery attempts do not create uncontrolled records. This is the repository’s current transactional projection seam; a separate worker/replay process remains future infrastructure if asynchronous delivery is required.

## 7. APIs and UI

Implemented routes are `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, and `POST /notifications/read-all`. All reads and writes require an authenticated organization/tenant context and are recipient-scoped. The new `/curriculum/notifications` page and curriculum-header popover use backend records, newest-first ordering, bounded templates, native links/buttons, visible status text, honest empty/error states, and no localStorage truth.

## 8. Deep links, privacy, and boundaries

Links point to canonical destinations; destination authorization remains authoritative. Notification payloads do not expose tenant keys, membership IDs, raw Evidence IDs, secrets, raw provider errors, or other learners’ private data. Mark-read changes Notification state only. Notifications do not create or alter Review, Routing, Completion, Evidence, Credential, Portfolio, Deployment, Agent Package, Registry, Studio, runtime, or ClientOps facts. Notification-created events are not consumed as source events, preventing loops.

## 9. Channel policy

IN_APP is the only Phase 10 delivery channel implemented. Email, SMS, web push, channel preferences, broad admin alerting, and external provider credentials are deferred. No source-domain action depends on external delivery success.

## 10. Live acceptance

`tests/phase10-notification-live.spec.mjs` passed `1/1` on disposable PostgreSQL with migrations `001–081`. The executed golden path created a real Studio Review submission, observed the routed reviewer notification, marked it read, verified the routing assignment was unchanged, confirmed duplicate routing did not duplicate the notification, verified foreign-organization list/read isolation, and rendered issued and empty notification pages at 1440px, 768px, and 390px with reduced motion enabled. This directly proves canonical event consumption, server-derived recipient resolution, persistence, idempotency, read behavior, privacy scope, semantic accessibility, and source-authority containment.

## 11. Regression and validation

Fresh isolated acceptance suites passed for Reviewer Routing (`1/1`), Studio/Review (`1/1`), Completion (`1/1`), Portfolio (`1/1`), Website Deployment (`1/1`), Agent Package (`1/1`), Autonomous Registry (`1/1`), and Credential (`1/1`). The Agent Package test required a test-only wait for the canonical submitted UI state before reading `/review/current`; no production behavior changed. API typecheck/build, frontend build, `ui:validate`, `manifests:validate`, and `git diff --check` pass. Migration replay reports `81 applied`, zero pending, zero drift, and zero unknown applied migrations.

## 12. Accessibility and responsive baseline

The page uses semantic `main`, headings, native list structure, native links/buttons, textual `UNREAD`/`READ` status, visible focus inherited from the operations shell, keyboard-reachable controls, and honest loading/error/empty states. The live browser check passed at desktop, tablet, and mobile widths with `prefers-reduced-motion: reduce`; the page uses the existing responsive operations styles. Full assistive-technology certification remains Phase 14 scope.

## 13. Phase 11 entry contract

Phase 11 is Team Project Authority. It will govern project team identity, membership, roles, ownership, invitations/join/leave, project authorization, contribution boundaries, and institutional submission ownership. Notifications may consume those future canonical events but must remain presentation/delivery infrastructure.

## Final Notification initiative verdict

Phase 10 Notification Integration is **COMPLETE**. Notifications are durable, backend-derived, recipient-scoped, idempotent, privacy-bounded, responsive, and unable to manufacture source-domain truth.
