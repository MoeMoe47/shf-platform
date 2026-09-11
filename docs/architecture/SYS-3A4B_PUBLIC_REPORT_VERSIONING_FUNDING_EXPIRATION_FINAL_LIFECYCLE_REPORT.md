# SYS-3A4B Public Report Versioning + Funding Expiration Final Lifecycle Report

## 1. Executive Result

COMPLETE for the SYS-3A4 repository-local funding and public report lifecycle scope. Overall SYS-3 remains open for SYS-3A5 integrated HTTP, browser, and final-consumer acceptance.

## 2. Repository Baseline

- Path: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`
- Tracked dirty entries: 89
- Untracked entries: 133
- Owner work preserved; no reset, stash, clean, rebase, commit, push, or destructive operation performed.
- Migration filename head: `121_report_publication_supersession_current.sql`
- PostgreSQL: PASS, disposable cluster on port 55433; database `shs_sys3a4b_20260909`
- API: NOT RUN in this lifecycle-only phase
- Frontend: NOT RUN in this lifecycle-only phase
- Agent Fabric: NOT RUN; production execution remains policy-disabled

## 3. Remaining Gaps Entering Phase

Public publication had no persisted current/supersession marker. Funding resume could bypass the date-derived end-date rule at the state-transition boundary. Both seams were addressed and live-proven.

## 4. Canonical Public Report Authority Map

| Responsibility | Canonical Owner | Current Implementation | Missing Seam |
|---|---|---|---|
| Content/revision | `ReportDraftService`, `ReportDraftRepo` | `report_drafts`, immutable `report_draft_revisions` | None in this phase |
| Review/approval | `ReportDraftService` | Human review transition and audit | None in this phase |
| Disclosure/publication authorization | `ReportPublicEligibilityService`, `ReportPublicDisclosureService`, `ReportPublicationService` | Governed snapshot and release approval | None in this phase |
| Publication/current version | `ReportPublicationActionRepo` | `is_current`, predecessor reference, current projection query | Closed by migration 121 |
| Revocation | `ReportPublicationService` | Authorization revoke and current-marker removal | Closed by this phase |
| Historical retrieval | `ReportPublicationActionRepo`, draft revision repository | Scoped publication and revision history | None in this phase |

## 5. Canonical Version Model

Existing publication records are versioned by immutable snapshot/publication rows. Migration 121 adds `supersedes_publication_id` and `is_current`; V2 explicitly names V1 as its predecessor.

## 6. Publication Gating

Existing governed eligibility, disclosure approval, policy, institutional authority, release approval, and execute-permission checks remain required. Direct publication without current authorization fails.

## 7. V1 Publication

PASS. Fresh live test published V1 and public current lookup returned the V1 projection.

## 8. V2 Correction

PASS. A second immutable snapshot/publication was created with an explicit `supersedesPublicationId` pointing to V1.

## 9. V2 Review / Approval

PASS. Publication required the existing governed approval chain; the focused report-draft regression also proves human-only review and immutable revision history.

## 10. Supersession

PASS. V1 became non-current, V2 became current, and the predecessor reference persisted.

## 11. Single-Current-Version Invariant

PASS. Scoped partial unique index `uq_report_publications_one_current` enforces one current publication per tenant, organization, and report lineage.

## 12. Current Public Resolution

PASS. Public projection lookup returned V2 and excluded the superseded V1 projection.

## 13. Historical Resolution

PASS. Both publication rows remained available through scoped internal publication lookup; V1 was retained with `is_current=false`.

## 14. Revocation

PASS. Revoking V2 removed public current visibility and marked V2 non-current. V1 was not resurrected.

## 15. Reauthorization / Republishing

N/A — canonical publication policy requires a new authorized publication/correction rather than silently reactivating a revoked predecessor.

## 16. Cross-Org Versioning Isolation

PASS at the repository scope already covered by publication authorization/snapshot scope guards. Broad authenticated HTTP matrix remains SYS-3A5.

## 17. Versioning Audit / Provenance

PASS. Publication audit includes predecessor, current marker, snapshot, approval, publication, actor, scope, and correlation metadata.

## 18. Funding Expiration Canonical Decision

COMPLETE — DATE-DERIVED TERMINAL ELIGIBILITY. No `EXPIRED` status was added. The persisted grant retains its lifecycle status while effective-date authorization determines whether new funded use is eligible.

## 19. Effective-Period Enforcement

PASS. Before-start and after-end use are denied; in-period use succeeds. `SUSPENDED -> ACTIVE` after the end date is denied by `FundingGrantService`.

## 20. Expiration + Suspension

PASS. Suspended grants deny use. A grant whose end date has passed cannot resume.

## 21. Expiration + Resume

PASS. Resume within the supported lifecycle is preserved before expiry; resume after expiry is denied.

## 22. Expiration + Closure

PASS. Administrative `CLOSED` remains terminal. Expiry prevents new use, and closure remains available for finalization without reopening eligibility.

## 23. Final Reporting After Expiration

PASS. The live funding scenario created and retrieved a final report after closure; audit history remained available.

## 24. Continuous Funding PostgreSQL Acceptance

PASS. Fresh `shs_sys3a4b_20260909`: create, activate, in-period use, before/after-period denial, suspension denial, post-expiry resume denial, closure, invalid terminal re-entry denial, audit history, and final report retrieval.

## 25. Continuous Report PostgreSQL Acceptance

PASS. Fresh live chain: V1 publication, V2 explicit supersession, current lookup, historical lookup, replay, V2 revocation, no public fallback to V1.

## 26. Public Disclosure Regression

PASS. Public DTO remains limited to disclosure-approved projection fields; internal publication/supersession fields are not returned by `toPublicProjection`.

## 27. Concurrency / Idempotency

PASS for material tested behavior. Duplicate V2 publication replays the existing publication and creates no additional row; the database unique partial index protects the current invariant.

## 28. Regression Results

| Verification | Result | Evidence |
|---|---|---|
| SYS-3A4B publication versioning live test | PASS | 1/1 on fresh PostgreSQL |
| SYS-3A4 funding/report lifecycle | PASS | 2/2 live tests |
| SYS-3A2 publication/outbox regression | PASS | 2/2 in combined focused run |
| SYS-3A3 lifecycle regression | PASS | 3/3 in combined focused run |
| Publication unit tests | PASS | 8/8 |
| API typecheck/build | PASS | `npm run typecheck`, `npm run build` |
| Root build | PASS | `npm run build` |
| Migration status | PASS | 001–121, pending/drift/unknown empty |
| Schema integrity | PASS | `{ ok: true, failures: [] }` |
| Git diff check | PASS | `git diff --check` |

## 29. Migrations

Added migration 121: `121_report_publication_supersession_current.sql`. It is additive, scoped, indexed, and preserves historical rows.

## 30. Files Created

- `apps/shs-api/migrations/121_report_publication_supersession_current.sql`
- `apps/shs-api/tests/government-program-assurance-sys3a4b-report-versioning.integration.test.ts`
- `docs/architecture/SYS-3A4B_PUBLIC_REPORT_VERSIONING_FUNDING_EXPIRATION_FINAL_LIFECYCLE_REPORT.md`

## 31. Files Modified

- `apps/shs-api/src/domain/reporting/report-publication-action-repo.ts`
- `apps/shs-api/src/domain/reporting/report-publication-service.ts`
- `apps/shs-api/src/domain/funding-grants/service/funding-grant-service.ts`
- `apps/shs-api/tests/government-program-assurance-sys3a4-lifecycle.integration.test.ts`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_REGISTRY.md`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_DEPENDENCY_GRAPH.md`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_COMPLETION_ROADMAP.md`

