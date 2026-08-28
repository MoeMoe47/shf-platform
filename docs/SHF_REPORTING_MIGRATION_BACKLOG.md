# SHF Reporting Migration Backlog

## Priority 0: false institutional reporting and security

- Completed in Phase 9 Wave 1: removed production reachability of
  `shsReportSeedRecords` from SHS report lookup/storage paths and added safe
  empty states. Fabricated/seed-backed report output is not presented when no
  canonical record exists.
- Surfaces: `surface.shs.dashboard`, `surface.shs.export`,
  `surface.hub.imports`, `surface.iep.dashboard`, `surface.iep.command`.
- Completed in Phase 9 Wave 1: public Impact Command Center and Ohio map values
  are suppressed pending approved canonical Truth data. No replacement values
  were invented.
- Surfaces: `surface.impact.command`, `surface.impact.ohio`,
  `surface.exchange.public`.
- Remove development-token and browser-administrative-key paths from reporting
  authorization.

- Completed in Phase 9 Wave 1: targeted static Hub import KPIs, IEP command
  export, and Lord of Outcomes export are suppressed or disabled. IEP and
  Lord of Outcomes remain demo-only and are not canonical.

## Priority 1: browser-authoritative producers

- Wave 2 checkpoint: Hub referral ingestion, Truth projection, and isolated
  runtime connection from `apps/shs-api` to Agent Fabric are verified. The
  browser Truth fallback is removed; the surface remains noncanonical until its
  Reporting Service response is consumed by the frontend.
- Wave 2C checkpoint: fail-closed `service:shs-api` identity validation,
  producer/event binding, PostgreSQL outbox schema, transactional referral
  enqueue, and bounded dispatcher contract are implemented and tested. Deploy
  only after secret-manager configuration, migration execution, and managed
  dispatcher ownership are approved.
- Runtime-closure review: local isolated runtime proof is complete at
  `ISOLATED_DEV_RUNTIME_VERIFIED`. Production secret-provider configuration,
  migration execution, and managed dispatcher ownership remain deployment
  prerequisites; they do not block the local Reporting Service contract.

- Exchange workspace state: authenticated ingestion, evidence policy, and
  tenant-scoped report projection.
- Surfaces: `surface.exchange.investor`, `surface.hub.workspace`.
- Exchange Investor: the authorized backend-owned `exchange_funding_commitment`
  record now emits one minimized `shs.exchange` /
  `funding_commitment.committed` v1 event transactionally with the committed
  transition and audit. The `/exchange/investor` page remains a placeholder;
  authenticated ingestion, a narrow draft/unapproved/non-public
  Evidence/Source/Truth projection, and the historical distinct-count metric
  `exchange.funding.commitment_count.v1` and
  `report.exchange.funding.commitment_count.v1` now exist. The authenticated
  `/shf/reports/exchange.funding-commitment-count` endpoint exposes only that
  metric with existing source/approval eligibility rules. The surface is
  `FRONTEND_MIGRATION_REQUIRED`; one historical commitment-count field is now
  connected in `InvestorDashboard`; retain all other investor placeholders as
  noncanonical. Allocation, forecast, simulation, and Oracle advisory values
  remain noncanonical. Current-state commitment metrics require cancellation
  lineage; amount aggregation requires a currency/FX policy.
- Grant Binder authority, producer, and authenticated ingestion are complete for an operational event only: `/grant-binder` now reads backend-owned scoped `grant_binders` workspace records with server IDs/timestamps, draft lifecycle/version, and audit. Creation transactionally emits minimized `shs.grant_binder` / `grant_binder.created` v1 through the existing integration outbox; the trusted worker delivers it to Agent Fabric as one idempotent operational event. Browser logs remain operational UI history, not Evidence. Surface `surface.grant.binder` is `NOT_APPLICABLE` for current Trusted Reporting claims because workspace creation has no meaningful institutional assertion. A real submission/finalization lifecycle producer is required before reconsideration; do not create Evidence/Truth automatically.
- Surface: `surface.grant.binder`.
- Placement KPIs: real placement producer and denominator contract.
- Surface: `surface.placement.kpis`.
- Hub Reports: `Hub Referrals Created` now consumes the canonical referral
  report; readiness, Truth, audit, workflow, and export values remain
  operational/demo or unsupported and must not be treated as institutional.
