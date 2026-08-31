# SHF External Calendar Integration (Phase 12, extended by Phase 12.2)

Backend: `apps/shs-api/src/domain/calendar-feed/`
Routes: `GET /calendar/feed-token/me`, `POST /calendar/feed-token/rotate`,
`DELETE /calendar/feed-token/me`, `GET /calendar/feed.ics`
Frontend: `src/lib/calendarFeed/api.js` → `src/pages/curriculum/calendar/CalendarFeedSubscribe.jsx`

## 1. Scope decision (read this first)

Phase 12's brief asked for Google Calendar, Microsoft Outlook, and Apple/iCal support. The
pre-implementation audit (§2 below) found **no existing OAuth infrastructure, no per-user
credential/token storage, and no reversible-encryption or KMS capability anywhere in this
codebase** — the one existing "provider" precedent (`zoom-provider.ts`, Live Learning) uses a
fundamentally different auth model (a single org-wide server-to-server client-credentials grant,
env-var-only, never persisted) that does not generalize to a per-learner, three-legged Google/
Microsoft OAuth flow, which requires storing a long-lived refresh token that must later be
replayed back to that provider — something only reversible encryption can do safely.

Per the phase brief's own explicit stop conditions (§14 and §109 — "if secure OAuth token storage
does not exist... STOP with PARTIAL rather than inventing insecure persistence" and "if provider
secrets would need plaintext persistence... STOP with PARTIAL"), Google Calendar OAuth connect and
Microsoft Graph OAuth connect are **not implemented this phase**. This is a scope-honest PARTIAL,
not a silent omission — see the Phase 12 report for the full justification.

What **is** real, complete, and shipped this phase: a standards-based ICS/webcal subscription
feed. This is the brief's own preferred approach for Apple Calendar (§21) — and, because every
major calendar client (Google Calendar, Outlook, and Apple Calendar all included) natively
supports "subscribe to a calendar by URL," one secure ICS feed gives every learner a real,
working, one-way SHF → external sync into all three, satisfying the brief's own §7 "First
Principle — one-way SHF export" preference without needing OAuth for any of them.

## 2. Pre-implementation audit

Searched the entire repository for Google/Microsoft SDKs, OAuth client libraries, `.ics`/webcal
generation, and encryption/KMS helpers. Found: zero. The one relevant precedent,
`zoom-provider.ts`, uses Zoom's Server-to-Server OAuth (account-level client credentials from
`process.env`, never persisted, never per-user) — architecturally unrelated to a per-learner
OAuth connect flow. A genuinely reusable secure-token pattern **does** exist:
`production-identity-repo.ts`'s session tokens (`randomBytes(32)` → SHA-256 hash persisted, raw
value shown once, verified by hash lookup) — this is exactly the pattern Phase 12's ICS feed
token reuses, because it is a self-issued bearer credential this app both creates and verifies
(never a third-party secret that must be sent back to a provider), so one-way hashing is
sufficient and no reversible encryption is needed or claimed.

## 3. Provider Capability Matrix (updated by Phase 12.2 — see §13)

| Provider | Connect (OAuth) | Read busy/free | SHF → provider mirror | Subscribe by URL (ICS) |
|---|---|---|---|---|
| Google Calendar | **IMPLEMENTED_NOT_LIVE_VERIFIED** (real code, no configured credentials in this environment) | **IMPLEMENTED_NOT_LIVE_VERIFIED** | **IMPLEMENTED_NOT_LIVE_VERIFIED** | **REAL** (via the generic ICS feed) |
| Microsoft Outlook | **IMPLEMENTED_NOT_LIVE_VERIFIED** | **IMPLEMENTED_NOT_LIVE_VERIFIED** | **IMPLEMENTED_NOT_LIVE_VERIFIED** | **REAL** (via the generic ICS feed) |
| Apple Calendar | N/A (never claimed — §21) | N/A | N/A | **REAL** |

No capability is marked REAL unless it was actually built and tested end-to-end against the live
provider. "IMPLEMENTED_NOT_LIVE_VERIFIED" means real, complete, non-mocked production code exists
and passes its full contract test suite against a `MockExternalCalendarProvider`, but has never
been exercised against Google's or Microsoft's actual servers because no real app-registration
credentials exist in this environment — see §13 for the full honest accounting.

