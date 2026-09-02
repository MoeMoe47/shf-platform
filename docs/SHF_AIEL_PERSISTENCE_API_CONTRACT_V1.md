# SHF AIEL Persistence & API Contract Design v1 (Phase 2)

Status: design-only. No schema, no route, no migration exists yet. Binds Phase 3 the same way
Phase 0/1's documents bind this one.

## 1. Purpose

Translates Phase 1's conceptual contracts into a concrete, repository-consistent persistence model
and API surface — precise enough for Phase 3 to implement without making new architectural
decisions, while adding zero code, schema, or migration this phase.

## 2. Persistence Decision

**Design A — one row per user, structured JSON.** See §5 of the full report for the comparison
against normalized columns and key-value; JSON was chosen because Phase 1's nested
`presentation/interaction/media/sensory` shape has no query pattern that needs per-field SQL
filtering (nobody will ever `WHERE text_scale = 'LARGE'` across all users), while JSON gives clean
unknown-field round-tripping (Phase 1 §20) for free — a normalized-column table would require an
additive migration for every future field, defeating the extensibility Phase 1 mandated.

## 3. Personal Profile Schema

Table: `user_accessibility_profiles` (conceptual — not migrated this phase).

```
id                  TEXT PRIMARY KEY               -- e.g. "a11yprofile_<uuid>", matching this repo's id-prefix convention
user_id             TEXT NOT NULL UNIQUE REFERENCES users(user_id)   -- one row per user, enforced
profile_version     INTEGER NOT NULL DEFAULT 1      -- schema/data-contract generation, see §12
revision            INTEGER NOT NULL DEFAULT 1       -- optimistic-concurrency counter, see §12
preferences         JSONB NOT NULL DEFAULT '{}'::jsonb  -- the nested presentation/interaction/media/sensory + learningSupport shape
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

No `organization_id` column — matches Phase 0/1's user-scoped decision exactly; the row is not
tenant-partitioned because the profile itself is not organization data.

## 4. Learning Support Persistence

**Same row, same JSON blob, nested under a `learningSupport` key** — not a separate table. Learning
Support preferences (`preferredReadingSupport`, `readAloudPreference`) are user-scoped exactly like
Personal Preferences and share every scoping/versioning/reset property; splitting them into a
second table would only duplicate the primary key and the concurrency column for no query benefit.
This is "partially persisted / partially domain-owned" per Phase 1: AIEL persists the *preference*;
`ReadingLevelProvider`'s content-variant lookup and the (not-yet-consolidated) TTS component remain
the domain behavior AIEL never touches.

## 5. Effective Context Computation

Computed, never persisted — confirmed correct per Phase 1 §6. Pipeline: `stored profile (this
table) → merge with OS/device signal for motion only → merge with organization suggested default
(deferred, see §9) → merge with AuthorizedAccommodationContext (additive, separate object, never
merged into the same field namespace)`. Motion is the only field with a non-platform, non-org input
(the OS signal), computed client-side since the OS signal is not observable server-side. Every
other field's effective value is server-computable from the stored row alone. Caching: safe to
cache client-side keyed by `user_id` + `revision`, invalidated on any successful PATCH.

## 6. Organization Suggested Defaults — DEFER

**DEFER.** No organization-settings model with a precedent for "default value for a per-user
preference" was found anywhere in this codebase during Phase 0/1/2 research, and no current SHF use
case requires it for an initial launch. Building it now would add a second precedence layer with no
consumer. If reconsidered later, it would need its own additive migration and does not block
Phase 3.

## 7. Authorized Accommodation Storage Boundary

**`user_accessibility_profiles` MUST NOT contain any accommodation field, column, or JSON key.**
Future `authorized_accommodations` table (not created this phase) would conceptually reference
`membership_id` (reusing the existing `memberships` table's own PK), be written only by an
institutional role-gated surface entirely outside AIEL, be read by AIEL as a separate, distinct
query, and be enforced by Assessment/Live Learning — never by AIEL itself.

## 8. Content Capability Persistence Boundary

Not an AIEL-owned table. `ContentAccessibilityCapabilities` facts belong on Curriculum's own
content/lesson/media metadata (e.g., a future `lesson_media.captions_available` column or similar,
owned entirely by Curriculum's migrations). AIEL's only integration point is a read call into
whatever Curriculum API/query already exposes that metadata — no new AIEL table, no duplication.

## 9. Application Capability Persistence Boundary

**Mixed by domain, not one strategy.** A static, code-declared capability set is sufficient for
Arcade (per Phase 0's finding that zero real activities exist yet — a static contract Arcade
activities implement is enough until real activities exist to need per-row DB storage). Live
Learning's caption-availability signal is a runtime API declaration (the provider contract itself,
`live-learning-provider.ts`, extended with a new interface method — no DB row needed, since it's a
live property of "does this session's provider support captions," not a persisted fact). Future
interactive Career simulations would decide their own strategy when built. AIEL defines the
*contract shape* only (Phase 1 §16); it does not mandate one persistence mechanism onto every
consuming domain.

## 10. API Resource Design

Following the repo's real, established `/{domain}/me` self-service convention (`/credentials/me`,
`/enrollments/me`, `/external-accounts/me` — all confirmed real, existing routes this session):

```
GET   /accessibility/profile/me         -- personal profile (presentation/interaction/media/sensory/learningSupport)
PATCH /accessibility/profile/me         -- partial update, see §13
POST  /accessibility/profile/me/reset   -- reset semantics, see §21
GET   /accessibility/context/me         -- EffectiveAccessibilityContext (excludes accommodations unless the caller also has an active membership-scoped grant)
GET   /accessibility/accommodations/me  -- read-only AuthorizedAccommodationContext for the caller's active membership (§7 — write authority lives entirely outside this domain)
```

Content/Application capability reads are **not** AIEL routes — a consumer calls Curriculum's own
content-metadata endpoint or the Live Learning session endpoint directly, per §8-9's ownership
boundary.

## 11. Authorization

Every route: `requirePermission("enrollment.view")` — matching the exact permission this session's
Calendar/External-Account work already reused for every other broadly-held, self-service, `/me`
route (deliberately not inventing a new permission name for a fifth self-service domain). Actor
resolved from the authenticated session only, exactly like every other `/me` route in this
codebase — never a client-suppliable `userId` parameter.

## 12. Validation

Every enum field: unknown/invalid client-supplied value → **422**, never silently coerced to a
default (Phase 1's `AUTO`/`UNKNOWN` reserved values exist precisely so a client has a valid way to
express "no opinion" — an actually-invalid value is a client bug, not an implicit AUTO). Missing
field on PATCH → untouched (merge-patch semantics, §13). Unknown top-level field name on write →
**preserved, not rejected** (round-trip safety for a newer client talking to an older deployed
server — matches Phase 1 §13's "unknown fields must be preserved" rule applied at the write path,
not just the read path). Unknown field on write from a genuinely malicious/malformed payload is
still bounded by a max-payload-size check, not unlimited key acceptance.

## 13. Versioning / Revision Model

`profileVersion` (data-contract generation, bumped only when the *shape* changes, e.g. a field is
renamed) is distinct from `revision` (this row's own optimistic-concurrency counter, bumped on
every successful write) — reusing the exact `version = version + 1, updated_at = NOW()` pattern
already established in `exchange-funding-commitment-repo.ts`, `grant-binder-repo.ts`, and
`live-session-repo.ts`. Two-tab conflict: a PATCH carries the `revision` it last read; the write
succeeds only if the stored `revision` still matches (`WHERE user_id = $1 AND revision = $2`,
directly reusing `report-public-disclosure-policy-repo.ts`'s own real CAS pattern), returning
**409** otherwise. Two-device conflict: identical — revision is server-side truth, not
device-specific. Offline reconnect: the client re-fetches before retrying a stale write rather than
blindly resubmitting. A newer client writing a field an older client's code doesn't know about:
the older client's own next PATCH (merge-patch, not full-replace) never touches that field, so it
survives untouched — this is the concrete reason merge-patch was chosen over full-PUT-replacement
in §13's design.

## 14. Unknown-Field Preservation

**Merge-patch semantics** (RFC 7396-style: a submitted field replaces that field, an absent field
is untouched, an explicit `null` clears it), not full PUT replacement and not path-based JSON
Patch. Full PUT is explicitly rejected: it's exactly the failure mode the user's own worked example
describes — an old client fetching the whole object, changing one field, and PUTting the whole
thing back would silently erase every field it doesn't know about. Merge-patch is applied
server-side against the stored JSONB, never client-computed, so the server is the only party that
ever needs to understand the full current shape.

## 15. Default Row Creation

**Option C — created at first preference write, not at user creation or first read.** A GET with no
existing row returns the full platform-default object synthesized in memory (never persisted) —
this avoids millions of default-valued rows for users who never touch the accessibility page at all
(the overwhelming majority, based on this codebase's own general usage patterns), while still
making profile existence meaningful (a row existing means "this person made at least one real
choice," useful for future audit/support purposes) — matching Option C's evaluation against
Option A's unnecessary-row cost and Option B's slightly odd "row exists but nobody chose anything
yet" semantics.

## 16. Reset Semantics

`POST /accessibility/profile/me/reset` supports three conceptual granularities: **RESET ALL**
(entire `preferences` JSONB replaced with platform defaults, `revision` incremented, row retained —
never a DELETE, preserving audit history per §24), **RESET GROUP** (e.g. reset only `sensory.*`,
merge-patch semantics applied with the default sub-object), and **RESET FIELD** (a single dotted
path reset to its own default — functionally just a PATCH with that field set to its default value,
not a separate mechanism). This preserves the absence-vs-explicit-default distinction Phase 1
mandated: a reset row still has an explicit `revision` bump and an audit trail entry showing a
deliberate reset action, distinct from a row that was simply never written to.

## 17. Legacy localStorage Migration

**Trigger:** first authenticated load after this feature ships, client-side, one-time. **Server
precedence:** if a server profile row already exists, it always wins — legacy localStorage is
discarded without ever overwriting it (directly satisfies the user's explicit "never allow legacy
localStorage to overwrite a newer server preference silently" instruction). **If no server row
exists yet:** the client reads each legacy key (§22-23 for the two special cases), constructs one
PATCH request from whatever legacy values are present and valid, and sends it once. **Idempotency:**
the client deletes the legacy localStorage keys only after a confirmed 200/201 response — a failed
migration attempt leaves the legacy keys intact and will retry on the next authenticated load with
no server row yet. **Multi-device risk:** if a learner has different legacy values in
`localStorage` on two different devices and neither has migrated yet, the first device to
successfully authenticate and migrate wins; the second device's migration attempt no-ops (server
row already exists) and its own local legacy values are simply discarded — an acceptable, disclosed
outcome (device-local convenience data, never a source of truth, per Phase 0 §7). **Corrupted
localStorage:** a JSON-parse failure on a legacy key is treated as absent, never as a crash or a
false migration failure.

## 18. Reading-Level Migration

**Prefer the existing real `sh:readingLevel` value if present; ignore `simplifiedReading`
entirely.** Evidence-based, per Phase 1 §3/§22 finding that `ReadingLevelProvider`'s
`sh:readingLevel` key already holds real, currently-effective three-value data
(`core|simple|advanced`), while `AccessibilityPreferences.simplifiedReading` is a boolean that
never had any real effect and cannot be safely mapped to the three-value enum (mapping `true→SIMPLE`
would silently discard whatever real reading level a learner may have already set via
`ReadingLevelSwitch`, which the boolean has no way to represent). No mapping of the broken boolean
is invented "for convenience," per the explicit instruction not to do so.

## 19. TTS Persistence Decision

**DEFER.** No `speechRate`/`voice`/`language` field is added this phase. Evidence: all three
existing TTS implementations either read from orphaned, never-written localStorage keys
(`SpeakBtn`'s `civic:tts:rate`/`civic:tts:lang`) or take hardcoded props from the calling page
(`SectionTTS`'s `rate`/`pitch`) — there is no real product requirement demonstrated anywhere in the
current code for a user-configurable speech rate/voice, only a decade-old unused stub. Persisting
speculative fields now would violate Phase 1's own anti-pattern list (§29: "one app inventing its
own field semantics," here risking "AIEL inventing a field nobody asked for"). `readAloudPreference`
(§4, already locked) is sufficient for Phase 3's actual scope.

## 20. Audit History Boundary

**Reuse `writeAuditEvent()`** (the same mechanism this session's own Calendar/External-Account work
used for `external_account.connected`/`.disconnected`), with a new `action_type` family
(`accessibility_profile.updated`, `accessibility_profile.reset`). Logged: `user_id`,
`organization_id` (the actor's active org at write time, for routing/audit purposes only — not a
scope constraint on the profile itself), the changed field paths, and — for ordinary Personal
Preference/Learning Support fields only — old/new values (low sensitivity, per Phase 1 §22).
**Never logged:** anything from a future `authorized_accommodations` write (§7) through this
mechanism — accommodation writes, when that domain is eventually built, need their own
higher-redaction audit path outside AIEL's scope entirely, consistent with Constitution §8.6. This
is exactly the AUDIT HISTORY vs. TRUTH SPINE EVENT distinction the user asked to lock: these events
land in the same `audit_events` table every other domain's ordinary settings changes already use,
and never in Operational Events/Evidence/Truth Spine.

## 21. Cache / Offline Policy

Cache key: `user_id` (from the authenticated session, never a raw device key). Cleared on sign-out
(matching this codebase's existing session-teardown convention). Stale tolerance: safe to render a
cached profile immediately while a fresh GET resolves in the background (standard stale-while-
revalidate), since accessibility preferences are not safety-critical in the way, say, an active
accommodation timer would be. **Offline writes: DEFER at launch.** No evidence anywhere in this
session's work of an offline-write pattern for any other SHF domain to reuse, and Phase 1 never
mandated offline support — a failed PATCH while offline should surface as a normal network error
the user can retry, not a queued background sync (which would reintroduce exactly the kind of
silent-overwrite risk §17 was designed to prevent).

## 22. Cross-Organization Security Test Model

1. User A's `GET /accessibility/profile/me` while authenticated as User A never returns User B's
   row (actor-scoped by construction — no `userId` path/query parameter exists).
2. No route accepts a `userId` parameter of any kind for this domain — structurally eliminates the
   direct-ID IDOR class already proven safe for External Accounts in this same session's work.
3. Staff/instructor role cannot write another user's Personal Preference via any route (no route
   exists that takes a target user id at all).
4. A student's session token cannot write to any future `authorized_accommodations` write path
   (that path does not exist in this domain's own route set at all).
5. Switching active organization context does not change which `user_accessibility_profiles` row
   is returned (no `organization_id` in the lookup key at all — §3).
6. `GET /accessibility/accommodations/me` under Membership A's active-org context never returns
   Membership B's accommodation record for the same person (future accommodation table's own
   membership-scoped query, tested once that domain exists — documented here as the test AIEL's own
   consumption code must satisfy).
7. `GET /accessibility/context/me` output changes when a (future) accommodation grant changes,
   without any change to the underlying `user_accessibility_profiles` row (proves accommodations
   are additive/consumed, never merged into the persisted preference row itself).
8. A profile PATCH from an authenticated session for User A, replayed by an attacker who somehow
   captured the request, fails once the `revision` has moved on (replay is naturally bounded by the
   same CAS check used for legitimate concurrency control).

## 23. API Error Model

Reusing this repo's existing `ok()`/`fail(code, message, correlation_id)` envelope exactly (the same
one used by every domain built this session):
- **401** — no authenticated session (same as every other `/me` route).
- **403** — authenticated but missing `enrollment.view` (same `requirePermission` shape).
- **404** — `GET /accessibility/accommodations/me` when no accommodation record exists for the
  active membership (never fabricated as an empty success with a fake "no accommodation" object
  when the truth is "unknown/not applicable" — 404 is the honest response, matching this session's
  own established convention of never returning a fake empty state).
- **409** — stale `revision` on PATCH (§13).
- **422** — invalid enum value or malformed nested shape on PATCH (§12).

## 24. Initial DB Migration Design

**Table:** `user_accessibility_profiles` (exact shape in §3). **Indexes:** the `UNIQUE(user_id)`
constraint already provides the only lookup index needed (every real query is by `user_id`); no
additional index is justified without a demonstrated query pattern. **Check constraints:** none at
the SQL layer for the JSONB contents (validation lives in the application layer per §12, matching
how this repo already validates JSONB payload shapes in application code rather than Postgres CHECK
expressions for every other JSONB column found in this session's own migration review). **FKs:**
`user_id REFERENCES users(user_id)`. **Must NOT contain:** any `organization_id` column, any
accommodation field, any diagnosis/disability field, any TTS speculative field (§19). This is
additive-only; the next real migration would be numbered one past whatever the actual head is at
implementation time (not assumed to be `056` — Phase 3 must re-check the actual head before
authoring it, per this session's own established discipline).

## 25. Initial Backend Domain Design

**Not** `apps/shs-api/src/domain/accessibility/` alone with a vague scope — recommend
`apps/shs-api/src/domain/accessibility-profile/` (explicitly named for what it owns, avoiding the
"broad adaptive-experience module" anti-pattern the user explicitly warned against, and avoiding
ambiguity with the unrelated `src/system/adaptive-experience/` Hub system found in Phase 0).
Structure follows this repo's own consistent `model/repo/service/api` convention (exactly the shape
of `external-accounts`, `credentials`, `assignments`, etc., all built this session):
- `model/accessibility-profile.ts` — types, enums, defaults, the merge-patch shape validator.
- `repo/accessibility-profile-repo.ts` — `findForUser`, `upsertWithRevisionCheck`, `resetForUser`.
- `service/accessibility-profile-service.ts` — merge-patch application, default synthesis (§15),
  audit-event emission (§20).
- `api/routes.ts` — the four routes in §10.
- Tests: `tests/accessibility-profile.security.test.ts`, following this session's own
  `*.security.test.ts` naming convention exactly.

## 26. Initial Frontend Client Contract

`src/lib/accessibilityProfile/api.js` (matching this session's own established `src/lib/{domain}/api.js`
convention exactly): `getProfile(role)`, `patchProfile(role, patch)`, `resetProfile(role, scope)`,
`getEffectiveContext(role)`. Learning Support reads/writes through the **same** `patchProfile` call
(same resource, per §4) — no separate client method needed, since it's the same JSON object's
`learningSupport` key.

## 27. RootProviders Implementation Input

**`AccessibilityProfileProvider`** consumes: raw `preferences` object, `revision`, `loading`,
`error`, `updatePreference(path, value)` (thin wrapper over a debounced `patchProfile`),
`resetPreferences(scope)`. **`EffectiveAccessibilityContextProvider`** consumes: the raw profile
from the sibling provider above (not its own fetch), the live OS `prefers-reduced-motion` media
query (client-only, matching `CompanionProvider.jsx`'s own already-correct pattern), and — later,
not required for Phase 3's MVP — content/application capability context where relevant; it performs
**no persistence of its own**. `AuthorizedAccommodationContext` remains a third, separate provider,
mounted but subscribed to by almost nothing in the initial MVP (§28), keeping accommodation data out
of the render path for every component with no legitimate reason to see it — the React-tree
enforcement of Constitution §9 that Phase 1 §26 already recommended.

## 28. Phase 3 Implementation Scope (MVP)

**IN SCOPE:** the `user_accessibility_profiles` table and migration; `GET`/`PATCH`/`reset` routes
(no accommodations route yet — defer until the accommodation domain itself exists, since a
route that always 404s serves no purpose); `AccessibilityProfileProvider` +
`EffectiveAccessibilityContextProvider` mounted into `RootProviders.jsx`; one-time legacy
localStorage migration (§17-18); the current Accessibility page rewired to the real profile,
replacing (not merely supplementing) `AccessibilityPreferencesProvider`; **one** canonical
`sensory.motionPreference` consumed by both Celebration and Companion, replacing both the
localStorage-bypass read and Companion's own separate `companion:reduceAnimation` key.

**OUT OF SCOPE for Phase 3:** any accommodation table/route/UI; TTS consolidation (§19); Live
Learning capability contract extension; Arcade capability contract; organization suggested
defaults (§6); offline writes (§21); staff/admin visibility UI (no staff consumer exists yet to
build against). This mirrors the brief's own suggested MVP shape, adjusted only by explicitly
dropping the `/accommodations/me` route from Phase 3 (building a route with no backing domain
yet is speculative, not evidence-based, per this document's own §19/§6 reasoning pattern).

## 29. Phase 3 Acceptance Criteria

1. An authenticated user's profile persists across two different browser sessions/devices (real
   backend round-trip, not localStorage).
2. Every control shipped in the MVP's rewired Accessibility page has a real, traceable consumer —
   no field is included merely because it existed on the old page without one.
3. Exactly one stored motion preference exists; Companion's own separate `companion:reduceAnimation`
   key is retired (not left as a second, competing input) once Companion consumes the shared
   context.
4. OS `prefers-reduced-motion` remains a live, working `AUTO` fallback input.
5. `GET`/`PATCH /accessibility/profile/me` reject any request for a different user's data (no
   route parameter exists that could name one).
6. Switching a user's active organization does not create, duplicate, or return a second profile
   row.
7. No accessibility preference write ever appears in `audit_events` under any `action_type` this
   session's own Truth Spine/Operational Events domains treat as institutional evidence — verified
   by the same kind of dedicated security test this session wrote for External Accounts.
8. `POST /accessibility/profile/me/reset` (RESET ALL) returns the row to platform defaults with an
   incremented `revision`, never a deleted row.
9. Two concurrent PATCHes with the same starting `revision` — exactly one succeeds, the other
   receives a 409, matching the CAS test pattern this session already wrote for the Calendar
   mirror-sync advisory lock.
10. Running the legacy-migration client logic twice in a row is a no-op the second time (idempotent
    — the second run finds a server row already present and takes no action).

## 30. Phase 3 Readiness Gate

All twenty-two required items are locked in this document: persistence strategy (§2), exact schema
(§3), Learning Support decision (§4), effective context model (§5), accommodation isolation (§7),
API resources (§10), self-service write authority (§11 — implicitly, only the authenticated self
may write, no broader role was ever proposed), staff read authority (never proposed — see §16 of
the original brief's own default-toward-privacy-minimization instruction, satisfied by simply not
building any staff-facing read route for Personal Preferences in this design), validation (§12),
versioning (§13), concurrency (§13), reset semantics (§16), legacy migration (§17), TTS decision
(§19 — DEFER), audit-history boundary (§20), caching/offline decision (§21), security test matrix
(§22), initial migration design (§24), backend domain placement (§25), frontend client contract
(§26), MVP scope (§28), acceptance criteria (§29). No contradiction with Phase 0 or Phase 1 was
found.

## 31. Verification

Application source: unchanged. Backend source: unchanged. Migrations: unchanged. Tests: unchanged.
Packages: unchanged. Database/persistent data: unchanged. No migration executed. No package
installed. Only this one sanctioned file was created.