## 32. Owner Work Preservation

All pre-existing dirty and untracked work was preserved. No unrelated files were reverted or deleted.

## 33. Lifecycle Matrix

| Lifecycle | Trigger | Terminal Outcome | Live Proven |
|---|---|---|---|
| Funding expiration | Effective end date reached | New use denied; administrative close remains terminal | PASS |
| Funding suspension/resume | Authorized state transition | Use blocked while suspended; expired resume denied | PASS |
| Report V1 | Governed publication | V1 current public projection | PASS |
| Report V2 | Authorized correction/publication | V2 current; V1 historical/superseded | PASS |
| Current revocation | Authorized revoke | No current public projection; no V1 resurrection | PASS |

## 34. Remaining Risks

- CRITICAL: None discovered.
- HIGH: None in SYS-3A4 lifecycle scope.
- MEDIUM: SYS-3A5 integrated authenticated HTTP, browser, and final-consumer acceptance remains open.
- LOW: None introduced by this phase.

## 35. SYS-3A4 Final Lifecycle Decision

**SYS-3A4 FUNDING AND REPORT LIFECYCLES COMPLETE**

## 36. Next Phase

**PROCEED TO SYS-3A5 — FINAL INTEGRATED API / CONSUMER / BROWSER ACCEPTANCE**

SYS-3A5 was not started.

## Final Verdict

1. Funding expiration canonically defined? YES, date-derived terminal eligibility.
2. Expiration live-proven? YES.
3. Valid in-period use works? YES.
4. Before-period use fails? YES.
5. After-period use fails? YES.
6. Resume-after-expiration prevented? YES.
7. Expiration/closure behavior complete? YES.
8. Final/historical reporting preserved? YES.
9. Publication gated by approved state? YES, governed approval/publication state.
10. V1 publishes? YES.
11. V1 resolves current? YES.
12. V2 immutable correction? YES.
13. V2 reviewed and approved? YES through existing human-governed chain.
14. V2 publishes? YES.
15. V2 supersedes V1? YES.
16. One current public version? YES.
17. V1 preserved historically? YES.
18. Current lookup returns V2? YES.
19. Revocation removes public availability? YES.
20. Revocation avoids V1 resurrection? YES.
21. Cross-org isolation passes? YES at repository scope; broad HTTP remains SYS-3A5.
22. Public disclosure safe? YES.
23. Continuous funding PostgreSQL acceptance? PASS.
24. Continuous report PostgreSQL acceptance? PASS.
25. Audit/provenance preserved? YES.
26. CivicSure remains correct? YES, focused regressions pass.
27. Payment/accounting execution avoided? YES.
28. Duplicate authority created? NO.
29. HIGH lifecycle blockers left? NO.
30. SYS-3A4 finally complete? YES.
