# MET-6 Presence & Communication Runtime

Status: Implemented

MET-6 turns the MET-2B presence/communication/moderation/safety architecture into a running server-authoritative runtime and wires it into the Silicon Heartland Metaverse frontend shell.

The metaverse still projects access, presence, and communication only. It does not create identity, organization membership, curriculum completion, assessment pass, verified outcome, credential, civic authority, economy state, or employment eligibility.

## Canonical Authority Map

| Fact | Canonical source | MET-6 status |
| --- | --- | --- |
| Authentication/session | `apps/shs-api/src/auth/auth-middleware.ts` | Reused; `req.user` is the sole identity input |
| Active organization / tenant / membership / role / permissions | `apps/shs-api/src/auth/organization-context.ts`, `tenant-context.ts`, auth session projection | Reused via `actorContext()` |
| Metaverse authority facts (cohorts/teams/projects/classes/simulations) | `user.metaverse_authority_facts` on the authenticated session | Reused; never accepted from client body |
| Notification system | NCA (`apps/shs-api/src/domain/notifications`) | Referenced only; MET-6 creates no second notification center |
| City/district/facility registry | `apps/shs-api/src/domain/metaverse/registry/city-registry.ts` | Referenced by frontend navigation model; unchanged |
| MET-2B contracts | `apps/shs-api/src/domain/metaverse/communication/*.ts` | Consumed as-is; no contract changes in MET-6 |

## What MET-6 Added

Runtime services under `apps/shs-api/src/domain/metaverse/communication/runtime/`:

- `communication-repository.ts` — in-memory repository for presence, rooms, messages, reports, preferences, and moderation records
- `presence-service.ts` — `MetaversePresenceService` (start/heartbeat/revoke/city aggregate/participants) and `actorContext()`/`metaverseRoleContext()`, the canonical derivation of role/org/cohort/team facts from `req.user`
- `room-service.ts` — `MetaverseRoomService` (get-or-create room, server-authoritative membership decision, direct-messaging policy)
- `message-service.ts` — `MetaverseMessageService` (list/send/delete, mute/block/report, bounded moderation actions, rate limiting, safe-link validation)
- `routes.ts` — `registerMetaverseCommunicationRoutes(app)`, mounted from `apps/shs-api/src/api/router.ts`

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/metaverse/presence` | Start/refresh a presence session at a city/district/facility/activity location |
| POST | `/metaverse/presence/heartbeat` | Extend a presence session and optionally update user-selectable status |
| POST | `/metaverse/presence/revoke` | End a presence session (sign-out/explicit exit) |
| GET | `/metaverse/presence/city` | Aggregate online counts per district (`exposes_identity: false`) |
| GET | `/metaverse/presence/participants` | Identity-level participants visible under server visibility policy for a district/facility |
| GET | `/metaverse/rooms/policy` | Direct-messaging policy, notification integration, and authority boundary projections |
| POST | `/metaverse/rooms` | Get-or-create a server-authorized room |
| GET/POST | `/metaverse/rooms/:roomId/messages` | List/send messages in a room the caller is a member of |
| DELETE | `/metaverse/rooms/:roomId/messages/:messageId` | Delete own message (or moderator/org-admin), preserving reported evidence |
| GET | `/metaverse/rooms/:roomId/participants` | Participants visible for the room's district/facility |
| POST | `/metaverse/rooms/:roomId/mute` | Mute a sender for the caller only |
| POST | `/metaverse/rooms/:roomId/block` | Block interaction with a sender for the caller only |
| POST | `/metaverse/rooms/:roomId/reports` | File a report, preserving message/room/actor context |
| POST | `/metaverse/moderation/actions` | Bounded moderator/instructor/org-admin action, scope-checked |

Every route derives identity, organization, role, and cohort/team/project/simulation facts from `req.user` (set by `authMiddleware`). No route accepts a client-declared `user_id`, `organization_id`, `role`, `sender_user_id`, or moderation authority field — request bodies for those fields are ignored or, for `sender_user_id`, rejected with `sender_identity_cannot_be_client_forged` if it disagrees with the authenticated actor.

## Server-Side Security Behavior (verified by tests)

- Presence requires canonical authenticated identity and an active organization; `org_context_error` and revoked membership fail closed.
- Stale presence sessions expire from server-observed heartbeat state (90s), not client claims.
- City-level presence returns aggregate district counts only (`exposes_identity: false`); no per-user rows.
- Facility/room participant visibility is policy-resolved (`resolvePresenceVisibility`) and denies cross-organization visibility.
- Room membership is server-authoritative (`resolveRoomMembership`); anonymous rooms are rejected; `DIRECT_MESSAGE` room type is rejected unconditionally (student 1:1 DM stays disabled by default).
- Cohort/team/project/simulation room membership is enforced against `user.metaverse_authority_facts`, never a client-supplied membership claim.
- Sender identity on a message is always the authenticated actor; a client-claimed `sender_user_id` that disagrees is rejected.
- Moderation actions require an actual `MODERATOR`/`INSTRUCTOR`/`ORG_ADMIN` role (derived from `roles`, never from a `permissions` string alone — see Fixed Vulnerability below) and are scope-bounded (`isModeratorActionInScope`).
- Mute/block/report are independent: mute hides for the muting user only, block does not expel, report preserves context and does not declare guilt; reported/flagged messages cannot be silently deleted (redacted instead).
- Unsafe links (`javascript:`, `data:`, protocol-relative `//...`) are rejected; raw `<`/`>` markup is stripped.
- Message flood/duplicate submission is rate-limited per user/room (max 8 messages / 30s window, duplicate-body throttling).
- Revoked auth/org suspension immediately denies room and presence access.

