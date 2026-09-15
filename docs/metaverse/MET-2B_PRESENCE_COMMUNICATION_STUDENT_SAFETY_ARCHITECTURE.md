# MET-2B Presence, Communication & Student Safety Architecture

## Executive Result

MET-2B defines the canonical presence, communication, moderation, retention, notification, realtime-transport, accessibility, privacy, and student-safety architecture for the Silicon Heartland Metaverse.

This phase is architecture-first. It adds bounded TypeScript contracts and deterministic policy tests only. It does not implement production chat UI, unrestricted social networking, WebSockets, a second identity system, a second notification center, a second evidence/audit system, uncontrolled direct messaging, persistence migrations, commits, or pushes.

The locked flow is:

Identity / Organization Context -> Presence Session -> Authorized Visibility Projection -> Approved Room Membership -> Message / Interaction -> Moderation / Safety Policy -> Notification Projection -> Audit / Incident Evidence when required

## Repository Baseline

| Field | Value |
| --- | --- |
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| Phase HEAD at start | `34024e2fdb1aac065f085ad938c7c74d6ebac130` |
| MET-1 | `docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md` |
| MET-2 | `docs/metaverse/MET-2_CITY_DISTRICT_REGISTRY.md` |
| MET-2A | `docs/metaverse/MET-2A_VISUAL_DESIGN_LOCK_ASSET_MAPPING.md` |

## Canonical Principle

Presence and communication are projections over canonical identity, organization, tenant, membership, role, cohort, curriculum, career, SHF Civic, notification, operational event, audit/evidence, and accessibility context.

They do not create:

- membership
- role
- cohort membership
- authorization
- civic authority
- job eligibility
- credential authority
- economy authority
- notification authority
- verified evidence or Truth Spine authority

Metaverse communication may own only:

- presence session state
- room/channel definitions
- room participation state
- message records if a canonical communication store is justified in a later phase
- moderation actions specific to metaverse communication
- block/mute preferences
- report submissions specific to communication/presence
- derived online/nearby projections

## Presence Contract

Canonical presence record:

| Field | Requirement |
| --- | --- |
| `presence_session_id` | Server-issued presence session identifier |
| `user_id` | Canonical authenticated user ID |
| `organization_id` | Canonical active organization boundary |
| `tenant_id` | Canonical tenant context when applicable |
| `role_context` | Derived from canonical role/permission context |
| `cohort_ids` | Authorized cohort references only |
| `team_ids` | Authorized team references only |
| `city_id` | Canonical city registry ID |
| `district_id` | Canonical district ID |
| `facility_id` | Canonical facility ID or null |
| `activity_id` | Activity/simulation/session reference or null |
| `status` | One of the locked statuses below |
| `visibility_scope` | Server-authorized visibility scope |
| `connected_at` | Server-observed connection start |
| `last_seen_at` | Server-observed heartbeat time |
| `expires_at` | Server-derived expiration |
| `client_instance_id` | Client instance correlation only, not authority |
| `moderation_state` | Communication-specific moderation state |
| `accessibility_presence_preferences_reference` | Reference to canonical accessibility preferences/effective runtime |

Allowed statuses:

- `ONLINE`
- `ACTIVE`
- `IN_ACTIVITY`
- `IN_CLASS`
- `IN_SIMULATION`
- `AVAILABLE`
- `AWAY`
- `DO_NOT_DISTURB`
- `OFFLINE`

User-selectable statuses:

- `AVAILABLE`
- `AWAY`
- `DO_NOT_DISTURB`
- `OFFLINE`

System-derived statuses:

- `ONLINE`
- `ACTIVE`
- `IN_ACTIVITY`
- `IN_CLASS`
- `IN_SIMULATION`

The browser cannot declare itself online indefinitely. Presence expires from server-observed heartbeat state.

## Online Visibility Model

Supported visibility scopes:

- `SAME_FACILITY`
- `SAME_DISTRICT`
- `SAME_CLASS`
- `SAME_COHORT`
- `SAME_TEAM`
- `AUTHORIZED_STAFF`
- `CITY_AGGREGATE_ONLY`

There is no default city-wide student directory.

City overview may show aggregate counts only, such as:

- 18 online in Data Center District
- 7 online in Civic District

