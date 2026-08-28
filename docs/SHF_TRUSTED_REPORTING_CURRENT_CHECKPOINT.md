# SHF Trusted Reporting Current Checkpoint

## Program

Controlled rebuild of SHF Trusted Reporting.

## Current stage

Controlled next-surface selection after the Grant Binder operational-only review.
The first curriculum lesson-completion count slice is complete. The Hub referral
transport has been verified in an isolated local development runtime, and the
created-count field on the Hub referral surface consumes the canonical Reporting
Service.

## Last completed gate

The `Lessons completed` value in `LearningProgressCard` consumes the canonical
Reporting Service with pending/unavailable handling and no browser fallback.
Focused client tests and the existing Truth Spine, Evidence, ingestion, Metric
Registry, Reporting Service, Wave 1 safety, and census checks remain green.

The next requested surface, `surface.curriculum.lesson_completion`, was
verified at its actual route `/curriculum/lesson/:id`. It renders a personal
lesson-detail completion action and learner sync status through `LessonBody`;
it does not expose an institutional aggregate. Its browser state remains
personal UX/transport only and is explicitly excluded from canonical metric
consumption.

`surface.assignments` was then inspected at its actual curriculum and career
routes. `src/pages/Assignments.jsx` renders a hardcoded placeholder open list
and an ephemeral component-state completed list. It has no backend assignment
producer, no institutional persistence, and no valid metric/report contract.
It is recorded as `PERSONAL_UX_ONLY` / `NOT_APPLICABLE` for institutional
reporting; its placeholder values must not be promoted to Truth or metrics.

## Last reviewed surface: Hub referrals

`CaseService.createReferral()` persists the referral, audit event, and minimized
`hub.referral` / `referral.created` outbox event in one transaction. The
code-level dispatcher signs requests for `/shf/internal/ingestion/events`, and
Agent Fabric validates the service identity, producer/event binding, scope,
idempotency, Evidence, and draft/unapproved Truth projection.

Runtime status is now `ISOLATED_DEV_RUNTIME_VERIFIED`: a synthetic referral
was created through SHS API, persisted with its outbox row in an isolated
local PostgreSQL database, delivered by the trusted-reporting worker using a
local-only HMAC key, and accepted by Agent Fabric. The resulting operational
event, Evidence, unverified Source, and draft/unapproved/non-public Truth
claim were verified with one-record idempotent replay. The Hub intake browser
Truth fallback is now removed; the `Referrals Created` field on the Hub
referral lifecycle surface is now canonical through the authenticated
Reporting Service. Other lifecycle values remain operational or unavailable.

Isolated proof lineage: referral/case
`case_0125f704-fbef-4ab8-9c69-c8d20f87d456`; outbox
`outbox_d823d9db-c2fa-46ef-997e-aa188975beb3`; correlation
`corr_530a1ce1-87e8-44a9-baec-fc77866ee967`; operational event
`op_evt_f527c27ce9e840edb702dae2`; Evidence
`evd_85fc2880e352218e440af5ad`; Source
`src_a38692d84e52731d85953e61`; Truth claim
`claim_85fc2880e352218e440af5ad` version 1. These are synthetic local test
records only.

## Hub referral metric eligibility review

The Truth semantic prerequisite is now implemented generically. Persisted
`hub_referral_created` claims preserve `subject_id`, `predicate`,
`occurred_at`, `evidence_ids`, `source_ids`, `lineage_id`, producer/event
identity, tenant, organization, verification state, internal approval state,
public eligibility, and version/supersession fields. Projection remains
idempotent and does not approve or verify anything.

Truth Spine now exposes separately authorized `approve-internal` and
`revoke-internal` transitions. Internal approval requires a verified Source,
is limited to the SHS-admin approval role, is audited in append-only history,
and never changes `public_approved`. Service principals and cross-organization
actors cannot approve. The fail-closed internal eligibility predicate requires
canonical lineage metadata, verified Source state, internal approval, current
version, and scoped ownership.

The canonical versioned metric `hub.referral.created_count.v1` is now
implemented. It counts distinct current canonical referral `subject_id` values
for `hub_referral_created` / `referral_created` claims in an occurred-at UTC
window. Internal eligibility requires verified Source, internal approval,
complete lineage metadata, and scoped current claims. Public mode additionally
uses the canonical public-visibility predicate. No denominator exists.

The versioned report definition `hub.referral.created_count` (version 1) now
references that metric through `GET /shf/reports/hub.referral-created-count`.
The report service preserves metric and source/evidence lineage and fails
closed for unavailable data or public-ineligible results. The `Referrals
Created` field on the Hub frontend surface now consumes that endpoint with
fail-closed validation, preserved zero, and unavailable-state handling.
Operational lifecycle counts remain API projections; completion rate is
explicitly unavailable because no canonical completion metric exists.

## Grant Binder review

The initial `/grant-binder` audit found browser log authority in
`shf.adminToolLogs.v1` and `shf.civicMissionLogs.v1`; those logs remain
operational-only and are not backfilled. The bounded authority and producer
work is now complete: the page uses the scoped backend `grant_binders` workspace
for canonical identity/lifecycle, and creation emits one minimized
`shs.grant_binder` / `grant_binder.created` v1 event through the existing
transactional outbox. Browser duration/entry totals and exports remain
noncanonical UI history.

## Grant Binder authority contract review

The backend inventory contained reusable identity, audit, reporting-draft, and
trusted-reporting outbox infrastructure but no Grant Binder domain at the start
of this slice. The
minimal backend-owned `grant_binders` workspace is now implemented through
PostgreSQL migration `009_grant_binders.sql`, scoped authenticated routes,
server-owned identity/scope/timestamps, draft-only lifecycle, version checks,
and audit entries. `surface.grant.binder` later advances to
`NOT_APPLICABLE` for current Trusted Reporting claims after authenticated
operational-event ingestion.

The bounded prerequisite is documented in
`docs/SHF_GRANT_BINDER_BACKEND_AUTHORITY_CONTRACT.md`, which now records the
implemented workspace boundary: server-generated `binder_id`, server-derived
tenant/org/actor, server timestamps, backend draft lifecycle/version, and
audit. Browser activity totals, percentages, exports, and the
`grant.log.recorded` localStorage history remain operational legacy data and
are not eligible for backfill, Evidence, or Truth.

Candidate event review remains bounded: `grant_binder.created.v1` is the only
accepted producer event. It is emitted by `shs.grant_binder` after canonical
workspace creation, in the same transaction as the binder and audit rows via
the existing integration outbox. Its subject is the server-generated
`binder_id`; its payload is limited to binder ID, draft lifecycle, and version;
its idempotency key is `grant-binder:{binder_id}:created`. Update events remain
operational/audit activity, and no submission event is justified. The event is
now accepted by the existing authenticated Agent Fabric ingestion boundary as
one canonical operational event; Evidence, Truth, metrics, and Reporting
Service work remain absent.

Migration runtime status: the authorized isolated local `shs_dev` PostgreSQL
database was available and verified. Existing migration `007_integration_outbox.sql`
was also absent in that target and was applied as a non-destructive prerequisite;
then `009_grant_binders.sql` was applied and reapplied successfully. Verified
schema includes the Grant Binder primary key, scope indexes, draft-only check,
positive version constraint, timestamps, and the existing outbox uniqueness and
pending-delivery indexes. Synthetic runtime proof created, read, updated, and
cleanly removed a binder; stale version and cross-scope reads were rejected,
audit rows were written, and one minimized producer event was delivered by the
trusted-reporting worker to Agent Fabric. The operational event replay returned
the original event without duplication; invalid HMAC returned 401. No Evidence,
Source, Truth, metric, or report artifacts were created. No real data or
production database was changed. Runtime proof level is
`ISOLATED_DEV_RUNTIME_VERIFIED`. Projection review is declined for this
creation-only workflow because Truth Spine would duplicate ordinary workspace
and audit history; a real submission/finalization lifecycle event is required
before institutional projection is reconsidered.

## Grant Binder projection review

`grant_binder.created` proves only that a server-owned draft workspace exists.
The repository has no submission, finalization, award, funding, compliance, or
impact producer semantics. Projecting workspace existence into Evidence/Truth
would add no current institutional assertion beyond the canonical backend and
audit records, so the classification is `OPERATIONAL_EVENT_ONLY`. The lineage
entry remains authenticated and operational-only, with no Evidence projector,
Source, Truth claim, metric, or report ID. Browser logs remain noncanonical and
are not backfilled.

## Hub Reports review

The active route is `/hub/reports` in `AdminRoutes.jsx`, rendering
`src/pages/hub/HubReports.jsx`. Its `Hub Referrals Created` KPI now consumes
`GET /shf/reports/hub.referral-created-count` through the shared Hub reporting
client and validates the canonical report and metric IDs. The page's readiness,
Truth, audit, workflow, report-card, and export-history values remain
operational, browser-summary, static, or demonstration-only; a visible notice
separates them from canonical reporting. No new metric was created. The page
remains `REPORTING_SERVICE_REQUIRED` because its other institutional-looking
values lack canonical producer/Truth/metric contracts.

Potential metrics classify as follows:

- distinct referrals created: `IMPLEMENTED`, exposed through Reporting Service;
- referral completion/success/outcome/conversion/rate/time-to-completion:
  `REQUIRES_ADDITIONAL_PRODUCER_EVENT` and, for rates, `REQUIRES_DENOMINATOR`.

Semantic-contract verification: the focused Truth/referral/security suite
passed 59 tests; the integrated Truth, ingestion, Evidence, referral,
Metric Registry, Reporting Service, lineage, census, and migration suite
passed 128 tests. JSON, Python syntax, census/rebuild validators, secret-pattern
scan, and `git diff --check` passed. Tests used temporary isolated stores and
did not touch persistent Truth data.

Infrastructure checkpoint verification: focused SHS API outbox/worker tests
passed 10 tests; SHS API typecheck and build passed; local PostgreSQL 16
accepted migration `007_integration_outbox.sql`; Agent Fabric and SHS API ran
as separate local processes on ports 8092 and 8091; and the synthetic
cross-service handoff completed. Agent Fabric stores were redirected to
`/private/tmp/shf-trusted-reporting-runtime-20260825` and repository-local
Truth stores remained untouched.

The proof level is `ISOLATED_DEV_RUNTIME_VERIFIED`, not staging or production.
The HMAC key was deterministic local test configuration only. No production
secret reference was injected, no production database was migrated, and no
real participant data was used.

## SHS Create workflow review

The active route is `/ops/reports/create` in `AdminRoutes.jsx`, rendering
`src/pages/admin/reports/ShsCreateReportPage.jsx`. The page composes a draft
object from form state and readiness/template helpers, then calls the
authenticated backend draft client. The create/preview path no longer uses
`shsReportStorage.js` as canonical authority; that legacy module remains for
other SHS report consumers and is not a Trusted Reporting producer.

The backend reporting boundary at
`apps/shs-api/src/domain/reporting/routes.ts` owns draft creation, scoped
reads, and version-checked updates through PostgreSQL report draft and
revision repositories. Tenant, organization, actor, IDs, timestamps,
lifecycle, history, and audit records are server-owned. Readiness calculations
remain presentation/template checks, not canonical institutional metrics.

The backend-owned prerequisite is now implemented for the create/preview path.
`POST /reporting/drafts`, scoped GET routes, and version-checked PUT updates
use PostgreSQL `report_drafts` and `report_draft_revisions`, server-derived
tenant/organization/actor, server-generated IDs/timestamps, draft-only
lifecycle behavior, and existing audit records. `ShsCreateReportPage` and its
direct history/preview readers use the backend client and show save/read
failure states; `shsReportStorage.js` remains for legacy SHS report consumers
and is not canonical for this path.

The surface is now `BACKEND_OWNED_DRAFT_WORKFLOW` / `NOT_APPLICABLE` for
Trusted Reporting claims.
A narrowly scoped `report.created` producer contract is now defined and the
event is enqueued atomically with draft creation through the existing
integration outbox. The event is `OPERATIONAL_ONLY`: it records creation of a
canonical draft, contains no draft content, and does not create Evidence,
Truth, metrics, or reports. `report.saved`, `report.updated`, and
`report.version_created` remain audit/version activity and are not Trusted
Reporting events.

The authenticated Agent Fabric ingestion contract is now connected for this
operational event. It accepts only `shs.reporting` + `report.created` v1,
preserves server-derived scope and idempotency, and explicitly returns no
Evidence/Source/Truth projection. Migration 008 is code-ready but not applied
in the local environment.

## Next authorized task

Do not project `lineage.shs.report.created.v1`. A future review may define a
separate `report.submitted` or `report.finalized` producer event if the backend
workflow gains that lifecycle, but do not invent or implement it in this
slice.

## Next surface selection

The next remaining candidate review selected `surface.curriculum.progress` after
the following top-five ranking of noncanonical backlog entries:

1. `surface.curriculum.progress` — `/curriculum` / `CurriculumDashboard`;
   `Lessons completed` already has producer, ingestion, Evidence/Truth, metric,
   and Reporting Service lineage, while the remaining cards are partial and need
   separate semantic contracts.
2. `surface.shs.history` — `/ops/reports/history` /
   `ShsReportHistoryTable`; durable report history and Reporting Service exposure
   are missing, and the current source is legacy browser history storage.
3. `surface.hub.reports` — `/hub/reports` / `HubReports`; only the existing
   referral-created field is canonical, while readiness, outcome, audit,
   workflow, and export values lack canonical contracts.
4. `surface.exchange.investor` — `/exchange/investor` /
   `OutcomeMetricsPanel`; the current Exchange workspace state has no authenticated
   producer, Evidence path, or Truth contract.
5. `surface.institutional.pdf` — backend-generated institutional PDF builder;
   Oracle-adjacent inputs are advisory/noncanonical and report definitions must be
   migrated to canonical metrics.

The first candidate is selected because it has the shortest remaining trustworthy
path: one exact canonical field is already connected and the unresolved work can
be handled card-by-card without inventing a new producer domain or metric family.

The actual mounted route is `/curriculum/asl/dashboard` under the `/curriculum`
route shell, rendered by `CurriculumDashboard` and its progress, weekly,
assignment, wallet, pathway, and calendar section cards. The `Lessons completed` field
in `LearningProgressCard` already consumes the canonical
`curriculum.lesson.completion_count.v1` Reporting Service response. The same
surface also displays pathway completion, assignments due, credentials earned,
streak, and attendance values sourced from hardcoded or mock/personal state;
those values are not semantically equivalent to the existing lesson metric.

`CurrentPathwayCard` displays `CURRENT_PATHWAY.percentComplete = 68`. Its only
formula clamps that static value to the range 0-100 before rendering the progress
bar and label. It has no numerator, denominator, persistence, producer, backend
authority, learner record, or registered metric. The value is therefore classified
as `DEMO_ONLY`; it must not be treated as pathway, course, lesson, credential, or
career-readiness completion.

No additional migration was performed. The first missing canonical layer for the
remaining fields is semantic eligibility and, where institutional reporting is
intended, separate producer/population contracts. Specifically, the pathway
percentage and calendar/assignment content are static or demo values; assignments
due and streak are operational/personal values; attendance uses a mock injection;
credentials have no verified evidence contract; and wallet values are a separate
credit-domain display. None is equivalent to lesson completion. Do not map them
to lesson completion or invent denominators.

The selected surface remains `MIGRATE` with
`migration_slice_status=CANONICAL_REPORTING_SERVICE_CONNECTED`; no status change
was justified by this review. Its first bounded follow-up is to review one
remaining card at a time and either classify it as personal/operational/demo or
define an already-supported canonical producer and population contract.

