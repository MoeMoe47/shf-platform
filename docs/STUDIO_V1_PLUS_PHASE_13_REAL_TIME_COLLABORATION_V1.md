# Studio V1+ Phase 13: Real-Time Collaboration Experience

## Executive Result

Phase 13 adds an optional, authenticated collaboration experience to Team Studio projects. It provides lightweight presence and transient working-state updates while keeping Phase 12 revision/CAS persistence as the only durable save authority. The collaboration transport is not required for building, saving, QA, Review, Completion, Deployment, Agent Package, or Registry operations.

## Current Infrastructure Audit

The repository had no existing WebSocket, Socket.IO, SSE, WebRTC, or collaboration transport. The reusable authority boundaries were the Studio project authorization service, Team membership checks, the Phase 12 workspace compare-and-swap API, the existing Studio builder, and the Student Learning Context projection. No new durable collaboration schema was required.

## Actual Localhost Preflight

The running development stack was verified before acceptance. Vite serves `/Users/mikeslate/Projects/shrv1` on `127.0.0.1:5173`; the API runs from `/Users/mikeslate/Projects/shrv1/apps/shs-api` on port `8091`. The API uses the disposable local PostgreSQL 16 database `shs_localhost_acceptance`, not `shs_dev`, production, or cloud storage. Migration replay reported `001` through `083` applied with no pending, drift, or unknown migrations. The API exposed the current Studio create, workspace, and collaboration routes.

The localhost preflight created Website and AI Agent personal projects through `/curriculum.html#/studio/new`. Both returned `201`, redirected to the canonical project route, rendered Personal Project context, initialized the workspace, and accepted a first durable save as Revision 1. A real localhost two-browser smoke then created a Team project through the API, opened both authenticated members in the Vite application, verified `Connected` presence, and delivered a visible editor update from Member A to Member B without reload.

## Transport Decision

The implementation uses authenticated Server-Sent Events for server-to-browser presence and remote-update delivery, plus an authenticated REST endpoint for transient client-to-server updates. The broker is process-local and intentionally bounded to the current API process; it does not introduce Redis, Kafka, or cloud infrastructure. A disconnected stream is reported as `Real-time updates unavailable`, and ordinary Studio API operations remain usable.

## Session, Authorization, and Privacy

A session is scoped to project, organization, tenant, workspace, current revision, and authenticated actor. Joining rechecks Studio project access and active Team membership through `StudioProjectService`; a session does not grant authority. The server derives actor identity from authentication and never trusts client user, Team, organization, tenant, role, permission, or revision claims. Presence exposes only privacy-safe display names and connection status. Emails, internal IDs, membership IDs, and tenant keys are not rendered.

Connections are removed on stream close and process-side cleanup. Presence is rebroadcast on join and leave. The next update or reconnect rechecks authorization, so a removed member cannot regain access through an old connection or stale browser state.

The stream heartbeat also revalidates each active connection against current Studio access. Revoked membership therefore expires the active session on the next heartbeat, while the update and reconnect paths independently fail closed. Connection writes guard against ended/destroyed responses.

## Working-State Synchronization

Remote updates contain validated transient Studio work and sender display name. They are broadcast to other authenticated users on the same authorized project and do not write PostgreSQL or the integration outbox. The client debounces transient updates so ordinary typing does not create a request for every keystroke. No presence heartbeat, cursor event, or transient update creates a revision, QA result, Review submission, Evidence, Completion, Credential, Deployment, Agent Package, Registry record, or Notification.

The server rejects arrays, unknown top-level fields, forged revision claims, malformed work, unsupported work shapes, and oversized payloads before broadcast. The Phase 13 acceptance observed a `400` for a forged `revisionId` payload.

The builder remains the primary surface. The compact Collaboration panel is secondary to the Student Learning Context, which continues to show Build, Assignment, Progress, Requirements, Next Step, and canonical revision state. Individual projects do not render collaboration controls.

## Phase 12 Save Boundary

The explicit Save draft action continues to call the Phase 12 workspace PATCH endpoint. That endpoint performs revision/CAS validation, creates the durable immutable revision snapshot, records the authenticated actor, and preserves exact revision lineage. Realtime transport cannot bypass CAS. A stale durable save returns the existing bounded conflict response and cannot silently overwrite newer work.

Submitted revisions remain governed by Phase 12. REQUEST_CHANGES and Revision N+1 are Review and Revision authority behavior; collaboration only reflects the current working state. Completion remains Completion authority, and Learning Context reads its verified state without manufacturing it.

## Disconnect, Reconnect, and Revocation

The browser reports `CONNECTED`, `RECONNECTING`, or `Real-time updates unavailable` textually. Stream failure triggers bounded reconnect attempts. On reconnect the server reauthorizes the actor and sends the current workspace revision context. Unsaved transient work is not presented as durable history. If a member is removed, workspace access and future transient updates fail closed.

## Fallback and Tenant Boundaries

Transport failure does not disable the ordinary builder or Phase 12 save API. Same-organization nonmembers and cross-tenant actors cannot join or publish because project access is checked server-side. Malformed or oversized transient work is rejected by the collaboration service. There is no localStorage source of truth for presence, membership, revision, connection authority, or institutional save state.

## Acceptance Evidence

The focused disposable acceptance is `tests/phase13-realtime-collaboration-live.spec.mjs`. It creates a real Team project, opens two authenticated browser contexts, verifies bidirectional visible updates and privacy-safe presence, performs a durable Phase 12 save, proves stale CAS rejection, closes and reconnects a collaborator, removes that member, and verifies subsequent workspace denial. A second browser scenario aborts the collaboration stream while proving the builder and canonical save remain usable.

The localhost-specific smoke is `tests/phase13-localhost-smoke.spec.mjs`. It runs against the actual development ports and verifies two authenticated Team members can connect, see one another by display name, and receive a live content update. The disposable Phase 13 suite passed `2/2`; the localhost smoke passed `1/1`; the fresh Learning Context/Completion regression passed `3/3`.

The existing Phase 11 Team, Phase 12 revision, and Phase 12.1 Learning Context acceptance evidence remains authoritative for Team ownership, review lineage, exact revision binding, Learning Context preservation, and adjacent institutional domains because those production authorities were not replaced by the collaboration layer.

## Responsive and Accessibility Boundary

The collaboration panel is compact on desktop, reflows with the existing builder on tablet, and remains a stacked secondary section on mobile. Names and connection states are textual and programmatically exposed, with status semantics and no color-only meaning. Remote-change feedback is bounded and does not announce every keystroke. Existing Learning Context and builder keyboard/focus behavior remains primary. Full assistive-technology certification is deferred to Phase 14.

## Phase 14 Entry Contract

Phase 14 may certify screen reader announcements, focus behavior, magnification/reflow, error recovery, reduced motion, and the complete Studio experience. It must consume Phase 12 revision truth and Phase 13 connection/presence state without turning transient collaboration into institutional truth.
