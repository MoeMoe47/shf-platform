# CODEX HANDOFF REPORT

Agent: Foundation public Donation payments, single executor.
Task: Stripe-hosted one-time/monthly Donation integration.
Starting branch: `feature/shf-donation-payments`.
Starting SHA: `dfe329330442634e201cd15e7e99966ec0cd0ad4`.

STATUS: COMPLETE for the implemented repository slice; processor credentials, real Stripe sandbox acceptance and production configuration remain external prerequisites. No production-ready ecosystem claim is made.

## Objective and implemented result

Implement a public charitable-donation payment context without forcing anonymous donors into institutional identity. Existing provider-neutral payment readiness and organization-scoped financial authorities remain intact. Stripe Checkout is the sole processor; no raw card/bank credentials enter SHF.

PostgreSQL persists the donation intent, verified processor events and individual collections. The existing required organization/payer constraints make institutional `payment_transactions` unsuitable. Migration `164_foundation_public_donations.sql` creates only `foundation_donations`, `foundation_donation_events` and `foundation_donation_collections`. No production or shared database migration was applied.

Backend authority: SHS API, existing PostgreSQL pool/transaction conventions, existing public rate-limit and safe operational telemetry infrastructure. Core auth/tenant semantics and institutional registries are not changed. The only shared server edit registers exact public donation routes before global JSON parsing. Existing unrelated HOST/listen changes are excluded from the commit.

Endpoints (add `/api` when using the frontend proxy):

- `POST /foundation/donations/checkout`
- `POST /foundation/donations/webhook`
- `GET /foundation/donations/:publicReference/status`

The async Stripe adapter isolates the official SDK, pinned API, server-generated price/recurrence/metadata, return URLs, raw-body signature verification and event normalization. Stripe's SDK verifies the original webhook buffer with the signing secret and a 300-second tolerance. PostgreSQL row locks, unique event IDs and unique collection references make replay and concurrent processing idempotent. Metadata, amount, currency, frequency, environment and processor references must agree.

One-time paid Checkout events complete the gift. Monthly Checkout correlates a subscription and remains pending until an automatically paid invoice is verified. Each later monthly invoice is its own collection; historical completion is separate from active/past-due/canceled recurring state. Refund/dispute projections, automated receipts and subscription self-service remain outside this slice.

The frontend preserves the Donation layout/presets/custom cents and adds accessible frequency selection. It redirects only to validated Stripe-hosted URLs returned by the backend. Errors, invalid responses and unconfigured Stripe use truthful fallback. Success initially confirms nothing; it reads backend state and permits refresh. Cancel never writes payment truth. Hash-specific return-component identity prevents completed state from carrying into another return URL.

## Files created

```text
apps/shs-api/migrations/164_foundation_public_donations.sql
apps/shs-api/src/domain/foundation-donations/model.ts
apps/shs-api/src/domain/foundation-donations/repo.ts
apps/shs-api/src/domain/foundation-donations/routes.ts
apps/shs-api/src/domain/foundation-donations/service.ts
apps/shs-api/src/domain/foundation-donations/stripe-provider.ts
apps/shs-api/tests/foundation-donation-payments.test.ts
apps/shs-api/tests/foundation-donation-payments.tsconfig.json
src/foundation/adapters/donationCheckout.js
src/foundation/adapters/donationReturnMessage.js
src/foundation/pages/DonationReturn.jsx
tests/foundationDonationPayments.test.mjs
tests/ui/foundation-donation-payments.spec.mjs
docs/ui/foundation-donation/PAYMENT_INTEGRATION.md
docs/ui/foundation-donation/PAYMENT_HANDOFF.md
```

## Files modified

