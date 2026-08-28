# SHF Trusted Reporting Local E2E Acceptance

Date: 2026-08-26
Classification: `CURRICULUM_PRODUCER_CODE_COMPLETE_CROSS_PROCESS_PROOF_PENDING`

## Scope and safety

This was a code-side acceptance attempt using synthetic references only. The
database proof used PostgreSQL 16.12 and a disposable database named
`shf_trusted_reporting_acceptance_20260826`; it was not staging, Azure, or a
production database. No Auth0 tenant, participant data, production credential,
or Azure resource was used.

## Environment and migration state

- PostgreSQL 16.12 was started locally for the proof.
- Canonical migrations 001 through 031 applied successfully in numeric order.
- The disposable database contained 31 bookkeeping rows, including migration
  028 identity/session tables, 029 outbox hardening, 030 rate-limit state, and
  031 canonical curriculum completion persistence.
- No application migration was run from API startup.

## Runtime components

The Agent Fabric FastAPI application started successfully on a disposable
loopback port and its in-process runtime tests exercised the real
`/shf/internal/ingestion/events` route, HMAC verification, producer/event
binding, idempotency, Evidence/Source/Truth projection, metric calculation, and
reporting service. A separate shell `curl` process could not reach the
temporary listener because the execution environment isolates command network
namespaces; this prevented a cross-process HTTP assertion.

The SHS TypeScript application and trusted-reporting worker have runnable
entrypoints and the worker/outbox contract is covered by real PostgreSQL and
focused runtime tests. The `lesson.completed` browser transport now invokes
the authenticated SHS completion endpoint; the server owns completion
persistence and transactionally enqueues the existing outbox envelope.

This baseline preceded the canonical producer assembly implemented in the
follow-up task below. It remains retained as historical evidence and is not the
current producer status.

## Evidence by boundary

The following existing runtime suites were rerun:

- 69 Agent Fabric ingestion/projection/metric/report/HMAC tests passed.
- 152 SHS TypeScript tests passed with the repository `tsx` runner.
- 27 frontend/public curriculum and publication tests passed.
- SHS typecheck and build passed.
- frontend production build passed; existing chunk-size and dynamic-import
  warnings were non-fatal.
- reporting census, rebuild validator, manifest validation, Python compilation,
  and `git diff --check` passed.

The Agent Fabric lesson projection suite proves the actual route chain:
authenticated synthetic lesson event -> Operational Event -> Evidence ->
unverified Source -> draft/unapproved Truth claim. The reporting and
publication suites prove the server-owned metric, report, public eligibility,
disclosure, immutable snapshot, publication authorization, publication, and
public projection boundaries in isolation. They do not constitute one shared
HTTP transaction across both services.

## Synthetic acceptance lineage

Safe references to the canonical lineage are recorded below. Runtime-generated
opaque IDs and payloads were not copied into control documentation.

```text
producer activity: synthetic lesson.completed fixture
  -> browser transport: src/shared/progress/curriculumIngestionClient.js
  -> authenticated ingestion: Agent Fabric /shf/internal/ingestion/events
  -> Operational Event: test_shf_truth_projection_routes.py
  -> Evidence: evidence_projection_service
  -> Source: truth_spine_service evidence source
  -> Truth: lineage.curriculum.lesson.completed.v1, draft/unapproved
  -> metric: curriculum.lesson.completion_count.v1
  -> report: report.curriculum.lesson_completion_count.v1
  -> public governance: SHS report eligibility/disclosure services
  -> snapshot: report-public-snapshot service
  -> publication authorization/action: report-publication services
  -> public projection: curriculum-lesson-completions
  -> public endpoint: GET /public/impact/curriculum-lesson-completions
```

The outbox/worker handoff is independently proven for canonical backend
producers, including PostgreSQL persistence, HMAC delivery, retry,
idempotency, and no duplicate downstream event. It is not claimed here as the
lesson-completion handoff.

## Acceptance matrix