### Fixed Vulnerability (found while verifying this phase)

`metaverseRoleContext()` (`presence-service.ts`) previously elevated a user to `MODERATOR` if their `permissions` array contained a substring matching `/moderation|support/`, independent of their actual `roles`. A `learner`-role actor carrying a `permissions: ["metaverse.moderation"]` claim could forge moderator status and pass `messages.moderate()`'s authority check. Role elevation to `MODERATOR`/`ORG_ADMIN`/`INSTRUCTOR` is now derived only from the `roles` field; permission strings no longer grant moderation authority on their own. Covered by the "sender and moderator status cannot be forged by clients" test.

### Fixed Defect (found during bounded acceptance)

`buildServerAuthoredMessage()` throws a plain `Error("sender_identity_cannot_be_client_forged")` when a client-supplied `sender_user_id` disagrees with the authenticated actor. `message-service.ts#send()` did not catch this, so `routes.ts#statusFor()` fell through to its 500 default and the client received a generic `INTERNAL_ERROR` response for a routine, expected security rejection (verified live via `curl` against a running instance during acceptance — the unit test only asserted the thrown message text, not the resulting HTTP status, so it did not catch this). `send()` now catches that specific error and re-throws it as `MetaverseCommunicationError("SENDER_IDENTITY_FORGED", "sender_identity_cannot_be_client_forged", 403)`, so a forged-sender attempt now returns a clean `403` instead of a `500`. The message itself was never created either way; this only fixes the HTTP-layer error surface.

## Storage / Persistence

`MetaverseCommunicationRepository` is an in-memory singleton (`Map`-backed), matching MET-2B's P1 disposition that moderation/message persistence is deferred until a production chat surface is justified. This is intentional, not a regression: presence is documented as short-lived operational state, and message/room data does not need to survive an API process restart for this phase's scope. Durable storage remains `MET-2B-GAP-P1-002`.

## Frontend Implementation

New runtime client: `src/system/metaverse/metaverseCommunicationClient.js` — the only frontend module that calls the `/metaverse/presence/*` and `/metaverse/rooms/*` routes. It sends `credentials: "include"`, no client-declared authority fields (no `organization_id`, `role`, or `user_id` in any request body), and mirrors the `metaverseRuntimeClient.js` dev/production header pattern from MET-5.

New components under `src/components/metaverse/`:

- `MetaversePresenceHud.jsx` — aggregate "Online Now" count (city-wide, and current district when inside one) sourced from `getCityPresence()`, plus a user-selectable status control (`AVAILABLE`/`AWAY`/`DO_NOT_DISTURB`/`OFFLINE`) that calls `heartbeatPresence()`. Status is shown with both an icon and text label (non-color-only).
- `MetaverseParticipantList.jsx` — renders the server-provided, privacy-filtered participant rows for the current facility room (`display_name`, `role_label`, `status` only — no internal IDs). Does not attach mute/block/report here (see below).
- `MetaverseChatTray.jsx` — a dockable chat panel bound to the active `FACILITY_ROOM`. Polls messages (4s while open, 15s while closed), shows an unread badge, enforces the 1000-character body limit client-side, and renders a safety menu per non-self message.
- `MetaverseSafetyMenu.jsx` — shared mute/block/report control with an inline report form (reason + optional comment), used from the chat tray.