The exact next bounded review is the next unresolved card in the dashboard, not a
metric implementation for `CurrentPathwayCard`. No pathway denominator or rate
contract is authorized.

## Credentials Earned review

`Credentials earned` is the fourth statistic rendered by
`src/pages/curriculum/sections/LearningProgressCard.jsx` on the mounted route
`/curriculum/asl/dashboard`. It renders the static `PROGRESS.credentialsEarned =
8` value. There is no curriculum credential API, persisted credential record,
credential issuance authority, learner credential subject, issuance timestamp,
revocation state, or producer adapter connected to this field.

The repository contains a separate operator contract-issuance service and a
generic `credential.earned` operational-event allowlist, but neither is a
curriculum credential contract or a source for this dashboard value. Therefore
the field is classified `DEMO_ONLY`, not `CANONICAL_EXISTING_METRIC` or
`PERSONAL_CREDENTIAL_UX`. It has no canonical lineage beyond the static UI.

No migration was performed. A future institutional credential count would first
require a real backend credential issuance record and producer contract with
server-owned credential subject, issuer, scope, issue time, and status/revocation
semantics; no such contract is authorized here.

## Streak review

The curriculum dashboard renders Streak in two places: `LearningProgressCard`
renders `PROGRESS.streakDays = 12` as `Day streak`, and `WeeklySummaryCard`
renders `readMock("__mockStreakDays", 12)` as `Streak`. Neither component imports
or reads the shared streak engine. These displayed values are therefore static or
mock dashboard data, not a persisted learner streak record.

The separate `src/shared/engagement/streaks.js` engine is browser-local: it stores
`eng:streak:count` and `eng:streak:lastAt` in localStorage, treats one touch per
browser local calendar day as activity, increments only when the previous local
day was touched, and resets to 1 after a gap. It has no backend persistence,
server-derived learner identity, tenant/org scope, or curriculum producer event.

The dashboard Streak field is classified `DEMO_ONLY`, and the underlying engine is
personal gamification UX only. It is not equivalent to lesson completion,
attendance, engagement, participation, persistence, or student success. No
Trusted Reporting migration or streak metric is justified.

## Attendance review

The curriculum dashboard renders Attendance in `WeeklySummaryCard` at
`/curriculum/asl/dashboard`. It reads `window.__mockAttendancePct` through the
generic `readMock` helper and falls back to the hardcoded `86`, rendering that
number with a percent sign. There is no numerator, denominator, expected-session
population, attendance unit, learner/program/session relationship, backend
attendance record, server identity/scope, correction model, or attendance
producer in this dashboard path.

The separate registry entry `surface.attendance` is also producer-missing, and
repository searches found no curriculum attendance/session/enrollment contract
that could supply this field. The value is classified `DEMO_ONLY`; it is not
equivalent to lesson completion, logged-in days, engagement, participation, or
institutional attendance. No attendance metric, denominator, Evidence, or Truth
integration is justified.

## Wallet & Rewards review

`WalletRewardsCard` is rendered by `CurriculumDashboard` at
`/curriculum/asl/dashboard`. It displays `240 SHF credits`, `120 Corn`, and
`75 Wheat` from the component's `FALLBACK_WALLET` because the current
`CreditProvider` context does not expose a `balances` field. The provider stores
credit events in localStorage under `shf:credit:events` and makes a best-effort
client request to `/api/credit/events`; this does not establish an authoritative
wallet or transaction ledger for the dashboard.

The labels describe application credits/tokens as implemented, not money, wages,
grants, scholarship funds, or financial aid. No server-owned wallet identity,
learner/tenant scope, issuance or redemption authority, transaction history,
correction semantics, producer event, Evidence, Truth, or registered metric is
connected to this card. The separate wallet page's conversion UI does not make
these dashboard fallback balances institutional financial data.

The field is classified `DEMO_ONLY` with personal gamification/wallet UX context.
It must not be reused for lesson completion or promoted to institutional,
funder, grant, impact, or financial reporting. No migration or wallet metric is
justified.

## Curriculum calendar / assignment-marker review

`CurriculumCalendar` is mounted by `CurriculumDashboard` at
`/curriculum/asl/dashboard`. It renders date-only dots for August 2026 on days
`5, 7, 14, 21, 24, 28, 31`; the accessible label says only `has an assignment`.
The markers come from the component-local `MOCK_EVENT_DAYS` constant and are
selected by month/day lookup. The calendar's selected date and month navigation
are component state only.

There is no assignment ID, learner, course/pathway relationship, due timestamp,
assigned timestamp, status, instructor/issuer, tenant/org scope, persistence,
backend calendar/assignment API, or producer event. The marker source is also
distinct from `src/pages/Assignments.jsx`, whose open list is separately
hardcoded placeholder data with ephemeral completion state.

The calendar markers are therefore classified `DEMO_ONLY` (the surrounding
interaction is personal scheduling UX). They do not establish institutional
assignments, workload, compliance, attendance, or completion backlog and have no
canonical Evidence, Truth, metric, or Reporting Service lineage. No migration or
calendar/assignment metric is justified.

## Next surface selection: SHS report history

The next bounded candidate selected is `surface.shs.history`. The actual route is
`/ops/reports/history`, protected by the existing reports-view permission and
rendered by `src/pages/admin/reports/ShsReportHistoryPage.jsx` with
`ShsReportHistoryTable`.

Top remaining candidates were ranked by current lineage depth and shortest safe
path: `surface.shs.history` first (authenticated backend draft listing and
PostgreSQL draft/revision authority exist, but canonical history exposure is
missing); `surface.hub.reports` second (one canonical referral field, remaining
values unsupported); `surface.exchange.investor` third (workspace state without
producer or Evidence); `surface.institutional.pdf` fourth (Oracle-adjacent
builder inputs without canonical metrics); and `surface.funder.report` fifth
(builder aggregation without funder metric definitions).

For SHS history, the page reads current backend `report_drafts` through
`GET /reporting/drafts`, so draft identity, scope, and version are backend-owned
for that read. The backend now exposes safe `report_draft_revisions` metadata
through the scoped revisions endpoint, and the table no longer invokes the
legacy `shsReportStorage.createReportVersion` mutation. The legacy locked/exported
duplicate action is not recreated because backend reports have a draft-only
lifecycle and no canonical lock/approval contract. The creation producer
`lineage.shs.report.created.v1` remains authenticated operational-only, with no
Evidence, Truth, metric, or Reporting Service report contract.

The durable report-history contract is complete for the actual backend workflow:
server-owned revision retrieval is deterministic, scope-filtered, and content
minimized; history failures do not fall back to localStorage. No draft/history
value was promoted to Truth or a metric. The surface is now
`OPERATIONAL_HISTORY_ONLY` / `NOT_APPLICABLE` for Trusted Reporting claims;
legacy deletion remains gated.

## Current blockers

- Agent Fabric operational, Evidence, and Truth stores remain JSONL development
  abstractions, not approved production durability.
- Production deployment still requires an approved secret-provider injection,
  production PostgreSQL migration, and managed worker scheduling; these were
  not claimed by the local proof.
- SHS `report.created` authenticated operational ingestion is connected and
  tested through Agent Fabric; local PostgreSQL is unavailable and migration
  008 is unapplied locally, so SHS API outbox-to-worker runtime delivery is
  not independently re-proven in this task.
- Hub referral reporting now has a canonical metric, Reporting Service mapping,
  and canonical `Referrals Created` frontend field. The browser intake fallback
  is removed, while shared Truth adapters remain for other Hub readers pending
  their own migrations. Remaining lifecycle metrics are not canonical.
- Missing producer domains remain missing; do not invent attendance, placement,
  employment, public-impact, funding, IEP, or completion-rate denominators.

## SHS report history backend authority

The `/ops/reports/history` route renders `ShsReportHistoryPage.jsx` and
`ShsReportHistoryTable.jsx`. The page now loads report drafts through the
authenticated `GET /reporting/drafts` contract and loads each report's safe,
scope-filtered revision metadata through
`GET /reporting/drafts/:reportId/revisions`. Revisions are read from
`report_draft_revisions`, ordered by version and server timestamp, and expose
report/revision identity, version, actor, scope, and timestamp without
returning snapshot content.

The table no longer imports or invokes `shsReportStorage.createReportVersion`.
The legacy locked/exported duplicate action belonged to browser records and
has no equivalent in the backend draft-only lifecycle; it is not recreated by
inventing a new lock or approval state. Backend history failures show the
existing unavailable state and never fall back to localStorage history.

This surface is classified `OPERATIONAL_HISTORY_ONLY` and its registry status
is `NOT_APPLICABLE` for current Trusted Reporting claims. Report draft and
revision history proves workflow persistence/version activity, not a Truth
claim, institutional metric, or Reporting Service report. The shared
`shsReportStorage.js` remains in place for other callers; no deletion
eligibility changed. The next task is a separate review of any remaining
SHS report/export surface that has an actual institutional reporting need.

## Current next-surface selection: Exchange Investor

The next unresolved surface selected is `surface.exchange.investor`. The top
five remaining candidates were ranked by actual runtime lineage and shortest
trustworthy path:

1. `surface.hub.reports` — `/hub/reports` / `HubReports`; one referral-created
   field is canonical, but remaining readiness, outcome, audit, workflow, and
   export values lack separate contracts. Partial migration only; no referral
   slice is reopened.
2. `surface.exchange.investor` — `/exchange/investor` /
   `InvestorDashboard`; the mounted route is a placeholder with no KPI data,
   backend record, producer, ingestion, Evidence, Truth, metric, or report.
3. `surface.funder.report` — backend `funder_report.py`; builder output uses
   Oracle-adjacent/advisory inputs and defaults, with no canonical metric or
   report definitions.
4. `surface.institutional.pdf` — backend institutional builder; it renders
   advisory builder inputs and snapshot defaults without canonical metric
   lineage or Reporting Service support.
5. `surface.impact.command` — `/foundation/impact` /
   `SHFImpactCommandCenter`; public/internal impact values remain static or
   Oracle-adjacent with no verified Source, approved Truth, or public predicate.

The selected Exchange Investor surface is not being treated as an existing
outcome report. `src/routes/exchangeRoutes.jsx` mounts
`src/pages/exchange/InvestorDashboard.jsx`, which displays only placeholder
copy describing future pool performance, capital deployment, verified outcomes,
rankings, risk monitoring, and allocation controls. The registry's
`OutcomeMetricsPanel.jsx` is not mounted and currently returns `null`.

Its current lineage depth is zero. The first missing canonical layer is a
backend-owned, scoped outcome business record and an authenticated producer
contract. No producer, population, event semantics, ingestion, Evidence,
Truth, metric, or Reporting Service contract exists for the mounted route.
The surface is therefore recorded as `PRODUCER_REQUIRED`; no implementation
was performed. Investor-facing outcome values must not be invented from
Exchange workspace state, browser storage, simulations, Oracle advisory data,
or placeholder copy.

Impact Center/public candidates were explicitly checked and remain below this
candidate: their current values are static or unproven, with missing provenance,
Source verification, Truth approval, and public eligibility. Nothing was
unsuppressed. No legacy deletion eligibility changed.

The exact next authorized task is to define and review the smallest legitimate
backend Exchange Investor outcome record/population and producer contract.
Do not create metrics or Reporting Service contracts until that semantic
prerequisite is established.

## Exchange Investor authority review

The mounted `/exchange/investor` route is `ExchangeRoutes` →
`InvestorDashboard.jsx`. Its UI contains only placeholder copy describing
future pool performance, capital deployment, verified outcomes, rankings, risk
monitoring, and allocation controls. `OutcomeMetricsPanel.jsx` and the other
investor KPI components are not mounted; the investor hook returns `data: null`
and the investor API resolves an empty item list.

Repository-adjacent allocation and treasury services are not a reusable
canonical investment domain. They persist JSON files, accept caller-supplied
operator identity, lack tenant/organization scope and authenticated investor
ownership, and emit generic operator events. They do not establish whether
capital is pledged, committed, transferred, reserved, settled, reversed, or
owned by an investor. Oracle/advisory and simulation values likewise remain
noncanonical and cannot establish outcomes, ROI, impact, or financial truth.

No canonical investor business object, population, producer, ingestion,
Evidence, Truth, metric, or Reporting Service contract was identified. The
surface remains `PRODUCER_REQUIRED`. The exact prerequisite is a separately
authorized review of a real backend-owned investment/funding population and
its lifecycle before any producer event is designed. No reporting or public
surface was changed.

## Exchange Investor backend authority decision

The authorized authority review found no canonical Exchange investment or
funding population. The mounted `/exchange/investor` route remains a
placeholder and has no runtime investor values. Adjacent allocation,
treasury, contract, and capital-action services are operator tooling backed
by JSON files or in-memory state; their caller-supplied actors, missing
tenant/organization ownership, and absent payer/recipient/currency and
reversal semantics prevent reuse as institutional financial authority.

The repository therefore does not currently justify an
`exchange_investment`, `exchange_funding_commitment`, or
`exchange_allocation_authorization` record. `committed_amount`,
`allocated_capital`, `settled_amount`, and contract `currency` fields are
operational inputs/state, not proof of a real-money commitment, transfer, or
settlement. Oracle, simulation, forecast, and advisory outputs remain outside
the Truth Spine and cannot establish financial truth, ROI, impact, or outcome.

Candidate events were reviewed without implementation: an investment-created
event requires a canonical investment record; a funding-commitment event
requires explicit pledge/commitment authority; and allocation-authorized or
settlement events remain operational until ownership, counterparty, monetary,
reversal, and audit semantics are established. No producer, metric, Evidence,
Truth, Reporting Service, or frontend change was made. The surface remains
`PRODUCER_REQUIRED`; the next authorized prerequisite is a separately approved
Exchange financial domain contract, including the real-money/business-fact
boundary and server-owned tenant/org/actor authority.

## Exchange Investor financial authority contract review

The repository-grounded contract review found no currently selectable
canonical Exchange financial fact. Funding commitment and investment record
are not justified because no authorized investor/counterparty workflow,
durable record, lifecycle, or correction contract exists. Allocation
authorization remains a supporting operator record. Funds transfer and
settlement require external financial authority that the repository does not
provide. These concepts remain distinct and none may be inferred from pool
balances, allocation capacity, contract `currency`, operator settlement labels,
Oracle output, forecasts, simulations, or advisory allocation.

The minimum future contract is documented in
`docs/SHF_EXCHANGE_FINANCIAL_AUTHORITY_CONTRACT.md`. It requires an explicit
business decision selecting one fact, server-owned ID/scope/actor/timestamps,
validated investor and recipient relationships, durable PostgreSQL
persistence, explicit monetary representation, lifecycle and
cancellation/reversal semantics, and audit before producer design. No
financial domain, producer, ingestion, Evidence, Truth, metric, Reporting
Service, or frontend change was made. `surface.exchange.investor` remains
`PRODUCER_REQUIRED`.

The exact next authorized task is to obtain the business decision and then
implement only the selected backend authority contract.

## Exchange Funding Commitment backend authority

The authorized business decision selected `EXCHANGE FUNDING COMMITMENT` as the
first canonical Exchange fact. The backend-owned
`exchange_funding_commitments` PostgreSQL record now stores a server-generated
ID, server-derived tenant/org/actor, server-owned creator and commit actor,
stable recipient organization, positive
integer minor-unit amount, explicit currency, version, timestamps, and the
minimal `DRAFT → COMMITTED/CANCELLED` lifecycle. Only drafts are editable;
commit and cancellation timestamps are server-owned, cancellation is
terminal, and all create/update/commit/cancel actions use the existing audit
infrastructure.

