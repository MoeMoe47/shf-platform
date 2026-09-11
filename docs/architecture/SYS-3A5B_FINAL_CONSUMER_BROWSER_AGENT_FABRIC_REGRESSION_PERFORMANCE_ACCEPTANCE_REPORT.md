# SYS-3A5B Final Consumer / Browser / Agent Fabric / Regression / Performance Acceptance Report

## 1. Executive Result

PARTIAL. Agent Fabric runtime and signed trusted-reporting delivery are live-proven. SYS-3 remains incomplete because mounted reviewer/public browser acceptance, live real-consumer recovery, and application query-count profiling remain open.

## 2. Repository Baseline

Path `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`; HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. Tracked dirty: 89. Untracked: 390. Owner work was preserved.

## 3. Remaining Blockers Entering Phase

Reviewer/public browser proof, real-consumer retry/recovery proof, broad regression confidence, and query-count profiling.

## 4. Active Entrypoint Map

| Surface | Active | API-backed | Result |
|---|---:|---:|---|
| Operator reporting `#/operator/government-assurance/reports` | YES | YES | PASS render |
| Public reporting API `/public/impact/curriculum-lesson-completions` | YES | YES | PASS API |
| Reviewer report browser route | NO mounted route found | N/A | NOT VERIFIED |
| CivicSure explorer package | NO | MOCK | FRAME_ONLY |

## 5. Reviewer Browser Acceptance

PARTIAL. The mounted operator reporting route rendered with a scoped API-backed identity. No distinct reviewer route or mounted review controls were found, so browser state-transition acceptance is not claimed.

## 6. Public Browser Acceptance

NOT VERIFIED. The canonical public API is active, but no public report browser route is mounted by the root entry.

## 7. Public Disclosure Safety

PASS for the exercised public projection: no tenant, protected organization, actor, evidence, risk/MAR, reconciliation, outbox, or session fields were observed.

## 8. Final Consumer Architecture

The public API projection is the active public consumer. Trusted reporting uses `IntegrationOutboxRepo` and `trusted-reporting/dispatcher.ts` to send signed events to Agent Fabric internal ingestion.

## 9. Public Final Consumer

PASS at API boundary; browser proof is not available because no mounted public report page exists.

## 10. Trusted Reporting Final Consumer

Agent Fabric signed internal ingestion is the repository-defined trusted reporting boundary. For `shs.reporting/report.created`, it acknowledges the event with `projection_status: not_configured` by current policy.

## 11. Psycopg2 / Agent Runtime Dependency

`requirements.txt` already declared `psycopg2-binary==2.9.11`; it was installed in the repository virtualenv. No production dependency file changed.

## 12. Agent Fabric Runtime Acceptance

PASS. `/health/live` and `/health/ready` returned HTTP 200. Gate G, registry contract, and runtime enforcement lock passed.

## 13. Agent Fabric Safety Regression

PASS: 28 focused tests passed. Unsigned and invalid-signature ingress each returned HTTP 401. WF-040 remains `BLOCKED — SAFETY/POLICY`.

## 14. Real Consumer Delivery

PASS. A real signed `shs.reporting/report.created` event was accepted by Agent Fabric and the outbox row reached `DELIVERED` with attempt count 1.

## 15. Real Consumer Failure / Retry

PARTIAL. Dispatcher retry behavior remains covered by focused worker tests, but a transient failure and recovery loop against the live consumer was not completed.

## 16. Quarantine

PASS by existing trusted-reporting worker hardening tests.

## 17. Manual Recovery / Redelivery

PARTIAL. Existing scoped requeue behavior remains tested; live redelivery after quarantine was not completed.

## 18. Replay / Idempotency

PASS. Re-enqueue with the same scoped idempotency key returned the same outbox event ID; Agent Fabric focused replay tests passed.

## 19. Continuous Public Path

PARTIAL. Public API projection is live; no mounted public browser path exists.

## 20. Continuous Trusted Reporting Path

PASS through the current repository boundary: report event, signed dispatch, Agent Fabric acknowledgment, and `DELIVERED` persistence.

## 21. SYS-2 Broad Regression

PARTIAL. Broad API run: 587 PASS, 26 SKIP, 429 FAIL. The failures were predominantly `fetch failed` against unavailable default HTTP fixtures.

## 22. SYS-2 Failure Classification

The broad failures are TEST HARNESS / FIXTURE / ENVIRONMENT failures. No SYS-3-caused product regression was identified.

## 23. SYS-1 Regression

PARTIAL broad confidence; focused authority, disclosure, Truth, Evidence, and Agent Fabric safety evidence remains green.

## 24. CivicSure Regression

PASS for focused baseline suites; no CivicSure production code changed.

## 25. Query Count Profile

PARTIAL. No query-count instrumentation or `pg_stat_statements` extension is available, so end-to-end application counts were not captured.

## 26. Query Plan Analysis

PASS for representative disposable-DB plans. Funding, allocation, report scope/current publication, and outbox pending paths use existing lifecycle indexes; no structural N+1 or unbounded scan defect was identified.

## 27. Performance Remediation

NOT RUN. No structural defect justified a migration or production change.

## 28. PostgreSQL / Migration Acceptance

PASS. `shs_sys3a5_20260909` has migrations 001–121 applied; pending, drift, and unknown migration lists are empty and schema integrity passed.