Student visibility:

- May see aggregate city/district counts.
- May see identity-level peers only in approved class, cohort, team, facility, activity, simulation, civic session, or event contexts.
- May not use camera location or client request state to self-grant broader visibility.

Instructor visibility:

- May see students in authorized classes, cohorts, teams, rooms, facilities, and activities.
- May not browse unrelated organizations or unrelated student cohorts.

Moderator visibility:

- May see identity-level participants only within assigned moderation scope.
- Does not gain credential, career, economy, civic, or identity-administration authority.

Organization admin visibility:

- May access organization-bounded presence and moderation projections when authorized by role/policy.
- Must remain bounded to organization/tenant policy and audit expectations.

Guest/external participant visibility:

- Disabled by default unless a future organization policy explicitly permits it.
- If supported, guests can see only the room/session context they were authorized to join.

## Room / Channel Contract

Required room types:

- `FACILITY_ROOM`
- `DISTRICT_ROOM`
- `CLASS_ROOM`
- `COHORT_ROOM`
- `TEAM_ROOM`
- `PROJECT_ROOM`
- `CIVIC_SESSION_ROOM`
- `JOB_SIMULATION_ROOM`
- `EVENT_ROOM`
- `HELP_SUPPORT_ROOM`
- `STAFF_MODERATION_ROOM`

Every room must include:

- `room_id`
- `organization_id`
- `room_type`
- optional `city_id`
- optional `district_id`
- optional `facility_id`
- optional class/cohort/team/project/civic/job/event reference
- `owner_domain`
- `membership_rule`
- `posting_rule`
- `moderation_policy`
- `retention_policy_reference`
- `status`
- `created_at`
- optional `expires_at`
- `anonymous_allowed: false`

No anonymous public rooms are permitted. Room membership is server-authoritative and derived from canonical identity, organization, role, cohort, team, class, project, SHF Civic, or simulation context.

## Messaging Contract

Canonical message structure:

| Field | Requirement |
| --- | --- |
| `message_id` | Server-issued message ID |
| `room_id` | Approved room |
| `sender_user_id` | Server-derived authenticated user ID |
| `organization_id` | Canonical org boundary |
| `sent_at` | Server timestamp |
| `message_type` | Locked type |
| `body` | Bounded text content |
| `reply_to_message_id` | Nullable reply reference |
| `attachment_refs` | Existing safe file boundary references only; no new attachment system in MET-2B |
| `moderation_state` | Visible/flagged/held/redacted/deleted state |
| `edited_at` | Nullable server timestamp |
| `deleted_at` | Nullable server timestamp |
| `source_client_id` | Client correlation only |
| `safety_flags` | Safety classifier/moderation flags |
| `audit_reference` | Audit/evidence reference when required |

Message types:

- `TEXT`
- `SYSTEM`
- `ANNOUNCEMENT`
- `HELP_REQUEST`
- `MODERATOR_NOTICE`
- `TASK_CONTEXT`
- `CIVIC_CONTEXT`
- `PROJECT_CONTEXT`

The client may submit body and correlation data, but it may not forge `sender_user_id`, organization, room authority, role, or moderation state.

## Direct Messaging Policy

Architecture decision: one-to-one student direct messaging is disabled by default.

If direct messaging is ever enabled, it must require explicit organization policy, age/grade hooks, role rules, retention policy, moderation policy, and audit behavior.

Students should primarily communicate through approved shared contexts:

- class
- cohort
- team
- project
- civic session
- simulation
- event

Rationale: school-safe communication needs visible, policy-bound, moderated context. Uncontrolled one-to-one student messaging creates avoidable safety, evidence, supervision, and cross-boundary risks.

## Moderation Model

Required moderation actions:

- warn
- mute
- room mute
- remove from room
- temporary communication suspension
- block interaction
- report
- escalate to authorized staff
- retain evidence
- close room
- lock posting
- archive conversation

Moderator scopes:

- room-level
- facility-level
- district-level
- organization-level

Moderators must not gain unrelated platform authority. Moderation authority does not confer:

- identity role assignment
- organization membership management
- credential issuance
- civic authority
- economy authority
- evidence/Truth authority

## Block / Mute / Report

Mute:

- Hides messages or alerts for the muting user.
- Does not change the other user's permissions.
- Does not create an incident by itself.