## 4. External Truth Boundary

SHF source domains remain the sole authority for completion, attendance, credentialing,
enrollment, and every other institutional fact. The ICS feed is **read-only, one-way, and
generated fresh on every request** from the exact same already-entitled
`getCalendarProjectionForActor()` result `GET /calendar/events/me` returns (Phase 9, unchanged,
not recomputed). There is no code path anywhere in this feature that accepts a write from an
external calendar client — a subscribed calendar app only ever performs `GET` requests against
`/calendar/feed.ics`, and that route reads only. An external calendar user editing or deleting
their local copy of a mirrored event has no effect on SHF truth, by construction (there is no
mechanism for it to reach back).

## 5. Data Ownership

- **SHF_CANONICAL** — every fact in the ICS feed (title, dates, status) comes directly from the
  same Calendar Projection Service every other Calendar surface uses. No new truth is created.
- **EXTERNAL_MIRROR** — does not apply this phase; there is no provider-side event mapping table
  because there is no OAuth-based provider write path (§27/§28 of the brief are not applicable).
- **EXTERNAL_BUSY** — does not apply this phase; free/busy ingestion requires the same blocked
  OAuth infrastructure (§9/§10/§35/§36 deferred — see §12 below).

## 6. Token Security

`calendar_feed_tokens` (migration 053) stores only a SHA-256 hash of a `randomBytes(32)`
high-entropy token — the raw token is returned exactly once, at generation time, and cannot be
recovered later, only rotated. Regenerating replaces the learner's one row in place (`UPSERT`),
immediately invalidating any previously issued URL — verified by test. Revoking clears the active
row; the feed URL then returns `404` for any request, whether missing, malformed, or a valid-but-
revoked token (a constant failure shape, no information leak about which case occurred).

## 7. Connection Ownership

The feed token is strictly learner-owned: `PRIMARY KEY (organization_id, user_id)`, one row per
learner. All three management routes (`GET/POST/DELETE /calendar/feed-token/...`) are gated by
`requirePermission("enrollment.view")`, matching every other self-service Calendar route (Phase
9/10/11) — no `learnerId`/`userId`/`actorId` query parameter is ever read for identity, verified
live and by test (a spoofed identity parameter has zero effect).

## 8. ICS Feed Contract

`GET /calendar/feed.ics?token=<opaque>` — the only unauthenticated route in this feature, by
necessity: an external calendar client polling a subscribed URL cannot send this app's session
cookie or dev-token header. Security is entirely the token's own entropy and hash-verified
lookup — the same "secret address" model every major calendar provider uses for its own private
ICS links.

- **UID**: deterministic, `${projectionId}@calendar.siliconheartland.org` — stable across every
  fetch (verified by test), so an external client updates rather than duplicates on re-sync.
- **DTSTART/DTEND**: UTC instants (`YYYYMMDDTHHMMSSZ`) for timed events; `VALUE=DATE` for all-day
  events (the exclusive-next-day DTEND convention). An event with no real end (every deadline-
  shaped projection) gets a zero-duration DTEND at the same instant — never a fabricated block of
  time (phase brief §65).
- **No RRULE** — every SHF projection event is a single instance; no recurrence is invented
  (phase brief §66).
- **Escaping**: backslash, comma, semicolon, and newline are escaped per RFC 5545 §3.3.11 —
  verified by test with a title containing all four.
- **Line folding**: content lines over 75 octets are folded per RFC 5545 §3.1 (`\r\n ` continuation)
  — verified by test with a 120-character title.
- **CLASS:PRIVATE** on every event — this is one learner's own personal schedule.
- **Cache-Control: private, max-age=300** — a light response cache hint for the subscribing
  client; the server itself caches nothing and recomputes the projection on every request.

## 9. Frontend

