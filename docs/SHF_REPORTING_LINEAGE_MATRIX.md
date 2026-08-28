# SHF Reporting Lineage Matrix

Phase 8 audit scope: repository-wide production and demo-visible SHF surfaces
that display, calculate, export, summarize, store, or communicate quantitative
institutional information. The complete field-level matrix is the machine-
readable `SHF_REPORTING_SURFACE_REGISTRY.v1.json`; this document explains the
audit and preserves the earlier producer mapping.

## Inventory Counts

- Producer lineage entries: 17, matching `producer_lineage_registry.v1.json`.
- Confirmed report surfaces: 30.
- First canonical report surface: 1 (`curriculum.lesson_completion_count`).
- Raw candidates: 40; 30 included, 8 grouped/duplicate decisions, 2 excluded.
- No legacy surface is promoted by this document.

Every confirmed surface has one row in the JSON registry with the required
route, component, formula, source, storage, producer, ingestion/evidence/
Truth/metric/report mapping, scope, provenance, browser-storage status,
classification, action, blocker, and code evidence fields. The deterministic
checker is `scripts/check_shf_reporting_census.py`.

## Producer Matrix

| Producer | Event/record | Current storage | Truth status | Metric/report path | Classification | Evidence |
|---|---|---|---|---|---|---|
| curriculum.lesson | lesson.completed | authenticated SHS lesson-completion transaction + `integration_outbox` → Agent Fabric | eligible, projection complete | completion count v1 | CANONICAL producer | `apps/shs-api/src/domain/curriculum/service/curriculum-completion-service.ts`, `src/shared/progress/curriculumIngestionClient.js` |
| curriculum.assessment | assessment.completed | authenticated event JSONL abstraction | eligible, projection contract | no active count implementation | TRUTH_PROJECTION_REQUIRED | `src/components/lessons/AssessmentRenderer.jsx` |
| curriculum.reflection | reflection.submitted | authenticated event JSONL abstraction | evidence only | none | METRIC_REQUIRED | `src/components/lessons/LessonBody.jsx` |
| curriculum.browser.ledger | ledger:events:v1 | localStorage transport | restricted | none | REMOVE authority / migrate quarantine | `src/shared/progress/progressClient.js` |
| shs.reports.records | report.record.saved | localStorage | not applicable | legacy SHS reports | REMOVE authority | `src/data/shsReports/shsReportStorage.js` |
| shs.reports.seed.records | seed.report.record | seed JSON | not applicable | legacy fallback | REMOVE from production reachability | `src/data/shsReports/shsReportSeedData.js` |
| exchange.workspace.reports | exchange.report.workspace_state | browser workspace storage | operational only | Exchange report | INGESTION_REQUIRED | `src/pages/exchange` census |
| grant.binder.logs | grant.binder.log | browser localStorage log aggregator | operational only; no Evidence/Truth | none | PRODUCER_REQUIRED | `src/pages/admin/GrantBinder.jsx`, `src/utils/logAggregator.js` |
| shs.grant_binder | grant_binder.created v1 | PostgreSQL `grant_binders` + transactional `integration_outbox` → Agent Fabric operational events | operational event only; Evidence/Truth intentionally absent | none | OPERATIONAL_ONLY | `apps/shs-api/src/domain/grant-binder/service/grant-binder-service.ts`, `apps/shs-api/src/domain/trusted-reporting/outbox.ts`, `services/shf-agent-fabric/routers/shf_internal_ingestion_routes.py` |
| placement.kpi.browser.metrics | placement.kpi.snapshot | browser metrics client | aggregate only | placement rate | PRODUCER_REQUIRED | `src/pages/admin/PlacementKPIs.jsx` |
| impact.ohio.map.static | static county outcome | static frontend data | publication candidate only | public impact map | PROVENANCE_INSUFFICIENT | `src/pages/shf-command/components/SHFImpactOhioMap.jsx` |
| loo.impact.mock.outcomes | mock outcome | mock data | not applicable | Lord of Outcomes | DEMO_ONLY | `src/utils/lordOutcomes/mockOutcomesData.js` |
| iep.fabricated.student.data | fabricated student | client fixture/state | not applicable | IEP calculations | REMOVE from institutional reporting | `src/pages/iep`, `src/pages/iep-command-v2` |
| reporting.fabricated.csv | fabricated export | client-generated | not applicable | CSV export | REMOVE | lineage registry |
| oracle.advisory.outputs | advisory output | Oracle service | evidence only | readiness/report context | PROVENANCE_INSUFFICIENT | `services/shf-agent-fabric/services/oracle_service.py` |
| hub.identity.dev.token | dev identity | development token | not applicable | Hub/report access | REMOVE in production | lineage registry |

## Report Surface Matrix

