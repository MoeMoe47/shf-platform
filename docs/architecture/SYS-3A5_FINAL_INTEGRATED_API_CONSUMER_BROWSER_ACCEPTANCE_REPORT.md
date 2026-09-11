# SYS-3A5 Final Integrated API / Consumer / Browser Acceptance Report

## 1. Executive Result

PARTIAL. The fresh authenticated API fixture, PostgreSQL migration/schema checks, active operator browser route, builds, and representative query plans passed. SYS-3 is not complete because the full HTTP publication-to-consumer chain, public browser consumer, and Agent Fabric runtime authority proof were not all completed.

## 2. Repository Baseline

- Path: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`
- Tracked dirty entries: 89 at baseline; owner work preserved.
- Untracked entries: 134 at baseline, 136 after SYS-3A5 acceptance artifacts.
- Migration filename head: `121_report_publication_supersession_current.sql`.
- Disposable database: `shs_sys3a5_20260909` on local PostgreSQL port 55433.

## 3. Active Entrypoint Map

| Surface | Route/Entrypoint | Active | API-Backed | Canonical Consumer | Acceptance Required |
|---|---|---:|---:|---|---:|
| Root frontend | `src/entries/index.main.jsx` | PASS | PASS | SHF/CivicSure operator shell | PASS |
| Operator assurance reports | `#/operator/government-assurance/reports` | PASS | PASS | GovernmentAssurance reporting view | PARTIAL |
| Funding API | `/funding/grants*` | PASS | PASS | FundingGrantService | PASS |
| Reporting API | `/reporting/drafts*`, `/reporting/publications*` | PASS | PASS | Reporting services | PARTIAL |
| Public projection | `/public/impact/curriculum-lesson-completions` | PASS | PASS | PublicDisclosure projection | PASS for safe empty response |
| CivicSure explorer package | `apps/shf-web` explorer routes | FRAME_ONLY/MOCK_ONLY | NO | None in root entry | NOT APPLICABLE |

## 4. Acceptance Fixture

Fresh PostgreSQL fixture prefix `sys3a5-` contains three organizations, three users including revoked membership, scoped roles, permissions, two programs, reporting service entitlement, grant, allocation, and report draft data. No `wave0d-org` residue was required.

## 5. Authenticated API Acceptance

PASS for the self-contained HTTP slice on `http://127.0.0.1:8093`: grant creation, activation, allocation, authorized funded use, wrong-program denial, cross-org grant read isolation, revoked-membership denial, report draft creation, review submission, human approval, missing service entitlement denial, and wrong-organization denial.

## 6. Authenticated Authority Matrix

| Operation | Authorized Actor | Missing Permission | Wrong Org | Wrong Tenant | Revoked Membership | AI/System | Result |
|---|---|---|---|---|---|---|---|
| Funding create/use | PASS | PASS via guard | PASS | PASS via derived tenant/org | PASS | Canonical service denial | PASS |
| Report draft/review | PASS | PASS via guard/entitlement | PASS | PASS via derived scope | PASS | Human-only service boundary | PASS for tested slice |
| Publication/revocation | Existing service proof | Existing guard | Existing scope proof | Existing scope proof | Existing guard | Human-only | PARTIAL HTTP proof |

## 7. Cross-Org Matrix

PASS for tested API slice. Org C cannot read Org A funding; Org B cannot use Org A context. Org B has an intentional funding-party relationship and was therefore not incorrectly treated as isolated from a grant it funds.

## 8. Continuous API Happy Path

PARTIAL. Funding and report draft/review/approval were connected over HTTP. Evidence, verification, Truth, Metric, governed publication, delivery, and final consumer were proven in prior service-level live tests but were not rerun as one complete authenticated HTTP chain in this phase.

## 9. Continuous API Negative Path

PASS for wrong-program and revoked-membership/cross-org cases. Suspension, resume, and post-expiry denial remain proven by SYS-3A4/A4B PostgreSQL service tests, not this complete HTTP run.

## 10. Report Rejection / Resubmission API Path

NOT VERIFIED in this phase. Service-level SYS-3A4 proof remains passing.

## 11. V1 → V2 API Path

NOT VERIFIED in this phase. Service-level SYS-3A4B proof remains passing: one current publication, immutable V1 history, V2 current resolution, idempotent publication, and safe revocation.

## 12. Actual Final Consumer

The repository-native terminal boundary is the trusted-reporting dispatcher and its signed internal ingestion handoff. A non-test external destination was not available for this run; the prior worker tests use injected consumers. Therefore final-consumer acceptance is PARTIAL.

## 13. Trusted Reporting / Agent Fabric Consumer

PARTIAL. SHS trusted-reporting worker code and signed dispatch path are present and prior live worker tests pass. Agent Fabric could not start in the current environment because `services/shf-agent-fabric/.venv` lacks `psycopg2`; startup reached Compliance Gate G before failing at import.

