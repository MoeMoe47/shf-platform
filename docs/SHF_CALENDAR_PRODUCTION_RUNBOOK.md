# SHF Calendar Production Runbook

Operator reference for the canonical Calendar/Intelligence/Companion pipeline and the Phase 12.1/
12.2/13 External Calendar Integration layer. No secret values appear in this document — only
variable names and where their real values come from.

## 1. Startup prerequisites

- Postgres reachable at `DATABASE_URL`, migrated to the latest migration (currently `055`).
- `SHF_EXTERNAL_SECRET_ACTIVE_KID` + `SHF_EXTERNAL_SECRET_KEYS_JSON` (dev) or
  `SHF_EXTERNAL_SECRET_KEYS_REF` (production, required — the app fails closed at first encryption
  attempt if this is unset in production) must resolve to a real 32-byte AES-256 key.
- `SHS_IDENTITY_PROVIDER`/`SHS_IDENTITY_PROVIDER_AUDIENCE`/`SHS_SESSION_SECRET_REF`/
  `AUTH0_ISSUER`/`AUTH0_AUDIENCE` required in production (pre-existing, unrelated to Calendar).

## 2. Required environment variables (Calendar-specific)

| Variable | Purpose | Required when |
|---|---|---|
| `SHF_EXTERNAL_SECRET_ACTIVE_KID` / `_KEYS_JSON` / `_KEYS_REF` | Token encryption key | Always (feature fails closed otherwise) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app | Only if Google connect is offered |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth app | Only if Microsoft connect is offered |
| `SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL` | This API's own externally-reachable base URL | Always if either provider is offered |
| `SHF_FRONTEND_BASE_URL` | Frontend base URL for the post-callback redirect | Always if either provider is offered |
| `SHF_EXTERNAL_CALENDAR_PROVIDER_TIMEOUT_MS` | Per-request provider HTTP timeout (default 10000) | Optional, tune per environment |
| `SHF_EXTERNAL_CALENDAR_SYNC_BATCH_SIZE` | Background mirror-sync batch size (default 20) | Optional |
| `SHF_EXTERNAL_CALENDAR_SYNC_POLL_MS` | Background mirror-sync worker-loop interval (default 900000 = 15 min) | Optional, only if the loop-mode worker is deployed |

Neither Google nor Microsoft is required to be configured — each adapter reports
`healthCheck() === "not_configured"` and the corresponding Settings row shows "Not connected"
with no way to reach a fabricated success.

## 3. Google setup (when enabling)

1. Create an OAuth 2.0 Client ID (Web application) in Google Cloud Console.
2. Add `${SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL}/external-accounts/google/oauth/callback` as an
   authorized redirect URI — must match exactly.