### Why mute/block/report is bound to the chat tray, not the participant list

`presence.participants()` intentionally never returns a real `user_id` (MET-2B privacy rule: "do not expose... internal IDs"); it returns only an opaque `presence_session_id` for list rendering. The backend's mute/block/report endpoints key on the real `sender_user_id`. Wiring safety actions to the participant list would silently target the wrong identifier and never actually work. Message rows from `listMessages()` do carry the real `sender_user_id` (needed to render "you" vs. a message and for moderation), so that is the correct, functional attachment point. This was caught and fixed during MET-6 implementation rather than shipped as a broken control.

### Presence lifecycle in `MetaverseCityPage.jsx`

- A presence session is started (`startPresence`) whenever `districtId`/`facilityId`/`activityId` changes, and revoked (`revokePresence`) on the next change or unmount.
- A 25s client interval calls `heartbeatPresence()` (under the server's 30s/90s heartbeat/stale-timeout policy) to keep the session alive without letting the client declare indefinite online state.
- City aggregate counts (`getCityPresence()`) poll every 15s regardless of camera level, rendered only as totals — never a directory.
- A `FACILITY_ROOM` is obtained (`getOrCreateRoom`) only once the player has already passed MET-5's protected-entry check for that facility (`level === "FACILITY_VIEW" || "ACTIVITY_SIMULATION_VIEW"` implies entry was already authorized); the room, participant list, and chat tray render only in that context — never at city/district level.

## Preserved Constraints (verified by test)

- **Student 1:1 DM disabled by default**: the client never requests `room_type: "DIRECT_MESSAGE"`; the server rejects it unconditionally regardless of client input.
- **Aggregate-only city presence**: `MetaversePresenceHud` renders only summed counts from `getCityPresence()`; it never calls a participants/room endpoint. Identity-level participants only render once inside an authorized facility room.
- **No fake users/counts**: no hardcoded counts, IDs, or names exist anywhere in the presence/chat/participant source; every rendered value traces to a server response. Verified by regex-based source tests in `tests/metaversePresenceCommunicationRuntime.test.mjs`, plus the pre-existing MET-4/MET-5 "no fake presence" tests (updated to check for the new `getCityPresence()` wiring instead of the old "not implemented yet" placeholder string).

## Accessibility

- Chat log uses `role="log"` with `aria-live="polite"` so new messages are announced without a full page re-read.
- Opening the chat tray moves focus to its close button (focus management); the composer textarea has an associated (visually hidden) label.
- Presence status uses a real `<select>` with a text label, not a color-only dot; participant/status indicators pair a status dot with text.
- Safety menu is a real disclosure button (`aria-haspopup="menu"`, `aria-expanded`) with keyboard-operable menu items and an accessible report form.
- Participant count is announced via a visually-hidden (`.met-sr-only`) string in addition to the visual `(count)` badge.
- Reduced-motion shell (`data-reduced-motion`) from MET-4 is unchanged and still covers the new overlay elements (no new transitions were added that ignore it).

## Mobile / Tablet Behavior

- Below 900px: presence status control drops to full width; participant list and chat tray shift up to avoid the bottom camera controls bar.
- Below 620px: participant list becomes a top-anchored panel with a bounded height; chat tray becomes a full-width bottom bar, and its panel expands to fill nearly the full viewport height when open — consistent with the existing MET-4 mobile pattern for the location navigator.

## Direct Messaging Policy

Unchanged from MET-2B: `studentOneToOneDmEnabledByDefault: false`. The room-service route (`POST /metaverse/rooms`) rejects `room_type: "DIRECT_MESSAGE"` unconditionally. `GET /metaverse/rooms/policy` exposes the policy object (including the rationale text) so the frontend can render it verbatim in the chat tray rather than duplicating the policy statement.

## Real-Time Transport

MET-6 implements the MET-2B recommendation: authenticated short polling over the server-authoritative presence/message endpoints (4s while a chat tray is open, 15s while closed or idle; 15s for city aggregate counts; 10s for room participants; 25s presence heartbeat). No WebSocket, Socket.IO, or Redis dependency was added. `MET-2B-GAP-P1-001` (richer realtime transport) remains open for a future phase if polling latency proves insufficient at scale.

## Operational Events

MET-6 does not add new operational telemetry events; it reuses the existing MET-5 operational event pattern for entry/activity events. Presence/chat actions are observable through the moderation/report/preference records themselves rather than a duplicate event stream.

## Validation Coverage

Backend (`apps/shs-api/tests/metaverse-phase6-communication-runtime.test.ts`, 15 tests):

1. presence requires authenticated identity and active organization
2. presence expires stale sessions and revoked membership removes access
3. city presence is org-scoped aggregate only and cannot be client forged
4. facility participant visibility obeys server policy; cross-org visibility denied
5. room membership is server-authoritative; anonymous rooms denied
6. sender and moderator status cannot be forged by clients
7. student direct messaging is disabled by default
8. cohort/team/project/simulation room membership is enforced
9. CivicSure is not civic authority; unresolved SHF Civic fails closed
10. mute and block do not revoke unrelated room permissions or expel targets
11. reports preserve evidence, do not declare guilt; normal delete cannot destroy reported evidence
12. unsafe javascript/data links and raw executable markup are rejected or sanitized
13. rate limiting blocks abusive flood and duplicate submissions
14. revoked auth and org suspension stop room access
15. authorized moderation is bounded and NCA notification integration is reused

Frontend (`tests/metaversePresenceCommunicationRuntime.test.mjs`, 16 tests) covers: client sends no client-authority fields; presence lifecycle wiring; no hardcoded/fabricated counts; city overview never requests identity-level participants; participant list renders only server rows; room creation goes through server-authorized `FACILITY_ROOM`; DM stays disabled in the UI; chat never forges sender identity; mute/block/report wiring; client-side message length bound; accessibility (log/live-region/focus/menu semantics); mobile/tablet responsive rules; reduced-motion coverage; status lifecycle goes through the server heartbeat, not a client-only toggle.

Existing MET-4/MET-5 frontend tests (44 tests across `metaverseCityShell.test.mjs`, `metaverseVisualAssetMapping.test.mjs`, `metaverseRuntimeAdapter.test.mjs`) still pass; two assertions in the first two files that asserted "no live presence rendered" (accurate at MET-4/MET-5, superseded by this phase's explicit charter) were updated to assert the *absence of fake counts* plus the presence of the real `getCityPresence()` wiring, rather than being deleted or left contradicting shipped behavior.

## Browser / Runtime Acceptance

See the Completion Report delivered alongside this document for the bounded acceptance run performed for this phase (local API + Vite dev server, protected entry, presence session lifecycle, and route-level manual verification). Full interactive Chrome UI acceptance was not run in this pass; see that report for what was and was not verified and why.

## Migration

Migration created?: No. Presence/room/message/report/preference/moderation state remains in-memory per MET-2B's retention architecture (`hardcodedDuration: false`, policy-reference-driven). No schema changes were required for MET-6.

## P0 / P1 Gaps

P0 gaps: None identified in implemented scope.

P1 gaps (carried from MET-2B, still open):

- `MET-2B-GAP-P1-001` — richer realtime transport (WebSocket/SSE) if polling latency proves insufficient
- `MET-2B-GAP-P1-002` — durable persistence for rooms/messages/moderation records (currently in-memory)
- `MET-2B-GAP-P1-003` — retention policy references must be bound to canonical organization policy before production persistence
- `MET-2B-GAP-P1-004` — production-grade spam/flood controls beyond the current in-process rate limiter

New in MET-6:

- Full interactive browser/Chrome UI acceptance (multi-user presence, live chat exchange between two sessions) was not run in this pass; only local API-level and dev-server-level bounded checks were performed. Recommended before this surface is treated as user-facing production-ready.
- `metaverse-city-registry.test.ts` has one pre-existing failing test ("city registry is declarative...") unrelated to MET-6 (no MET-6 file touches that registry or test). Flagged for a future phase; not remediated here to avoid scope creep beyond MET-6.