`CalendarFeedSubscribe.jsx` — one small rail card on the Curriculum Calendar page (same visual
language as Plan My Week/Journey Milestones, no redesign): status-aware button ("Get subscription
link" / "Get a new subscription link"), a revealed-once URL with a copy-to-clipboard action, an
explicit one-way/read-only/privacy disclosure, and a revoke action. Verified live end-to-end:
generate → copy → revoke, all working, zero console errors.

## 10. Explicit Non-Goals This Phase

Google Calendar OAuth connect, Microsoft Graph OAuth connect, free/busy ingestion, external-busy
conflict detection in Calendar Intelligence, Companion external-availability guidance, webhooks,
incremental sync tokens, and SHF→provider event mirroring via the Calendar/Graph APIs are all
**not implemented** — each is architecturally blocked on the same missing secure per-user token
storage (§1), not merely deferred by preference. No fake/mocked provider connection, token, or
sync state was created anywhere, including in `shs_dev`.

## 11. Phase 12.1 Boundary (resolved)

Phase 12.1 (`docs/SHF_EXTERNAL_ACCOUNT_SECURITY.md`) built exactly the foundation items (a) and
(b) below anticipated by this section: reversible AES-256-GCM encryption-at-rest
(`src/security/external-secret-cipher.ts`) for a token that must later be replayed to a third
party, and a full OAuth state/PKCE/callback-security lifecycle
(`src/domain/external-accounts/service/oauth-state-service.ts`). It deliberately implemented no
Google or Microsoft API call, no OAuth `/start` or `/callback` route bound to a real provider, and
no free/busy ingestion — those remain a future phase's job (item (c) below still applies: explicit
organizational sign-off on the Google/Microsoft API scopes to request). This ICS feed, Calendar
Projection, Calendar Intelligence, and Companion Context were not modified by Phase 12.1 and do
not need to change to accommodate a future OAuth-based phase.

## 12. Phase 13 Boundary (superseded by §13 — see below)

The gap this section anticipated (real provider adapters, real OAuth routes) is what Phase 12.2
built. What genuinely remains for Phase 13 is listed in §13's own "Remaining Gaps."

## 13. Phase 12.2 — Native External Calendar Integration (resolved)

Backend: `apps/shs-api/src/domain/external-accounts/{providers,service,repo,api}/`
Migration: `055_external_calendar_event_links.sql`
Frontend: `src/lib/externalAccounts/api.js` → `src/pages/career/settings/ExternalCalendarConnections.jsx`
(mounted in `src/pages/Settings.jsx`)

### 13a. What was built

Real Google Calendar and Microsoft Outlook OAuth adapters
(`google-calendar-provider.ts`/`microsoft-calendar-provider.ts`), a provider-neutral connect
orchestration layer (`external-calendar-connect-service.ts`) built entirely on Phase 12.1's
state/PKCE/cipher foundation, one-way SHF → provider event mirroring
(`external-calendar-mirror-service.ts`, backed by the new `external_calendar_event_links` table),
and privacy-minimal free/busy retrieval (`external-availability-service.ts`) feeding into Calendar
Intelligence (Phase 10) and Companion Context (Phase 11) as a new, clearly-distinguished
`EXTERNAL_BUSY_CONFLICT` signal — never merged into or confused with an SHF-vs-SHF `HARD_CONFLICT`.

### 13b. What was deliberately NOT built

No real Google/Microsoft app registration exists in this environment
(`GOOGLE_CLIENT_ID`/`MICROSOFT_CLIENT_ID` unset) — both adapters report `healthCheck() ===
"not_configured"` and refuse any real network call, exactly mirroring `zoom-provider.ts`'s own
established pattern. Live-clicking "Connect" in the new Settings UI is verified to reach the real
backend route and receive an honest `PROVIDER_NOT_CONFIGURED` response — never a fabricated
success. No automatic/background mirror sync scheduler exists (§61 Phase 13 boundary) — sync is
triggered explicitly via `POST /external-accounts/:provider/sync`. No webhook receiver exists for
detecting a provider-side mirror deletion — `suppressMirrorForActor()` is implemented and tested,
but nothing calls it yet (documented, not silently missing).

### 13c. Least privilege — exact scopes requested