| # | Item | Result | Evidence/limitation |
|---:|---|---|---|
| 1 | Fresh migrations 001-030 | PASS | Disposable PostgreSQL runtime |
| 2 | SHS API runtime | PASS | TypeScript build/tests and runnable entrypoint |
| 3 | Agent Fabric runtime | PASS | FastAPI startup and 69 runtime tests |
| 4 | Worker runtime | PASS | Worker/outbox hardening and PostgreSQL tests |
| 5 | Producer transaction/outbox for lesson | PASS | SHS completion transaction and outbox runtime test; live HTTP duplicate proof |
| 6 | HMAC ingestion | PASS | Real Agent Fabric route tests |
| 7 | Rate limiting | PASS | Shared PostgreSQL mechanism and regressions |
| 8 | Operational Event | PASS | Agent Fabric projection runtime tests |
| 9 | Evidence | PASS | Canonical projection tests |
| 10 | Source | PASS | Canonical source creation tests |
| 11 | Truth | PASS | Draft/unapproved Truth projection tests |
| 12 | Metric Registry | PASS | Registered curriculum metric tests |
| 13 | Deterministic metric | PASS | Calculation tests |
| 14 | Reporting Service | PASS | Canonical report tests |
| 15 | Missing-data Unavailable | PASS | Frontend/report client tests |
| 16 | Aggregate public-population boundary | PASS | Governance/publication tests |
| 17 | PUBLIC_ELIGIBLE | PASS | Eligibility service tests |
| 18 | PUBLIC_DISCLOSURE_APPROVED | PASS | Disclosure service tests |
| 19 | Immutable snapshot | PASS | Snapshot tests |
| 20 | Publication authorization | PASS | Exact snapshot/authority tests |
| 21 | PUBLISHED | PASS | Publication action tests |
| 22 | Public projection | PASS | Projection boundary tests |
| 23 | Public endpoint HTTP | UNAVAILABLE | Public governance/projection HTTP assembly was outside this bounded producer task |
| 24 | Frontend canonical display | PASS | Client/surface/build tests; browser run unavailable |
| 25 | Invalid HMAC denial | PASS | Agent Fabric tests |
| 26 | Unauthorized governance denial | PASS | Governance tests |
| 27 | Tenant/org isolation | PASS | Scope and ingestion tests |
| 28 | Oracle non-authority | PASS | Registry and route tests |
| 29 | Browser-storage non-authority | PASS | No fallback in canonical client tests |
| 30 | Agent Fabric outage/recovery | PASS | Worker retry/recovery tests; assembled HTTP unavailable |
| 31 | Worker idempotency | PASS | Stable event identity/downstream replay tests |
| 32 | Monitoring signals | PASS | Telemetry hook tests |
| 33 | Retention protection | PASS | Lifecycle allowlist/immutable guard tests |
| 34 | Compatibility bridge safety | PASS | Legacy closure tests |
| 35 | No duplicate institutional event | PASS | Idempotency tests |
| 36 | Exact assembled lineage captured | PASS | Canonical completion/outbox identity captured; downstream lineage remains covered by Agent Fabric runtime suites |

## Deferred boundaries and follow-up

Invalid HMAC, unauthorized governance actors, cross-scope requests, rate-limit
rejections, missing canonical data, Oracle use, and browser storage are covered
by fail-closed focused tests. The production-only dev/fixture identity guard
remains intact. Monitoring telemetry remains outside Truth and reporting
metrics. The active curriculum compatibility bridge remains documented and was
not removed.

Azure staging remains `DEFERRED_EXTERNAL_INFRASTRUCTURE`. Auth0 live tenant
proof remains `DEFERRED_EXTERNAL_CONFIGURATION`. Hub real public data remains
`WAITING_FOR_REAL_CANONICAL_DATA`. Rate-limit values, monitoring thresholds,
and retention durations remain explicit policy inputs pending institutional
configuration.

The next authorized task is the final code-side assurance audit. Azure, Auth0,
and the assembled public HTTP deployment proof remain external/deferred.

## Canonical lesson producer assembly follow-up (2026-08-26)

The SHS API now owns `POST /curriculum/lessons/:lessonId/complete`. It derives
the authenticated user and organization, persists
`curriculum_lesson_completions`, and inserts the existing `lesson.completed`
envelope into `integration_outbox` in the same PostgreSQL transaction. Migration
031 is included in the canonical migration chain. The browser client invokes
this endpoint for lesson completion while retaining localStorage only as a
transport/UI queue.

Disposable PostgreSQL runtime tests passed for transaction rollback and
duplicate idempotency. Live local HTTP requests returned the same synthetic
completion and idempotency identity on retry:

```text
completion: curriculum_completion_fb50dddc71cd1af698a4242ff53387d3
idempotency: lesson.completed:fb50dddc71cd1af698a4242ff53387d3
outbox: outbox_733ceda4-8d03-4eba-9c96-36ddf65014be
```

The initial assembled worker attempt also identified and fixed the exact
least-privilege Agent Fabric binding for `curriculum.lesson` / `lesson.completed`.
The local process proof remains classified as cross-process runtime assembly
pending because loopback listener collisions and the disposable shell harness
prevented an unambiguous post-fix worker-to-projection capture in one run.
