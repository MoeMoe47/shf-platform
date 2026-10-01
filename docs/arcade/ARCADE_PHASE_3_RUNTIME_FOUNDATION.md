# Arcade Phase 3: Shared Runtime Foundation

## Phase Status

Phase 3A establishes authenticated Runtime Session persistence and lifecycle only. Save state (3B), telemetry (3C), frontend runtime client/development harness (3D), server-backed Learning leaderboard projection (3E), Evidence Replay projection (3F), and cross-slice integration acceptance (3G) are deferred. No gameplay engine or game wiring is included.

## Authority Boundaries

Arcade Runtime Sessions preserve gameplay continuity but do not establish mastery, evidence, credentials, rewards, or institutional truth.

Runtime Session status describes operational runtime lifecycle only. It is not an Arcade Attempt or Result. Runtime completion does not submit an Attempt or create a Result. Existing Result persistence, server-derived mastery, transactional `arcade.resulted`, Verified Evidence, signed Agent Fabric ingestion, Truth Spine, and Treasury remain separate and unchanged.

## Phase 3B: Save State

`arcade_runtime_save_states` stores one current JSON object per runtime session. The session ID is the primary key and references `arcade_runtime_sessions` with cascade deletion; organization, tenant, and user scope are resolved from the parent session rather than duplicated in save rows.

The authenticated owner reads and writes through `GET /arcade/runtime/sessions/:id/save` and `PUT /arcade/runtime/sessions/:id/save`. Writes require `expectedRevision`: revision `0` creates revision `1`; a successful subsequent write increments the current revision by one. PostgreSQL performs this compare-and-swap atomically, scoped to the owning organization, tenant, user, and writable parent session. A stale write returns HTTP 409 with `SAVE_REVISION_CONFLICT` and `currentRevision`; clients must reload rather than overwrite.

Save payloads must be JSON objects no larger than 64 KiB when serialized. Writes are allowed only for ACTIVE and PAUSED sessions; terminal sessions remain readable but cannot be changed. Save-state persistence does not modify session lifecycle or create Attempts, Results, mastery, `arcade.resulted`, Evidence, Truth Spine facts, rewards, or leaderboard entries. Concurrent writes using one expected revision produce at most one successful update.

Arcade save state preserves resumable gameplay continuity. It is operational runtime data and does not establish mastery, evidence, credentials, rewards, leaderboard standing, or institutional truth.

## Phase 3C: Bounded Runtime Telemetry

`arcade_runtime_events` stores minimized operational observations for a runtime session. Events have a UUID, parent session, positive sequence, allowlisted event type, client `occurredAt`, server-assigned `serverReceivedAt`, bounded JSON-object payload, and creation timestamp. `(session_id, sequence)` is unique and events are read in sequence order.

The allowlist is `SESSION_STARTED`, `SESSION_RESUMED`, `SESSION_PAUSED`, `CHECKPOINT_REACHED`, `LEVEL_STARTED`, `LEVEL_COMPLETED`, `INTERACTION`, `SESSION_COMPLETED`, and `SESSION_ABANDONED`. Lifecycle-named telemetry describes a runtime observation only; it does not invoke or replace the separate Runtime Session lifecycle routes. Telemetry writes are accepted only while the parent session is ACTIVE. PAUSED and terminal sessions reject new events; owners may still read their timeline.

`POST /arcade/runtime/sessions/:id/events` requires the next contiguous sequence beginning at 1. A duplicate, gap, or out-of-order sequence returns HTTP 409 `RUNTIME_EVENT_SEQUENCE_CONFLICT`; exact replays conflict and create no duplicate row. A session-row lock held inside a transaction serializes writers before reading the current sequence and inserting. `GET /arcade/runtime/sessions/:id/events` is owner-scoped, ordered ascending, and bounded with `afterSequence`/`limit` pagination.

Payloads are JSON objects capped at 16 KiB and nesting depth 12. Sensitive keys for credentials, authorization, cookies, clipboard, microphone/camera, location/GPS, keystrokes, browser history, fingerprints, and free-form messages/essays are rejected recursively. The event timestamp is an ISO-8601 client observation time, limited to at most five minutes in the future; `serverReceivedAt` is the server-side receipt time. Neither timestamp establishes institutional outcome time.

Arcade runtime telemetry records bounded operational observations and does not establish mastery, verified completion, evidence, credentials, rewards, leaderboard standing, or institutional truth. Telemetry events cannot mutate Runtime Session lifecycle state. They do not create Attempts or Results, update save state, emit outbox events, or write Evidence, Truth Spine, Treasury, or leaderboard records. Evidence Replay may later consume an authorized bounded projection; no such handoff exists in this phase.

Leaderboard rank is a presentation projection over authorized score sources and is not itself evidence or credential authority. Evidence Replay explains the provenance of a canonical Arcade outcome but does not independently establish mastery or verification. Neither leaderboard nor replay is implemented in 3A.

## Runtime Session Identity and Persistence

Migration `149_arcade_runtime_sessions.sql` creates the Arcade-owned runtime continuity table with organization, tenant, and user scope; a family (`learning`/`classic`); a session type; lifecycle status; timestamps; version; and a bounded optional idempotency key. Owner/scope and recent-session indexes support scoped reads.

`experience_id` is a separate opaque descriptor/game identity reference. `arcade_activity_id` is nullable and references only an existing canonical Arcade Activity. A Classic session cannot bind an Arcade Activity. When a Learning request supplies an Activity ID, the server resolves an active canonical Activity before persistence. No Activity ID is generated or inferred from an experience ID.

Start and read requests use existing `arcade.attempt` authorization. User, active organization, and tenant scope are derived from the authenticated request. Runtime reads and transitions are owner-only and scoped by organization and tenant; cross-owner and cross-organization requests appear not found. Start requests may provide an idempotency key; reuse returns the existing session only when the full session identity matches.

## Lifecycle

Statuses are `ACTIVE`, `PAUSED`, `COMPLETED`, `ABANDONED`, and `EXPIRED`. 3A exposes start, list/get, pause, resume, complete, and abandon. Allowed transitions are:

- `ACTIVE` to `PAUSED`, `COMPLETED`, or `ABANDONED`
- `PAUSED` to `ACTIVE`, `COMPLETED`, or `ABANDONED`
- terminal states do not transition; repeated completion is idempotent

The `version` increments on accepted status transitions. Expiration is reserved and has no automatic expiry worker in 3A. No save payload or telemetry is persisted yet.

## Privacy and Deferred Slices

3A stores only session identity, scope, type, lifecycle, and timestamps. It does not collect keystrokes, clipboard contents, microphone/camera, location, browser history, free-form personal text, or device fingerprints. Future telemetry must be separately allowlisted, bounded, and minimized.

The closest existing session implementation is Metaverse Simulation, but it is simulation-specific and remains Metaverse-owned; it is not reused as Arcade authority. OGL telemetry is presentation analytics rather than gameplay telemetry. Existing frontend Arcade leaderboards are legacy presentation, not an authorized server score source. Those boundaries inform later slices without altering their ownership.