## 14. Outbox Delivery

PASS at service level in prior SYS-3A2/A3 tests: outbox rows are claimed, signed, acknowledged, delivered, retried, quarantined, and manually requeued within scoped canonical services.

## 15. Retry

PASS in prior isolated live PostgreSQL tests. One combined run exposed a test fixture collision where A2 observed an earlier queued event; classified as TEST FIXTURE/HARNESS, not product failure.

## 16. Quarantine

PASS in prior live worker proof with `QUARANTINED`, attempt count, failure classification, and last error persisted.

## 17. Manual Recovery / Redelivery

PASS at canonical service/repository boundary in SYS-3A3; full authenticated HTTP recovery was not rerun here.

## 18. Replay / Idempotency

PASS in prior SYS-3A2/A4B live tests and current API-backed funding/report request behavior.

## 19. Frontend Route Classification

The root operator Government Assurance route is LIVE and API-backed. The root report route rendered with the scoped fixture on port 5174. The active page displayed a real canonical reporting surface; the broader dashboard also surfaced a missing monitoring permission, so full operator browser workflow is PARTIAL. CivicSure explorer pages are frame/mock-only and not valid final-consumer evidence.

## 20. Operator Browser Acceptance

PARTIAL. Active route and scoped identity rendered successfully; a complete browser state-changing funding/report workflow was not executed.

## 21. Reviewer Browser Acceptance

NOT VERIFIED. No distinct active reviewer route was demonstrated.

## 22. Public Browser Acceptance

NOT APPLICABLE for the root entry: no active root public report browser route was found. Public API projection returned a safe empty `{items:[]}` response.

## 23. Public Disclosure Safety

PASS for the tested public projection response: HTTP 200 and no internal records, tenant IDs, organization IDs, MAR, warning, evidence, actor, or rationale fields. Published public snapshot safety remains covered by prior disclosure tests.

## 24. SYS-2 Regression

NOT RUN as a broad suite in this focused SYS-3A5 phase. No SYS-2 code was changed.

## 25. SYS-1 Regression

PARTIAL. Scope, permission, Truth, Evidence, Metric, and public-boundary behavior were exercised by focused regressions and prior live tests. Broad SYS-1 suite was not rerun.

## 26. CivicSure Regression

PASS for the existing SYS-3A through SYS-3A4B focused live suite except one combined-test fixture collision. Fresh individual A3/A4/A4B scenarios pass; no payment or accounting authority was introduced.

## 27. Agent Fabric Regression

BLOCKED — ENVIRONMENT. Safe runtime startup failed because `psycopg2` is absent from the repository virtualenv. WF-040 production execution remains disabled.

## 28. Performance Sanity

PASS for representative plans. Funding recipient/status uses `idx_funding_grants_recipient`/`idx_funding_grants_status`; allocations use program index plus bounded nested loop; report drafts use `idx_report_drafts_scope`; current publications use `uq_report_publications_one_current`; outbox uses the organization/idempotency index. Tiny-fixture scans/sorts were bounded; no N+1 was observed in these direct plans. Full application query-count profiling was not run.

## 29. PostgreSQL / Migration Acceptance

PASS. Fresh `shs_sys3a5_20260909` applied migrations 001–121 with pending/drift/unknown empty. Schema integrity returned `{ok:true, failures:[]}`.

## 30. API Build / Typecheck

PASS: API `typecheck` and `build`.

## 31. Root Build / UI Contract

PASS: manifest validation, UI contract validation, root build, and `git diff --check`. Existing Vite chunk-size/dynamic-import warnings remain non-blocking.

## 32. Failure Classification

| Failure | Classification |
|---|---|
| A2 combined outbox event assertion | TEST FIXTURE/HARNESS: shared database event ordering |
| Agent Fabric import failure | ENVIRONMENT: missing `psycopg2` dependency |
| Existing 8092 listener | ENVIRONMENT/OWNER PROCESS: controlled run moved to 8093 |
| Operator dashboard monitoring permission | FIXTURE/SCOPE: fixture role intentionally limited |
| Mock CivicSure explorer | FRAME_ONLY/MOCK_ONLY, not active root consumer |

## 33. Azure Dependency

NOT APPLICABLE — NO AZURE-BACKED WORKFLOW PRESENT.

## 34. Remediation Performed

Added only acceptance artifacts: a self-contained database fixture SQL file and a focused authenticated HTTP integration test. No business-domain production architecture or migration was added in SYS-3A5.

## 35. Migrations

No migration added. Current head remains 121.

## 36. Files Created

- `apps/shs-api/tests/fixtures/sys3a5-auth-fixture.sql`
- `apps/shs-api/tests/government-program-assurance-sys3a5-api.integration.test.ts`
- This report.

## 37. Files Modified

No production files modified in SYS-3A5. Existing owner and prior-phase changes remain untouched.