```text
apps/shs-api/package.json
apps/shs-api/package-lock.json
apps/shs-api/src/server.ts (donation registration hunks only)
src/foundation/App.jsx
src/foundation/adapters/donationHandoff.js
src/foundation/components/FoundationGiftSelector.jsx
src/foundation/components/FoundationWaysToGive.jsx
src/foundation/styles/foundation-donation.css
tests/foundationDonationFinal.test.mjs
tests/foundationGiftSelector.test.mjs
tests/foundationWaysToGive.test.mjs
tests/ui/foundation-donation.spec.mjs
tests/ui/foundation-donation-gift.spec.mjs
tests/ui/foundation-donation-final.spec.mjs
docs/ui/foundation-donation/README.md
docs/ui/foundation-donation/HANDOFF.md
docs/ui/foundation-donation/FINAL_PRODUCTION_READINESS.md
```

Generated browser screenshots are local verification artifacts under `docs/ui/foundation-donation/screenshots/`; they are not implementation source and are not staged. No approved photo asset was modified. Historical readiness documents received only a current-state link; their earlier evidence remains intact.

DATABASE CHANGES: One migration, named above, adding three narrow donation tables. Verified in a disposable local PostgreSQL cluster/schema only.

API CHANGES: Three public donation endpoints above; no existing endpoint changed.

ROUTE CHANGES: Existing Donation route retained. Added `#/get-involved/success` and `#/get-involved/canceled` inside the canonical Foundation app; public reference is in the hash query.

SHARED COMPONENT CHANGES: No shared header/footer/design-system source edits. Scoped Donation styles and controls only.

## Tests and results

- `node --test tests/foundation*.test.mjs`: PASS, 62/62, including new adapter/component/return tests and all existing Donation unit/render suites.
- From `apps/shs-api`: `DONATION_TEST_DATABASE_URL=postgres://localhost:5597/postgres ./node_modules/.bin/tsx --test tests/foundation-donation-payments.test.ts tests/pr3-payment-readiness.test.ts`: PASS, 35/35, no skipped tests. Real PostgreSQL constraints/transactions/concurrency; fake Stripe session creation and real SDK signature checks; local HTTP raw-body and sanitized-error tests. The final run used the isolated payment-only snapshot and includes subscription cancellation before the first collection.
- All three `./node_modules/.bin/tsc -p tests/{foundation-donation,foundation-donation-header,foundation-global-cta}.tsconfig.json`: PASS.
- From `apps/shs-api`: `npm run typecheck` and `npm run build`: PASS in the dirty primary checkout. **Clean full-API checks fail on 13 pre-existing Portfolio permission diagnostics**, exactly identical byte-for-byte in the untouched baseline and payment-only snapshot. The unrelated primary `security-permissions.ts` edits supply those missing constants and remain excluded from payment commits. No protected permission architecture was changed to hide this baseline issue.
- `./node_modules/.bin/tsc -p apps/shs-api/tests/foundation-donation-payments.tsconfig.json`: PASS in primary and isolated snapshot, checking Donation production code and its backend tests without unrelated Portfolio modules.
- Isolated snapshot built from the baseline plus explicit payment files: clean `npm ci --ignore-scripts --no-audit --no-fund` in `apps/shs-api` PASS (190 packages); frontend 62/62, standalone institutional-header regression, three frontend TypeScript configurations, manifest/UI validators, scoped API TypeScript, PostgreSQL payment 35/35 and scoped Foundation build PASS. Root dependencies are shared read-only with primary; API dependencies were independently installed from the committed lockfile.
- `node scripts/validate-manifests.mjs`: PASS, 17 manifests.
- `node scripts/validate-ui-contracts.mjs`: PASS, 1 contract.
- `node docs/ui/foundation-donation/build.mjs`: PASS, Foundation/shf entrypoints; output only in `/private/tmp/shf-donation-build`.
- Scoped frontend ESLint with the repository's unchanged configuration and the existing `/private/tmp/shf-donation-lint` installation: PASS. TypeScript uses the repository TypeScript checks.
- Prettier checks for task code/new docs/tests: PASS. SQL was executed by PostgreSQL, not passed to an unsupported Prettier parser. Existing historical document bodies and unrelated server hunks were not reformatted.
- `git diff --check`: PASS across the primary checkout; staged checks also pass.
- Full browser command: `SHF_FOUNDATION_BASE_URL=http://127.0.0.1:5297 ./node_modules/.bin/playwright test tests/ui/foundation-donation*.spec.mjs --workers=2 --output=/private/tmp/shf-payments-all-browser`: 39 PASS, 10 FAIL. **All three new payment browser tests pass**, including exact monthly cents/hosted redirect, malformed URL fallback, and pending-confirmed-cancel navigation. All four full-page readiness cases and gift selector cases pass.