## 29. API Regression

PASS for the self-contained SYS-3A5 authenticated API test. Broad HTTP confidence is limited by default-fixture failures.

## 30. Frontend / Route Validation

PASS for root build, manifest/UI validation, and active operator route rendering. Reviewer/public report browser proof remains open because those routes are not mounted.

## 31. Failure Classification

PRODUCT DEFECT: none found in this scope. TEST HARNESS/FIXTURE/ENVIRONMENT: broad default HTTP fixture failures. EXTERNAL DEPENDENCY: none. SAFETY/POLICY: WF-040 intentional block.

## 32. Azure Dependency

NOT APPLICABLE — NO AZURE-BACKED WORKFLOW PRESENT.

## 33. Remediation Performed

Installed the already-declared local `psycopg2-binary` dependency and restarted Agent Fabric with the explicit development signing keyring. No domain architecture changed.

## 34. Migrations

No migration added. Disposable database clean through 121.

## 35. Files Created

This report. Existing SYS-3A5 fixture/test artifacts were preserved.

## 36. Files Modified

The three systemwide workflow documents received SYS-3A5B evidence updates.

## 37. Owner Work Preservation

No reset, stash, clean, rebase, commit, push, deletion, migration rewrite, or unrelated dirty-file overwrite was performed.

## 38. Final Consumer Matrix

| Path | Final Consumer | Real/Test | Delivered | Recovery Proven | Result |
|---|---|---|---:|---:|---|
| Public | Canonical public API projection | Real | PASS | N/A | PARTIAL browser |
| Trusted | Agent Fabric signed ingestion | Real | PASS | PARTIAL | PARTIAL |

## 39. Browser Acceptance Matrix

| Surface | Active Route | Auth | API | PostgreSQL | Display | Result |
|---|---|---|---|---|---|---|
| Operator | `#/operator/government-assurance/reports` | Scoped identity | PASS | PASS | PASS | PASS |
| Reviewer | None mounted | N/A | N/A | N/A | N/A | NOT VERIFIED |
| Public report | None mounted | Public | PASS API | PASS | N/A | NOT VERIFIED |

## 40. Regression Matrix

| Layer | Pass | Fail | Skip | Product Defects Remaining |
|---|---:|---:|---:|---|
| Broad SHS API | 587 | 429 harness/fixture | 26 | None identified |
| Agent Fabric focused | 28 | 0 | 0 | None |
| SYS-3A5 authenticated API | 1 suite | 0 | 0 | None in tested slice |

## 41. Performance Matrix

| Operation | Query Count | Plan | Index | Result |
|---|---|---|---|---|
| Funding/allocation | Not instrumented | Scoped nested-loop | Present | PASS plan review |
| Report/publication current | Not instrumented | Scoped lookup | Present | PASS plan review |
| Outbox pending | Not instrumented | Status/lease lookup | Present | PASS plan review |
| Public projection | Not instrumented | Not captured | N/A | PARTIAL |

## 42. Remaining Risks

CRITICAL: none identified. HIGH: reviewer/public browser proof, live real-consumer recovery, and query-count profiling. MEDIUM: broad HTTP fixture reliability.

## 43. SYS-3 FINAL DECISION

**SYS-3 END-TO-END WORKFLOWS INCOMPLETE**

## 44. Next Phase

No SYS-4 work started. Continue SYS-3 acceptance closure with only the remaining mounted-consumer/browser, live recovery, and query-count gaps.

## Final Verdict

1. Active operator path: YES.
2. Reviewer browser acceptance: NO, no mounted canonical reviewer route.
3. Public browser acceptance: NO, no mounted canonical public report route.
4. Public V2 browser render: NOT VERIFIED.
5. Browser revocation disappearance: NOT VERIFIED.
6. Public final consumer: YES, canonical public API.
7. Trusted final consumer: YES, Agent Fabric signed ingestion boundary.
8. Trusted delivery: YES at the current acknowledgment boundary.
9. Psycopg2 issue: resolved as a local declared dependency.
10. Agent Fabric starts where required: YES.
11. Agent Fabric readiness: YES.
12. WF-040 disabled: YES.
13. Real-consumer retry: NOT VERIFIED end-to-end.
14. Real-consumer quarantine: PASS by focused tests.
15. Authenticated recovery/redelivery: NOT VERIFIED with live consumer.
16. Replay idempotent: YES.
17. Cross-org isolation: YES in focused API evidence.
18. Revoked membership denied: YES.
19. SYS-2 broad regression ran: YES, with fixture failures.
20. SYS-2 product regressions: none identified.
21. SYS-1 regression: PARTIAL broad confidence.
22. CivicSure regression: YES focused.
23. Query-count profiling: NO.
24. Query plans acceptable: YES for representative plans.
25. Material performance defects: none identified.
26. Migration/schema checks: YES.
27. API regression: PASS for self-contained SYS-3A5 slice.
28. Frontend/route validation: PASS; required reviewer/public routes absent.
29. Public disclosure safety: YES for public API projection.
30. Azure classification: NOT APPLICABLE.
31. Payment/accounting authority avoided: YES.
32. Duplicate authority introduced: NO.
33. Critical blockers: NO.
34. High blockers: YES, acceptance gaps remain.
35. SYS-3 complete from funding trigger through real final consumer and terminal outcome: NO.