| Surface ID | Surface/file | Current source | Scope | Classification | Required action |
|---|---|---|---|---|---|
| surface.curriculum.progress | curriculum progress views | browser progress/ledger plus new transport | internal | REPORTING_SERVICE_REQUIRED | use canonical report endpoint |
| surface.curriculum.lesson_completion | personal lesson completion status at `/curriculum/lesson/:id` | learner-local lesson record plus progress transport queue | student | NOT_APPLICABLE | preserve personal UX and sync status; do not bind to institutional completion count |
| surface.assignments | placeholder assignment lists at `/curriculum/asl/assignments` and `/assignments` | component state with hardcoded open items | student UX | NOT_APPLICABLE | retain navigation/interaction only; no institutional metric or producer exists |
| surface.shs.reports.dashboard | SHS report dashboard | localStorage + seed fallback | admin | REMOVE | isolate as demo until backend report storage exists |
| surface.shs.reports.create | SHS create report | `ShsCreateReportPage` → `POST /reporting/drafts` → PostgreSQL draft repository → same-transaction `integration_outbox` (`report.created`) → authenticated `/shf/internal/ingestion/events` | server-derived tenant/org/actor | BACKEND_OWNED_DRAFT_WORKFLOW / `NOT_APPLICABLE` | `report.created` is operational workflow telemetry only; draft creation does not justify Evidence/Truth; a distinct submitted/finalized event would be required for future institutional review |
| surface.shs.reports.history | SHS report history | authenticated report-draft API + PostgreSQL revisions | admin | NOT_APPLICABLE | operational history only; no Truth/metric/report contract justified |
| surface.exchange.investor | Exchange Investor Funding Commitments | backend commitment → transactional outbox → authenticated Operational Event → narrow Evidence/Source/Truth projection → historical distinct-count metric → Reporting Service → one connected frontend field | internal/funder | PARTIAL_CANONICAL | retain only the historical commitment-count field; do not infer transfer or settlement |
| surface.shs.reports.export | SHS export metadata | localStorage/fabricated export path | admin | REMOVE | export canonical report projection only |
| surface.exchange.workspace | Exchange workspace reports | browser workspace storage | internal | INGESTION_REQUIRED | authenticated workspace event producer |
| surface.grant.binder | Grant Binder workspace/reporting at `/grant-binder` | backend workspace + transactional outbox + operational event; browser logs remain operational history | internal/funder | NOT_APPLICABLE | retain creation as operational/audit history; require a real submission/finalization event before institutional projection |
| surface.placement.kpis | Placement KPI page | browser metrics | internal | PRODUCER_REQUIRED | collect placement outcomes with scope |
| surface.impact.ohio | SHF Impact Ohio map | static values | public | PROVENANCE_INSUFFICIENT | identify producer and public approval path |
| surface.impact.center | Impact Center KPI panels | static/mock/page values | public/internal | REMOVE | replace only after canonical metrics |
| surface.loo.home | Lord of Outcomes home | mock outcomes | public/demo | DEMO_ONLY | label demo and block institutional use |
| surface.loo.program_outcomes | Program outcomes | mock/API mix | public | PROVENANCE_INSUFFICIENT | audit API producer and metric definitions |
| surface.iep.dashboard | IEP dashboard | fabricated/client calculations | restricted | REMOVE | separate operational case workflow from reporting |
| surface.hub.reports | Hub Reports | `/hub/reports` → `HubReports.jsx` | Hub Referrals Created uses `/shf/reports/hub.referral-created-count`; readiness/Truth/audit use browser Truth; workflow/export values are static/demo | internal | PARTIAL_CANONICAL_CREATED_COUNT_CONNECTED / `REPORTING_SERVICE_REQUIRED` | retain canonical created-count field; classify or suppress remaining values before further migration |
| surface.reports.briefings | Reports & Briefings panel | Board Brief, Grant Narrative, and Program Health Memo consume the workforce Reporting Service as historical verified-employment presentations; remaining `EXPORT_ITEMS` are static presentation/demo selectors | internal/public | PARTIAL_CANONICAL | retain the three bounded internal compositions; review Donor Summary and Public Impact Snapshot independently and preserve public/privacy gates |
| surface.fabric.reports | institutional/funder PDF builders | report builders and Oracle-adjacent inputs | internal/funder | REPORTING_SERVICE_REQUIRED | consume canonical metric/report contracts |

## Browser Authority Findings

Authoritative dead ends identified in this audit are the curriculum ledger,
SHS report records/drafts/history/exports, Exchange workspace state, Grant
Binder aggregation, placement KPI metrics, Hub reports, and Truth Spine
frontend adapters. Curriculum now treats its browser ledger as transport and
retains it after failed synchronization; the remaining surfaces are not
converted in Phase 8.