Authenticated routes use dedicated view/manage permissions and ignore client
ownership, actor, ID, timestamp, version, and lifecycle authority. Runtime
proof in isolated local `shs_dev` created, updated, committed, stale-rejected,
retrieved, and cancelled one synthetic commitment; audit actions were verified
and the synthetic row/history were removed afterward. PostgreSQL 16 was
reachable and migration `010_exchange_funding_commitments.sql` applied.

This proves commitment only. It does not prove transfer, settlement, receipt,
investment performance, ROI, impact, outcome, or public benefit. No outbox,
Trusted Reporting ingestion, Evidence, Truth, metric, report, or
InvestorDashboard change was made. The narrow transactional
`shs.exchange` / `funding_commitment.committed` v1 producer is now verified;
`surface.exchange.investor` is `INGESTION_REQUIRED` and the next authorized
task is authenticated ingestion for that exact binding.

## Exchange Funding Commitment producer

The `DRAFT → COMMITTED` transition now writes the commitment update,
`funding_commitment.committed` audit action, and one minimized
`shs.exchange` / `funding_commitment.committed` v1 event to the existing
PostgreSQL `integration_outbox` in one transaction. The event subject is the
server-generated `commitment_id`; tenant, organization, actor, amount in
integer minor units, currency, lifecycle, version, and occurrence time derive
from the canonical record and server-controlled commit transition. Its
deterministic idempotency key is
`exchange-funding-commitment:{commitment_id}:committed`.

Isolated `shs_dev` runtime proof created and committed synthetic data, verified
one `PENDING` outbox row, matching `committed_at` and commit actor, audit
actions, and safe repeat rejection; synthetic database rows were cleaned.
The existing trusted-reporting worker then delivered the event to local Agent
Fabric, which accepted one operational event
(`op_evt_21e16bb3868a3b2cc19dd0ae`) and marked outbox
`outbox_2d84f940-6646-489c-82a1-b924a2826018` `DELIVERED`; the synthetic
operational store was cleaned afterward. Creation, draft update, cancellation,
Oracle/advisory paths, and unsupported transfer or impact facts emit no event.
Agent Fabric returned 401 for a missing/invalid HMAC. The event now has a
narrow generic projection: one minimized Evidence record, one unverified
first-party Source, and one historical `funding_commitment_committed` Truth
claim, initially draft, not internally approved, and non-public. Projection
replay is idempotent. The historical metric
`exchange.funding.commitment_count.v1` is now registered and tested: it counts
distinct eligible commitment-created Truth subjects in UTC windows, requiring
verified first-party Source and internal Truth approval. Valid evaluated empty
populations return zero; missing eligibility data fails closed. A later
cancellation does not erase this historical event fact, so cancelled
commitments remain in this historical count. No current-active metric exists
because cancellation lineage is absent. No committed-amount sum is authorized
because currencies may differ and no FX policy exists. No metric report or
InvestorDashboard change was made. `surface.exchange.investor` is now
`REPORTING_SERVICE_REQUIRED`.

The exact next authorized task is to expose only
`exchange.funding.commitment_count.v1` through Reporting Service, preserving
the commitment-only boundary and not inferring transfer or settlement.

## Exchange Funding Commitment Reporting Service

The registered report `report.exchange.funding.commitment_count.v1` now binds
only to `exchange.funding.commitment_count.v1`; formula authority remains in
the Metric Registry. Authenticated `GET
/shf/reports/exchange.funding-commitment-count` derives organization scope from
the authenticated actor, preserves verified Source and internal Truth approval
requirements, returns valid zero only for an evaluated empty population, and
fails closed when eligibility is unavailable. Public mode is not authorized
for commitment data. No amount, current-state, transfer, settlement, ROI, or
impact report was added. `surface.exchange.investor` is now
`FRONTEND_MIGRATION_REQUIRED`; `InvestorDashboard` remains unchanged.

The exact next authorized task is to migrate one explicitly authorized
InvestorDashboard field to this historical commitment-count report without
adding frontend formulas or implying transfer or settlement.

## Exchange Investor frontend migration

`InvestorDashboard` at `/exchange/investor` now renders one canonical
`Funding Commitments` field from the authenticated
`/shf/reports/exchange.funding-commitment-count` client. The value is the
historical count of distinct commitments that entered `COMMITTED`; loading,
valid zero, unavailable, malformed, authorization, and network states remain
explicit and no browser, mock, Truth, Evidence, amount, active-state, transfer,
settlement, ROI, or impact fallback exists. The dashboard's remaining investor
language is placeholder/navigation content and was not promoted. The surface
is `PARTIAL_CANONICAL`; no deletion eligibility changed.

The exact next authorized task is a separate review of whether any remaining
InvestorDashboard placeholder warrants an independently justified canonical
contract. Do not invent a current-state or monetary metric.

## Exchange Investor remaining-content review

The only remaining mounted content on `InvestorDashboard` is the future-tense
placeholder copy naming pool performance, capital deployment, verified
outcomes, rankings, risk monitoring, and allocation controls. It renders no
additional KPI, statistic, outcome, financial, portfolio, or impact value and
has no independent backend source, producer, Evidence, Truth, Metric Registry,
or Reporting Service contract. Each item is classified
`PLACEHOLDER_COPY_ONLY`; none is a candidate for migration. The existing
`Funding Commitments` field remains the sole canonical reporting field, and
the surface remains `PARTIAL_CANONICAL`.

The exact next authorized task is to review another unresolved Trusted
Reporting surface; do not create additional Exchange Investor contracts from
placeholder copy.

## Next Trusted Reporting surface selection

The remaining noncanonical surfaces were ranked from the current registry:

1. `surface.hub.reports` — `/hub/reports`,
   `src/pages/hub/HubReports.jsx`. Hub Referrals Created already reaches the
   canonical report; remaining readiness, Truth, audit, workflow, report-card,
   and export values are browser-summary, operational, demo, or unsupported.
   First missing layer for each remaining field is an independently justified
   producer/semantic contract. Estimated depth: one review plus any separate
   field contracts.
2. `surface.reports.briefings` — `/foundation/impact`,
   `ReportsBriefingsPanel.jsx`. Page-local briefing/report selectors have no
   backend authority, producer, Truth, metric, or report. First missing layer:
   canonical producer and metric definitions. Estimated depth: multi-layer.
3. `surface.institutional.pdf` — backend-generated institutional builder,
   `fabric/reports/institutional/builder.py`. Builder and Oracle-adjacent
   inputs have no canonical metric lineage. First missing layer: canonical
   metric/report composition; Oracle remains advisory. Estimated depth:
   multi-layer.
4. `surface.funder.report` — backend-generated
   `fabric/reports/funder_report.py`. Funder aggregation has no canonical
   producer, Truth, metric, or Reporting Service binding. First missing layer:
   metric definitions. Estimated depth: multi-layer.
5. `surface.impact.command` — `/foundation/impact`,
   `SHFImpactCommandCenter.jsx`. Static/page-local impact values have no real
   producer, provenance, verified Source, approved Truth, metric, or report.
   First missing layer: producer/provenance. Estimated depth: full public
   lineage and approval chain.

`surface.hub.reports` is selected because it is closest to closure: one
canonical field is already connected and the remaining values have already
been bounded as noncanonical. No additional Hub metric is justified by this
ranking. Public Impact surfaces remain non-actionable: current static or mock
values lack canonical Source verification, Truth approval, explicit public
eligibility, and Reporting Service readiness. No public data was unsuppressed.

The exact next authorized task is a review of only the remaining
`surface.hub.reports` fields, stopping at their first missing canonical layer;
do not reopen the Hub Referrals Created chain.

## Next Trusted Reporting surface selection: Reports & Briefings

The next unresolved surface review selected `surface.reports.briefings` after
ranking the current noncanonical candidates:

1. `surface.reports.briefings` — `/foundation/impact`,
   `src/pages/shf-command/sections/ReportsBriefingsPanel.jsx`. The panel is a
   renderer over static `EXPORT_ITEMS` supplied by the Impact Command Center;
   no backend authority, producer, ingestion, Operational Event, Evidence,
   Source, Truth, Metric Registry definition, or Reporting Service contract is
   present. First missing layer: canonical impact/report population and
   producer. Estimated depth: multi-layer.
2. `surface.institutional.pdf` — backend builder at
   `services/shf-agent-fabric/fabric/reports/institutional/builder.py`. It
   renders Oracle-adjacent payloads and fallback KPI/target/trend values; no
   canonical metric lineage is attached. First missing layer: canonical metric
   composition. Estimated depth: multi-layer.
3. `surface.funder.report` — backend builder at
   `services/shf-agent-fabric/fabric/reports/funder_report.py`. It reuses LOO/
   AAL and report inputs without a canonical funding/outcome population,
   producer, Truth, metric, or Reporting Service binding. First missing layer:
   canonical metric definitions. Estimated depth: multi-layer.
4. `surface.hub.workspace` — `/hub`,
   `src/pages/hub/HubWorkspaceDashboard.jsx`. Browser/localStorage workspace
   state and adaptive workflow signals have no canonical producer or
   institutional population. First missing layer: producer contract.
   Estimated depth: multi-layer.
5. `surface.placement.kpis` — `/admin/placement-kpis`,
   `src/pages/admin/PlacementKPIs.jsx`. `shf:metrics:v1` localStorage counters
   and seven-day browser calculations have no placement outcome population,
   producer, or denominator. First missing layer: backend placement producer
   and population/denominator contract. Estimated depth: multi-layer.

`surface.reports.briefings` is selected because it is explicitly marked
`REPORTING_SERVICE_REQUIRED` and is the nearest report-surface candidate, but
repository evidence does not make it safe for a bounded implementation. Its
displayed values are static presentation inputs: `Board Brief`, `Grant
Narrative`, `Donor Summary`, `Public Impact Snapshot`, and `Program Health
Memo`. The Impact Command Center also sets `REPORTING_DATA_AVAILABLE = false`
for its suppressed impact mode, while Oracle calls remain advisory and do not
establish canonical Truth.

Public Impact surfaces are not actionable: the Impact Command Center and Ohio
map lack canonical producer provenance, verified Source, approved Truth,
explicit public eligibility, and Reporting Service readiness. No public data
was unsuppressed. No code or registry status was advanced in this selection
pass.

The exact next authorized task is to define or verify the canonical impact
business population and producer for `surface.reports.briefings`; do not bind
the static selectors to Reporting Service and do not promote Oracle or static
values into institutional reporting.

## Verified outcome authority review

The strongest existing outcome-shaped candidate is the Agent Fabric
`/api/v1/outcomes/submit` workflow with `participant_id`, `program_id`,
`outcome_type`, artifact references, and an evidence hash. Its current
`JOB_90D` submission is not an institutionally canonical employment outcome:
the store uses SQLite fallback persistence, tenant/org/actor authority is not
established, and the MVP verifier accepts submissions without a governed
employment or external-verification policy. It proves receipt of an outcome
submission payload only.

Referral creation, lesson completion, and funding commitment remain activity or
process facts and are not relabeled as service or workforce outcomes. Placement
KPI counters, Career proof props, Lord of Outcomes mock data, and Oracle
recommendations remain noncanonical. No generic Impact Record, producer,
Evidence, Truth, metric, report, or public projection was created.

The authority contract is documented in
`docs/SHF_VERIFIED_OUTCOME_AUTHORITY_CONTRACT.md`. The exact next authorized
task is to harden backend authority for one explicitly selected employment fact,
decide whether `JOB_90D` means employment start or retention, and establish the
authoritative verifier before reviewing a producer event. `surface.reports.briefings`
remains `PRODUCER_REQUIRED`.

## Canonical documents

- `docs/SHF_TRUSTED_REPORTING_TARGET_ARCHITECTURE.md`
- `docs/SHF_TRUSTED_REPORTING_REBUILD_REGISTRY.v1.json`
- `docs/SHF_TRUSTED_REPORTING_DEMOLITION_MAP.md`
- `docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json`
- `docs/SHF_REPORTING_LINEAGE_MATRIX.md`
- `docs/SHF_REPORTING_MIGRATION_BACKLOG.md`
- `services/shf-agent-fabric/docs/reporting/SHF_TRUSTED_REPORTING_IMPLEMENTATION_STATUS.md`

## Baseline

- Reporting census: 30 surfaces, zero unresolved.
- Integrated Agent Fabric reporting/security subset: 102 passed.
- SHS API outbox/dispatcher tests: 5 passed.
- Wave 1 safety and curriculum tests: 5 passed.
- Local isolated migrations 007 and 009 were applied only to `shs_dev`; no
  production migration, deployment, commit, staging, or real-data mutation.

## Forbidden work at this checkpoint

Do not mass-migrate surfaces, create missing producer domains, expand metric
families, delete legacy paths, run production migrations, deploy credentials, or declare
any frontend surface canonical without a complete tested vertical slice.

## Completion criteria

The rebuild program is complete only when canonical lineage covers every
production number, public eligibility is enforced, browser authority is gone,
legacy code is deleted only after replacement proof, demo data is quarantined,
and repository validation finds no known forbidden legacy path.

## Hub Reports remaining-field review

`surface.hub.reports` remains `PARTIAL_CANONICAL` / `REPORTING_SERVICE_REQUIRED`.
The existing `Hub Referrals Created` field was not changed and remains the only
canonical field on `/hub/reports`.

The remaining rendered fields were traced in `src/pages/hub/HubReports.jsx`:

| Field/group | Actual source and meaning | Classification | First missing layer |
| --- | --- | --- | --- |
| Reporting Readiness rail (`87%`, `On track`, `FY24 Q2 ... due in 18 days`) | Hardcoded presentation copy; no backend population or report contract | `DEMO_ONLY` | Canonical source/metric |
| Report Readiness, Reports Ready, Pending Reports | `getTruthSpineReportSummary` over browser Truth snapshot/adapter records; page-local `filter`/percentage calculations, not a governed report population | `UNSUPPORTED` | Canonical producer/population and metric |
| Verified Outcomes | `truthSummary.verifiedCount`, which counts generic browser Truth records and does not establish an outcome domain | `METRIC_REQUIRED` with unsupported outcome semantics | Outcome producer/population and Truth contract |
| Audit Trace Coverage | Browser Truth record trace/audit flags summarized by page-local calculation; operational trace health, not an institutional outcome | `UNSUPPORTED` | Canonical audit/metric contract |
| Workflow Ready, Open Referrals, Unassigned, Aging, Capacity Risk, Report Posture and workflow guidance | `HUB_REPORT_WORKFLOW_REFERRALS` fixture plus `hubPartners` and `buildHubWorkflowReadiness`; operational/demo workflow bridge, not canonical referral outcomes | `DEMO_ONLY` | Backend workflow producer and semantics |
| Truth Records, Pending, Verified, Report Ready, Backend Audit, Backend Exports and health recommendation | Browser Truth snapshot plus local adapter/backend counters; operational observability, not canonical reporting | `OPERATIONAL_ONLY` | Canonical source and governed metric contract |
| Report cards, including Outcome Snapshot | Static `ReportCard` definitions with presentation readiness/audience/date labels; no registered report lineage | `DEMO_ONLY` | Canonical report/metric definition |
| Audit / Trace Status rows and `94% COVERAGE` | Static trace rows and hardcoded coverage chip; no canonical audit coverage population | `DEMO_ONLY` | Canonical audit population/metric |
| Export History and generated export notice | `shs_hub_report_exports_v1` localStorage plus browser-generated IDs/timestamps and best-effort export API; presentation/operator history, not canonical report lineage | `DEMO_ONLY` | Canonical export/report contract |
| Action Queue `12` badge and surrounding guidance/header copy | Navigation/presentation copy, not a Hub Reports reporting value | `PLACEHOLDER_COPY_ONLY` | Not applicable |