Block:

- Prevents approved direct interaction paths where applicable.
- Does not create hidden platform-level expulsion.
- Does not suppress required safety evidence.

Report:

- Creates a reviewable safety/moderation record.
- Preserves relevant message and presence context.
- Does not itself declare guilt.

Anti-abuse behavior:

- Rate-limit reports, messages, and room actions.
- Deduplicate repeated submissions through idempotency.
- Preserve the ability to report/block/mute from relevant UI surfaces.
- Prevent users from using mute/block/report to bypass required staff notices or destroy evidence.

## Student Safety Protections

Required protections:

- no anonymous contact
- no unrestricted external messaging
- no default city-wide student directory
- no client-side role spoofing
- no hidden unmoderated rooms
- no disappearing evidence for reported incidents
- bounded staff visibility
- organization policy controls
- cohort/team scoping
- age/grade policy hooks
- safe links
- message rate limiting
- spam/flood protection
- account/session revocation propagation
- report/block/mute availability
- moderation audit trail

MET-2B does not make legal compliance claims. It defines product and architecture controls that future compliance review can evaluate.

## Retention & Audit

Retention must be policy-reference-driven rather than hardcoded.

Ordinary message retention:

- Uses a configurable retention policy reference.
- User delete/archive can affect ordinary presentation only within policy.

Moderation evidence retention:

- Uses a policy reference and incident-preserving behavior.
- Reported/flagged evidence cannot be silently destroyed by ordinary delete/archive.

Reported incident retention:

- Preserves relevant message, presence, room, actor, and moderation context.
- Does not itself declare guilt.

Presence retention:

- Presence is short-lived operational state.
- Long-lived presence history should not be retained unless a bounded policy/audit use case requires it.

Aggregate analytics:

- May retain aggregate/deidentified counts under policy reference.
- Must not become a shadow student directory.

## Notification Integration

Metaverse communication reuses the canonical NCA notification system.

Allowed projections include:

- team message
- instructor announcement
- help response
- civic session starting
- job simulation invitation
- moderation notice

Communication does not create a second notification center. Notifications remain organization-scoped and preference-aware where NCA policy allows preferences. Mandatory operational and required-action notices must not be suppressed by metaverse-specific preference logic.

## Real-Time Transport Boundary

Repository audit found:

| Mechanism | Current repo finding |
| --- | --- |
| WebSocket dependency | Not present in `apps/shs-api/package.json` |
| Socket.IO dependency | Not present in `apps/shs-api/package.json` |
| Server-Sent Events implementation | No canonical implementation found |
| Redis dependency | Not present in `apps/shs-api/package.json` |
| Durable outbox | Present as existing trusted-reporting/integration outbox patterns |
| Polling | Existing HTTP polling/subscription patterns exist in areas such as calendar feeds |

Recommendation:

Start future implementation with authenticated short polling or bounded SSE projection over server-authoritative presence state. Add WebSocket and Redis only after scale, fanout, and bidirectional latency requirements are proven.

## Presence Expiration / Heartbeat

Safe lifecycle:

- Heartbeat interval concept: 30 seconds.
- Stale-session timeout concept: 90 seconds.
- Disconnect handling: mark unavailable when known; otherwise expire after stale timeout.
- Explicit sign-out: mark offline and expire immediately.
- Session revocation: expire presence and deny room/presence projection.
- Duplicate tabs/devices: keep distinct `client_instance_id` records and coalesce user-level projection.
- Network loss: do not keep a user online beyond stale timeout.

## Camera / Presence Connection

Camera hierarchy:

CITY OVERVIEW -> DISTRICT VIEW -> FACILITY VIEW -> ACTIVITY / SIMULATION VIEW

Presence projection behavior:

| Camera level | Presence behavior |
| --- | --- |
| City overview | Aggregate online counts only |
| District view | District-level aggregate and optionally authorized peers/groups |
| Facility view | Visible participants where policy permits |
| Activity/simulation | Active participants, team members, instructor, and moderator presence |

Camera position does not grant visibility permission.

## Visual Presence Model

Presence indicators must be dynamic UI, never baked into background images.

Required overlay components/placeholders:

- Online Now counter
- nearby participants list
- team members online
- instructor/moderator badge
- status indicator
- chat tray
- unread indicator
- report/block/mute menu
- help/request instructor
- room name/context
- participant count

## Accessibility

Communication and presence must support:

- keyboard operation
- screen-reader participant lists
- semantic room names
- accessible message chronology
- reduced motion
- non-color-only presence status
- captions/transcripts for future audio/video
- text-first communication baseline
- mobile/tablet usability
- focus management
- accessible moderation actions

## Privacy / Data Minimization

Recommended student-visible fields:

- approved display name
- avatar
- role label where appropriate
- current approved space
- status
- team/class relationship when relevant

Do not expose:

- personal email
- home address
- phone
- hidden organization metadata
- internal IDs
- private staff/admin data

## Security

Required controls:

- Message spoofing: sender identity is server-derived.
- Presence spoofing: presence requires canonical authenticated user/org context and server heartbeat.
- Cross-org room access: denied by organization boundary.
- Room membership bypass: membership resolution is server-authoritative.
- Stale JWT/session use: future runtime must recheck session and membership on heartbeat and room actions.
- Revoked membership: revocation invalidates presence and room membership.
- Role escalation: roles are canonical, never client-declared.
- Forged sender identity: client sender claims are ignored or rejected.
- Replayed messages: use idempotency/source-client correlation and server-issued IDs.
- Duplicate submission: deduplicate by server policy where persistence is introduced.
- Unsafe links: allow same-origin relative action links only.
- Rate abuse: rate-limit messages, reports, help requests, and moderation operations.
- Unauthorized room creation: require authenticated canonical organization context.
- Unauthorized moderator action: enforce moderation scope and audit every action.

## P0/P1 Gap Register

P0 gaps:

- None remain for MET-2B.

P1 gaps:

| Gap ID | Classification | Description | Disposition |
| --- | --- | --- | --- |
| MET-2B-GAP-P1-001 | Missing implementation dependency | Production realtime transport is not implemented. | Future phase should start with authenticated polling or bounded SSE before adding WebSocket/Redis. |
| MET-2B-GAP-P1-002 | Missing moderation persistence | Moderation records are contractual only in MET-2B. | Future persistence phase must add policy-backed storage and audit integration if production chat proceeds. |
| MET-2B-GAP-P1-003 | Unresolved retention policy | Retention durations are not hardcoded and require organization/canonical policy references. | Keep configurable; do not add duration constants without policy authority. |
| MET-2B-GAP-P1-004 | Required implementation dependency | Message rate limits, spam/flood enforcement, and duplicate-submission persistence remain future runtime work. | Contract and tests require the rule; implementation belongs with production messaging. |

## Minimal Implementation Contracts

Added bounded contracts under:

`apps/shs-api/src/domain/metaverse/communication/`

Files:

- `presence-contract.ts`
- `room-contract.ts`
- `message-contract.ts`
- `moderation-contract.ts`
- `communication-policy.ts`
- `transport-contract.ts`

These are type/policy/helper contracts only. They add no migrations, routes, WebSocket dependency, UI, uncontrolled DM, or production chat surface.

## Validation Coverage

Deterministic tests cover:

1. presence requires canonical user/org identity
2. stale presence expires
3. client cannot self-grant visibility
4. cross-org presence is denied
5. city overview exposes aggregate counts only
6. facility presence obeys visibility policy
7. room membership is server-authoritative
8. anonymous rooms prohibited
9. student DM disabled by default
10. mute != block != report
11. reported message evidence cannot be silently destroyed
12. moderator scope is bounded
13. notification integration reuses canonical NCA
14. no duplicate identity authority
15. no duplicate notification authority
16. no CivicSure communication authority
17. accessibility fields/contracts exist
18. safe-link rule exists
19. sender identity cannot be client-forged
20. revoked membership invalidates room/presence access

## Repository-Local P0/P1

P0: None.

P1:

- `MET-2B-GAP-P1-001` Future realtime transport implementation is still required.
- `MET-2B-GAP-P1-002` Future moderation persistence is still required.
- `MET-2B-GAP-P1-003` Retention policy references must be bound to canonical organization policy before production persistence.
- `MET-2B-GAP-P1-004` Production rate limiting/spam controls must be implemented with production messaging.