Acceptable browser uses include presentation preferences, temporary drafts,
offline transport queues, and non-authoritative UI state. Browser data is not
an approval, verification, tenant, organization, or metric authority.

## Canonical Vertical Slice

`src/pages/curriculum/Lesson.jsx`
→ authenticated SHS `POST /curriculum/lessons/:lessonId/complete`
→ PostgreSQL completion + `integration_outbox` in one transaction
→ hardened worker/HMAC delivery
→ Agent Fabric operational event repository
→ `POST /shf/ingestion/events/{event_id}/truth-projection`
→ Evidence / Truth source / unapproved claim
→ authorized verification and approval
→ `curriculum.lesson.completion_count.v1`
→ `GET /shf/reports/curriculum.lesson-completion-count`

## Audit Boundary

The existing legacy report builders, Oracle advisory outputs, and frontend
surfaces remain compatibility or demonstration paths. They must not be
described as canonical until each row has a real producer, authenticated
ingestion, evidence, Truth, metric, and reporting-service reference.

## Hub Referral Metric Eligibility

The isolated runtime handoff is verified, while the Source remains unverified
and the claim remains draft/unapproved by default. `hub_referral_created`
claims now preserve canonical subject, predicate, occurred-at, evidence/source,
lineage, tenant/org, producer, verification, approval, and version metadata.
Truth Spine provides separately authorized internal approval/revocation; it
requires verified Source state and never changes `public_approved`. The narrow
`hub.referral.created_count.v1` is now the sole canonical metric for this
producer, and the `Referrals Created` field on `surface.hub.referrals` is now
`CANONICAL` through `GET /shf/reports/hub.referral-created-count`. Operational
lifecycle counts remain API projections, and completion rate remains
unavailable because no canonical completion metric exists.

## Hub referral public eligibility review

`hub.referral.created_count.v1` and `report.hub.referral.created_count.v1` are
canonical registrations with the verified producer lineage documented above.
Their public meaning is limited to the count of canonical Hub referral records
created during a reporting period. The metric does not establish service
delivery, acceptance, completion, participant outcome, successful placement,
need resolution, or community impact.

The candidate classification is
`PUBLIC_ELIGIBLE_WITH_NEW_DISCLOSURE_POLICY` at the review level. The existing
curriculum policy is not reusable automatically. A referral-specific policy
scope and institutional values for threshold, geography, period, referral
category/provider specificity, repeated releases, combination risk, rare
events, and re-identification remain unresolved.

The public governance stack now has an explicit multi-report registration layer
for eligibility, policy resolution, disclosure decisions, snapshots, publication
authorization/action, and projection storage. Curriculum and Hub evaluation
remain explicit registered adapters. Hub v1 now has an approved
`PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY` policy and evaluator, but no exact Hub
disclosure decision, snapshot, publication, projection, or UI cutover has been
created. The current real Hub population remains draft/unapproved and cannot
produce a real public eligibility or disclosure decision.
until the metric is exposed through the Reporting Service. Completion, success,
outcome, conversion, and rate metrics still require
additional producer events and, for rates, a defensible denominator.

## Hub Truth public-approval workflow review

The exact Hub Truth predicate is `hub_referral_created` /
`referral_created`, produced through the authenticated referral outbox and
Agent Fabric Evidence/Source/Truth path. Truth claim public approval is
version-bound, separately permissioned, audited, and reset on substantive
version creation. However, the current `public_approved` predicate also feeds
unauthenticated raw Truth claim/package routes, and Hub claims carry
participant/case-linked identifiers and Evidence/Source references. No
aggregate-only public-population state exists. Classification is
`HUB_PUBLIC_APPROVED_SEMANTICS_UNSAFE_FOR_PARTICIPANT_LINKED_TRUTH`; no Hub
claims were approved and the next prerequisite is a versioned population
contract separating aggregate eligibility from direct Truth visibility.

That population-eligibility authority is now implemented as an append-only,
claim/version-bound Truth governance log with a distinct permission and
predicate registry. Hub approval remains fail-closed until institutional
authority configuration is present; no real Hub claims were changed.

## Phase 9 Wave 2C Infrastructure Checkpoint

`apps/shs-api/src/domain/cases/service/case-service.ts` now records the
minimized `hub.referral` / `referral.created` integration event in the same
PostgreSQL transaction as the referral and audit event. The outbox dispatcher
signs the event for `POST /shf/internal/ingestion/events`; Agent Fabric
validates the service identity and invokes the existing ingestion, Evidence,
and Truth projection services. The source remains unverified and the claim
remains draft/unapproved. Production secret-provider configuration, production
migration, and managed worker scheduling remain deployment prerequisites; they
do not change the metric eligibility decision.

