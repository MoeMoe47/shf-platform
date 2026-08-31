# SHF External Account Security (Phase 12.1)

## 1. Purpose

Phase 12 (`docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`) identified a hard blocker to Google/
Microsoft Calendar OAuth integration: this codebase had no reversible encryption-at-rest for a
secret that must later be replayed to a third party. Phase 12.1 builds exactly that foundation —
and nothing beyond it. No Google API call, no Microsoft Graph call, and no OAuth route bound to a
real provider exist after this phase. Everything here is provider-neutral and fully exercised by
synthetic test values.

## 2. Threat model

The primary asset is a learner's third-party OAuth refresh/access token — a credential that, if
leaked, grants an attacker read access to that learner's real Google/Microsoft Calendar. Threats
addressed: database compromise (tokens must not be recoverable as plaintext from a DB dump or
backup), log/error leakage (tokens must never appear in logs or error messages), cross-user access
(one learner must never read or revoke another's connection), CSRF/open-redirect during the OAuth
handshake (a forged callback must never complete a connection on a victim's behalf, and a
malicious return path must never be honored), and replay (a captured authorize-callback request
must not be usable twice). Out of scope for this phase's threat model: compromise of the
application server process itself (an attacker with code execution inside this process can call
`decryptSecret()` directly, same as any application-layer encryption scheme) and compromise of the
key-management system backing `SHF_EXTERNAL_SECRET_KEYS_REF` in production.

## 3. Repository-wide secret storage audit (performed before writing any code)

Grepped the full backend source tree for `encrypt|decrypt|cipher|AES|KMS|vault|secret|OAuth|PKCE|
nonce|credential store|key rotation|key id`. Findings:
- **No reversible encryption-at-rest existed anywhere.** Confirmed both by the grep and by
  `migrations/053_calendar_feed_tokens.sql`'s own comment: "no reversible-encryption/KMS
  infrastructure exists anywhere in this codebase."
- Every existing secret-like value (session tokens in `production-identity-repo.ts`, calendar feed
  tokens in `calendar-feed-token-service.ts`) uses one-way SHA-256 hashing — sufficient because
  this app only ever verifies its own self-issued values, never replays them to a third party. An
  OAuth refresh token is the opposite case: it must be sent back to the provider verbatim, so it
  cannot be hashed.
- A directly reusable **key-ID / JSON-map / `_REF` convention already existed** for a different
  purpose — HMAC request signing (`src/domain/trusted-reporting/outbox.ts`,
  `SHF_INTERNAL_SERVICE_ACTIVE_KID` / `_KEYS_JSON` / `_KEYS_REF`): an active key id names which
  key in a `{kid: value}` map signs new requests; production requires the `_REF` (approved secret
  manager) variable and fails closed if only the local `_JSON` variable is set. Phase 12.1 mirrors
  this exact naming and fail-closed pattern for the new encryption key rather than inventing a
  second convention.
- An existing operational audit system (`audit_events` table, `writeAuditEvent()`) was directly
  reusable for connection lifecycle events.

## 4. Pre-implementation verdict

**A.** No reversible encryption-at-rest existed (see §3). **B.** No key-encryption convention
existed, but the `_ACTIVE_KID`/`_KEYS_JSON`/`_KEYS_REF` convention did, and was reused. **C.**
AES-256-GCM is safely introducible via Node's built-in `crypto` module — no new dependency. **D.**
IV: `crypto.randomBytes(12)` per encryption call. **E.** Auth tag: `cipher.getAuthTag()`, stored
alongside ciphertext/IV. **F.** Key version: a `keyVersion`/`token_key_version` column per
encrypted field. **G.** Rotation: not an active job this phase, but not precluded — decrypt looks
up the key by its recorded `kid`, so adding a new `kid` and re-encrypting rows later is additive.
**H.** Refresh and access tokens are encrypted independently (separate envelope columns). **I.**
Access tokens are persisted encrypted but treated as optional/best-effort; the refresh token is the
durable value. **J/K.** OAuth state: server-side DB record, `crypto.randomBytes(32)`, only its
SHA-256 hash persisted, `expires_at` + atomic single-claim `consumed_at`. **L.** PKCE is feasible
and implemented (S256). **M/N.** `provider_account_id` column; rows scoped by
`(organization_id, user_id, provider)`. **O.** The existing `audit_events` system was reused for
`external_account.connected` / `.disconnected` / `.reauth_required`. **P.** Phase 12.2 will consume
`createAuthorizationState()`, `consumeAuthorizationState()`, and `createOrReplaceConnection()`
directly, plus the real provider redirect URI / client id / token-exchange call this phase does
not implement.

## 5. Encryption architecture

`src/security/external-secret-cipher.ts` — `encryptSecret(plaintext)` / `decryptSecret(envelope)`.
Each envelope is `{ ciphertext, iv, authTag, keyVersion }`, all base64-encoded except `keyVersion`.
Decryption always verifies the GCM auth tag before returning plaintext; any tampering (ciphertext,
IV, or auth tag) throws rather than returning corrupted or wrong data.

## 6. Cipher / authenticated encryption

AES-256-GCM (`node:crypto`'s `createCipheriv`/`createDecipheriv`), a 96-bit random nonce per
encryption (never reused), and a 128-bit GCM authentication tag. No ECB, no home-grown
construction. A fresh nonce means encrypting the same plaintext twice never produces the same
ciphertext (verified by test).

## 7. Key management

`SHF_EXTERNAL_SECRET_ACTIVE_KID` names which key new encryptions use, from a
`SHF_EXTERNAL_SECRET_KEYS_JSON` map of `{ kid: base64(32-byte key) }` (local/dev). In production,
`isProductionEnvironment()` gates a hard requirement for `SHF_EXTERNAL_SECRET_KEYS_REF` — a
reference to an approved secret manager — and the app fails closed (throws before any encryption
attempt) if that is unset, exactly mirroring `assertProductionIdentityProviderConfigured()`'s own
production gate for the identity provider. No key is ever hardcoded or logged.

## 8. Key versioning

Every envelope records the `keyVersion` it was encrypted under. Decryption resolves the key by that
recorded version, not the currently-active one — so rotating `SHF_EXTERNAL_SECRET_ACTIVE_KID`
forward for new encryptions does not break decryption of rows encrypted under an older key, as
long as that older key remains present in the JSON/`_REF` map. A future rotation job (re-encrypting
existing rows under the new active key) is additive work, not a schema or architecture change.

## 9. Token storage

`external_account_connections` (migration `054`) stores access and refresh tokens as separate
envelope column sets (`access_token_ciphertext`/`_iv`/`_auth_tag`, `refresh_token_ciphertext`/`_iv`/
`_auth_tag`), plus one shared `token_key_version`. No plaintext token column exists.

## 10. Token redaction

No global request/response body logging exists anywhere in this backend (confirmed by grep — no
morgan, no generic `console.log(req.body)`), and none of Phase 12.1's own code logs a token, a
ciphertext, or a PKCE verifier at any point (confirmed by grep of the new files). There is
therefore no log sink for a reusable redaction helper to attach to; the mitigation here is
structural (nothing ever calls `console.log` on a secret value) rather than a filter applied after
the fact.

## 11. External connection model

`external_account_connections`: one row per `(organization_id, user_id, provider)`, `provider` in
`('google', 'microsoft')`, `status` in `('ACTIVE', 'REAUTH_REQUIRED', 'REVOKED')`, `scopes` JSONB,
encrypted token envelopes, `connected_at`/`last_refreshed_at`/`reauth_required_at`/`revoked_at`
timestamps. `oauth_authorization_states`: short-lived one-time state/PKCE records, `state_hash`
(SHA-256, never the raw state), encrypted PKCE verifier envelope, `expires_at` + `consumed_at`.

## 12. Connection ownership

Every repository method is scoped by `(organization_id, user_id)` together — there is no method
that accepts a bare connection id from a caller. A cross-user read via a guessed/enumerated id is
structurally impossible, not merely permission-checked.

## 13. Connection lifecycle

`ACTIVE` (created or reconnected) → `REAUTH_REQUIRED` (marked by a future provider adapter on a
refresh failure) → `REVOKED` (learner-initiated disconnect, destroys the encrypted token columns in
place) → `ACTIVE` again on reconnect (same row, per the table's `UNIQUE(organization_id, user_id,
provider)` constraint — never a second simultaneously-valid row for the same actor/provider).

## 14. Safe DTO

`{ id, provider, status, connectedAt, reauthRequired }` — never ciphertext, IV, auth tag, key
version, or raw provider account metadata. This is the only shape `GET /external-accounts/me`
returns, and the only shape any test observed over HTTP (verified: response body never contains a
raw token value or the word "ciphertext").

## 15. OAuth state architecture

`src/domain/external-accounts/service/oauth-state-service.ts` —
`createAuthorizationState({ actor, provider, returnPath })` returns `{ state, codeChallenge,
codeChallengeMethod }` (never the verifier); `consumeAuthorizationState({ actor, provider, rawState
})` atomically claims the state row (fails on unknown/expired/already-consumed) and returns `{
returnPath, codeVerifier }` only when the actor and provider match the issuing request.

## 16. CSRF protection

The state value is bound to the issuing actor (`organization_id` + `user_id`) and provider at
creation, and re-checked at consumption — a callback cannot be completed on behalf of a different
signed-in user's session, since `consumeAuthorizationState()` requires the *current* request's
actor to match the actor the state was originally issued to.

## 17. Replay protection

`OAuthAuthorizationStateRepo.claimByStateHash()` is a single atomic `UPDATE ... WHERE consumed_at
IS NULL AND expires_at > NOW() RETURNING *` — the first caller to reach it wins; every subsequent
attempt (including a legitimate double-submission or a replay) finds zero unconsumed rows and gets
`null`, with no read-then-write race window.

## 18. PKCE

RFC 7636 S256: a 256-bit random verifier, `SHA-256(verifier)` base64url-encoded as the challenge.
The verifier is stored server-side only (encrypted, never returned by `createAuthorizationState()`)
and released to the caller exactly once, at successful state consumption — matching the same
"shown once, never again" idiom as calendar feed token rotation.

## 19. Callback security

No callback route exists yet (no real provider to call back from — see §23). The provider-neutral
validation primitive (`consumeAuthorizationState()`) that a future callback route will call already
enforces: state exists, not expired, not already consumed, actor matches, provider matches — before
any token exchange would occur. It never trusts a userId/organizationId/providerAccountId supplied
by the caller; the actor always comes from the authenticated session.

## 20. Return-path / open-redirect protection

`src/domain/external-accounts/service/return-path-guard.ts` — `isSafeInternalReturnPath()`
requires a relative path (`/...`), rejects protocol-relative (`//evil.example`), any embedded
`scheme:` (`javascript:`, `data:`), backslash tricks, control characters, and `..` path-traversal
segments, and requires a match against an explicit allowlist of internal path prefixes. Checked
once at state-issuance time (not only at consumption), so an unsafe path can never even be
persisted into a state record. **A `..`-traversal bypass was caught by this phase's own test suite
during development** (a return path like `/career/settings/../../evil` passed a naive
prefix-string check) and fixed before this phase's report was written — see §26.

## 21. Admin privacy

No route of any kind allows retrieving another actor's connection or its secrets — `GET
/external-accounts/me` and `DELETE /external-accounts/:provider` are both scoped to the requesting
session's own actor only, with no admin-override parameter, path, or permission that reads a
different user's row. This was verified directly: an admin user's own `/external-accounts/me` call
returns only the admin's own (empty) list, never another learner's connections.

## 22. Direct-ID / IDOR

Eliminated by design, not just checked: the only mutation route is `DELETE
/external-accounts/:provider`, keyed by provider name, not by a connection id — there is no URL
parameter anywhere that accepts a raw connection id, so there is no ID to guess or enumerate across
users in the first place.

## 23. No provider implementation this phase

No Google API call, no Microsoft Graph call, no OAuth `/start` or `/callback` HTTP route bound to a
real provider, no free/busy ingestion, no webhook, no sync worker. `createOrReplaceConnection()` is
fully implemented and tested with synthetic token values so a future Phase 12.2 adapter can call it
unmodified once it has real tokens from a real provider token-exchange call.

## 24. Operational audit

Reused the existing `audit_events` system (`writeAuditEvent()`) for `external_account.connected`,
`external_account.reauth_required`, and `external_account.disconnected` — `target_object_type:
"external_account_connection"`, never any token content in `new_state_json`/`previous_state_json`.

## 25. Database changes

One additive migration, `054_external_account_connections.sql`: `external_account_connections` and
`oauth_authorization_states`, both with FK-enforced ownership (`organization_id`/`user_id`
referencing `organizations`/`users`), `CHECK` constraints on `provider`/`status`, a `UNIQUE
(organization_id, user_id, provider)` constraint, and lookup indexes. No historical migration was
edited.

## 26. Security test results

34 new tests in `tests/external-account-security.test.ts`, covering all four required matrices —
crypto (10), OAuth state (10), PKCE (5), IDOR/lifecycle (13, some combined) — all passing. **Two
real bugs were found and fixed during test development, not merely covered after the fact:**
(1) the return-path guard's original prefix-only check accepted a `..`-traversal payload disguised
inside an allowlisted prefix (fixed in `return-path-guard.ts`, §20); (2) the dev-token identity
fixture (`identity-repo.ts`) didn't recognize this phase's synthetic test user ids, which initially
surfaced as spurious 401s — fixed by adding one matching regex entry, mirroring that file's own
established convention for every prior phase's dynamically-generated test personas (not a security
finding — a test-fixture gap).

## 27. Fresh DB verification

Created `shs_phase121_verify_1788188239`. Migrated 001→054 cleanly (54 migrations, matching the
repository's actual migration count — verified, not assumed). Curated integrity: `ok:true,
failures:[]`. Strict integrity: `ok:true, checkedMigrations:54, checkedObjects:1803, failures:[]`.
All 12 seed files applied cleanly. Full suite: 505 total / 499 pass / 0 fail / 6 skip. Server
booted, `/health` healthy. Dropped; confirmed 0 occurrences remain via `psql -l`.

## 28. shs_dev verification

Migration status clean (54 applied, `pending:[]`, `drift:[]`, `unknownApplied:[]`). Curated +
strict integrity both clean. `external_account_connections` and `oauth_authorization_states` both
contain **zero rows** — no fake/test data was left behind (each test run's own `after()` hook
deletes its synthetic rows). Smoke-tested `GET /external-accounts/me` against a real seed user
(`user_student_001`) — returns `{ connections: [] }`, honest and healthy.

## 29. Backend regression

Two consecutive clean runs against `shs_dev`: 505 total / 499 pass / 0 fail / 6 skip, both times. A
pre-existing hardcoded migration-count assertion (`tests/migration-runner.test.ts`, expecting 53
migrations / `053_calendar_feed_tokens.sql` as the last file) was updated to 54 /
`054_external_account_connections.sql` — the same category of update every prior phase that added a
migration has required.

## 30. Performance

10,000 encrypt+decrypt round-trips of a 200-byte representative token value: 329ms total, ~33
microseconds per operation — negligible for any per-request path. Refresh tokens are not cached in
process memory beyond the single request that needs them.

## 31. Files changed

New: `src/security/external-secret-cipher.ts`, `migrations/054_external_account_connections.sql`,
`src/domain/external-accounts/{model,repo,service,api}/*.ts` (7 files), `tests/external-account-security.test.ts`,
this document. Modified: `src/api/router.ts` (route registration), `src/domain/identity/repo/identity-repo.ts`
(test-fixture regex, §26), `src/domain/external-accounts/service/return-path-guard.ts` (bug fix,
§20 — created and fixed within this phase), `tests/migration-runner.test.ts` (migration count),
`.env` / `.env.example` (new key env vars), `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`
(cross-reference).

## 32. Documentation

This document created. `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` updated with a resolved §11
Phase 12.1 boundary and a renumbered §12 Phase 13 boundary reflecting what now remains.

## 33. Remaining gaps

No key-rotation job exists yet (not required this phase — see §8; the schema and decrypt path
already support it). No formal secret-manager integration was built for `SHF_EXTERNAL_SECRET_KEYS_REF`
itself — this phase only asserts it is required and fails closed in production; wiring an actual
secret-manager client is a deployment/ops concern outside this phase's backend-code scope.

## 34. Phase 12.2 readiness (resolved)

Phase 12.2 (`docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §13) built exactly this: real
`GoogleCalendarProvider`/`MicrosoftCalendarProvider` adapters, `/external-accounts/:provider/
oauth/start` + `/callback` routes calling `createAuthorizationState()`/`consumeAuthorizationState()`
unmodified, and `createOrReplaceConnection()` fed with real (well, real-code-path — not yet
live-verified) provider tokens. None of this phase's security properties needed to change. One
real bug was found and fixed during Phase 12.2's own test development: `createOrReplaceConnection()`'s
upsert originally reassigned the connection row's `id` on every reconnect, which would have orphaned
Phase 12.2's `external_calendar_event_links` foreign key — fixed to preserve the row's original id
across reconnects (`external-account-connection-repo.ts`).

## 35. Phase 12.2 token-refresh extension

`getValidAccessTokenForActor()` (added by Phase 12.2) transparently refreshes an expiring access
token using the same encrypted refresh token this phase established, re-encrypting under a fresh
IV each time (never reusing one — §6/§7 above), and never erases a valid refresh token just
because a provider's refresh response omitted a new one (Google routinely does this; Microsoft
usually does not, but the code path is provider-agnostic). A rejected refresh marks the connection
`REAUTH_REQUIRED`, never silently `REVOKED` — see `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §13
for the full Phase 12.2 accounting.