The canonical referral report is not reused for any of these fields. No remaining
field has an independently justified backend business fact, producer, Evidence,
Source, Truth, Metric Registry definition, and Reporting Service contract. The
page's existing notice correctly identifies the remaining values as operational
or demonstration-only; no safety correction was required. Export rendering is
not a source of metrics, and no audit/workflow/browser value was promoted.

The exact next authorized task is to select another unresolved Trusted Reporting
surface. Do not create Hub producers, metrics, Truth claims, or reports from
the remaining fields without a separately proven domain contract.

## Employment-start authenticated ingestion

The verified workforce producer now reuses the existing
`/shf/internal/ingestion/events` HMAC path and trusted-reporting worker for
exactly `shf.workforce` / `employment_started.verified` v1. Agent Fabric
validates service identity, producer/event binding, strict payload schema,
canonical subject, strong verification source, and deterministic idempotency.

One canonical Operational Event is persisted with the privacy-safe outcome ID,
participant/program references, `EMPLOYMENT_STARTED`,
`employment_started_at`, verification source, verified lifecycle, and version.
`occurred_at` equals `employment_started_at`; ingestion time is not substituted.
Invalid authentication, bindings, scope, schema, and pending weak-source
records fail closed. Replay returns the existing event without duplication.

Evidence, Source, and a narrow historical Truth claim are now projected through
the existing generic projector: Evidence is minimized, Source starts
unverified, and Truth starts draft, internally unapproved, and non-public.
Metrics, reports, and public projection remain absent. Isolated synthetic tests
verified one operational event, one Evidence/Source/Truth projection, replay
idempotency, and privacy/semantic boundaries; synthetic records were cleaned.
`surface.reports.briefings` remains `PRODUCER_REQUIRED` because its downstream
Evidence -> Truth -> metric -> report chain is absent.

The exact next authorized task is metric eligibility review for the narrow
verified employment-start Truth claim. Do not create retention, wage, placement
rate, reports, or public Impact integration in the projection slice.

## Employment-start backend authority

The first authorized workforce outcome fact is `EMPLOYMENT_STARTED`: a
participant began employment on an explicit `employment_started_at` date,
supported by an authorized verification source. This is an outcome fact only;
it does not prove retention, wages, job quality, payment, ROI, impact, or public
benefit.

Backend authority is implemented in PostgreSQL table
`workforce_employment_outcomes` by migration
`apps/shs-api/migrations/011_workforce_employment_outcomes.sql`. The
authenticated SHS API owns outcome IDs, tenant/org scope, actor, timestamps,
lifecycle, verification status, and optimistic versions. It supports scoped
submit/read, verification, rejection, and withdrawal routes with narrow
workforce permissions and append-only audit. Records begin in
`verification_pending`; only employer/equivalent strong sources can transition
to `verified`; participant or staff attestations remain pending. Privacy-safe
references and optional artifact hashes are accepted without document contents
or unnecessary PII.

Legacy Agent Fabric SQLite/fallback submission and `JOB_90D` remain
legacy/operational input only. No Trusted Reporting producer, outbox, Evidence,
Truth, metric, report, or public projection is emitted. The future producer
review boundary is verified employment start, not submission. The surface
`surface.reports.briefings` remains `PRODUCER_REQUIRED`.

Migration/runtime proof level: `ISOLATED_DEV_RUNTIME_VERIFIED`. Synthetic
proof created and verified an employment-start record in `shs_dev`, preserved
server scope and version 2 after verification, concealed cross-organization
access, and wrote `employment_outcome.submitted` plus
`employment_outcome.verified` audit events. Synthetic records were removed.

The exact next authorized task is to review the narrow verified-employment
producer contract at the verification boundary. Do not add producer emission,
Agent Fabric ingestion, Evidence, Truth, metrics, Reporting Service, retention,
or public Impact integration in the authority slice.

## Employment-start verified producer

The authorized workforce producer is now implemented at the canonical
`verification_pending` -> `verified` transition:
`shf.workforce` / `employment_started.verified` v1. It is written to the
existing `integration_outbox` in the same PostgreSQL transaction as the
verified outcome update and audit. Its deterministic identity is
`workforce-employment-outcome:{outcome_id}:verified`.

The event subject is the privacy-safe `workforce_employment_outcome` outcome
ID. Its minimized payload contains only the participant reference, optional
program reference, `EMPLOYMENT_STARTED`, explicit `employment_started_at`,
strong verification source, verified lifecycle, and version. `occurred_at` is
the employment-start date, not submission or verification time. No event is
emitted for submission, pending, participant/staff attestation, rejection,
withdrawal, `JOB_90D`, or Oracle/advisory output. The event does not mean
retention, wage, payment, settlement, ROI, impact, or public benefit.

Isolated `shs_dev` runtime proof verified a synthetic outcome through
`VERIFIED`, persisted audit and exactly one `PENDING` outbox row, and rejected
a duplicate/stale verification without creating another event. Synthetic
records were removed. The producer lineage registry records ingestion,
Evidence, Truth, metric, and report layers as absent. The exact next authorized
task is authenticated Agent Fabric ingestion for this single producer/event;
do not add downstream projections in the producer slice.

## Verified employment-start metric

The narrow metric `workforce.employment.started_verified_count.v1` is now
registered against the existing Metric Registry calculator. It counts distinct
`workforce_employment_outcome` subject IDs whose
`employment_started_verified` Truth claims have verified Source metadata and
authorized internal approval, using the canonical historical `occurred_at`
(`employment_started_at`) in an inclusive UTC window. Evidence rows, Source
rows, Truth versions, ingestion retries, and repeated claims for the same
outcome do not inflate the count. This metric counts outcomes, not unique
participants.

The metric does not represent current employment, placement rate, retention,
wages, transfer, settlement, ROI, impact, or public benefit. Current-state
reporting requires separate lifecycle lineage; placement requires an
authoritative denominator and population; retention requires a separate
retention fact; and wage reporting requires a governed wage authority. The
metric remains unavailable when required Source verification or internal Truth
approval cannot be evaluated, and returns zero only for a successfully
evaluated empty eligible population. It is not public-eligible by this slice.

The workforce outcome lineage is therefore `METRIC_COMPLETE / REPORT_REQUIRED`;
no Reporting Service endpoint or Impact Center field was added. The exact next
authorized task is to review and expose this existing metric through the
canonical Reporting Service. Do not create placement, current-employment,
retention, wage, or impact metrics in that slice.

## Verified employment-start Reporting Service

The existing metric `workforce.employment.started_verified_count.v1` is now
bound to the canonical report definition
`report.workforce.employment.started_verified_count.v1` and exposed only by
the authenticated `GET /shf/reports/workforce.employment-started-verified-count`
route. The endpoint requires `shf.report.read`, derives organization scope
from the authenticated actor, ignores client scope overrides, preserves the
metric's verified-Source and internally-approved-Truth eligibility, and keeps
zero distinct from unavailable eligibility.

The report remains historical: its window and distinct-key semantics come from
the Metric Registry (`occurred_at = employment_started_at`, distinct outcome
ID). It does not report current employment, placement, retention, wages,
transfer, settlement, ROI, impact, or public data. The workforce lineage is
`REPORT_COMPLETE / FRONTEND_COMPOSITION_REQUIRED`; the next authorized task is
an explicit composition review for Reports & Briefings, not a new workforce
metric or public exposure.

## Board Brief canonical composition

The Board Brief row on `/foundation/impact` now consumes the authenticated
Reporting Service endpoint
`/shf/reports/workforce.employment-started-verified-count` through
`src/shared/reporting/workforceEmploymentReportingClient.js`. It displays only
the canonical historical `workforce.employment.started_verified_count.v1`
value under the label `Verified Employment Starts`, preserving valid zero and
showing `Unavailable` on report failure or ineligible provenance. It sends no
tenant or organization override, performs no local aggregation, and exposes no
participant or Truth/Evidence data.

Grant Narrative, Donor Summary, Public Impact Snapshot, and Program Health Memo
remain unconnected. Public use remains approval- and privacy-gated. The
surface is now `PARTIAL_CANONICAL`; the next authorized task is an independent
composition decision for one remaining internal format, not a new workforce
metric or public exposure.

## Reports & Briefings composition review

`surface.reports.briefings` at `/foundation/impact` renders
`ReportsBriefingsPanel.jsx` from `SHFImpactCommandCenter.jsx`. The Board Brief
row now consumes the authenticated workforce report; the other four rows remain
static presentation/demo selectors. The surface is `PARTIAL_CANONICAL`.

The workforce report may be composed as `Historical Verified Employment Starts`
for an internal Board Brief. Grant Narrative and Program Health Memo remain
unconnected, Donor Summary is unsupported because distribution authority is
unresolved, and Public Impact Snapshot remains blocked by explicit public
eligibility, privacy, aggregate disclosure, and `public_approved` requirements.
No format may infer placement, current employment, retention, wage, transfer,
settlement, ROI, impact, or program success, and unavailable results must not
become zero or a mock value. The composition contract is documented in
`docs/SHF_REPORTS_BRIEFINGS_COMPOSITION_CONTRACT.md`.

## Grant Narrative canonical composition

Grant Narrative now consumes the same authenticated workforce Reporting Service
result as Board Brief: `report.workforce.employment.started_verified_count.v1`
from `/shf/reports/workforce.employment-started-verified-count`. Its only
canonical wording is the deterministic factual sentence:
`{value} verified employment starts were recorded during the reporting period.`
It preserves exact values including zero and shows an explicit unavailable
state when eligibility or retrieval fails. It does not query Truth/Evidence,
aggregate in the browser, use localStorage, expose participant or employer
data, or use Oracle to generate claims.

Board Brief and Grant Narrative remain unchanged. Program Health Memo now uses
the same report as one explicitly bounded historical workforce indicator; it is
not an overall health score and does not imply current employment, retention,
success rate, or impact. Donor Summary remains unsupported and Public Impact
Snapshot remains blocked by public approval/privacy policy.
`surface.reports.briefings` remains `PARTIAL_CANONICAL`; the next authorized
slice is an independent review of one remaining format, with no new workforce
metric or public exposure.

## Donor Summary authority review

Donor Summary remains `NOT_CURRENTLY_SUPPORTED`. The authenticated
`/foundation/impact` route establishes view access only. Its current item is a
static selector with a generic local generation drawer; there is no donor or
funder recipient authorization, external distribution control, distribution
audit, revocation/version contract, or public publication authority. The prior
`ACTIVE` placeholder was changed to `Unavailable` so the UI does not imply an
available donor deliverable.

The existing workforce report is semantically suitable only as the factual
aggregate sentence `{value} verified employment starts were recorded during the
reporting period.` for a future authorized audience. No participant or employer
details may be exposed, and no external privacy/small-n policy or public
eligibility policy exists. Donor Summary is not connected to the report and
`surface.reports.briefings` remains `PARTIAL_CANONICAL`. The next authorized
task is to establish shared distribution authority before any donor composition
cutover.

## Canonical report artifact authority

The shared report distribution prerequisite is now implemented as PostgreSQL
artifact metadata through migration `012_report_artifacts.sql`. Authenticated
`POST /reporting/artifacts` uses the existing `reports.export` permission;
authenticated list/read endpoints use `reports.view`. The service derives
tenant, organization, and actor from the authenticated principal, generates the
artifact ID and timestamps server-side, persists one `GENERATED` record, stores
only canonical report IDs/versions in the input manifest, and writes one
`report_artifact.generated` audit entry. Client classification, scope,
publication, and lifecycle overrides are not authoritative.

The reusable classification taxonomy is `INTERNAL`, `RESTRICTED_EXTERNAL`, and
`PUBLIC`. Classification does not grant distribution or publication. No durable
PDF/file-byte owner exists in this repository, so `content_hash` remains null;
the record is generated composition metadata, not file storage. No recipient,
distribution, share-token, email, public URL, or publication endpoint was
added. Browser/localStorage export history remains legacy presentation history
and was not migrated. Donor Summary remains unconnected with distribution
authority undefined; Public Impact Snapshot remains blocked by public approval,
privacy, and disclosure policy.

Artifact authority was code-level verified through focused service tests and SHS
API typecheck/build. No isolated PostgreSQL runtime proof was claimed in this
slice; migration code is ready for the approved runtime runner. The next
authorized task is a restricted external distribution control review after
recipient/audience authority and external privacy policy are established.

## Restricted external distribution authority review

The repository's organization, user, membership, invitation, and contact-point
records provide identity/contact data only. They do not establish an authorized
external recipient or audience, so no donor CRM, recipient table, distribution
permission, or distribution record was added. `EXPORT` remains distinct from
`DISTRIBUTE`, and `RESTRICTED_EXTERNAL` remains distinct from `PUBLIC`.

The minimum future restricted-distribution chain is: server-owned recipient or
audience authorization, a narrow distribution permission distinct from
`reports.export`, exact generated artifact/version eligibility, an explicit
server-side disclosure decision, and append-only distribution audit. No approved
external privacy/small-n policy exists; therefore participant-derived aggregate
reports must fail closed with `PRIVACY_DISCLOSURE_POLICY_REQUIRED` until that
policy is established. No numeric threshold was invented.

Donor Summary remains `DISTRIBUTION_AUTHORITY_UNDEFINED` and unconnected. Its
workforce statement is `SUITABLE_WITH_CONTEXT` only. Board Brief, Grant
Narrative, and Program Health Memo remain internal compositions. Public Impact
Snapshot remains separately blocked by public eligibility, privacy, publication
permission, and `public_approved`. No email, share link, public URL, delivery
receipt, or publication behavior was implemented. The contract is documented in
`docs/SHF_RESTRICTED_REPORT_DISTRIBUTION_CONTRACT.md`; focused control tests
confirm fail-closed boundaries and artifact traceability. The next authorized
slice is to establish recipient/audience authority and an approved disclosure
policy interface before implementing distribution authorization.

## Restricted distribution prerequisites implemented

Migration `013_report_distribution_prerequisites.sql` now provides the minimum
pre-distribution authority. `report_distribution_recipients` is a server-owned,
tenant/org-scoped authorization record with `AUTHORIZED` and terminal `REVOKED`
states, references existing organization/contact identities, and writes
append-only authorization/revocation audit actions. `report_disclosure_decisions`
binds `APPROVED` or `BLOCKED` to an exact `RESTRICTED_EXTERNAL` generated
artifact/version, scope, reviewer, decision context, and policy reference.
Approved decisions require a policy reference; no numeric small-n threshold was
invented.

Authenticated APIs are limited to recipient create/list/read/revoke and artifact
disclosure-decision create/list. They use the existing
`reports.distribution.manage` permission. `reports.distribute` is registered
as the future execution permission but no distribution action is implemented.
The reusable `canDistributeRestrictedArtifact` predicate checks artifact
classification/lifecycle/scope, authorized recipient, exact approved decision,
and future execution permission, but performs no send or distribution-record
write.

No `report_distributions` table, email, share link, public URL, delivery receipt,
or publication route exists. `INTERNAL` cannot receive restricted approval,
`RESTRICTED_EXTERNAL` cannot publish, and `PUBLIC` approval remains separate.
Donor Summary remains unconnected and `surface.reports.briefings` remains
`PARTIAL_CANONICAL`. Synthetic distribution runtime proof was intentionally not
performed because distribution is not implemented; focused authority and
artifact regressions plus SHS API typecheck/build passed. The next authorized
task is audited restricted distribution action with exact artifact version,
authorized recipient, approved disclosure, and no delivery/publication
implication.

