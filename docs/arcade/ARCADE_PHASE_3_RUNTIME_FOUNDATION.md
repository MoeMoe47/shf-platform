# Arcade Phase 3: Shared Runtime Foundation

## Phase Status

Phase 3A establishes authenticated Runtime Session persistence and lifecycle only. Save state (3B), telemetry (3C), frontend runtime client/development harness (3D), server-backed Learning leaderboard projection (3E), Evidence Replay projection (3F), and cross-slice integration acceptance (3G) are deferred. No gameplay engine or game wiring is included.

## Authority Boundaries

Arcade Runtime Sessions preserve gameplay continuity but do not establish mastery, evidence, credentials, rewards, or institutional truth.

Runtime Session status describes operational runtime lifecycle only. It is not an Arcade Attempt or Result. Runtime completion does not submit an Attempt or create a Result. Existing Result persistence, server-derived mastery, transactional `arcade.resulted`, Verified Evidence, signed Agent Fabric ingestion, Truth Spine, and Treasury remain separate and unchanged.

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