3. Set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` via the environment's real secret injection
   mechanism (see §6) — never commit them.
4. Requested scopes (fixed in code, not configurable): `openid email
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/calendar.freebusy`.

## 4. Microsoft setup (when enabling)

1. Register an app in the Microsoft Entra (Azure AD) admin center, "Accounts in any organizational
   directory and personal Microsoft accounts."
2. Add `${SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL}/external-accounts/microsoft/oauth/callback` as a
   redirect URI (platform: Web).
3. Grant the delegated Graph permission `Calendars.ReadWrite`.
4. Set `MICROSOFT_CLIENT_ID`/`MICROSOFT_CLIENT_SECRET` via the real secret injection mechanism.

## 5. OAuth redirect URI checklist

The redirect URI registered with each provider must be byte-identical to
`${SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL}/external-accounts/{provider}/oauth/callback` — a
mismatch here is the single most common OAuth setup failure and surfaces as a provider-side
`redirect_uri_mismatch` error during the token exchange, not at connect time.

## 6. Secret key requirements & production secret injection

This app never reads a raw secret from a committed file. In production,
`SHF_EXTERNAL_SECRET_KEYS_REF` (and equivalently `SHF_INTERNAL_SERVICE_KEYS_REF` for the unrelated
trusted-reporting signing key) is asserted present and the app throws before any encryption
attempt if it is not — this is the existing fail-closed contract from Phase 12.1, unchanged by
Phase 13. **This runbook does not mandate a specific secret manager** — whatever mechanism the
deployment already uses to inject `AUTH0_*`/`SHS_SESSION_SECRET_REF` should inject
`SHF_EXTERNAL_SECRET_KEYS_REF`/`GOOGLE_CLIENT_SECRET`/`MICROSOFT_CLIENT_SECRET` the same way. No
bespoke vault was built for this (phase brief §7's own instruction).

## 7. Key rotation procedure

1. Generate a new 32-byte key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
2. Add it to the key map under a new key id (e.g. `k2`) alongside the existing one — via whatever
   mechanism populates `SHF_EXTERNAL_SECRET_KEYS_JSON`/`_REF` (both old and new keys must remain
   present; do not remove `k1` yet).
3. Set `SHF_EXTERNAL_SECRET_ACTIVE_KID=k2` and deploy — all *new* encryptions (new connects,
   refreshes) now use `k2`; every row still encrypted under `k1` remains fully decryptable, since
   `decryptSecret()` always resolves the key by the envelope's own recorded `keyVersion`, never the
   currently-active one.
4. Re-encryption of existing rows under `k2` is not automatic this phase (no rotation job was
   built — see Remaining Gaps in the Phase 13 report). To force it manually today: trigger a
   refresh for each connection (`getValidAccessTokenForActor()` re-encrypts on every refresh) or a
   disconnect+reconnect. A dedicated re-encryption CLI is a real, but not yet built, follow-up.
5. Only remove `k1` from the key map once you have confirmed (via a query against
   `token_key_version`) that no row still references it.
6. If a key is compromised: rotate immediately per the steps above, then follow §"Security
   Incident Runbook" (`docs/SHF_CALENDAR_SECURITY_INCIDENT_RUNBOOK.md`).

## 8. Reconnect procedure (learner-facing)

A learner sees "Reauthentication required" when a refresh fails (revoked/expired grant). The
Settings UI's "Reconnect" button re-runs the full OAuth start/callback flow and replaces the
connection's tokens in place — no support/admin action needed. If reconnect itself keeps failing,
check the provider's own app/consent status first (a revoked app registration, not a user-level
issue, produces the same symptom for every learner).

## 9. Provider outage procedure

No operator action is required. Google/Microsoft outages are isolated per-provider
(`Promise.allSettled` in `external-availability-service.ts`): `externalAvailabilityComplete`
becomes `false` for the affected provider only, Calendar Intelligence and Companion continue
operating on canonical SHF data, and the ICS feed and the other provider are unaffected. When the
outage clears, the next request/sync automatically returns to `complete: true` — no manual DB
repair.

## 10. Mirror-sync recovery

If `external_calendar_event_links` rows are lost or corrupted for a connection, no data is
unrecoverable: the next `POST /external-accounts/:provider/sync` (or the next background dispatch
pass, if deployed) rebuilds every mirror mapping from the canonical SHF projection — mirror state
is fully derivable, never itself a system of record. See Disaster Recovery Semantics in
`docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`.

## 11. Background mirror-sync worker (optional)

Not deployed by default — on-demand sync (`POST /external-accounts/:provider/sync`, triggered from
the Settings UI) already satisfies mirror correctness. If freshness without a manual trigger is
wanted operationally, invoke `npm run worker:external-calendar-mirror` as a long-running process
(self-polling every `SHF_EXTERNAL_CALENDAR_SYNC_POLL_MS`, default 15 minutes) under the same
process supervisor/managed scheduler contract as the existing
`npm run worker:trusted-reporting` — see `src/domain/external-accounts/service/external-calendar-mirror-worker.ts`.
Each pass is bounded (`SHF_EXTERNAL_CALENDAR_SYNC_BATCH_SIZE`, default 20 connections), advisory-
lock-protected against double-processing, and isolates one connection's failure from the rest.

## 12. Webhook recovery

Not implemented this phase (deferred — see the Phase 13 report's Remaining Gaps). No operator
action applies; there is nothing to recover.

## 13. ICS feed troubleshooting

- **Learner reports their subscribed calendar stopped updating**: check
  `GET /calendar/feed-token/me` for that learner — `active: false` means they (or someone) revoked
  it; issue `POST /calendar/feed-token/rotate` to give them a new URL (this invalidates the old one
  immediately, by design).
- **A calendar client shows a 404 on the feed URL**: the token in the URL doesn't match any active
  row — either revoked or never rotated. Same fix as above.
- **Feed content looks stale**: the feed is generated fresh from the canonical projection on every
  request (`Cache-Control: private, max-age=300`) — a 5-minute client-side cache is expected
  staleness, not a bug.

## 14. Database migration procedure

Standard: `npm run db:migrate` (advisory-lock protected against concurrent runners — see
`migration-runner.ts`'s own `MIGRATION_LOCK_KEY`). Always additive; this codebase has never edited
a historical migration. After migrating: `npm run db:schema:integrity` then
`npm run db:schema:integrity:strict` must both report `ok: true` before considering the migration
complete.

## 15. Integrity verification

`npm run db:migrate:status` (expect `pending: [], drift: [], unknownApplied: []`),
`npm run db:schema:integrity`, `npm run db:schema:integrity:strict` — run all three after any
migration, deploy, or suspected schema drift.

## 16. Common errors

| Symptom | Likely cause | Fix |
|---|---|---|
| `PROVIDER_NOT_CONFIGURED` on connect | `GOOGLE_CLIENT_ID`/`MICROSOFT_CLIENT_ID` (or secret) unset | Set real credentials via §6 |
| `CALLBACK_VERIFICATION_FAILED` | Expired/replayed/wrong-actor OAuth state (10-minute TTL) | Ask the learner to retry Connect from the start |
| `external_calendar_provider_did_not_return_refresh_token` | Provider consent screen was previously granted without `prompt=consent`/`offline_access` reaching it | Ask the learner to fully disconnect any prior grant on the provider's own account settings, then reconnect |
| Connection stuck `REAUTH_REQUIRED` after reconnect attempts | Provider-side app registration itself revoked/misconfigured | Check the provider's developer console, not the learner's account |
| `production_external_secret_key_provider_required` at startup | `SHF_EXTERNAL_SECRET_KEYS_REF` unset in production | Configure production secret injection per §6 |

## 17. Rollback / containment procedure

Calendar Projection/Intelligence/Companion/ICS have no Phase 12.x dependency — disabling External
Calendar Integration entirely (unset `GOOGLE_CLIENT_ID`/`MICROSOFT_CLIENT_ID`, or simply don't
deploy the mirror worker) leaves every other Calendar capability fully intact. To contain a
suspected issue with one provider only, unset that provider's client id/secret — its adapter
immediately reports `not_configured` and refuses further connects; existing connections continue
to work for read (free/busy, mirror) until their access token expires, at which point refresh
fails closed (`REAUTH_REQUIRED`) rather than silently continuing on a stale token.

## 18. Security incident note

See `docs/SHF_CALENDAR_SECURITY_INCIDENT_RUNBOOK.md` for the dedicated incident-response document
(secret exposure, key exposure, feed token exposure, compromised provider account, suspected
cross-user access).