## Audited restricted distribution authorization

The delivery/file boundary was reviewed before naming the action. Because no
canonical persisted PDF/bytes owner or delivery mechanism exists, the truthful
fact is `AUTHORIZED_FOR_DISTRIBUTION`, not `DISTRIBUTED`: SHF recorded that an
authorized actor approved a restricted artifact/version for an authorized
recipient under an approved disclosure decision. This does not assert
transmission, receipt, opening, reading, acceptance, or publication.

Migration `014_report_distribution_authorizations.sql` adds the append-only
`report_distributions` record. The authenticated
`POST /reporting/artifacts/:artifactId/distributions` action requires
`reports.distribute`, exact generated `RESTRICTED_EXTERNAL` artifact/version,
`AUTHORIZED` recipient, exact `APPROVED` artifact-bound disclosure decision
with policy reference, matching tenant/org, and explicit idempotency key.
Retries with the same key return the original authorization; a conflicting
request is rejected. History is available through the metadata-only GET route.
Successful authorization writes `report.distribution.authorized`; no
`report.distributed` event is emitted.

`reports.view`, `reports.export`, and `reports.distribution.manage` cannot
perform the action. Internal/public artifacts, revoked recipients, blocked or
missing disclosure, wrong versions, missing scope, and missing distribution
permission fail closed. No report contents, participant data, delivery fields,
email/share/public URL, or publication behavior was added. Donor Summary and
Public Impact Snapshot remain unconnected; `surface.reports.briefings` remains
`PARTIAL_CANONICAL`. Local PostgreSQL remained unavailable, so migration
application/runtime proof was not claimed. Focused authorization/artifact
tests, SHS API typecheck/build, and reporting validators passed. The next
authorized task is Donor Summary cutover review using this authorization path,
without adding delivery or publication semantics.

## Donor Summary restricted canonical cutover review

Donor Summary was reviewed against the complete governed path: canonical
workforce report, Donor Summary composition, `RESTRICTED_EXTERNAL`
`report_artifacts` metadata, authorized recipient, approved artifact-bound
disclosure, and `AUTHORIZED_FOR_DISTRIBUTION`. The decision is
`COMPOSITION_READY_BUT_ARTIFACT_GENERATION_GAP`.

The generic artifact and restricted-authorization services are available, but
the current Donor Summary row in `SHFImpactCommandCenter.jsx` remains an
`Unavailable` static selector using the legacy generic export drawer. It does
not create a Donor Summary artifact with an exact workforce report manifest,
does not independently invoke recipient/disclosure authorization, and does not
display an authorization state. Therefore no frontend or backend cutover was
performed. Donor Summary remains `DISTRIBUTION_AUTHORITY_UNDEFINED` and
`surface.reports.briefings` remains `PARTIAL_CANONICAL`.

The next bounded slice is a server-authoritative Donor Summary
composition/artifact registration flow using explicit composition type/version,
`RESTRICTED_EXTERNAL`, and the exact
`report.workforce.employment.started_verified_count.v1` input, followed by a
separate authorization action. It must preserve unavailable/fail-closed
behavior and must not add delivery or public publication.

## Donor Summary canonical artifact registration

The bounded artifact-registration slice is complete. The server route
`POST /reporting/compositions/donor-summary/artifacts` reuses PostgreSQL
`report_artifacts` and requires `reports.export`. It fixes composition type
`DONOR_SUMMARY`, composition version `1`, classification `RESTRICTED_EXTERNAL`,
and the sole canonical input
`report.workforce.employment.started_verified_count.v1` at report version `1`.
The route records the canonical report dependency; it does not embed a
period-specific report value, and therefore does not turn unavailable report
results into zero or another fallback.

Tenant, organization, actor, artifact ID, timestamps, lifecycle `GENERATED`,
and record version remain server-owned. The existing
`report_artifact.generated` audit is reused. No report value, Truth, Evidence,
participant data, or file bytes are stored; no content hash is fabricated
because no canonical bytes owner exists.
Generation retries require a server-scoped idempotency key; a repeated key
replays the existing artifact, while a new explicit key represents a new
generation request.

Artifact registration does not invoke recipient authorization, disclosure
approval, `reports.distribute`, `AUTHORIZED_FOR_DISTRIBUTION`, delivery, or
publication. The frontend Donor Summary selector remains unconnected and
unavailable; this slice changes artifact authority only.

Local PostgreSQL was unavailable, so migration/runtime persistence proof was
not claimed. Focused service and source-contract tests provide code-level
proof. The next authorized slice is Donor Summary authorization cutover against
an existing restricted recipient and approved artifact-bound disclosure
decision.

## Donor Summary authorization cutover

The Donor Summary backend authorization cutover is complete. The existing
`POST /reporting/artifacts/:artifactId/distributions` action now validates
Donor-specific composition identity, version `1`, `RESTRICTED_EXTERNAL`
classification, `GENERATED` lifecycle, and the exact workforce report manifest
before using the existing recipient, disclosure, permission, scope, and
idempotency gates.

Successful authorization remains `AUTHORIZED_FOR_DISTRIBUTION` and writes
`report.distribution.authorized`. It does not assert delivery and does not
create `DISTRIBUTED`, `SENT`, `DELIVERED`, public, or publication state.

No recipient is created automatically, no disclosure is auto-approved, and no
report contents or participant data enter the authorization record. The
frontend Donor Summary control remains unconnected because the current panel
has no governed recipient/disclosure selector UX. `surface.reports.briefings`
remains `PARTIAL_CANONICAL`; the next bounded slice is a frontend authority UX
review/cutover, still without delivery or publication.

Local PostgreSQL remains unavailable, so runtime persistence proof was not
claimed. Focused backend, artifact, distribution, composition, typecheck/build,
validator, and diff checks passed.

## Donor Summary authority-selection UX

The bounded frontend authority UX is now implemented at the existing
`/foundation/impact` Donor Summary drawer. It reuses the shared workforce
Reporting Service result and the existing authenticated artifact, recipient,
disclosure, and authorization endpoints. The UI generates a server-owned
`DONOR_SUMMARY` v1 artifact, lists only `AUTHORIZED` recipient authorizations,
loads only `APPROVED` disclosure decisions bound to the exact artifact/version,
and invokes the generic authorization action with a stable retry key. Backend
scope, permission, stale-authority, classification, version, and disclosure
checks remain authoritative.

The only successful UI state is `AUTHORIZED_FOR_DISTRIBUTION`; it does not say
sent, delivered, shared, distributed, or published. Valid zero is preserved,
unavailable workforce data disables generation, and errors fail closed. No
recipient creation, disclosure approval, delivery, public route, participant
data, Truth/Evidence access, or local/mock/Oracle fallback was added. Board
Brief, Grant Narrative, and Program Health Memo remain unchanged; Public Impact
Snapshot remains blocked. `surface.reports.briefings` remains
`PARTIAL_CANONICAL` and Donor Summary is now
`RESTRICTED_EXTERNAL_CANONICAL_AUTHORIZATION_READY` at the frontend authority
selection layer.

Focused UX/client and composition regressions, frontend production build, SHS
API typecheck/build, census, rebuild, and diff checks pass. PostgreSQL-backed
UI/E2E persistence proof remains unavailable in this environment and is not
claimed. The next authorized slice is delivery review/implementation only if a
canonical bytes owner and actual delivery mechanism are separately approved;
public publication remains a separate policy-gated task.

## Canonical report bytes and delivery ownership review

The repository review found server-side renderers but no reusable canonical
bytes owner. `services/shf-agent-fabric/fabric/reports/institutional` and
`pdf_report.py` return ReportLab bytes from legacy/advisory payloads without
durable `report_artifact` linkage. `services/shf-report-engine/src/render.js`
writes local Playwright PDFs from fixture inputs without tenant/org scope,
artifact/version binding, immutable storage, or authorized reads. The proof
pack hashes supplied bytes for verification but does not own them. Browser Blob
downloads, localStorage export history, process-memory export history, and
static output files remain `LEGACY_PRESENTATION_EXPORT` or demo artifacts.

Decision: `SERVER_RENDERER_EXISTS_BUT_DURABLE_STORAGE_MISSING`. No renderer was
promoted, no content hash was fabricated, and no delivery path was added. A
future file authority must bind immutable server-rendered bytes to the exact
artifact/version, compute the hash over persisted bytes, enforce tenant/org
scope, and audit reads/retention. The contract is documented in
`docs/SHF_CANONICAL_REPORT_FILE_AUTHORITY_CONTRACT.md`.

Delivery is deferred from the Trusted Reporting correctness critical path.
`AUTHORIZED_FOR_DISTRIBUTION` remains the highest truthful Donor Summary state;
it does not mean sent, shared, delivered, opened, or read. Public Impact
Snapshot remains separately governed by public eligibility and privacy policy.
The next bounded delivery workstream, only if required, is a server-side Donor
Summary renderer plus durable scoped immutable file storage. Focused bytes
authority tests, JSON/syntax checks, and `git diff --check` pass; no runtime
storage proof was claimed.

## Public reporting eligibility review

The public reporting contract is now defined in
`docs/SHF_PUBLIC_REPORTING_ELIGIBILITY_CONTRACT.md`. It preserves the distinct
path from canonical Truth and approved Metric Registry report, through public
eligibility and privacy/disclosure approval, to server-owned `public_approved`,
public-safe composition, publication authority, and eventual publication.
Internal Truth approval, report existence, metric calculation, artifact
generation, restricted authorization, frontend state, and Oracle output do not
establish public eligibility.

The current canonical candidates classify as
`PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY` for curriculum lesson completion,
Hub referrals created, and verified employment starts, while exchange funding
commitment count remains `INTERNAL_ONLY`. Their wording remains bounded to
activity/process or historical outcome semantics and cannot be relabeled as
impact, success, retention, deployed funding, wages, or jobs created.

The Public Impact Snapshot remains `PUBLIC_APPROVAL_REQUIRED` and unconnected.
The Impact Data Spine remains a projection layer, not Truth authority. A static
data drift was found and corrected: `src/data/shfImpactData.js` had marked
Sample/Draft static records with `publicApproved: true`. Those fixture records
are now explicitly `publicApproved: false`, remain demo-only, and are excluded
from public-approved counts/projections. No canonical public record was created
and no real public approval state was changed.

Focused public eligibility, reporting composition, Donor Summary, JSON/syntax,
census, rebuild, and diff checks passed. No public approval, publication,
threshold, metric, or surface connection was added. The next authorized slice
is to review one aggregate report's server-owned public eligibility/privacy
decision path; disclosure approval and publication remain separate.

## Curriculum public eligibility review

Step 1 resolved the Impact Data Spine drift by changing all static Sample/Draft
lanes and county fixtures in `src/data/shfImpactData.js` to
`publicApproved: false`. The fixtures remain demo-only, are excluded from
public-approved counts, and were not deleted or promoted into Truth, metrics,
or reports.

Step 2 reviewed `curriculum.lesson.completion_count.v1` through its existing
canonical lesson-event, Evidence, Source, Truth, Metric Registry, and
Reporting Service lineage. Its only defensible public meaning remains lesson
completion activity count. The repository has a server-owned Truth claim
public-approval permission, but no durable report/version-bound
`PUBLIC_ELIGIBLE` decision authority. Classification is
`PUBLIC_ELIGIBILITY_RECORD_REQUIRED`; no eligibility, privacy, or public
approval record was created. `surface.reports.briefings` remains
`PARTIAL_CANONICAL`, and Public Impact Snapshot remains
`PUBLIC_APPROVAL_REQUIRED` and unconnected.

Focused Impact Data Spine, public eligibility, curriculum reporting, Donor
Summary, JSON/syntax, census, rebuild, and diff checks pass. PostgreSQL runtime
proof was not required or claimed because no eligibility authority was
implemented. The next authorized task is to define the smallest scoped,
server-owned report/version eligibility decision record for curriculum
completion, keeping privacy disclosure and publication separate.

## Curriculum public eligibility authority

The report-level public eligibility authority is now implemented for exactly
`report.curriculum.lesson_completion_count.v1` version 1. PostgreSQL migration
`016_report_public_eligibility_decisions.sql` stores append-only,
tenant/organization-scoped `PUBLIC_ELIGIBLE` or `PUBLIC_INELIGIBLE` decisions
with server-owned actor, timestamps, reason code, policy reference, exact
report/version binding, optional supersession, and version. Authenticated
routes use the distinct `reports.public_eligibility.manage` permission for
writes and `reports.view` for reads. Decisions are audited as
`report.public_eligibility.approved` or `report.public_eligibility.denied`.

The service validates the server-supported canonical curriculum report and its
registered metric/Truth/Source lineage boundary; it rejects unknown reports,
wrong versions, missing policy references, and unauthorized or out-of-scope
actors. `PUBLIC_ELIGIBLE` means only eligible to proceed to a later privacy and
disclosure review. It does not set `public_approved`, approve disclosure,
authorize publication, or connect the Impact Data Spine/Public Impact
Snapshot. Referrals and workforce reports are not supported by this authority.

No PostgreSQL runtime persistence proof was obtained in this slice; focused
service/migration/route tests provide code-level proof. The next authorized
task is to define or implement the separate server-owned public disclosure
decision for an exact approved report/version, without inventing a small-n
threshold or connecting Public Impact Snapshot.

## Curriculum public disclosure authority

The second public governance gate is now represented by PostgreSQL migration
`017_report_public_disclosure_decisions.sql`. It supports only
`report.curriculum.lesson_completion_count.v1` version 1 and requires an exact
`PUBLIC_ELIGIBLE` decision, server-derived tenant/org/reviewer, privacy policy
reference and version, reason code, append-only supersession, and audit. The
distinct `reports.public_disclosure.manage` permission governs writes; reads
remain scoped under `reports.view`.

At that earlier checkpoint there was no approved numeric small-n or disclosure
policy authority, so execution was explicitly `BLOCK_ONLY_UNTIL_POLICY_APPROVED`.
That state is superseded by the approved curriculum policy v1 recorded below.
Disclosure does not mutate Truth `public_approved`, authorize publication, or
connect Public Impact Snapshot.
No referral or workforce disclosure path was added, and no PostgreSQL runtime
persistence proof was obtained in this slice; focused code-level tests pass.

The next authorized task is to establish an approved privacy/disclosure policy
authority and then review the narrow transition that can safely record
`PUBLIC_DISCLOSURE_APPROVED` for an exact curriculum report/version.

## Public disclosure policy authority

The policy authority is represented by
`docs/SHF_PUBLIC_DISCLOSURE_POLICY_CONTRACT.md` and PostgreSQL migrations
`018_report_public_disclosure_policies.sql` through
`021_public_disclosure_review_context.sql`. The scoped
`PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` policy v1 for
`report.curriculum.lesson_completion_count.v1` is institutionally approved
through the required privacy/data-governance, legal/privacy, and executive
sign-off categories. Policy management uses the distinct
`reports.public_disclosure_policy.manage` permission.

The approved policy does not set Truth `public_approved`, authorize
publication, or connect the Impact Snapshot. Report disclosure remains an
exact `PUBLIC_ELIGIBLE`-bound decision and requires the approved policy,
allowed slice and period, freshness metadata, threshold/suppression handling,
and all residual-risk reviews.

## Public disclosure policy schema closure

The documented policy-schema representation gaps for
`PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` are resolved by PostgreSQL migration
`019_public_disclosure_policy_schema_completion.sql` and policy-authority
validation. The structured definition now explicitly represents display mode,
complementary suppression, repeated-query/reconstruction risk,
freshness/expiration rules, and combination-risk rules. Institutional sign-off
is represented separately by scoped, versioned sign-off records carrying a
stable authority reference; no institutional title or approver was invented.

