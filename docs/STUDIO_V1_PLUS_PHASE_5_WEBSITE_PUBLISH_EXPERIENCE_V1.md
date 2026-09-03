# Studio V1+ Phase 5: Website Publish Experience

## 1. Executive Result

Phase 5 adds a student-facing Website Publish experience on the certified Phase 4 Deployment authority. Publish is explicit, Website-only, and currently targets the non-public `TEST` / `local_mock` provider. No migration or cloud provider is added.

## 2. Deployment Authority Consumed

The UI consumes the authenticated Deployment API and the current finalized Studio Delivery read model. The browser sends only `deliveryId` for creation and only a deployment identifier for retry. Organization, tenant, learner, project type, exact revision, provider metadata, status, and URL remain server-owned.

## 3. Ready to Publish

A current finalized Website Delivery with no deployment for that exact delivery is shown as **Ready to Publish**. An unfinalized, stale, or unavailable delivery shows the next Studio step and has no functional Publish action.

## 4. Eligibility

Deployment eligibility remains the Phase 4 server contract: finalized Website Delivery, exact approved revision, matching Studio authority, scoped actor, and deployment permission. AI Agent projects do not render Website Publish controls.

## 5. Publish Action

The student must explicitly activate **Publish** or **Publish New Version**. The panel refreshes from the canonical response and does not create local deployment truth.

## 6. Status Mapping

`REQUESTED`, `QUEUED`, `DEPLOYING`, `LIVE`, `FAILED`, `SUPERSEDED`, and `UNPUBLISHED` retain their backend meaning and receive student-friendly labels. Phase 4 currently provides no unpublish route, so no frontend-only unpublish control is exposed.

## 7. TEST / Non-Public Language

The current provider is presented as **Studio Test Deployment**. A successful record is described as **Test Deployment Live** in a test environment. Public hosting is explicitly described as not connected, and the UI does not fabricate a public URL or a Visit Site action.

## 8. Success

Success shows the exact published revision, test-environment status, and non-public boundary. Evidence, Portfolio, Completion, Credentials, Registry, and ClientOps remain separate authorities.

## 9. Failure

Provider failure is shown as **Publish Failed** with a truthful bounded message and a retry action. Failed history remains available through the Deployment history list.

## 10. Retry

Retry uses the canonical failed Deployment identifier. Controls are disabled while a request is in flight; backend idempotency and historical failed records remain authoritative.

## 11. Deployment History

History lists date, friendly status, exact revision number, and test environment without exposing infrastructure identifiers in Beginner Mode.

## 12. Newer Version Behavior

When the current finalized revision is newer than the latest deployment, the UI shows **A newer finalized version is ready to publish** and requires **Publish New Version**. Finalizing does not auto-deploy and does not retarget an earlier deployment.

## 13. Supersession

If the backend reports `SUPERSEDED`, the UI presents **Earlier Published Version**. It does not invent supersession state when the backend has not supplied it.

## 14. Unpublish Boundary

Phase 4 has no unpublish API. Unpublish remains deferred to a later publish experience/backend contract and is not simulated in client state.

## 15. Portfolio Boundary

Publishing does not add, remove, or update Portfolio Artifacts. A Portfolio Artifact and a test deployment may reference the same Studio work while remaining independent.

## 16. Evidence Boundary

Publishing does not create, verify, or modify Evidence. What You Proved remains the institutional Evidence experience.

## 17. Completion Boundary

Publishing never completes an assignment, lesson, course, or project requirement. Completion Policy remains authoritative.

## 18. Credential Boundary

No credential, badge, certificate, or eligibility claim is made by a deployment.

## 19. Provider Presentation

Beginner Mode uses the friendly label **Studio Test Deployment**. Raw provider/target metadata is not displayed in the student-facing panel.

## 20. Student Experience

The panel is placed after finalization and What You Proved in the Website build flow. It explains the difference between finishing in Studio and sending a version to a test provider, with a clear next action for unavailable, ready, live, failed, and newer-version states.

## 21. Companion

The existing Companion may explain finalization, test deployment, failure, and newer versions using read-only context. It does not publish, retry, alter provider state, create URLs, or change institutional facts.

## 22. Failure Handling

Load failures use `role="alert"` and a retry action. Mutation failures do not render success and do not use localStorage fallback. Refresh re-reads delivery and deployment history from the API.

## 23. Authorization

The backend remains responsible for deployment permissions and scope. The UI only exposes controls after the authenticated read model indicates a Website delivery is ready. Foreign learners and organizations remain denied by the Phase 4 API.

## 24. Responsive Behavior

The deployment panel uses the existing Studio responsive layout, wraps history content, and inherits the established mobile control behavior at 760px and 520px breakpoints.

## 25. Accessibility

The panel uses semantic headings, labelled status regions, `role="status"` for progress/success, `role="alert"` for errors, native buttons, and visible existing focus styles. Full VoiceOver/NVDA certification remains outside this phase.

## 26. Browser Acceptance

Phase 5 acceptance should exercise successful TEST Publish, failure/retry using the process-only Phase 4.2 seam, newer finalized version publishing, unauthorized learners, cross-organization denial, AI Agent exclusion, refresh persistence, and 1440x900 / 768x1024 / 390x900 layouts against disposable PostgreSQL.

## 27. Database Side Effects

Publish is expected to change only `website_deployment_records` and bounded deployment outbox events. It must not mutate Studio lifecycle, QA, Review, Delivery, Evidence, Portfolio, Completion, Credentials, Registry, or ClientOps records.

## 28. Phase 6 Entry Contract

Phase 6 may begin the Governed AI Agent Package initiative. It must keep Studio finalization, Evidence, teacher approval, Registry acceptance, and production execution as separate authorities. No Website Publish UI behavior should be reused as Registry approval.
