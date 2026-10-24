# SHF public Donation payment integration

Branch: `feature/shf-donation-payments`. Starting SHA: `dfe329330442634e201cd15e7e99966ec0cd0ad4`.
Date: 2026-10-24. Implementation target: ready for processor credentials, not a claim of production activation.

## Processor and authority

Stripe Checkout is the sole processor. Payment credentials are entered on Stripe-hosted pages. There is no Stripe.js, embedded card form, alternative processor, simulated production provider, tax-deductibility claim or invented receipt number.

Public charitable donations are a narrow bounded context in `apps/shs-api/src/domain/foundation-donations`. Anonymous donors do not acquire SHS/SHU accounts, memberships, learner identities or false organization/payer ownership. The existing institutional `payment_transactions` table requires organization and payer references; weakening those constraints would alter another authority. Migration `164_foundation_public_donations.sql` instead adds three narrow PostgreSQL tables with no dependency on unrelated migrations 161–163 currently present in the primary working tree:

- `foundation_donations`: internal UUID, separate unguessable public UUID, unique UUID idempotency key, Stripe mode, cents/currency/frequency/status, Checkout/payment/subscription references, recurring state, timestamps. No donor PII is stored in this phase.
- `foundation_donation_events`: verified Stripe event ID, donation reference, type and processor time; unique event IDs provide durable replay protection. Raw webhook payloads and credentials are never persisted.
- `foundation_donation_collections`: unique Checkout session for one-time collections or invoice reference for monthly collections, amount/currency and verified event lineage. Each paid month is distinct from the subscription schedule.

The schema was exercised only in a dedicated local disposable PostgreSQL cluster on port 5597. No production/shared database migration is applied by this task. Use the canonical migration runner during reviewed deployment.

## Public interfaces

The Vite `/api` proxy removes that prefix before forwarding to SHS API. Backend routes are:

| Method | Backend path                                    | Contract                                                                                                                                                                                  |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/foundation/donations/checkout`                | JSON `{amountCents:2500,currency:"usd",frequency:"ONE_TIME"}` or `MONTHLY`; `Idempotency-Key` header must be UUID v4. Returns `{donationId,checkoutUrl}`; the ID is the public reference. |
| POST   | `/foundation/donations/webhook`                 | Raw JSON bytes and `Stripe-Signature`; configured Stripe account only.                                                                                                                    |
| GET    | `/foundation/donations/:publicReference/status` | Only status, amountCents, currency, frequency and recurringStatus. No processor references, donor details, audit records or secrets.                                                      |

No organizational login is required. Exact routes are registered before global authentication/JSON middleware; other API authentication remains unchanged. Checkout/status use the existing PostgreSQL-backed `PUBLIC_READ_LIMIT` rate mechanism under a donation-specific IP key. Production startup retains the existing security and rate-limit configuration assertions. Provider webhook deliveries authenticate by signature and do not share anonymous visitor quotas. Configure edge body/rate controls and trusted proxy topology during deployment; do not blindly trust client-forwarded IP headers.

The public UUID provides an unguessable capability for viewing this minimal status. Responses use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`; frontend fetches omit credentials and referrers. Return references are placed in the URL fragment, not the server query. Do not publish return links in analytics, screenshots containing real donor context, or shared logs.

## Checkout and limits

Server validation accepts numeric integer cents only, $1.00–$10,000.00 inclusive, USD (`usd`/`USD` normalized to `usd`), and exact `ONE_TIME`/`MONTHLY` strings. Extra fields, privileged Stripe IDs, organization IDs, floats, strings, NaN/infinity, zero, negatives and excess values are rejected. The existing exact-cent display/parser retains compatibility; checkout enforces the narrower operational bounds in both UI and server.

The internal intent is committed before calling Stripe. A database row lock serializes checkout creation/retries; the bounded Stripe call uses a stable internal-donation idempotency key. The returned session is persisted before redirecting. Transport errors leave `CREATED`, because the remote creation outcome may be ambiguous. Retry with the same request/header reuses the intent and Stripe key; changed intent data returns 409. Intents older than 23 hours cannot be retried, preventing reuse after Stripe's minimum 24-hour idempotency retention. Use operator reconciliation before restarting an ambiguous old intent. The frontend keeps a key in component memory for identical retries; it does not persist donor intent in browser storage. Reloading begins a new intent.