This was the pre-approval schema state. It is superseded for curriculum v1 by
the institutional policy approval recorded below. Truth `public_approved`,
publication, and Public Impact Snapshot remain unchanged.

Focused code-level tests cover structured field presence and shape, incomplete
drafts, fail-closed approval, sign-off separation, migration representation,
and authority boundaries. PostgreSQL runtime persistence proof was not
obtained in this slice. The next authorized task is institutional governance
of the unresolved policy values and sign-off authority, without inventing
values in application state.

## Curriculum education disclosure policy v1 approval

The institutionally selected `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` policy
version `1` is now encoded in the policy authority as the approved curriculum
definition. It governs only
`report.curriculum.lesson_completion_count.v1`, version `1`. Approved values
include minimum exact-count group size `10`, public geography
`COUNTY`/`STATE`/`ORGANIZATION_WIDE`, program granularity
`FOUNDATION_WIDE`/`NAMED_PROGRAM`, periods `QUARTERLY`/`ANNUAL`, display modes
`EXACT_COUNT` and `SUPPRESSED_LT_10`, and freshness review after `12 months`.
Complementary suppression, re-identification, rare-event, reconstruction,
longitudinal, and combination-risk review are required.

Policy approval requires the three governed sign-off categories
`PRIVACY_DATA_GOVERNANCE`, `LEGAL_PRIVACY_REVIEW`, and `EXECUTIVE_APPROVAL`.
No natural-person approver is stored or invented. Policy approval is separate
from report disclosure approval, Truth `public_approved`, and publication.

The curriculum disclosure evaluator now permits
`PUBLIC_DISCLOSURE_APPROVED` only after exact `PUBLIC_ELIGIBLE` linkage, policy
resolution, allowed slice/period/freshness checks, and all residual-risk review
inputs pass. Counts below 10 remain internally canonical and are represented
publicly as `<10`; no metric value is mutated.

No Public Impact Snapshot or publication behavior changed. No production
database policy row was seeded in this slice, and no PostgreSQL runtime
persistence proof was obtained; focused code-level tests and builds provide
verification. The next authorized task is the separate architecture review
for Truth `public_approved` linkage and eventual publication authority.

## Truth public approval and report governance boundary review

The Truth Spine boundary review is complete and recorded in
`docs/SHF_TRUTH_PUBLIC_APPROVAL_REPORT_GOVERNANCE_BOUNDARY.md`.

The selected architecture is `TWO_DISTINCT_PUBLIC_GATES`. Truth
`public_approved` is an explicit, scoped, auditable decision on an individual
claim version. It is required by the active curriculum public metric
definition for claims entering that public metric population, but it does not
perform aggregate privacy or suppression review. `PUBLIC_ELIGIBLE` and
`PUBLIC_DISCLOSURE_APPROVED` are separate exact report/version decisions; the
latter does not mutate Truth. Future publication remains a separate authority.

The current curriculum public path must not expose participant-linked Truth
detail merely because an aggregate disclosure decision passes. No Truth
migration, mass approval, public projection, or Public Impact Snapshot change
was made. The next authorized task is a bounded review of the public
publication-authority and public-safe aggregate artifact boundary, including
whether the current curriculum claim-level public metric requirement remains
appropriate for a privacy-safe aggregate.

## Public publication authority boundary review

The publication review is recorded in
`docs/SHF_PUBLICATION_AUTHORITY_CONTRACT.md`. The decision is
`PUBLICATION_SNAPSHOT_REQUIRED`. The repository has legacy/admin-key publish
routes and a technical `reports.publish` permission, but no reusable canonical
SHF publication authority. The legacy route writes local run JSON/PDF files,
supports force behavior, and creates public URLs without exact SHF report
governance or immutable snapshot linkage.

The current Reporting Service result is generated on demand from mutable Truth
inputs; report definition/version and period alone do not uniquely identify an
immutable public result. No publication authorization record, public URL,
Impact Snapshot connection, Truth mutation, or publication state was added.
The next authorized task is to define the immutable public-safe curriculum
snapshot/file authority and resolve institutional publication authority before
implementing `PUBLICATION_AUTHORIZED`.

## Curriculum public-safe snapshot authority

The server-owned immutable public-safe snapshot prerequisite is now
implemented for `report.curriculum.lesson_completion_count.v1` version `1`.
PostgreSQL migration `022_report_public_snapshots.sql` adds a scoped,
append-only `report_public_snapshots` record bound to the exact Reporting
Service `report_result_id`, reporting period, data-as-of timestamp,
`PUBLIC_ELIGIBLE` decision, `PUBLIC_DISCLOSURE_APPROVED` decision, and
approved `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` policy v1. Snapshot creation
requires the current public-approved population assertion, re-evaluates the
approved disclosure context, enforces the approved quarterly/annual,
county/state/organization-wide, and foundation-wide/named-program bounds,
and stores only the public-safe representation.

An exact count such as `27` is stored as `27`; a suppressed positive count such
as `9` is stored as `<10` and the suppressed integer is not stored in the
snapshot payload. A safe canonical zero remains `0`. The canonical metric is
never mutated. Server-computed `snapshot_hash` is a metadata/data integrity
hash, not a file hash. The record is metadata-only: no PDF, bytes, delivery,
publication authorization, public URL, or Impact Data Spine write exists.

Snapshot creation uses the distinct `reports.public_snapshot.generate`
permission; scoped reads use `reports.public_snapshot.view`. Retries require
the same scope/idempotency key and conflicting reuse fails. Audit action
`report.public_snapshot.created` records governance references without report
contents. No PostgreSQL runtime persistence proof was obtained in this slice;
focused code-level tests and type/build checks are the available evidence.

Public Impact Snapshot remains blocked and `surface.reports.briefings` remains
`PARTIAL_CANONICAL`. The next authorized task is the separate institutional
publication-authority review/implementation, including whether a server-side
public renderer is required, followed by publication authorization. This
snapshot authority does not change Truth `public_approved`.

## Publication authorization against immutable snapshot

The approved v1 institutional model is now locked: `SHF_EXECUTIVE_AUTHORITY`
is final authority and may explicitly delegate
`PUBLIC_REPORTING_RELEASE_AUTHORITY`. Each curriculum authorization requires
an active authority plus a `PUBLIC_REPORTING_RELEASE_APPROVAL` bound to the
exact snapshot ID/version/hash. Technical permission
`reports.publication.authorize` remains separate from institutional authority;
legacy `reports.publish` is not reused.

The bounded PostgreSQL authorization path is implemented through migrations
`023_public_snapshot_population_attestation.sql` and
`024_report_publication_authority.sql`. It validates the immutable snapshot,
all current upstream decisions, policy v1, freshness, Truth public-population
attestation, scope, authority, release approval, and idempotency, then records
`PUBLICATION_AUTHORIZED` and `report.publication.authorized`. It stores no
report contents and creates no `PUBLISHED` state, public URL, file, or Impact
Data Spine write. No PostgreSQL runtime persistence proof was obtained.

At the time of this authorization checkpoint, Public Impact Snapshot remained
blocked and `surface.reports.briefings` remained `PARTIAL_CANONICAL`; the
publication action was the next authorized review. Truth `public_approved`
remains unchanged.

## Curriculum publication action

The canonical public projection prerequisite is now implemented for
`report.curriculum.lesson_completion_count.v1` version `1`. The repository
classified the prior SHF public Impact records as `STATIC_SAMPLE_ONLY`: the
map adapter and Foundation page use local sample/static values, while the
legacy Agent Fabric publish route is not snapshot-bound and is not canonical.

Migration `025_report_publications.sql` adds append-only `report_publications`
and the scoped `shf_public_impact_projections` read model. The publication
service accepts only an exact current `PUBLICATION_AUTHORIZED` curriculum
snapshot, rechecks upstream governance and freshness, requires distinct
`reports.publication.execute`, and copies only the snapshot's public-safe
representation. `27` remains `27`, `<10` remains `<10`, and a safe `0` remains
`0`; no private suppressed value, Truth, Evidence, or participant data is
stored. The action writes `report.published`, but `PUBLISHED` means only that
the snapshot was written to the governed SHF public Impact projection. It
does not mean delivery, a URL, or external file publication.

The read-only public endpoint is
`GET /public/impact/curriculum-lesson-completions`; it exposes only canonical
`PUBLISHED` projection rows and excludes static/sample records. The existing
Foundation UI has not yet been cut over from its hard-coded public claims, so
`surface.reports.briefings` remains `PARTIAL_CANONICAL` and the Public Impact
Snapshot remains blocked from UI consumption. The next authorized task is to
replace exactly one public-surface field with this read model and preserve the
activity-only wording `Verified Lesson Completions`. No PostgreSQL runtime
persistence proof was obtained; focused code-level tests and type/build checks
are the available evidence.

## Public curriculum surface cutover

The public Foundation entry point now replaces one hard-coded curriculum-adjacent
claim with `Verified Lesson Completions`, sourced only from
`GET /public/impact/curriculum-lesson-completions`. The client preserves the
server representation exactly: exact counts remain exact, suppressed values
remain `<10`, safe zero remains `0`, and empty or failed reads render
`Unavailable`. It does not call Truth, Evidence, Metric Registry, internal
Reporting Service routes, localStorage, static Impact fixtures, browser
aggregation, or Oracle.

The public endpoint returns only published `CANONICAL_PUBLICATION` projection
fields. The remaining Foundation page claims and SHF Impact map remain static
or sample/noncanonical and were not merged into the canonical field. The
public curriculum slice is `PARTIAL_CANONICAL_PUBLIC`; the overall Impact
Center is not advanced. No PostgreSQL runtime persistence or live browser/API
E2E proof was obtained because PostgreSQL remains unavailable. The next
authorized task is production public deployment/runtime verification of this
one field and a separate review of any additional public metric.

## Hub referral public metric review

The additional candidate `hub.referral.created_count.v1`, report
`report.hub.referral.created_count.v1`, is canonically registered and already
available through the internal Hub Reporting Service path. Its exact semantic
boundary is referral creation activity only: it does not prove service
delivery, acceptance, completion, participant outcome, successful placement,
need resolution, or impact. No unsupported Hub readiness, workflow, export, or
outcome values entered this review.

The public eligibility classification is
`PUBLIC_ELIGIBLE_WITH_NEW_DISCLOSURE_POLICY`, not public approval. The approved
curriculum policy `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY v1` is not reused.
Referral-specific policy scope and institutional values for population
threshold, geography, period, referral category/provider specificity,
repeated-release/reconstruction, combination risk, rare events, and
re-identification remain governance decisions.

The current public eligibility, disclosure, snapshot, publication, projection,
and public-read implementations are curriculum-specific, including exact
curriculum report/policy checks and curriculum-only projection constraints.
Therefore the implementation decision is
`HUB_PUBLIC_GOVERNANCE_REFACTOR_REQUIRED`. No Hub public endpoint, snapshot,
publication, or UI cutover was performed. `surface.reports.briefings` and the
curriculum public field remain unchanged; funding commitments remain internal.
The next authorized task is a bounded generic public-governance registration
refactor for Hub referrals, followed by a separately approved referral
disclosure policy review.

## Generic public-governance registration

The bounded multi-report refactor is complete. The server-owned registry at
`apps/shs-api/src/domain/reporting/report-public-governance-registry.ts` now
explicitly registers the curriculum report and `report.hub.referral.created_count.v1`
version 1 with metric identity, domain, required policy, semantic class/label,
Truth public-population requirement, snapshot/projection/read-model identity,
and registration version/status.

Eligibility, policy resolution, disclosure decision validation, snapshot
identity, publication authorization, and publication projection writing now
resolve registered report configuration rather than assuming the curriculum
report. The curriculum evaluator and public read endpoint remain intentional
report-specific adapters. Migration `026_generic_public_governance_registrations.sql`
removes curriculum-only projection database checks while retaining scoped
report filtering for the existing curriculum public endpoint.

Hub registration remains `POLICY_REQUIRED`. It requires the unapproved
`PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY` policy and has no disclosure evaluator,
so no Hub disclosure decision, snapshot, publication authorization, publication,
projection, or public endpoint was created. Hub semantic identity remains
`REFERRAL_CREATION_ACTIVITY`; curriculum policy values are not reused.

The public-governance reuse matrix is: registration `GENERIC_REUSABLE`;
eligibility `GENERIC_REUSABLE`; policy resolution `GENERIC_REUSABLE`;
disclosure decision `GENERIC_REUSABLE` with report-specific evaluators;
snapshot `GENERIC_REUSABLE` with report-specific evaluator adapters;
publication authorization `GENERIC_REUSABLE`; publication action/projection
storage `GENERIC_REUSABLE`; public read API `INTENTIONALLY_REPORT_SPECIFIC`;
frontend public client `INTENTIONALLY_REPORT_SPECIFIC`. The exact next task is
to prepare the `PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY` policy decision packet.

## Hub referral disclosure policy decision packet

The decision-ready packet is recorded in
`docs/SHF_PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY_POLICY_DECISION_PACKET.md`.
It binds only `report.hub.referral.created_count.v1` version 1 and preserves
the `REFERRAL_CREATION_ACTIVITY` boundary: referral creation does not prove
service delivery, completion, outcome, participant service, or impact.

The packet compares curriculum policy controls without inheriting them. Hub
threshold, suppression, geography, program/category/provider/partner
granularity, reporting periods, freshness, and residual-risk controls remain
explicit institutional decisions. Referral-specific category/provider rules
and category-sensitive thresholds are identified as possible future schema
extensions, not implemented here. The approved v1 values are recorded below;
future substantive changes require a new policy version.

The policy is now `APPROVED` with the institutionally selected v1 values:
threshold `10`, `<10` suppression for positive counts below threshold, safe
zero preservation, organization/state/county geography,
foundation-wide/named-program granularity, quarterly/annual periods,
12-month freshness, required complementary suppression, and required
re-identification, rare-event, reconstruction, longitudinal, and combination
risk review. Referral category, service type, provider, partner, case,
individual, and more granular geography remain blocked for v1. Required
institutional sign-offs are preserved and technical permission remains distinct
from institutional authority.

The registered `HUB_REFERRAL_ACTIVITY_V1` evaluator now supports exact Hub
disclosure review. No Hub disclosure decision, snapshot, publication
authorization, publication, public projection, endpoint, or UI state was
created automatically. The synthetic evaluator and authority tests pass, but
the current real Hub population remains draft/unapproved and does not satisfy
Truth `public_approved`. No real `PUBLIC_ELIGIBLE` or
`PUBLIC_DISCLOSURE_APPROVED` record was fabricated. The next authorized task is
to establish a legitimately public-approved Hub population, then execute an
exact Hub `PUBLIC_ELIGIBLE` report disclosure review; snapshot and publication
remain separate later gates.

## Hub Truth public-approval workflow review

The exact Hub Truth claim is `hub_referral_created` with predicate
`referral_created`, versioned under `lineage.hub.referral.created.v1`. Existing
Truth Spine machinery provides explicit Source verification, separate internal
approval, claim-version public approval/revocation, scope enforcement, and
append-only approval history using `truth.claim.approve_public` and
`truth.claim.revoke_public`.

