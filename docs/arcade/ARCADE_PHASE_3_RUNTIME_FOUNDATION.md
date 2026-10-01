# Arcade Phase 3: Shared Runtime Foundation

## Phase Status

Phase 3A establishes authenticated Runtime Session persistence and lifecycle. Save state (3B), telemetry (3C), frontend runtime client/development harness (3D), and the server-backed Learning leaderboard projection (3E) are documented below. Evidence Replay projection (3F) and cross-slice integration acceptance (3G) remain deferred. No gameplay engine or game wiring is included.

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

## Phase 3D Frontend Client and Development Harness

The shared browser client in `src/shared/arcade/runtime/arcadeRuntimeClient.js` uses the canonical SHS `API_BASE` from `src/lib/apiClient.js`, includes authenticated cookies, and preserves HTTP status, error code, message, correlation ID, and structured details. It exposes only existing 3A–3C routes for starting/listing/reading/transiting sessions, reading/writing save state, and listing/appending telemetry. It does not call Result, Evidence, Truth Spine, Treasury, or reward APIs.

The existing endpoint response contracts are intentionally not homogenized by the client: session start returns `{ session, reused }`, session GET returns the bare Session DTO, and lifecycle actions return `{ session, changed }`. Save GET returns `{ sessionId, saveState }` (`saveState` may be null), while save PUT returns the Save State DTO. Telemetry GET returns `{ sessionId, items, nextAfterSequence }`, while telemetry POST returns one Telemetry Event DTO. The Learning session request property is `activityId`; the server maps it to the returned DTO's `arcadeActivityId` field.

The `useArcadeRuntimeSession`, `useArcadeRuntimeSaveState`, and `useArcadeRuntimeTelemetry` hooks keep server responses as the source of truth. Save conflicts surface `SAVE_REVISION_CONFLICT` and `currentRevision` without replacing local editor text or retrying. Telemetry sequence conflicts remain visible and cause a refresh attempt so the server event list can be reloaded. UI status-based button disabling is ergonomic only; server validation remains authoritative.

The direct-link hash route `/arcade.html#/dev/runtime` is an internal Development / Test Harness and is not included in Arcade navigation. It exercises session controls, JSON save state, allowlisted telemetry, real stale-revision and duplicate-sequence requests, and a bounded last-response inspector. Classic sessions may be started without an Activity ID. A Learning Activity ID is optional input and is sent exactly as entered; the harness never generates or infers one. A development console is not a production learner experience, and the existing backend authentication/permission checks remain in force.

The harness uses labeled form controls, keyboard focus outlines, semantic status/error regions and a horizontally scrollable event table; reduced-motion preference is respected. Runtime state is held only in component memory and is not persisted to localStorage, sessionStorage, or IndexedDB.

The Phase 3D development harness exercises authoritative server runtime APIs but does not itself establish Runtime Session, Result, Evidence, reward, or Truth Spine authority. Runtime completion remains separate from Result submission. Game clients, gameplay, Evidence Replay, and any outcome/economic integration are deferred.

## Phase 3E: Server Learning Leaderboard

`GET /arcade/leaderboards/activities/:activityId` is a read-only, active-organization projection over persisted `arcade_results`. It requires the existing `arcade.results.view` permission; the learner's `arcade.attempt` permission remains scoped to their own attempts and history and does not expose organization peer results. The organization is derived from authenticated context; query parameters cannot widen it.

Only scored Results for the requested real Arcade Activity are eligible. Scoreless Results are excluded. Inactive Activities remain readable as historical context because their Results are immutable; unknown Activity IDs return not found. Each learner contributes their highest score, with the earliest Result retained when their scores tie. SQL `RANK()` ranks by score alone, so equal scores share a rank and the next rank has the expected gap. Display order is score descending, achievement time ascending, then stable learner ID; the learner ID is not returned.

The DTO contains rank, organization-local display name, score, max score, Result ID, and achievement time. The name is resolved from `users.full_name` only within the Result's organization, with a neutral `Learner` fallback. Email and raw learner ID are excluded. Pagination is bounded to 1-100 and applied after ranking. No leaderboard table or migration is added; ranking is computed directly from canonical Results. Migration 052's existing Result indexes are organization+learner oriented rather than organization+Activity+score, so this is a correctness-first query that may warrant a measured index if usage grows.

Leaderboard rank is a read projection over canonical Arcade Results. Leaderboard APIs do not accept gameplay scores from the browser. Rank does not establish gameplay truth, mastery, evidence, credentials, rewards, or institutional truth. The routed `/leaderboards` page consumes only the authenticated server projection; legacy browser scoreboards remain disconnected compatibility surfaces. Classic Arcade ranking remains deferred until a canonical server-backed score source exists. No Result, Evidence, outbox, Truth Spine, Treasury, or reward writes occur when reading the leaderboard.

## Phase 3F: Evidence Replay Foundation

Evidence Replay is an explanatory projection over existing Arcade records. `GET /arcade/results/:resultId/replay` resolves a real Result through its unique `arcade_attempt_id`, and joins that Attempt and Activity while constraining their Activity, learner, and organization identifiers to the Result. Learner reads use the existing `arcade.attempt` permission and are self-scoped; holders of `arcade.results.view` may read only within their authenticated active organization. The response omits learner email and tenant internals.

The projection returns canonical Result fields (including stored `masteryAchieved`), Attempt lifecycle fields, Activity identity/display metadata, and a deterministic timeline with source type and source ID on every item. Timeline order is `occurredAt` ascending, then the explicit source order (Attempt started, Result recorded, score recorded, stored mastery recorded), then source ID. Mastery is presented as a value recorded by the canonical Result; replay does not calculate or reinterpret it.

There is no canonical Runtime Session-to-Attempt or Runtime Session-to-Result relationship. Runtime Sessions optionally reference an Activity, but Attempt/Result rows do not reference a Session and no mapping table exists. Therefore `runtimeSession` is null with an explicit linkage-unavailable note; telemetry and current save-state are excluded rather than guessed from matching learner, Activity, or time. Evidence status/ID is also deferred because this replay slice does not introduce a separate Evidence read coupling. No migration is added.

The frontend client is `src/shared/arcade/replay/arcadeReplayClient.js`; the `useArcadeReplay` hook drives `/history/:resultId/replay`. Canonical History links to replay using the actual server-provided Result ID only. Replay reads do not mutate source records, create outbox events, create Evidence, write Truth Spine, award rewards, or alter leaderboard projections.

Evidence Replay is an explanatory projection over existing Arcade records. Replay does not establish, verify, or modify mastery, Evidence, credentials, rewards, or institutional truth. Missing canonical relationships are shown as unavailable rather than inferred.