Stripe SDK `23.0.1` is pinned, with API `2026-09-30.endive`. Stripe usage is isolated in `stripe-provider.ts`. This API uses `allowed_payment_method_types: ['card']`, intersected with the account's eligible methods. No ACH/bank method is enabled. Fixed server-generated `price_data` defines cents/currency and, for monthly gifts, `recurring.interval = month`. Subscription metadata carries the internal donation ID/context. Checkout metadata and `client_reference_id` carry the same internal ID. Redirect URLs are configured server-side, checked for matching origins/entrypoints and exact return routes, and receive only the separate public reference. Both server and frontend require a credential-free HTTPS `checkout.stripe.com/c/…` redirect.

## Verification and monthly semantics

`server.ts` registers the exact webhook route with `express.raw({type:'application/json',limit:'256kb'})` before the existing global `express.json()`. JSON parsing remains enabled everywhere it was previously enabled. Checkout has its own 2kb JSON limit. Stripe's official `constructEvent` verifies the raw buffer, signature and 300-second timestamp tolerance. Missing/invalid/stale signatures, Connect-account events and live/test mismatch are rejected before domain mutation.

Configure snapshot events with API version `2026-09-30.endive`:

- `checkout.session.completed`: a paid one-time session completes its gift; an unpaid session remains pending. A monthly session correlates the subscription and remains pending until a collection is verified.
- `checkout.session.async_payment_succeeded` / `checkout.session.async_payment_failed`: normalize delayed payment outcomes where relevant; only verified paid amounts can complete a gift.
- `checkout.session.expired`: cancels an unpaid intent. A browser cancel redirect alone never mutates payment state.
- `invoice.payment_succeeded`: confirms an automatically collected monthly invoice. Invoice `parent.subscription_details.metadata` identifies this context, with matching subscription reference, amount and currency. `invoice.paid` is deliberately not accepted as collection evidence because manually marked-paid invoices can emit it.
- `invoice.payment_failed`: records noncompletion before the first payment or a past-due recurring schedule after a previous payment. It does not erase historical paid gifts.
- `customer.subscription.deleted` / `customer.subscription.updated`: canceled subscriptions end future scheduling; subscription-active alone never establishes a paid gift.

Within one PostgreSQL transaction, row locking, reference/amount/currency/frequency/mode checks, event insertion, collection insertion and state update succeed together. Duplicate event IDs acknowledge with 200 without side effects. Separate events for the same collection also cannot duplicate collections. Invoice events may precede Checkout events. Late Checkout/failure/expiry events do not regress completed gifts. Recurring updates use processor time, prefer paid/canceled on equal-second delivery, and never reactivate a canceled subscription. Unknown or unrelated verified events return 200 `IGNORED`. Database failures return 503 so Stripe retries; known mismatches return 409 for operator review rather than silently accepting contradictory evidence.

Donation statuses are `CREATED`, `CHECKOUT_CREATED`, `PENDING`, `COMPLETED`, `FAILED`, `CANCELED`. For monthly gifts, `COMPLETED` means at least the first collection was verified, **not** that all future gifts are paid. Recurring state (`PENDING`, `ACTIVE`, `PAST_DUE`, `CANCELED`) is separate. Each subsequent verified invoice is a collection. Refunds/disputes are not implemented or represented as `REFUNDED`; historical completion is not a net-settlement accounting claim. Handle refunds/disputes in Stripe and reconcile operationally until a separately reviewed integration exists.

## Browser flow and truthful failures

The completed Donation layout, images, shared header/footer, presets, exact cents and native informational modal remain. A compact accessible One-time/Monthly radio group selects frequency. Give Now disables duplicate initiation, validates, calls the public backend and redirects only after a well-formed safe result. Failed network/provider/configuration/malformed responses retain a truthful informational fallback; there is no fake success. Navigation/browser capability failures also use that fallback.

`#/get-involved/success?donation=…` initially says “We are confirming your donation.” It reads durable public backend state and allows manual refresh. Only `COMPLETED` displays confirmation; monthly confirmation names the first gift and explains future collections. `#/get-involved/canceled` explains the return without asserting a completed gift and links back to giving. Cancellation does not write payment truth and can display a late verified success when an actual payment occurred. Contact SHF to cancel monthly gifts; subscription self-service, refund management and automated receipt/email delivery are outside this slice.