The workflow is not safe for Hub claims as currently modeled. The same
`public_approved` flag used by the Hub public metric also admits the raw
participant/case-linked Truth claim to unauthenticated Truth public claim and
package routes. The repository has no aggregate-only public-population state,
and no separate institutional sign-off reference for Hub claim approval.
Classification: `HUB_PUBLIC_APPROVED_SEMANTICS_UNSAFE_FOR_PARTICIPANT_LINKED_TRUTH`.
No real Hub claims were modified or fabricated as public-approved. Hub
eligibility and disclosure remain blocked. The next authorized task is a
versioned population-contract refactor separating aggregate contribution
eligibility from direct Truth visibility, followed by an institutional
authority/sign-off review.

## Truth public population eligibility split

The bounded semantic correction is implemented in
`docs/SHF_TRUTH_PUBLIC_POPULATION_ELIGIBILITY_CONTRACT.md`. A separate,
claim/version-bound `PUBLIC_POPULATION_ELIGIBLE` authority now governs
aggregate contribution for registered curriculum and Hub predicates. Raw
Truth public routes continue to require `public_approved`; population
eligibility alone cannot expose a claim. Curriculum uses dual-read compatibility
with its existing public path, while Hub requires the new authority and keeps
`public_approved` false.

The implementation uses append-only Truth-side JSONL development persistence,
distinct approve/revoke permissions, server-derived scope, required verified
Source/internal approval/lineage, and fail-closed governed authority/sign-off
records. No real Hub claims were approved or modified. No Hub report
eligibility, disclosure, snapshot, publication, projection, endpoint, or UI
state was created. Production durability remains a prerequisite for real
claim approval.

## Governed institutional population sign-off

The configuration-only population authority reference has been replaced by a
server-owned append-only Truth governance model. Authority records are typed
as `SHF_PRIVACY_DATA_GOVERNANCE_AUTHORITY`; optional delegated records require
an active primary authority. Each claim/version approval requires an exact
`PUBLIC_AGGREGATE_POPULATION_APPROVAL` sign-off, active authority, verified
Source, internal approval, registered predicate, and the dedicated
`truth.public_population.approve` permission. Authority and sign-off management
use separate SHS-admin permissions, and transitions are recorded in Truth
history without claim payloads.

The capability remains file-backed development persistence, so
`PRODUCTION_DURABILITY_PENDING` remains explicit. No real Hub claim was
approved or modified, and no Hub report eligibility, disclosure, snapshot,
publication, projection, endpoint, or UI state was created. Curriculum
dual-read compatibility remains unchanged. The next authorized task is a
controlled review and approval of individually eligible Hub claim versions,
only after real institutional sign-off records are established.

## Population governance production durability

The durable owner is the SHS PostgreSQL governance boundary. Ordered migration
`027_truth_public_population_governance.sql` adds append-only authority,
claim-sign-off, eligibility-transition, and governance-audit tables. The Truth
claim payload remains Agent Fabric file-backed and is not moved or duplicated.
Production population governance explicitly selects PostgreSQL and fails
closed on missing DSN, driver, or schema; JSONL remains development/test-only
and is not imported automatically. Active claim/version uniqueness and current
state revalidation provide concurrent-retry and revocation safety. No real Hub
claim was approved or changed.

Runtime durability proof completed against the authorized local PostgreSQL
16.12 `shs_dev` instance. Migration 027 applied and reran idempotently.
Synthetic authority, exact sign-off, and population eligibility survived
repository/process recreation; concurrent duplicate sign-offs collapsed to one
active authoritative record; revocation and raw Truth isolation were proven.
Synthetic rows were cleaned up. No real claim changed. The next authorized
task remains controlled review of individually eligible real Hub claim versions.

## Controlled real Hub population review

The authorized local review enumerated the canonical Truth repository and
matched only the exact Hub predicate pair `hub_referral_created` /
`referral_created` with lineage `lineage.hub.referral.created.v1`. The store
contained zero matching real claim/version candidates. Therefore zero were
approvable, zero were newly `PUBLIC_POPULATION_ELIGIBLE`, zero were already
validly eligible, and zero were blocked candidates. Synthetic, fixture, demo,
mock, seed, deleted, superseded, and unrelated records were excluded.

The authorized local PostgreSQL database is `shs_dev`; durable population
authority, sign-off, eligibility, and governance-audit tables were present and
contained zero rows after synthetic durability-proof cleanup. No institutional
sign-off or eligibility record was created, and no report-level eligibility,
disclosure, snapshot, publication, projection, endpoint, or UI state was
created. Truth `public_approved` was unchanged. The next authorized task is to
repeat exact claim-level review when a real canonical Hub Truth population
exists and satisfies all approved prerequisites.

## Production trusted-reporting hardening audit

The bounded production hardening audit is complete. The completed trusted
reporting and public-governance chain remains intact. Overall status is
`NOT_PRODUCTION_READY`: production-equivalent E2E is blocked by production
identity/password/session integration, reviewed network/ingress controls,
secret-manager provisioning and rotation, migration orchestration/bookkeeping,
managed outbox-worker recovery, rate limiting, and deployment-level
authorization verification. Backup/restore, retention, and monitoring
ownership are also required before production launch.

Two narrow safety defects were corrected: SHS Express CORS now requires an
explicit production origin allowlist and rejects unlisted origins; and the SHS
API no longer exposes a hard-coded `/auth/me` super-admin, falls back to an
admin for unknown dev tokens, or enables demo identity outside explicit local
development. Production database configuration also fails closed when
`DATABASE_URL` is absent. No metric, policy, Truth `public_approved` state,
Hub governance record, snapshot, publication, or public surface changed.

Hub status remains `PUBLIC INFRASTRUCTURE READY` / `REAL PUBLIC DATA NOT YET
AVAILABLE`; no real Hub candidates currently exist, and this is data-dependent
rather than an architecture blocker. The required next task is remediation of
the production E2E blockers recorded in
`docs/SHF_TRUSTED_REPORTING_PRODUCTION_HARDENING_AUDIT.md`, followed by a
reviewed production-equivalent curriculum E2E proof.

## Production identity/authentication boundary

The SHS API identity path was reviewed and the unsafe production fallback was
closed. Its `IdentityRepo`, `dev-token:<user_id>` credentials, and login path
are development-only; production no longer accepts them. Production startup
requires `SHS_IDENTITY_PROVIDER`, `SHS_IDENTITY_PROVIDER_AUDIENCE`, and
`SHS_SESSION_SECRET_REF`, then fails closed because no production identity
provider adapter currently exists. Unknown, malformed, and development tokens
cannot establish an identity in production. `/auth/me` remains server-derived
and unauthenticated requests receive `401`.

The existing SHS permission map and Trusted Reporting route guards remain in
place. Agent Fabric's HMAC service identity remains separate from human
identity. No client role, tenant, organization, actor, frontend state,
localStorage value, Oracle result, Truth state, report governance decision,
snapshot, publication, or public surface was changed.

The identity contract is documented in
`docs/SHF_PRODUCTION_IDENTITY_AUTHENTICATION_CONTRACT.md`. The remaining
critical blocker is external production identity/session integration and its
synthetic HTTP proof; classification is
`PRODUCTION_IDENTITY_EXTERNAL_PROVIDER_REQUIRED`. Trusted Reporting remains
`NOT_PRODUCTION_READY`, while Hub remains `PUBLIC INFRASTRUCTURE READY` /
`REAL PUBLIC DATA NOT YET AVAILABLE`.

## Production identity-provider requirements review

Auth0 is now the approved provider using the vendor-neutral `OIDC_GENERIC`
adapter boundary: verified provider subject and identity attributes flow into
SHS-owned identity mapping, current tenant/organization membership, roles,
permissions, and request scope. Provider claims cannot directly grant SHS
governance authority. Agent Fabric HMAC service identity remains separate from
human identity.

`apps/shs-api/src/auth/production-identity.ts` implements Auth0 RS256/JWKS
verification and exposes only minimal provider identity facts plus SHS
identity-resolution types. It does not return provider-derived permissions or
scope. The SHS API resolves a pre-existing identity link and active membership,
then creates a server-owned HttpOnly session. Requirements, ownership, session
recommendation, lifecycle rules, scorecard, and compatibility classifications
are recorded in `docs/SHS_PRODUCTION_IDENTITY_PROVIDER_DECISION.md`.

Production remains fail-closed and `NOT_PRODUCTION_READY`. Human approval is
required for provider selection, session architecture, identity ownership,
MFA/recovery, lifecycle, federation scope, and operating cost. The next task
is Auth0 tenant/callback configuration, identity-link and membership
provisioning, then a synthetic production-like HTTP proof.
## Auth0 live integration proof status

The approved Auth0 adapter, durable identity-link/session implementation, and production fail-closed guards remain in place. On 2026-08-26, live proof was `UNAVAILABLE`: no authorized Auth0 test-tenant configuration or production-like identity/session variables were present, and PostgreSQL was not listening on `localhost:5432`. Migration 028 was therefore not applied, and no live HTTP identity flow was attempted or claimed.

Code-level Auth0 verification and auth-boundary tests pass. No real Auth0 user, credential, identity link, session, governance record, reporting record, Hub claim, or public state changed. Trusted Reporting remains `NOT_PRODUCTION_READY`; Hub remains `PUBLIC INFRASTRUCTURE READY` / `REAL PUBLIC DATA NOT YET AVAILABLE`. The next authorized task is to configure an explicitly authorized Auth0 test tenant and local PostgreSQL, apply migration 028 with repository-native tooling, and run the synthetic HTTP identity proof.
## Trusted deployment/network boundary audit

The bounded Azure deployment-model slice is complete. Classification is
`AZURE_PRODUCTION_MODEL_CODE_COMPLETE_DEPLOYMENT_PENDING`: Terraform now
represents the approved Azure Container Apps, private PostgreSQL Flexible
Server, VNet/private DNS, ACR, Key Vault managed-identity, and monitoring
topology. The required exposure contract is recorded in
`docs/SHF_TRUSTED_REPORTING_DEPLOYMENT_NETWORK_CONTRACT.md`.

The intended zones are explicit: public edge for frontend assets and the
published curriculum Impact GET; authenticated edge for SHS human API use;
internal-service-only for Agent Fabric and Truth/Evidence mutation; worker-only
for the trusted-reporting worker; database-internal-only for PostgreSQL; and
development-only for fixture identity and legacy demo routes. HMAC service
authentication remains required in addition to private networking.

One bounded safety fix removed production mounting of legacy SHS demo identity,
organization, role, invite, and audit-log fixture routes. Auth0 integration,
reporting architecture, Hub status, public curriculum semantics, and public
Impact behavior were unchanged. The production-hardening status remains
`NOT_PRODUCTION_READY`; identity remains
`AUTH0_CODE_COMPLETE_EXTERNAL_CONFIGURATION_PENDING`. The next authorized
task is to install/enable the approved Terraform toolchain, validate the stack,
and deploy an explicitly authorized synthetic staging environment to prove
ingress, TLS, private service, worker, and database boundaries.
## Canonical Azure production deployment model

The approved Azure deployment model is now represented in Terraform under
`infra/azure/` and documented in
`docs/SHF_TRUSTED_REPORTING_AZURE_DEPLOYMENT_MODEL.md`. It uses Azure Container
Apps, Azure Database for PostgreSQL Flexible Server, Azure Container Registry,
custom VNet/private DNS, Key Vault managed identities, Azure Monitor/Log
Analytics, Auth0, and Terraform.

Classification is
`AZURE_PRODUCTION_MODEL_CODE_COMPLETE_DEPLOYMENT_PENDING`. The model places
SHS API at authenticated external ingress, Agent Fabric on internal ingress,
the trusted-reporting worker without ingress, and PostgreSQL on a private
database subnet. Explicit production origins, durable database configuration,
secret references, and no production fixture routes are represented.

Terraform was not available locally, so `fmt`, `init -backend=false`, and
`validate` could not run. No Azure credentials or subscription access were
used; no resources were deployed. The next authorized task is Terraform
toolchain validation followed by an explicitly authorized synthetic staging
deployment proof. Auth0 external configuration, migrations, worker recovery,
network policy, monitoring, backup, retention, and rate limiting remain
separate deployment dependencies. Hub remains inactive/data-dependent.
## Azure Terraform static validation

The approved Azure model under `infra/azure/` is now statically validated.
Terraform `v1.15.8` resolved AzureRM `v4.81.0`; recursive formatting,
`terraform init -backend=false`, and `terraform validate` passed on 2026-08-26.
The pass corrected invalid HCL semicolon separators and an AzureRM Key Vault
argument deprecation. No Azure subscription was authenticated and no resource
was created.

The model is classified
`AZURE_TERRAFORM_VALIDATED_READY_FOR_STAGING_PLAN`. Remote state is not yet
configured; staging and production require separate encrypted Azure Storage
state keys with restricted access/locking. The next authorized task is an
authenticated staging plan/deployment proof, including secret bootstrap,
private networking, migration execution, worker supervision, HTTPS, probes,
and Auth0 test configuration. Hub remains inactive/data-dependent.

## Azure staging deployment slice (2026-08-26)

The bounded remote-state and staging deployment attempt is blocked before any
Azure write. `az account show` returned no authenticated account, subscription,
or tenant context, so the environment could not be established as an authorized
non-production staging target. No remote state resources, Terraform plan,
apply, images, secrets, or staging data were created.

A separate bootstrap stack now exists at `infra/azure/bootstrap/` for restricted
Azure Storage state. It uses separate state keys for staging and production,
private storage access, HTTPS/TLS 1.2, blob versioning, and least-privilege
state access. The main stack retains an empty AzureRM backend block and is
initialized only with externally supplied backend configuration. A non-secret
`infra/azure/staging.tfvars.example` records the required staging inputs.

Both Terraform stacks passed `terraform fmt -check -recursive`,
`terraform init -backend=false`, and `terraform validate` with Terraform
`v1.15.8` and AzureRM `v4.81.0`. The current task classification is
`AZURE_STAGING_DEPLOYMENT_BLOCKED_BY_CREDENTIALS`. The next authorized gate is
an explicit staging Azure context, followed by state bootstrap, secret/image
provisioning, and a reviewed staging-only plan; apply remains separately
gated.

## Azure staging bootstrap and plan attempt (2026-08-26)

The authorized staging operation could not begin because the Azure CLI is not
installed (`az: command not found`). No Azure account, tenant, subscription,
or staging authorization could be verified. In accordance with the safety
gate, provider registration, state bootstrap, backend initialization, plan,
and apply were not attempted; no Azure resources or state were changed.

The separate state bootstrap and parent Terraform configurations remain
backendless-validated with Terraform `v1.15.8` and AzureRM `v4.81.0`. The
current classification is `AZURE_STAGING_CONTEXT_UNAVAILABLE`. The next
authorized task requires installing/authorizing the Azure CLI context and
confirming a clearly non-production staging subscription before any write.

## Azure CLI setup attempt (2026-08-26)

Azure CLI `2.89.1` is now installed through Homebrew. Interactive `az login`
was started but did not complete during this run, so no tenant, subscription,
or authorized staging context is verified. No Azure writes were performed. The
current classification is `AZURE_CLI_INSTALLED_LOGIN_REQUIRED`; the next step
is to complete the approved interactive login and then perform read-only
subscription/provider checks.

## PostgreSQL migration orchestration (2026-08-26)

The canonical TypeScript migration runner is now implemented at
`apps/shs-api/src/db/migration-runner.ts` with numeric filename discovery,
SHA-256 checksum/drift detection, durable `schema_migrations` bookkeeping,
bounded PostgreSQL advisory locking, per-migration transactions, fail-closed
unknown-history handling, read-only status/plan, explicit `up`, and an explicit
operator-controlled baseline command. Migration 028 participates in the same
ordered chain; historical SQL files were not rewritten.

Package commands are `db:migrate:status`, `db:migrate:plan`, `db:migrate`, and
`db:migrate:baseline`. API startup does not mutate schema. Production migration
commands require an explicit `DATABASE_URL`; no credential fallback or
automatic rollback exists.