Google: `openid email https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.freebusy` — deliberately not `calendar` (full access),
not Gmail/Drive/Contacts/profile. Microsoft: `openid email offline_access Calendars.ReadWrite` —
the narrowest single scope covering both mirror-write and free/busy-read, since Graph has no
narrower free/busy-only scope the way Google does; deliberately not Mail/Contacts/Files/Team/
directory scopes.

### 13d. Free/busy privacy

Google via the narrow `freeBusy` API; Microsoft via `/me/calendarView` with an explicit
`$select=start,end,showAs,isCancelled` — Microsoft's own API never even serializes a subject/body/
location into that response, a stronger privacy property than fetching full events and discarding
fields afterward. Neither call ever requests or stores a title. No SHF admin or instructor route
exists that can inspect any learner's busy intervals.

### 13e. Mirroring

One `external_calendar_event_links` row per (connection, SHF projection id) — the same stable
`${sourceDomain}:${sourceRecordId}` id Phase 9 already produces, never title/date-based matching.
A second sync updates the same provider event in place (verified by test); a source event that
falls out of the actor's entitled projection window has its mirror deleted, and only that one —
never another learner's or another connection's mirror. An external edit or deletion of the
mirrored event is never read back into SHF — the architecture has no code path that could.

### 13f. Companion honesty

An `EXTERNAL_BUSY_CONFLICT` guidance item only ever names the real SHF event ("your Live Session
overlaps a busy period on your connected calendar") — never the external event's own title,
because `FreeBusyInterval` carries no title field to begin with.

### 13g. Remaining gaps (real Phase 13 boundary)

Live Google/Microsoft acceptance is unverified (no real credentials available in this
environment — see the Phase 12.2 report's Live Provider Verification sections). No background
mirror-sync scheduler. No webhook-driven mirror-suppression trigger. No key-rotation automation
(inherited from Phase 12.1). No multi-calendar selection UI (one destination calendar per provider
connection, by design — phase brief §15).

## 14. Phase 13 — Production Hardening (resolved where in-scope; deliberately deferred elsewhere)

Fixed a real, previously-latent defect: every Google/Microsoft HTTP call now has a bounded
timeout (`provider-http.ts`, `AbortController`, default 10s,
`SHF_EXTERNAL_CALENDAR_PROVIDER_TIMEOUT_MS`) — a hung provider request could otherwise have
blocked Calendar Intelligence or a mirror sync indefinitely. Added retry-failure classification
(429/5xx retryable, other 4xx not) for a future caller to use.

Built, reusing the existing `trusted-reporting` worker/dispatcher pattern exactly (phase brief
§10's "prefer reuse"): an optional background mirror-sync dispatcher
(`external-calendar-mirror-dispatcher.ts`) and worker (`external-calendar-mirror-worker.ts`,
`npm run worker:external-calendar-mirror`), bounded batch, per-connection Postgres advisory-lock
protected against concurrent double-sync (using a dedicated pooled client for the lock's lifetime —
pool-auto-release `query()` would have silently broken session-level advisory-lock semantics, a
real bug caught and fixed during this phase's own implementation), and opportunistic OAuth-state
cleanup colocated in the same pass rather than a second cron entry.

**Deliberately deferred, with justification, not silently missing:** an automatic background
scheduler is not deployed by default (on-demand sync already satisfies mirror correctness; the
worker exists and is documented for an operator to enable if freshness-without-a-manual-trigger is
wanted). Provider webhooks were not built (phase brief §24's own "do not fake PASS... mark
DEFERRED" — a webhook receiver would only improve freshness, never correctness, since SHF never
treats provider-side changes as source truth regardless, and it cannot be safely live-verified
without real provider credentials in this environment). Automated key re-encryption on rotation was
not built (a manual procedure is documented in
`docs/SHF_CALENDAR_PRODUCTION_RUNBOOK.md` §7 instead). Apple/iCal was not exercised against a real
desktop/mobile Calendar client this phase (status: STRUCTURALLY_VERIFIED_ONLY).

New operational documentation: `docs/SHF_CALENDAR_PRODUCTION_RUNBOOK.md`,
`docs/SHF_CALENDAR_DEPLOYMENT_CHECKLIST.md`, `docs/SHF_CALENDAR_SECURITY_INCIDENT_RUNBOOK.md`.