HTTP failures: invalid intent/header/JSON/signature 400; unknown status 404; intent/event conflict or closed checkout 409; oversized body 413; public quota 429; absent/invalid provider configuration, provider transport failure or persistence outage 503. Public messages and operational telemetry contain only safe reason/status codes, never raw Stripe errors, secrets or payment credentials.

## Configuration and sandbox runbook

Required server variables (never `VITE_` secrets):

```dotenv
STRIPE_SECRET_KEY=<SHF Stripe test or live secret key>
STRIPE_WEBHOOK_SECRET=<matching endpoint signing secret>
SHF_DONATION_SUCCESS_URL=https://your-foundation.example/foundation.html#/get-involved/success
SHF_DONATION_CANCEL_URL=https://your-foundation.example/foundation.html#/get-involved/canceled
DATABASE_URL=<canonical SHS PostgreSQL connection>
```

Use the already established frontend `VITE_SHS_API_BASE` / `window.__SHS_API_BASE__` or same-origin `/api` reverse proxy; `VITE_API_BASE` retains the existing override priority. No new public base variable is introduced. `shf.html` is also a valid configured entrypoint, provided success and cancel use the same one. Plain HTTP is accepted only for localhost/127.0.0.1 outside production. Missing or invalid Stripe/return configuration leaves donation initiation safely unavailable without preventing the informational page from rendering.

1. Have the owner configure the correct SHF Stripe account and test mode; do not use SHS commercial-account identity. Apply the migration through reviewed deployment to an isolated sandbox database first.
2. Supply the server variables through secret management. For local testing, use matching `http://127.0.0.1:5297/foundation.html#/get-involved/{success,canceled}` return URLs and the existing dev API proxy.
3. Register the backend HTTPS webhook path in Stripe, or use Stripe CLI forwarding to `localhost:8091/foundation/donations/webhook`. Through an API proxy, the public path includes `/api`. Use the endpoint/CLI signing secret that matches that listener, and configure the listed snapshot event types/API version.
4. Exercise one-time and monthly Stripe test-mode Checkout, decline, cancel, webhook delay/replay, invoice renewal/failure and subscription cancellation. Confirm the durable tables/status after server restart. Verify test/live isolation and operator reconciliation for mismatches/orphans.
5. Before live activation, complete SHF merchant/legal onboarding, bank/settlement verification, recurring consent/cancellation/contact terms, donor support and refund procedures, approved acknowledgment/receipt/tax language, retention/access policy, secret rotation, external HTTPS/proxy/rate controls, database backup/recovery, alerts for stuck CREATED/PENDING or failed deliveries, and real sandbox owner acceptance. No real credentials are committed.

## Audit / Truth boundary

The existing `audit_events` helper and Trusted Reporting `integration_outbox` require organization scope and approved producer semantics. They cannot truthfully receive anonymous donor ownership. This phase stores narrow verified processor evidence atomically with donation state, using existing PostgreSQL conventions; it creates no event bus and publishes no Truth, impact, grant, entitlement or public metric. A later Core/Integration-reviewed producer may bridge verified donation collections into financial reporting with an approved receiving-entity scope, privacy policy and correction/refund semantics. Donation success is not learner competency or community impact.

## Verification evidence

Tests use injected Stripe SDK session creation and actual SDK signature verification with explicitly synthetic fixture secrets. There is no mock switch in production. PostgreSQL tests use a dedicated local cluster, a fresh schema per run, and actual constraints, transactions and concurrent requests; they do not contact Stripe. React renderer development dependencies live in the API package so the unrelated dirty root package manifest is preserved.

Verification commands and final results are recorded in [PAYMENT_HANDOFF.md](PAYMENT_HANDOFF.md). No real Stripe credentials were available to the process; live/sandbox Stripe end-to-end acceptance has not been performed. Local fake-provider and signature tests are not real donations.

Sources: [Stripe Checkout API](https://docs.stripe.com/api/checkout/sessions/create), [webhook signature and delivery guidance](https://docs.stripe.com/events/manage-webhook-endpoints), [event types](https://docs.stripe.com/api/events/types), [invoice object](https://docs.stripe.com/api/invoices/object). Installed SDK declarations and pinned API version were checked alongside these references.