Browser failures are not hidden or called MachPort limitations: Chromium worked outside the sandbox. Four hero tests use a whitespace-stale accessible-name selector (desktop cases reproduce on the untouched baseline); four Ways-to-Give action cases and one combined navigation case encounter pre-existing pointer interception (combined case reproduced on untouched baseline). The primary 390px header test measured a transient 43.35px action target against 44px; the isolated clean-baseline header case passed. Unrelated primary Foundation/header CSS is preserved. These shared layout/test issues remain follow-up work, not verified payment regressions. Earlier sandboxed Chromium failed with the historical MachPort error; the approved external run supplied the fresh results above.

The first backend commit attempt hit the repository legacy registry guard's default 60-second timeout. The pre-commit framework automatically stored/restored unstaged changes; no manual stash was used. The supported guard timeout was raised for a retry without skipping checks. SHA-256 comparisons verified the restored unrelated tracked-file contents.

## Credentials and production prerequisites

Required: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHF_DONATION_SUCCESS_URL`, `SHF_DONATION_CANCEL_URL`, plus the existing `DATABASE_URL` and production platform/rate-limit/origin configuration. Existing `VITE_SHS_API_BASE` / same-origin proxy supplies the public API location. No new public base variable or frontend secret was introduced.

No Stripe secret/webhook keys were present in the process environment or named in the checked local root/API environment files. Only key presence was reported; no credentials were printed or committed. No real Stripe test/live request or sandbox end-to-end donation was performed. Synthetic fixtures are confined to tests and cannot be enabled as runtime fallback.

Before production: provision the correct SHF merchant/test account, perform real sandbox acceptance and recurrence/failure/cancel/replay tests, review/apply the migration through canonical deployment, register version-matched snapshot webhooks, configure HTTPS/proxy/IP quotas/secrets, verify settlement and backup/recovery, operational reconciliation/alerts, recurring consent/cancellation/support terms, retention/privacy and approved receipt/tax/refund procedures. Resolve the listed existing browser issues before claiming complete public UI acceptance. See [PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md) for the detailed runbook.

CROSS-DOMAIN DEPENDENCIES: Core server/database/rate-limit conventions; SHF legal/merchant operations. Existing institutional payment, identity, grants, Exchange, entitlement, Evidence/Truth and reporting authorities remain separate.

ARCHITECTURAL DECISIONS: Public donation ownership is independent of institutional membership, as explicitly authorized. Existing organization-scoped audit/outbox cannot be reused without inventing donor ownership; verified evidence remains in the donation transaction and no Truth/public-impact event is emitted. A later approved producer can bridge collections with appropriate receiving-entity scope and refund/correction semantics. No competing generic billing authority or event bus was created.

FOLLOW-UP WORK: Processor credentials and real sandbox acceptance; production configuration/operations and the existing browser failures above. Refund/dispute accounting, receipt automation, subscription self-service and public reporting require separate reviewed scope.

SAFE TO MERGE: WITH CONDITIONS — scoped payment checks pass; the baseline-wide API/Portfolio type errors and existing browser issues remain. No production activation, real Stripe sandbox proof, clean full-API build or clean full-browser acceptance is claimed. No merge was performed.

Commit SHAs, clean-snapshot verification and push result are recorded by the final task response. All implementation commits originate in the primary checkout. The branch was never recreated or switched. Explicit paths were staged; the server used interactive hunk staging to exclude unrelated edits. No force-push, reset, clean, manual stash, unrelated-file deletion or production mutation was performed.