Focused migration tests passed 6/6, SHS API typecheck/build passed, and census,
rebuild, manifest, and diff checks passed. PostgreSQL was unavailable at
`localhost:5432`, so fresh-database, upgrade, rollback, and concurrency
runtime proof remains pending. Current classification:
`MIGRATION_ORCHESTRATION_CODE_COMPLETE_POSTGRES_RUNTIME_PROOF_PENDING`.
Azure staging and Auth0 remain deferred external work; Hub remains
data-dependent.

## PostgreSQL migration runtime proof (2026-08-26)

The migration runner is now runtime-proven against disposable local PostgreSQL
`16.12` databases. Fresh `001→028` execution persisted 28 ordered checksummed
rows and migration-028 identity/session structures; a second run was a no-op.
An upgrade database applied `001→010` first and then only pending migrations.

Real disposable fixtures proved plan/status non-mutation, transaction rollback,
stop-chain behavior, checksum drift rejection, unknown-history rejection,
explicit baseline confirmation/exact-ID behavior, advisory-lock contention,
lock release, and current-schema readiness. No Azure, staging, production, or
participant database was used, and all disposable databases were removed.

Classification is now `MIGRATION_ORCHESTRATION_COMPLETE_RUNTIME_PROVEN`.
The next authorized task is Trusted Reporting outbox worker runtime hardening;
Azure staging and Auth0 remain deferred external work.

The final readiness fixtures returned `READY`, `pending_migrations`,
`migration_drift`, and `unknown_applied_migration` for their respective
disposable database states. Those databases were removed after verification.

## Trusted Reporting outbox worker hardening (2026-08-26)

The canonical SHS outbox worker now uses migration
`029_trusted_reporting_outbox_worker_hardening.sql` for durable lease
ownership, database-time lease expiry/reclamation, bounded retry scheduling,
failure classification, quarantine state, and backlog aggregates. Completion
and failure transitions are scoped to the current lease owner. The continuous
worker loop stops claiming on SIGTERM/SIGINT; unfinished work remains
recoverable through lease expiry.

Local PostgreSQL 16.12 proof on a disposable database applied migrations
001-029, verified 29 checksummed migration rows, delivered one synthetic event,
excluded a concurrent second claim, persisted state across repository
recreation, reclaimed an expired lease, and preserved retry/backlog state. The
existing isolated Agent Fabric proof confirms retries retain the same
idempotency key and return one canonical operational event on replay. No real
Hub/curriculum/participant data was changed and no Azure/Auth0 operation was
performed.

Focused worker hardening tests, migration/outbox tests, SHS API typecheck, and
build pass. Current classification is
`OUTBOX_WORKER_RUNTIME_HARDENING_COMPLETE`. The next authorized task is
Trusted Reporting rate-limiting and abuse-protection hardening. Azure remains
`DEFERRED_EXTERNAL_INFRASTRUCTURE`, Auth0 remains
`DEFERRED_EXTERNAL_CONFIGURATION`, and Hub remains
`WAITING_FOR_REAL_CANONICAL_DATA`.

## Trusted Reporting rate limiting (2026-08-26)

The SHS API now has route-class-aware rate-limit middleware protecting the
canonical public Impact read, login/session establishment, authenticated user
APIs, governance mutations, and expensive reporting operations. Public/login
keys use Express `req.ip` without implicit forwarded-header trust; authenticated
keys use server-resolved identity, tenant, and organization. Health routes are
not user-rate-limited.

Production uses shared PostgreSQL fixed-window counters from migration
`030_rate_limit_windows.sql`, database time, atomic upsert, expiry indexing,
explicit `Retry-After`, and 503 fail-closed behavior when the limiter backend
is unavailable. Development/test memory state is explicitly non-production.
Production requires all limiter class values and `DATABASE_URL`; no weak
defaults are accepted.

Focused limiter tests, real local PostgreSQL concurrent-counter proof, SHS
typecheck/build, reporting regressions, and validators passed. Agent Fabric
internal ingestion remains separately protected by HMAC and network isolation,
but lacks a shared PostgreSQL limiter adapter and is therefore an explicit
remaining route-coverage gap. No reporting semantics, outbox behavior,
Azure/Auth0 state, or Hub data changed. Current classification is
`RATE_LIMITING_ROUTE_COVERAGE_GAP_REMAINS`.

## Agent Fabric internal ingestion rate limiting (2026-08-26)

Agent Fabric internal ingestion now performs HMAC authentication, trusted
producer/event binding, non-mutating operational-event validation, and then a
shared PostgreSQL `INTERNAL_INGESTION_LIMIT` decision before event persistence.
The native Python adapter reuses migration 030's `rate_limit_windows` schema,
database-time fixed windows, atomic upsert, producer-scoped namespace,
`Retry-After`, and production 503 fail-closed behavior. Invalid HMAC and
binding requests cannot consume another producer's bucket, and throttled or
backend-failed requests do not create Operational Events.

Focused Agent Fabric authentication/binding and limiter tests passed. A real
local PostgreSQL 16.12 disposable-database proof with four concurrent requests
from one trusted producer admitted exactly two under a max-two window and
persisted one shared counter of four; the disposable database was removed.
No Azure, Auth0, Hub, reporting semantic, Truth, Evidence, or production data
changed.

The internal-ingestion route coverage gap is closed at the mechanism level.
Production numeric policy values remain explicit configuration inputs and are
not yet institutionally approved. Current classification is
`RATE_LIMITING_CODE_COMPLETE_PRODUCTION_POLICY_VALUES_PENDING`. The next
authorized task is Trusted Reporting operational monitoring and alerting hook
hardening.

## Trusted Reporting operational monitoring hooks (2026-08-26)

The code-side monitoring slice adds vendor-neutral TypeScript and Python
operational telemetry adapters with one allowlisted event shape, severity and
outcome classification, aggregate counters, sink-failure isolation, and
configurable outbox backlog alert predicates. Sensitive payloads, credentials,
tokens, signatures, database URLs, and participant data are excluded from
telemetry metadata. Production backlog thresholds are required configuration
inputs and remain `PRODUCTION_POLICY_VALUE_REQUIRED`.

SHS rate-limit decisions, internal errors, and trusted-reporting worker claim,
delivery, retry, and quarantine transitions emit operational signals. Agent
Fabric ingestion acceptance, idempotent replay, validation rejection,
authentication rejection, persistence failure, and shared-limiter backend
failure emit corresponding signals. Agent Fabric public health diagnostics were
sanitized to remove subprocess output/error tails while preserving health
status shape. Telemetry is not Truth, Evidence, reporting metrics, or
governance audit, and no migration was added.

Focused telemetry, rate-limit, worker, ingestion, authentication, and health
tests passed; SHS typecheck/build, frontend build, Python compilation,
validators, and diff checks passed. The broader Agent Fabric suite retains six
unrelated pre-existing SQLite payout/pool/treasury failures. Azure/Auth0 and
Hub remain deferred/data-dependent. Current classification is
`OPERATIONAL_MONITORING_CODE_COMPLETE_ALERT_THRESHOLDS_PENDING`. The next
authorized task is Trusted Reporting retention and data-lifecycle enforcement.

## Trusted Reporting retention and lifecycle enforcement (2026-08-26)

The retention slice adds an explicit, vendor-neutral lifecycle maintenance CLI
and manager under `apps/shs-api/src/db/`. It supports status, no-mutation plan,
and explicitly confirmed cleanup. Cleanup is allowlisted to expired
`rate_limit_windows`, aged expired/revoked `shs_identity_sessions`, and aged
`DELIVERED` `integration_outbox` rows. It uses database time, indexed
predicates, bounded `FOR UPDATE SKIP LOCKED` batches, transactions, and safe
operational telemetry. It is not invoked by API startup.

Truth, Evidence, Sources, Truth history, report artifacts/history, governance
sign-offs and audit events, snapshots, publications, public projections,
identity links, memberships, and `schema_migrations` are explicitly outside
the cleanup allowlist and have no automatic deletion path. Pending, retryable,
leased, failed-final, and quarantined outbox rows are preserved. Missing
retention duration configuration produces a no-delete result; no institutional
or legal duration is asserted. The batch default is bounded at 100.

Local PostgreSQL 16.12 disposable proof passed: canonical migrations through
030, dry-run without mutation, one expired rate window removed while active
remained, expired and revoked sessions removed while active remained, one aged
delivered outbox row removed while pending remained, second cleanup no-op, and
session foreign-key integrity remained valid. No migration was added. No
Azure/Auth0 operation or shared database was used. Current classification is
`RETENTION_CODE_COMPLETE_PRODUCTION_POLICY_VALUES_PENDING`; production policy
durations and external log retention remain pending. The next authorized task
is the legacy/duplicate/orphan cleanup audit with safe demolition controls.

## Trusted Reporting legacy/orphan closure (2026-08-26)

The bounded legacy audit classified active canonical routes and repositories,
presentation-only browser/static/demo paths, development/test persistence,
active compatibility bridges, and remaining replacement candidates. No source
artifact was deleted: `src/data/shsReports/shsReportSeedData.js` has no runtime
caller, but the reporting lineage registry and implementation-status
documentation still name it as a controlled legacy artifact, so its deletion
gate is not complete.

`shsReportStorage.js` remains because `/ops/reports` and
`/ops/reports/export-metadata` still use it. The browser Truth Spine
adapter/engine remains active for Hub/admin compatibility flows, and the
curriculum public-population compatibility bridge remains explicitly active.
Legacy `reports.publish`, static/demo Impact values, browser history, and local
JSONL/SQLite stores remain noncanonical and were not deleted without caller or
replacement proof. Canonical Truth/Evidence/governance/publication history,
public projection, identity links, migration history, and data were untouched.

Focused legacy safety, canonical curriculum/publication, route, auth, and
reporting regressions plus build/validators passed. Current classification is
`LEGACY_CLEANUP_COMPLETE_ACTIVE_COMPATIBILITY_BRIDGES_REMAIN`. The next
authorized task is local production-equivalent Trusted Reporting E2E.

## Local production-equivalent Trusted Reporting E2E acceptance (2026-08-26)

The bounded acceptance attempt used synthetic references and a disposable local
PostgreSQL 16.12 database. Canonical migrations 001 through 030 applied and
were current. Agent Fabric's real FastAPI ingestion/projection runtime tests,
SHS worker/governance/publication tests, frontend/public-path tests, builds,
and validators passed.

Full assembled E2E closure was not claimed. The existing `lesson.completed`
producer is a browser transport path to Agent Fabric, while the SHS
transactional outbox currently has backend producers for other event classes
and no canonical transactional SHS lesson-completion producer route. Direct
outbox insertion would have falsified the required producer transaction proof
and was not used. A temporary Agent Fabric process started successfully, but
the execution sandbox prevented a separate HTTP client from reaching its
loopback listener. The exact evidence and 36-item matrix are in
`docs/SHF_TRUSTED_REPORTING_LOCAL_E2E_ACCEPTANCE.md`.

Classification: `LOCAL_E2E_RUNTIME_COMPONENT_UNAVAILABLE`. Azure remains
`DEFERRED_EXTERNAL_INFRASTRUCTURE`, Auth0 remains
`DEFERRED_EXTERNAL_CONFIGURATION`, Hub remains
`WAITING_FOR_REAL_CANONICAL_DATA`, and rate-limit, monitoring, and retention
policy values remain pending. No reporting architecture or compatibility bridge
was changed. The next authorized task is the final code-side assurance audit,
subject to review of the missing lesson-producer/outbox assembly and supported
cross-process HTTP harness.
## Canonical curriculum transactional producer assembly (2026-08-26)

The curriculum completion producer gap is closed in code. Authenticated
`POST /curriculum/lessons/:lessonId/complete` derives the server-owned user and
organization, persists `curriculum_lesson_completions`, and inserts the
existing `lesson.completed` event into `integration_outbox` in one transaction.
Migration 031 is part of the canonical migration chain. Completion and
idempotency identities are deterministic, so duplicate client retries resolve
to one completion and one outbox row.

Disposable PostgreSQL transaction tests passed, and live local SHS HTTP
requests returned the same synthetic completion/outbox identity on retry. The
Agent Fabric binding now includes only the exact `curriculum.lesson` /
`lesson.completed` pair needed for delivery; HMAC, producer/event binding,
shared rate limiting, and downstream idempotency remain mandatory. A post-fix
worker-to-Agent-Fabric projection capture was not unambiguously completed due
local process/loopback harness collisions, so the current classification is
`CURRICULUM_PRODUCER_CODE_COMPLETE_CROSS_PROCESS_PROOF_PENDING`.

Azure remains `DEFERRED_EXTERNAL_INFRASTRUCTURE`; Auth0 remains
`DEFERRED_EXTERNAL_CONFIGURATION`; Hub remains
`WAITING_FOR_REAL_CANONICAL_DATA`. The next authorized task is the final
code-side assurance audit.

## Final code-side assurance audit (2026-08-26)

The final assurance reconciliation found no new code defect or SHF/SHS
institutional authority crossover. The canonical producer, ingestion,
transactional outbox, migration chain through 031, worker, rate limiting,
monitoring hooks, retention guards, governance/publication chain, and legacy
boundaries remain intact. SHF and SHS share technical infrastructure only;
this audit does not claim completion of a separate SHS commercial-reporting
domain audit.

## Production policy decision packet (2026-08-26)

Created `docs/SHF_TRUSTED_REPORTING_PRODUCTION_POLICY_REGISTER.md` and recorded
the approved SHF Production Operational Policy Baseline v1. Approved
application-owned values are distinct from deployment configuration and runtime
proof. Privacy/legal retention values and deployment-owned settings remain
pending.

No architecture or source behavior changed. Azure, Auth0, Hub, and the
separate SHS commercial-reporting audit remain independent queues. Current
classification: `SHF_PRODUCTION_POLICY_BASELINE_V1_RECORDED`.

Current classification:
`SHF_TRUSTED_REPORTING_CODE_SIDE_COMPLETE_EXTERNAL_RUNTIME_AND_POLICY_PENDING`.
Privacy/legal retention remains pending; approved operational values and
recovery targets are policy-only. Azure is
`DEFERRED_EXTERNAL_INFRASTRUCTURE`, Auth0 is
`DEFERRED_EXTERNAL_CONFIGURATION`, and Hub is
`WAITING_FOR_REAL_CANONICAL_DATA`. Code-side hardening stops after this audit;
the next work queue is external runtime/policy activation or a separate SHS
reporting-domain audit.

## Production Operational Policy Baseline v1 (2026-08-27)

The SHF Trusted Reporting Production Operational Policy Baseline v1 is recorded
as `APPROVED_V1`. Approved values cover rate limits, monitoring thresholds,
expired rate-window retention, delivered-outbox retention, cleanup batch size,
and recovery policy targets. Policy approval is distinct from deployment
configuration and runtime proof.

SHF Trusted Reporting code-side status is `COMPLETE`. Privacy/legal retention
policy remains `PENDING`; protected institutional history remains no-delete.
Azure remains `DEFERRED_EXTERNAL_INFRASTRUCTURE`, Auth0 remains
`DEFERRED_EXTERNAL_CONFIGURATION`, backup/restore is
`POLICY_TARGET_APPROVED_RUNTIME_DRILL_PENDING`, Hub remains
`WAITING_FOR_REAL_CANONICAL_DATA`, and the SHS reporting audit remains a
`SEPARATE_FUTURE_DOMAIN_AUDIT`. Approved SHF values are not automatically SHS
commercial-reporting policy.
