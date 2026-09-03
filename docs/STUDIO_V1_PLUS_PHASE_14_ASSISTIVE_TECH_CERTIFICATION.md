# Studio V1+ Phase 14: Assistive-Technology Certification

## Certification Scope

Phase 14 certifies the Studio V1+ student and reviewer-facing workflows through automated keyboard, DOM semantics, ARIA snapshot, status-message, focus, reflow, reduced-motion, collaboration, Learning Context, Team, revision, QA/Review, Deployment, Registry, Notification, Portfolio, and Credential checks. This is **automated assistive-technology certification**. Native NVDA or VoiceOver manual certification was not performed in this environment; full native AT certification remains a later product activity.

## Localhost Preflight

The actual local stack was verified before testing. Vite served `/Users/mikeslate/Projects/shrv1` on port `5173`; the API ran from `/Users/mikeslate/Projects/shrv1/apps/shs-api` on port `8091`. The API used disposable local PostgreSQL 16 database `shs_localhost_acceptance`, never `shs_dev`, production, or cloud storage. Migration 083 was current. Actual localhost keyboard project creation reached a project route and builder; the context-failure smoke verified the builder remains usable when Learning Context is unavailable.

## Keyboard Coverage

`tests/phase14-assistive-technology-live.spec.mjs` passed 4/4 on a fresh disposable environment. It covers keyboard-only Website and AI Agent creation, builder editing and save, revision history, Team management activation, collaboration semantics, context error recovery, mobile/tablet reflow, and reduced motion. `tests/phase14-localhost-at-smoke.spec.mjs` passed 2/2 against the actual `localhost:5173` stack.

Critical controls use native links, buttons, inputs, radio controls, labels, and form submission. Static progress, requirements, ownership, and revision text are not made focusable solely for testing. Visible focus and keyboard reachability were verified on the tested paths.

## Semantic and Status Coverage

Formal ARIA snapshots cover the project builder, Learning Context, progress, requirements, Next Step, revision history, Team management, and collaboration panel. Names, roles, statuses, current progress, Team ownership, and connection state are textual/programmatic rather than color-only. Save success, Learning Context failure, collaboration availability, and revision-history states are exposed as status or alert content. Collaboration remote updates use bounded status feedback and do not announce every keystroke.

## Focus and Error Recovery

Project creation, Team activation, member-list activation, builder save, and context-error recovery were exercised with keyboard focus. A Learning Context `503` leaves the builder and saved-work controls available. A stale revision remains governed by Phase 12 conflict behavior. The acceptance harness found and corrected only fixture/selector issues plus a real immediate revision-history refresh defect; successful saves now refresh the canonical revision list without requiring a page reload.

## Learning Context, Team, Revisions, and Collaboration

Learning Context remains the primary experience: project identity, Assignment or Personal Project context, progress, requirements, revision state, and Next Step remain before secondary collaboration content. Team names, Team Project ownership, member roles, collaborators, and connection state are exposed programmatically. Revision history keeps contributor attribution and current saved revision understandable. Phase 12 remains the authority for revision identity, CAS, QA, Review, Completion, and downstream bindings.

## Reflow, Motion, and Touch

The focused suite verified mobile `390x900`, tablet `768x1024`, and desktop `1440x900` surfaces without ordinary horizontal overflow. Reduced-motion execution preserved functionality. Narrow mobile presentation keeps Learning Context and builder content reachable without a permanent collaboration sidebar. Exact 200%/400% browser zoom and forced-colors were not available as native automated modes in this environment; narrow reflow is the recorded equivalent and full visual/AT review remains in scope for later certification.

## Downstream Surfaces

Notification, Portfolio, Deployment, Registry, Credential, Reviewer Routing, Completion, and Team authority evidence was reused where Phase 14 changed only accessibility-facing tests or presentation. No migration or institutional authority was added. Existing downstream status labels and actions remain textual and keyboard-addressable in their certified acceptance paths.

## WCAG 2.2 AA Mapping

The evidence addresses 1.3.1, 1.3.2, 1.4.1, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11, 2.5.8, 3.2.1, 3.2.2, 3.3.1, 3.3.2, and 4.1.2/4.1.3 for the tested surfaces. This document does not claim legal compliance beyond the automated evidence described here.

## Findings and Remediation

No unresolved Critical or High AT defect was found. The real medium-level defect was immediate revision-history staleness after a successful save; it was fixed by refreshing revisions from the canonical API and covered by the Phase 14 suite. Initial failed runs were classified as test-fixture or selector defects and repaired without weakening production authority.

## Phase 15 Entry Contract

Phase 15 may perform final initiative certification across architecture, authority boundaries, migrations, Studio, Team, revisions, Learning Context, collaboration, downstream domains, and this automated AT baseline. Phase 14 does not claim native screen-reader certification, full AT certification, or legal compliance.