## 38. Owner Work Preservation

No reset, stash, clean, rebase, checkout, commit, push, deletion, or destructive database operation was performed. Existing dirty work was preserved.

## 39. End-to-End Acceptance Matrix

| Stage | Service | PostgreSQL | API | Browser/Consumer | Failure/Recovery | Final |
|---|---|---|---|---|---|---|
| Funding/use | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL |
| Evidence/verification | PASS | PASS | NOT VERIFIED | NOT VERIFIED | PASS | PARTIAL |
| Truth/Metric | PASS | PASS | NOT VERIFIED | NOT VERIFIED | PASS | PARTIAL |
| Report review | PASS | PASS | PASS for draft/review | PARTIAL | PASS | PARTIAL |
| Publication/versioning | PASS | PASS | NOT VERIFIED full chain | NOT VERIFIED | PASS | PARTIAL |
| Outbox delivery | PASS | PASS | NOT VERIFIED full HTTP | NOT VERIFIED real external | PASS | PARTIAL |
| Public projection | PASS | PASS | PASS safe empty | NOT APPLICABLE root browser | PASS | PARTIAL |

## 40. Workflow Status Changes

No SYS-3 workflow was promoted to COMPLETE in SYS-3A5. Existing service-level completion statuses remain unchanged pending integrated API/consumer/browser evidence.

## 41. Remaining Risks

CRITICAL: None discovered.

HIGH: Full integrated authenticated HTTP publication-to-final-consumer chain is not proven; Agent Fabric safe-scope runtime acceptance is environment-blocked; reviewer/public browser completion is not proven.

MEDIUM: Broad SYS-2/SYS-1 regression and full application query-count profiling were not run in this focused acceptance phase.

LOW: Existing frontend chunk warnings and limited fixture permissions.

## 42. SYS-3 FINAL DECISION

**SYS-3 END-TO-END WORKFLOWS INCOMPLETE**

## 43. Next Phase

No SYS-4 phase started. SYS-3A5 remains open until the missing integrated API/consumer/browser and Agent Fabric environment evidence is completed.

## 44. Final Verdict

1. Authenticated funding path: YES for focused HTTP slice.
2. Funded-use authorization through integration: YES for focused HTTP slice.
3. Wrong-program denial: YES.
4. Suspension/resume: YES in prior service-level live proof, not full HTTP.
5. Expiration enforcement: YES in prior live PostgreSQL proof.
6. Closure: YES in prior live PostgreSQL proof.
7. Evidence through integration: YES service-level; full HTTP NOT VERIFIED.
8. Verification: YES service-level; full HTTP NOT VERIFIED.
9. Truth promotion/blocking: YES service-level.
10. Metric integration: YES service-level.
11. Report draft API workflow: YES.
12. Review/rejection/resubmission: service-level YES; HTTP NOT VERIFIED.
13. Human approval: YES service-level; HTTP approval tested for report draft.
14. Publication: YES service-level; full authenticated HTTP chain NOT VERIFIED.
15. V1 to V2 correction: YES service-level; API path NOT VERIFIED.
16. Current-version resolution: YES service-level.
17. Revocation: YES service-level/public API safety; browser NOT VERIFIED.
18. Real final consumer: NO, only canonical dispatcher boundary proven.
19. Actual-consumer outbox delivery: PARTIAL.
20. Transient retry: YES service-level.
21. Terminal quarantine: YES service-level.
22. Authenticated manual recovery/redelivery: YES service-level; HTTP NOT VERIFIED.
23. Replay idempotency: YES service-level.
24. Two-way cross-org isolation: PARTIAL, focused API directions pass; full matrix NOT VERIFIED.
25. Missing permissions fail closed: YES for tested routes.
26. Revoked memberships fail closed: YES.
27. Active frontend routes confirmed: YES.
28. Operator browser acceptance: PARTIAL.
29. Reviewer browser acceptance: NOT VERIFIED.
30. Public browser acceptance: NOT APPLICABLE for active root; public API safe.
31. Public disclosure safety: YES for tested projection and prior governed tests.
32. SYS-2 broad regression: NOT RUN.
33. SYS-1 regression: PARTIAL focused.
34. CivicSure green: YES for focused live regressions, with one harness collision.
35. Agent Fabric safe-scope regression: BLOCKED — ENVIRONMENT.
36. WF-040 safely disabled: YES.
37. Performance sanity: PASS representative plans; full query-count profile NOT RUN.
38. Migration/schema acceptance: YES.
39. API build/typecheck: YES.
40. Root build/UI validation: YES.
41. Azure handling: YES, no adapter/workflow present.
42. Payment/accounting authority avoided: YES.
43. Duplicate authority introduced: NO.
44. CRITICAL blockers: NO.
45. HIGH blockers: YES.
46. SYS-3 genuinely complete: NO.
