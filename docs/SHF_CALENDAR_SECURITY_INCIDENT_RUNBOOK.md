# SHF Calendar Security Incident Runbook

Human-driven response guidance for the External Calendar Integration security surface (Phase
12.1/12.2/13). No automated destructive response exists or is built by this document — every step
here is something an operator performs deliberately, using infrastructure that already exists.

## 1. OAuth client secret exposed (`GOOGLE_CLIENT_SECRET` / `MICROSOFT_CLIENT_SECRET`)

1. Immediately rotate the secret in the provider's own developer console (Google Cloud Console /
   Microsoft Entra admin center) — this invalidates the exposed value at the provider itself,
   which is the actual point of compromise (not this app's database).
2. Update the environment's secret injection with the new value and redeploy.
3. Existing learner connections are unaffected — this app never stores the client secret per
   connection, only the one shared app-level credential, so no learner needs to reconnect.
4. Audit the exposure window (git history, log output, CI artifact) for what was visible and to
   whom; if the secret appeared in a public location, treat as a full compromise regardless of
   whether misuse is confirmed.

## 2. Encryption key exposed (`SHF_EXTERNAL_SECRET_KEYS_JSON`/`_REF` value)

1. Treat every currently-encrypted `access_token_ciphertext`/`refresh_token_ciphertext` under the
   exposed key id as compromised — an attacker with the key can decrypt them.
2. Rotate immediately per `docs/SHF_CALENDAR_PRODUCTION_RUNBOOK.md` §7: introduce a new key id,
   make it active.
3. Because Phase 13 does not include an automated re-encryption job, **force re-encryption of every
   affected row** by revoking every connection encrypted under the compromised key id (query
   `token_key_version`) and asking those learners to reconnect — do not just add a new key and
   wait for organic refresh, since a compromised refresh token remains individually valid at the
   provider until revoked regardless of local re-encryption.
4. Also call each affected provider's own token-revocation path where available (Google: the
   adapter's `revokeConnection()` already does this on disconnect) to invalidate the tokens at the
   source, not just locally.
5. Confirm via `SELECT token_key_version, count(*) FROM external_account_connections GROUP BY 1`
   that no row still references the compromised key id before considering remediation complete.

## 3. Private ICS/webcal feed token exposed

1. This is self-contained and low-severity by design: rotate that one learner's token
   (`POST /calendar/feed-token/rotate`) — the old URL stops working immediately (the previous
   token's hash no longer matches any active row).
2. No other learner or system is affected — feed tokens are per-learner, hashed at rest, and
   carry no institutional secret beyond that one learner's own already-entitled schedule.
3. If exposure is suspected to be systemic (e.g. a logging bug that captured many tokens), audit
   `calendar_feed_tokens.created_at`/`revoked_at` for the affected window and proactively rotate
   every token created in that window rather than waiting for individual reports.

## 4. Provider account compromised (a learner's actual Google/Microsoft account, not this app)

1. This app cannot detect this on its own — act on the report as received.
2. Disconnect the connection (`DELETE /external-accounts/:provider` for that learner, or have them
   do it from Settings) — this destroys the locally-held tokens and attempts provider-side
   revocation.
3. Direct the learner to secure their actual Google/Microsoft account (password reset, revoke
   third-party app access from the provider's own account security page) — this app's disconnect
   alone does not remediate a compromised provider account, only this app's own access to it.

## 5. Suspected cross-user access (an IDOR-shaped report)

1. Every route in this domain is actor-scoped from the authenticated session only, with no
   connection-id parameter anywhere (`src/domain/external-accounts/api/routes.ts`) — first
   determine whether the report describes a genuine new code path (re-read the route file) or a
   misunderstanding of expected behavior (e.g., an admin correctly seeing only their own,
   empty connection list).
2. If a genuine defect is found: treat it as a P0 — every access path in this domain was
   structurally designed to make this impossible, so a confirmed instance means an actual security
   regression, not a policy gap. Patch, then re-run the full `external-account-security` and
   `external-calendar-integration` test suites before considering it closed.
3. Preserve the specific request (correlation id, timestamp, actor, target) for post-incident
   review — every response in this domain includes a `correlation_id`.

## 6. General incident posture

- Do not build or trigger an automated destructive response (mass token revocation, account
  lockout) as a first step — this document intentionally keeps every remediation action manual and
  scoped, since an automated over-response has its own blast radius.
- No token, PKCE verifier, OAuth code, or client secret is ever written to this app's own logs
  (verified by code inspection — no `console.log` call anywhere in `src/domain/external-accounts`
  or `src/security/external-secret-cipher.ts` references a secret value) — log review for an
  incident should not itself risk further exposure.
- After any incident, re-run the full backend security test suite
  (`external-account-security.test.ts`, `external-calendar-integration.test.ts`,
  `external-calendar-hardening.test.ts`) before declaring remediation complete.