## First Canonical Curriculum Reporting Slice

`src/pages/curriculum/sections/LearningProgressCard.jsx`
→ `src/shared/reporting/curriculumReportingClient.js`
→ `GET /shf/reports/curriculum.lesson-completion-count`
→ `curriculum.lesson.completion_count.v1`
→ canonical metric value and lineage metadata.

The dashboard’s lesson-completion count no longer reads browser progress or a
page-local formula. Browser progress remains available for personal UX and
transport synchronization. The broader dashboard remains `MIGRATE` because
unrelated cards were intentionally not converted in this slice.

## Coverage Record

Independent passes covered semantic/report terms; formula and aggregation
patterns; browser storage; seed/mock/fake/fabricated/demo/sample/static/
fallback data; frontend route/page families; and backend report, CSV, PDF,
export, summary, statistics, and aggregation code.

Directories examined included `src/pages`, `src/components`, `src/router`,
`src/apps`, `src/utils`, `apps/shs-api/src`, and
`services/shf-agent-fabric/{routers,services,fabric,reports}`. The raw passes
produced 40 candidates. Thirty confirmed surfaces are in the registry; eight
were grouped as duplicate child implementations and two were excluded as
backup/non-runtime files. Unresolved count is zero.
# Phase 9 Wave 1 safety closure

The migration classifications below remain unchanged. Wave 1 adds a separate
safety disposition recorded in `SHF_REPORTING_PHASE9_WAVE1_SAFETY_AUDIT.md`.
Targeted false-data paths are now suppressed, disabled, or visibly
demonstration-only. No missing producer was created and no demo/static value is
eligible for canonical Truth, Metric Registry calculation, or Reporting Service
projection.

## Phase 9 Wave 2 producer checkpoint

The Hub referral producer is confirmed in `apps/shs-api/src/domain/cases` and
has a tested and isolated-runtime-verified Agent Fabric ingestion, Evidence,
and Truth projection contract. The Truth claim now carries the canonical
lineage metadata needed for future metric evaluation, and internal approval is
a separate authorized transition from public approval. `surface.hub.referrals`
is now `CANONICAL` for the created-count field; the versioned count metric,
report mapping, and frontend client are defined and tested. No lifecycle rate
or outcome metric was added.

## Workforce employment-start metric checkpoint

The canonical workforce chain now has one registered metric:
`workforce.employment.started_verified_count.v1`. It uses the existing
`distinct_subject_count` calculator over approved, verified historical Truth
claims with `occurred_at = employment_started_at` in UTC. The distinct key is
the canonical workforce outcome ID, so replayed events, multiple Evidence or
Source rows, and Truth versions do not inflate results. The metric is not a
placement rate, current-employment count, retention, wage, transfer,
settlement, ROI, impact, or public-benefit measure.

The metric definition preserves fail-closed eligibility: verified Source and
internal Truth approval are required, and unavailable eligibility is not
converted to zero. The workforce lineage is `METRIC_COMPLETE / REPORT_REQUIRED`;
no Reporting Service report or frontend migration exists yet. The next bounded
slice is the Reporting Service review for this metric only.

## Workforce employment-start Reporting Service checkpoint

`workforce.employment.started_verified_count.v1` is now exposed by the
versioned internal report `report.workforce.employment.started_verified_count.v1`
through `GET /shf/reports/workforce.employment-started-verified-count`. The
report binds exactly one Metric Registry definition and delegates all formula,
UTC window, distinct outcome-ID, Source verification, and internal Truth
approval semantics to that registry/calculator. It returns unavailable rather
than zero when canonical eligibility cannot be evaluated and does not enable
public mode.

The workforce lineage is `REPORT_COMPLETE / FRONTEND_COMPOSITION_REQUIRED`.
The report does not imply current employment, placement, retention, wage,
transfer, settlement, ROI, impact, or public benefit. Reports & Briefings has
not been changed; its future composition remains a separate authorization.

The first public projection slice extends the canonical lineage through
immutable public snapshot, publication authorization, canonical publication,
and `shf_public_impact_projections` before the public Foundation UI. It
exposes only `Verified Lesson Completions`; retained map/sample records and
all other public claims remain noncanonical.

## Institutional population sign-off checkpoint

Truth aggregate-population approval now requires a typed
`SHF_PRIVACY_DATA_GOVERNANCE_AUTHORITY` and an exact
`PUBLIC_AGGREGATE_POPULATION_APPROVAL` sign-off for each claim/version. The
authority is distinct from raw Truth `public_approved` and report-level
eligibility/disclosure. Authority and sign-off records are append-only JSONL
development persistence; no real Hub claim has been changed. Production mode
uses the ordered PostgreSQL governance migration and fails closed when the
durable store is unavailable.
