# SHF Exchange Financial Authority Contract

## Purpose

This document is the authority contract for `surface.exchange.investor`. It
records the implemented minimum backend contract for Exchange to own a
funding fact and emit one narrowly scoped Trusted Reporting producer. It does
not establish transfer or settlement authority, downstream metrics beyond the
narrow historical commitment count, or reports.

## Current decision

The authorized canonical fact is an **Exchange Funding Commitment**: an
authorized organization formally commits a defined monetary amount in a
defined currency to a defined recipient, represented by the backend-owned
`exchange_funding_commitment` record.

This record proves commitment only. It does not prove transfer, bank
settlement, recipient receipt, investment performance, ROI, impact, outcome,
program success, or public benefit. `surface.exchange.investor` is now
`REPORTING_SERVICE_REQUIRED` because the historical commitment-count metric is
registered while Reporting Service exposure remains absent.

## Candidate fact evaluation

| Candidate | Decision | Reason |
| --- | --- | --- |
| Funding commitment | `CANONICAL_DOMAIN_CANDIDATE` | Authorized implementation in this slice; commitment remains distinct from transfer and settlement. |
| Allocation authorization | `SUPPORTING_OPERATIONAL_RECORD` | Allocation records describe pool capacity and operator actions, not the canonical commitment. |
| Funds transfer | `REQUIRES_EXTERNAL_FINANCIAL_AUTHORITY` | No payment rail or transfer proof is established by this record. |
| Settlement | `REQUIRES_EXTERNAL_FINANCIAL_AUTHORITY` | Settlement requires separate external financial evidence. |
| Investment record | `NOT_JUSTIFIED` | Investment performance and ownership semantics are outside this fact. |

These concepts must remain distinct. An allocation is not a commitment; a
commitment is not a transfer; a transfer is not settlement; and none of them
proves an outcome, ROI, or impact.

## Canonical record contract

The implemented record contains:

- server-generated `commitment_id`;
- server-derived `tenant_id`, `organization_id`, and actor;
- server-owned `created_by_user_id` and `committed_by_user_id` actor references;
- stable `recipient_organization_id`;
- positive integer `amount_minor` and explicit three-letter uppercase currency;
- server timestamps and optimistic `version`;
- lifecycle `DRAFT`, `COMMITTED`, or `CANCELLED`;
- durable PostgreSQL persistence, scope/recipient indexes, and audit.

The authenticated API is `POST/GET /exchange/funding-commitments`,
`GET/PUT /exchange/funding-commitments/:commitmentId`, and explicit
`POST .../:commitmentId/commit` and `/cancel` transitions. Mutation requires
`exchange.fundingCommitments.manage`; reads require
`exchange.fundingCommitments.view`.

## Monetary semantics

The authorized commitment record uses positive integer minor units and an
explicit three-letter uppercase currency. This establishes the stated
commitment amount only; it does not establish transfer or settlement. Future
financial authority must still prove:

1. whether the value is money;
2. the currency and integer minor-unit representation;
3. whether it is proposed, committed, authorized, transferred, or settled;
4. the source party and recipient party;
5. the effective timestamp;
6. cancellation and reversal behavior; and
7. what internal or external evidence proves the stated state.

Floating-point balances, mock dollars, forecast values, pool capacity, and
operator settlement labels are not sufficient.

## Lifecycle and correction

The implemented lifecycle names only states authorized for this workflow and
defines the actor, prerequisite, timestamp, audit action, and legal next state
for each transition. Destructive rewriting is prohibited: cancellation
preserves the original record, and a future reversal or correction must be
linked to the original with an auditable compensating record or version.

The legal transitions are `DRAFT → COMMITTED`, `DRAFT → CANCELLED`, and
`COMMITTED → CANCELLED`; `CANCELLED` is terminal. `committed_at` and
`cancelled_at` are server-owned. Only drafts can change amount, currency, or
recipient. Cancellation preserves the record and audit history.

## Authority boundaries

Oracle output, simulation, forecast, advisory allocation, and predicted ROI
may propose an action but cannot create or mutate canonical financial state,
establish Truth, or prove impact. Browser values and the current operator
JSON/in-memory stores remain noncanonical. Audit records remain distinct from
Trusted Reporting producer events.

The future financial record must not imply learner outcomes, jobs, community
impact, grant success, program success, ROI, or public eligibility.

## Producer contract

The implemented producer emits only on a successful `DRAFT → COMMITTED`
transition, in the same PostgreSQL transaction as the commitment update and
`funding_commitment.committed` audit action:

- producer: `shs.exchange`;
- event: `funding_commitment.committed`, schema `v1`;
- subject: canonical `commitment_id`;
- occurrence: server-controlled `committed_at`;
- idempotency: `exchange-funding-commitment:{commitment_id}:committed`;
- payload: commitment ID, recipient organization reference, integer
  `amount_minor`, currency, committed lifecycle, and version.

Creation, draft update, cancellation, Oracle recommendation, simulation, and
forecast do not emit this producer event. It must not claim transfer,
settlement, outcome, or impact. Authenticated Agent Fabric ingestion and the
narrow operational-to-Truth projection are now implemented. The registered
`exchange.funding.commitment_count.v1` metric counts distinct historical
commitments whose `funding_commitment_committed` claim entered `COMMITTED`, in
UTC windows, with verified first-party source and internal approval. Cancelled
commitments remain in this historical event count; a current-active metric
requires cancellation lineage. No committed-amount sum is authorized because
currencies may differ and no FX policy exists.

## Open decisions / blockers

- Reporting Service exposure for `exchange.funding.commitment_count.v1` remains
  outstanding; no report is authorized by this contract.
- Transfer and settlement require a separate external financial authority.
- Investment performance, ROI, impact, and public eligibility require separate
  domains and evidence.
