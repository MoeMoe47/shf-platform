# SHF Calendar Deployment Checklist

Run through this before promoting a build that touches Calendar/External Calendar Integration
code. Not all items apply to every deploy — skip what's unaffected, but don't skip silently on
anything that touched `apps/shs-api/src/domain/{calendar,companion,external-accounts}`.

## Environment
- [ ] `DATABASE_URL` points at the intended environment's database, not a dev/test one.
- [ ] `SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL` and `SHF_FRONTEND_BASE_URL` match this
      environment's real, externally-reachable URLs.

## Database
- [ ] `npm run db:migrate:status` shows `pending: []` before deploy, or the deploy pipeline runs
      `npm run db:migrate` as part of rollout.
- [ ] `npm run db:schema:integrity` → `ok: true`.
- [ ] `npm run db:schema:integrity:strict` → `ok: true`.

## Secrets
- [ ] `SHF_EXTERNAL_SECRET_ACTIVE_KID` + a resolvable key are present (via `_KEYS_REF` in
      production).
- [ ] If Google is being enabled/rotated: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` set via the
      real secret injection mechanism, never a committed file.
- [ ] If Microsoft is being enabled/rotated: `MICROSOFT_CLIENT_ID`/`MICROSOFT_CLIENT_SECRET` set
      the same way.
- [ ] `git status`/`git log` for this change contains no `.env` file and no secret-looking string
      in a diff.

## Migration
- [ ] Any new migration is additive only (no edit to a historical migration file).
- [ ] Migration filename number is exactly one greater than the previous head — verified by
      inspection, not assumed.

## Provider configuration
- [ ] Google/Microsoft redirect URIs registered with each provider exactly match
      `${SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL}/external-accounts/{provider}/oauth/callback` for
      this environment.
- [ ] Requested scopes reviewed and still minimal (`openid email calendar.events calendar.freebusy`
      for Google; `openid email offline_access Calendars.ReadWrite` for Microsoft) — no scope
      creep introduced by this change.

## Worker / scheduler
- [ ] If the optional background mirror-sync worker (`npm run worker:external-calendar-mirror`) is
      deployed in this environment, confirm it is running under the environment's process
      supervisor with restart-on-crash, not a one-shot invocation.
- [ ] If it is NOT deployed, confirm on-demand sync (`POST /external-accounts/:provider/sync`) is
      reachable from the Settings UI as the sole mirror-freshness mechanism for this environment.

## Webhooks
- [ ] N/A this phase — no webhook receiver is implemented (deferred; see the Phase 13 report).

## Health
- [ ] `GET /health` returns `{ ok: true }` post-deploy.
- [ ] `GET /calendar/events/me` and `GET /calendar/intelligence/me` smoke-tested against a real
      seed/staging user, return 200 with the expected shape (including `externalConflicts`/
      `externalAvailabilityComplete` fields).
- [ ] `GET /external-accounts/me` smoke-tested, returns `{ connections: [] }` or real connections
      as expected — never an error for a user with no connections.

## Smoke
- [ ] Connect flow reaches the real provider authorize screen (or, if not configured, returns
      `PROVIDER_NOT_CONFIGURED` — never a silent failure or fabricated success).
- [ ] Disconnect removes the connection and its mirror links (`external_calendar_event_links` row
      count for that connection drops to 0).
- [ ] ICS feed URL still resolves and returns `text/calendar` for an existing token.

## Mobile
- [ ] Settings/Connected Calendars section visually checked at a genuinely narrow device or
      emulator width — see the Phase 13 report's Responsive Acceptance section for this
      environment's own tooling-limitation disclosure; use a real device/browser devtools
      emulator for final sign-off before a production release, not just this checklist.

## Accessibility
- [ ] Connect/Reconnect/Disconnect controls are real `<a>`/`<button>` elements reachable by
      keyboard (verified by inspection this phase — no new interactive pattern was introduced).

## Provider status
- [ ] `docs/SHF_CALENDAR_CAPABILITY_MATRIX.md` reflects the true current status
      (REAL/IMPLEMENTED_NOT_LIVE_VERIFIED/PARTIAL/MISSING/DEFERRED) for this release — updated if
      live acceptance was newly completed.

## ICS
- [ ] Calendar feed security review (token entropy, hash-at-rest, revocation, rotation, UID
      stability) unchanged from Phase 12 — re-run `tests/calendar-feed.security.test.ts` as part of
      the standard regression, not skipped.

## Monitoring
- [ ] Structured JSON logs from `external_calendar_mirror_dispatcher` (if the worker is deployed)
      and provider timeout/failure events are flowing into this environment's existing log
      aggregation — no new observability stack was introduced to wire up.

## Backup / recovery
- [ ] `external_account_connections`, `oauth_authorization_states`, `external_calendar_event_links`
      are covered by the environment's normal database backup policy (no special-cased exclusion).

## Rollback
- [ ] Rolling back this deploy does not require a migration rollback (all Phase 12.x/13 migrations
      are additive; an older app version simply ignores tables/columns it doesn't know about).
- [ ] If rolling back specifically to disable External Calendar Integration, unsetting
      `GOOGLE_CLIENT_ID`/`MICROSOFT_CLIENT_ID` is sufficient and reversible — no data is destroyed.