- Remaining SHS report drafts/history/exports: backend-owned authorized
  persistence and migration preview. SHS history now reads scoped revisions
  from PostgreSQL through the authenticated draft API; it is operational
  history only, not a Trusted Reporting surface. Browser version mutation is
  no longer reachable from the canonical history route.
- Surfaces: `surface.hub.reports` (partial), `surface.shs.create`,
  `surface.shs.history` (operational history only).
- `surface.shs.create` backend authority established: `/ops/reports/create`
  now creates drafts through authenticated `POST /reporting/drafts`; IDs,
  timestamps, scope, actor, lifecycle, versions, revisions, and audit records
  are backend-owned. Trusted Reporting remains deferred: define a separate
  `lineage.shs.report.created.v1` now defines the operational-only
  backend-created-draft event and is atomically enqueued with the draft through
  the existing outbox. `report.saved`, `report.updated`, and
  `report.version_created` remain audit/version activity. Apply migration 008
  in an authorized environment and connect the event to authenticated Agent
  Fabric ingestion is now connected for the operational event. The event is
  intentionally operational-only: draft creation does not prove submission,
  approval, verification, readiness, completion, impact, or public eligibility.
  A distinct submitted/finalized lifecycle event is required before any
  institutional Evidence/Truth review.

## Priority 2: canonical Truth and metrics

- Assessment completion: complete evidence projection and define metrics only
  after approval and population contracts exist.
- Hub referral count: the canonical claim subject/predicate/time/evidence
  metadata contract and separately authorized internal claim approval are now
  implemented and tested. `hub.referral.created_count.v1` is exposed through
  `GET /shf/reports/hub.referral-created-count`; the `Referrals Created` field
  on `surface.hub.referrals` now consumes that endpoint. Lifecycle counts and
  completion/outcome metrics remain separate future work.
  Do not reuse `public_approved` for internal reporting and do not define
  completion, success, outcome, conversion, or rate metrics without additional
  producer events and a defensible population.
- Reflection submissions: remain evidence-only unless a reviewed metric need
  and privacy policy are approved.

## Priority 3: report surface migration

- Move curriculum progress, SHS reports, institutional PDF builders, and funder
  reports to the Reporting Service one surface at a time.
- Preserve demo/mock routes as demo; do not silently backfill them as Truth.
- Reviewed `surface.curriculum.lesson_completion`: the actual route is
  `/curriculum/lesson/:id` and the value is personal completion/sync status,
  not an institutional aggregate. No Reporting Service migration is required
  for this surface; retain its producer transport behavior and exclude it from
  institutional metric display.
- Reviewed `surface.assignments`: `/curriculum/asl/assignments` and
  `/assignments` render hardcoded placeholder open items and component-state
  completion movement. This is not a real assignment producer or institutional
  metric. Preserve navigation tests, but do not promote the values to Truth or
  Reporting Service; a future assignment producer and metric contract are
  prerequisites for any reporting use.
- Reviewed next candidate `surface.curriculum.progress` at `/curriculum`:
  `Lessons completed` already consumes the canonical lesson-completion report.
  Pathway completion, assignments due, credentials earned, streak, and
  attendance remain hardcoded, mock, personal, or operational values and are
  not eligible for reuse of the lesson metric. Separate producer and metric
  contracts are required before further migration.

## Explicit blockers

- No defensible lesson-completion denominator exists for a rate.
- Placement, public impact, employment, funding, and IEP outcomes lack the
  verified producer contracts required for canonical metrics.
- JSONL operational/evidence/report repositories remain development
  abstractions and are not approved production durability boundaries.
