# MET-9 Student Market + Treasury Integration

## Authority Reuse Map

- Identity/org/team authority: reused from auth middleware, organization context, memberships, role permissions, and `studio_team_members`.
- Treasury authority: PR-3 payment records exist for provider-neutral external payments, but no canonical durable SHF Credit balance/ledger exists. MET-9 therefore adds a bounded Treasury adapter and stores only Treasury refs on Market orders/refunds.
- MET-7 missions: reused through `mission_projection_id`/completion eligibility inputs; mission completion never mutates balances.
- MET-8 Opportunity Exchange: reused through `payment_intent_ref`; Opportunity awards remain non-employment and non-financial authority.
- NCA notifications: reused through `IntegrationOutboxRepo` and notification projection policies for market events.
- MET-6 communication: reused by policy. No marketplace DM, direct student DM, or new chat room model is created.
- Evidence/credential/career/civic authority: not reused for mutation. Market purchases can be operational facts only.

## Market/Treasury Split

Market owns listings, catalog presentation, orders, fulfillment, cancellation workflow, refund request workflow, and buyer/seller/admin experience.

Treasury owns SHF Credit balances, debit authorization, transfer execution, settlement refs, refund settlement refs, idempotency, and financial history. Market never calculates canonical balance from orders and never accepts client-supplied paid/refunded truth.

## Listing Model

Durable records are stored in `market_listings` with org/tenant scope, seller type/ref, title/summary/description, listing type, category, price type, amount, currency, quantity mode/available quantity, fulfillment type, visibility, optional district/facility/program/mission refs, status, review fields, and timestamps.

Supported listing types: digital product, service, project resource, program resource, arcade resource, event item, cosmetic item, city collectible, educational resource, simulated good.

Prohibited goods are blocked in service policy: grades, verified skills, credentials, certificates, civic authority, job/career eligibility, verified evidence, instructor approval, course completion, assessment outcome, legal entitlement, membership authority, and Work Passport capability.

## Seller Authority

Seller identity is server-derived. Student listings require a student role and use the actor user id. Team listings require canonical active team membership. Program, organization, and system sellers require admin/instructor/program authority. Student enterprise seller authority remains P1 for MET-12 because no canonical enterprise authority was found.

Student-created listings enter governed review. Admin/instructor-created listings can publish directly.

## Visibility

Visibility is explicit: private, program, organization, network, or city. Student-created listings are constrained to organization/program visibility unless an authorized reviewer/admin sets broader scope. Cross-org private listings fail closed.

## Orders And Snapshots

`market_orders` stores immutable listing, buyer, price, currency, seller, quantity, and fulfillment snapshots. Listing edits cannot alter existing orders.

Order statuses include pending payment, paid, accepted, in fulfillment, fulfilled, cancel requested, cancelled, refund requested, refunded, declined, and expired. Client code cannot mark paid/refunded or forge Treasury transaction refs.

## Payment Execution And Idempotency

Flow:

1. Buyer initiates order.
2. Market validates listing, visibility, quantity, price, currency, buyer, seller, and self-purchase policy.
3. Treasury authorizes debit.
4. Market atomically decrements limited quantity.
5. Market creates idempotent payment intent/order.
6. Treasury executes transfer.
7. Market records Treasury transaction ref and marks order paid.

Payment intent refs are deterministic from listing, buyer, and client idempotency key. Replay returns the existing order before touching quantity or Treasury. Duplicate Treasury calls return the existing transaction ref.

## Balance Handling

The UI calls `/metaverse/market/balance`; server delegates to Treasury. Client never sends balance or uses order history as balance authority.

## Inventory

Limited listings use an atomic SQL decrement guarded by available quantity. Unlimited listings have no quantity value. Negative quantity is blocked by schema and service validation.

## Fulfillment

Supported fulfillment types are digital delivery, in-platform service, project handoff, event access, program resource, and simulated good. Buyer self-fulfillment is blocked. Seller/admin fulfillment writes `market_fulfillments` and only then moves orders to fulfilled.

## Cancellation And Refunds

Pending-payment orders can cancel. Paid/accepted orders move to cancel requested, because refund policy may be required. Refund requests are market workflow; settlement requires Treasury. Order `REFUNDED` is set only after Treasury returns a refund ref. Duplicate refund settlement is blocked.

## Opportunity Compensation

MET-8 awards can settle compensation only when work is accepted and a MET-8 `payment_intent_ref` exists. The Opportunity Exchange remains non-employment and non-financial authority.

## Program And Side Mission Rewards

Mission reward settlement requires verified completion eligibility and calls Treasury. Program Mission and Side Mission completion itself never mutates balances.

## Education, Evidence, Reputation

Purchases do not alter assignment/course/lesson/assessment completion, verified evidence, credentials, career state, civic eligibility, or reputation. Fulfillment artifacts may later become evidence candidates only through canonical Evidence workflows. Full reputation scoring remains MET-10.

## Safety And Communication

No private address, personal phone, personal email, external payment details, unsafe direct contact, or unmoderated adult-student commerce is introduced. Fulfillment is in-platform/simulated/institutional. Marketplace DMs remain disabled; existing MET-6 rooms/support/team channels are the only communication path.

## Notifications

Market emits integration outbox events for listing review/publish, order paid, order fulfilled, and refund settled. NCA projects notifications from those events.

## Accessibility

The market panel is keyboard/screen-reader operable, uses semantic buttons/forms, clear price/balance labels, non-color-only status text, live status messages, and mobile bottom-sheet layout.

## Security

Controls include auth and active-org requirements, server-derived buyer/seller identities, listing ownership checks, allowed listing type enforcement, prohibited goods rejection, price/currency tamper rejection, visibility scoping, self-purchase denial, idempotent payment, atomic limited quantity, seller/admin fulfillment gates, refund settlement authority, duplicate refund blocking, no client balance fields, no client transaction refs, no marketplace DM, and no duplicate Treasury ledger.

## Persistence

Migration: `apps/shs-api/migrations/145_student_market.sql`.

Market tables: `market_listings`, `market_orders`, `market_fulfillments`, `market_refund_requests`, `market_listing_reviews`.

No Treasury ledger/balance tables were added.

## Browser Acceptance

Browser acceptance is P1 in this environment because no migrated local fixture was exercised with a running API/browser during this pass. Source-level frontend tests verify the panel uses real market APIs, not fake listings/counts, and build verification covers integration.

## P0/P1 Gaps

P0: none known in the implemented repository-local contract.

P1:

- Durable canonical SHF Credit Treasury ledger/balance persistence.
- Full student enterprise seller authority, expected MET-12.
- Advanced inventory reservations/backorders.
- External commerce, physical fulfillment, tax/legal commerce.
- Advanced dispute resolution.
- Full reputation/capability graph, expected MET-10.
- Rich browser acceptance with multi-user fixture data.
