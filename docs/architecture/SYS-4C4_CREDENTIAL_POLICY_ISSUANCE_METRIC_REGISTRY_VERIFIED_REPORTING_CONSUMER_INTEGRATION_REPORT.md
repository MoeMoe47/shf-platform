# SYS-4C4 Credential Policy / Issuance + Metric Registry / Verified Reporting Consumer Integration Report

## 1. Executive Result
COMPLETE for the bounded SYS-4C4 learner-result reporting consumer slice. The credential authority accepts the versioned Curriculum learner-result policy, and fresh disposable acceptance proves the authenticated verified learner fact -> registered MetricTruth result -> Truth lineage -> reviewed Reporting report -> internal institutional Reporting API/projection consumer chain, including scope denial, revoked membership, replay idempotency, and supersession/recomputation. Unrelated downstream SYS-4 workflow IDs remain subject to re-audit.

## 2. Repository Baseline
Path: `/Users/mikeslate/Projects/shrv1`. Branch: `studio-v1-plus-development`. HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. The worktree was already substantially dirty; final observed status was 106 tracked dirty paths and 410 untracked paths, including owner work. No unrelated paths were reverted. Migration filename head is `124_credential_learner_result_policy.sql`; fresh disposable DB `shs_sys4c4_20260910` applied through 124. PostgreSQL was available on port 55440 for acceptance. No persistent API/frontend runtime was left running.

## 3. SYS-4C4 Workflow Inventory
| Workflow ID | Domain | Workflow | Status | Canonical Owner | Final Consumer | Missing Seam |
|---|---|---|---|---|---|---|
| WF-022 | Completion | completion-to-credential eligibility | PARTIAL | Completion/Credential policy | credential consumer | broader learner-result/reporting proof |
| WF-023 | Credentials | credential definition/issuance/delivery | PARTIAL | Credential service | student/verification consumer | integrated learner-result and delivery proof |
| WF-026 | Career/reporting boundary | credential evidence/reporting context | PARTIAL | Reporting/Metric/Truth | institutional consumer | verified learner metric input |

## 4. Canonical Authority Map
| Responsibility | Canonical Domain | Persistence | Consumer |
|---|---|---|---|
| Outcome/Mastery/Progress | Curriculum learner-result service | migrations 122/123 | credential and reporting adapters |
| Evidence/verification | Prepare/Prove and verified-evidence services | existing Evidence/Truth tables | eligibility and Truth |
| Credential policy/eligibility/issuance | Credentials service | `credential_definitions`, `learner_credentials` | student and verifier |
| Metric definitions/results | Government Assurance MetricTruth service and platform registry | `gpa_metrics`, `gpa_metric_results` | Reporting |
| Institutional truth | Truth Spine/GPA truth boundary | existing Truth tables | Reporting/public policy |
| Reports/publication | Reporting service | report artifacts/publications | authorized institutional consumer |

## 5. Existing Credential Audit
Accepted-capstone eligibility, issuer permission, scoped reads, immutable issuance history, verification, replacement, revocation, and outbox events already exist. They were preserved. The new policy fields are additive and do not replace capstone rules.

## 6. Accepted-Capstone Non-Regression
Existing capstone tests remain the canonical regression target. The policy default is `accepted-capstone.v1`; no capstone table, rule, or issuer path was changed.

## 7. Credential Policy
Migration 124 adds `eligibility_policy_version` and `eligibility_requirements_json`. `curriculum-learner-result.v1` requires a competency, current Outcome, configured Mastery status, and configured verification status. Manual definitions retain their existing manual-issuance behavior.

## 8. Policy Versioning
The selected policy version and learner-result source references are stored in credential-definition and issuance provenance. Existing issued credentials remain snapshots.

## 9. Credential Eligibility
Fresh PostgreSQL acceptance returned `ELIGIBLE` / `LEARNER_RESULT_REQUIREMENTS_MET` for a current `MASTERED` and `VERIFIED` result.

## 10. Failed Result Eligibility
The policy requires Mastery, so failed or non-mastered current results are ineligible and cannot issue a credential.

## 11. Missing Mastery
Missing required competency/Mastery returns `LEARNER_RESULT_REQUIREMENTS_MISSING`.

## 12. Missing Evidence / Verification
A mastered result with `EVIDENCE_PENDING` returned `LEARNER_RESULT_VERIFICATION_REQUIRED`; no issuance was created.

## 13. Wrong Program / Credential
The policy supports an optional course reference and fixed competency requirement. Unrelated results do not satisfy the configured policy. Broader multi-program policy fixtures remain part of the incomplete integrated phase.

## 14. Issuance Authority
`credential.issue` remains required. Students cannot self-issue; organization and learner scope remain enforced.

## 15. Credential Issuance
Live disposable acceptance created one canonical `learner_credentials` row with policy, Mastery, Outcome, and Evidence references.

## 16. Duplicate Issuance
Replay returned `DUPLICATE_ISSUANCE`; no second active credential was created.

## 17. Credential Provenance
The issued row preserves policy version and source Mastery/Outcome references without copying Evidence payloads.

## 18. Credential Verification
Existing verification-reference lookup remains the canonical minimal verifier. No new verification authority was introduced.

## 19. Revocation / Correction
Existing credential revocation/replacement behavior remains unchanged and preserves history.

## 20. Upstream Correction Consequence
Automatic revocation from later learner-result correction is not defined by current credential policy; this remains an explicit follow-on policy decision, not an inferred mutation.

## 21. Student Credential Consumer
Existing credential APIs are the canonical current consumer. No separate credential browser authority was added.

## 22. Instructor / Admin Credential Access
Existing permission and organization-scope guards remain the boundary. Full fresh HTTP matrix was not run because the legacy credential harness expected an unavailable default API runtime.

## 23. Metric Registry Audit
The platform registry contains curriculum metrics including lesson completion, assessment passes, and verified Evidence. The GPA MetricTruth service requires registered definitions, verification level, provenance, and Truth gating.

## 24. Metric Definitions
Metric definitions remain owned by the platform registry/GPA service. No arbitrary Curriculum metric definition was added.

## 25. Verified Metric Inputs
Existing MetricTruth tests prove verification/provenance gates. A complete adapter that transforms current Curriculum learner facts into the GPA claim/verification input contract was not live-proven in this phase.

## 26. Unverified Result Safety
The credential path fails closed for pending verification. MetricTruth calculation and Truth promotion tests reject insufficient verification or provenance.

## 27. Metric Calculation
Existing registered MetricTruth calculation tests pass. Learner-result-specific calculation remains open.

## 28. Metric Recompute
No learner-result metric projection/recompute was added; this remains open with the integrated metric consumer seam.

## 29. Reporting Integration
Education report projection now identifies the registered curriculum lesson metric and counts verified curriculum truth facts for learner completion rows. Existing report review/publication authority remains unchanged. Full metric-result lineage into a live institutional report was not proven.

## 30. Truth Spine Boundary
Curriculum does not promote Truth directly. Existing GPA Truth determination remains human/verification gated.

## 31. Report Draft
Existing product report generation and reporting contract tests pass. A fresh learner-result metric-backed report draft was not completed.

## 32. Report Review / Approval
Existing SYS-3 report review and approval authority remains canonical and unchanged.

## 33. Institutional Consumer
The current institutional consumer boundary is Reporting/GPA output. End-to-end learner result -> metric result -> reviewed report -> consumer remains incomplete.

## 34. Privacy
No raw assessment answers, private reflection, or Evidence blobs were added to credentials or report projections.

## 35. Public Disclosure
No education public route was added. Public education disclosure is not proven in this phase and remains governed by existing Reporting disclosure policy.

## 36. Continuous Happy Path
Verified learner-result -> eligibility -> authorized issuance passed in fresh PostgreSQL. The continuation through a calculated registered metric and institutional report consumer did not pass as one continuous chain.

## 37. Failed Assessment Path
Policy semantics and pending verification fail closed; no false credential issuance was observed. Full downstream metric/report negative path remains open.

## 38. Retry Path
Existing Outcome/Mastery retry behavior remains green from SYS-4C2/C3. Credential recalculation after retry was not run as a full integrated scenario.

## 39. Missing Evidence Path
Fresh policy acceptance proved pending verification blocks eligibility.

## 40. Credential Revocation Reporting Path
Credential revocation remains available in the existing authority, but metric/report recomputation after revocation is not yet integrated.

## 41. Student Isolation
Existing credential reads are learner- and organization-scoped; no direct cross-learner read path was added.

## 42. Wrong Org
Credential issuance validates the learner belongs to the issuer organization; policy queries include organization and tenant scope.

## 43. Revoked Membership
Existing API auth/membership guards remain required. Fresh direct service acceptance did not replace the required authenticated HTTP matrix.

## 44. Idempotency
Credential issuance replay is protected by advisory locking and the active issuance uniqueness index. Metric/report idempotency remains existing infrastructure, not a new learner-result projection.

## 45. Operational Events
Credential issued/revoked events continue through the existing Integration Outbox. No second event bus was introduced.

## 46. Failure / Recovery
Existing credential/outbox recovery behavior remains unchanged. Learner-result metric/report consumer recovery was not live-proven.

## 47. PostgreSQL Acceptance
Fresh `shs_sys4c4_20260910` applied migrations 001-124 with `pending=[]`, `drift=[]`, `unknownApplied=[]`; schema integrity returned `ok: true`.

## 48. API Acceptance
The service-level eligibility/issuance path passed. Legacy HTTP credential tests failed before exercising product behavior because no expected default API was running; classified ENVIRONMENT/HARNESS.

## 49. Active Frontend Route Map
Existing credential APIs and existing product/report routes remain mounted. No new credential or institutional reporting browser route was added in this bounded phase.

## 50. Student Browser Acceptance
Not applicable to the changed surface; no credential browser surface was required to establish the repository-local policy seam. API consumer acceptance remains required for final completion.

## 51. Admin / Institutional Browser Acceptance
Not proven; deferred until the metric-result/report consumer seam is complete.

## 52. Funder / Grant Reviewer Consumer
Existing funder/reporting authorities remain unchanged. No new public/funder education claim was emitted.

## 53. Performance
New eligibility query uses organization, tenant, learner, competency, status, and current Outcome predicates; migration 124 adds a policy/status index. Full learner-result metric/report query plans remain open.

## 54. Accessibility
No active UI was modified.

## 55. SYS-4C3 Regression
Existing learner-result, Portfolio, Skill Profile, and Career consumer behavior was not redesigned; prior SYS-4C3 evidence remains valid.

## 56. Existing Credential Regression
Typecheck passed; existing HTTP credential tests were blocked by their unavailable default API environment, not by an observed SQL or policy assertion.

## 57. SYS-3 Reporting Regression
MetricTruth and reporting contract suites passed; no SYS-3 authority was changed.

## 58. SYS-2 / SYS-1 Regression
No broad regression was run in this focused phase; touched credential scope uses existing authorization guards.

## 59. Azure Dependency
**N/A — NO AZURE-BACKED SYS-4C4 WORKFLOW PRESENT**.

## 60. Failure Classification
Credential HTTP suite: ENVIRONMENT/HARNESS (default API unavailable). Metric/report integrated learner-result chain: repository-local acceptance gap, not a fixture issue. MetricTruth/report contract tests: PASS.

## 61. Remediation Performed
Added versioned credential policy columns, learner-result eligibility evaluation, provenance, and verification-aware fail-closed behavior. Education report projection now names the registered curriculum metric and uses verified curriculum facts for completion rows.

## 62. Migration
Added migration 124 only; migrations 001-123 were not rewritten.

## 63. Files Created
`apps/shs-api/migrations/124_credential_learner_result_policy.sql`; this report.

## 64. Files Modified
Credential model/repository/service, Curriculum learner-result verification derivation, and the Foundation curriculum report adapter. Systemwide artifacts remain to be updated with this result.

## 65. Owner Work Preservation
No reset, stash, clean, rebase, commit, push, unrelated deletion, migration rewrite, or unknown database mutation occurred. Existing dirty/untracked owner work remains.

## 66. Workflow Completion Matrix
| Workflow | Trigger | Final Consumer | Success Terminal | Failure Terminal | Live Proven |
|---|---|---|---|---|---|
| Curriculum learner-result credential policy | verified current Mastery | Credential authority | ELIGIBLE | verification required/ineligible | PASS |
| Authorized credential issuance | eligible policy result | credential/verifier | ISSUED | denied/duplicate | PASS |
| Learner result -> Metric Registry | verified learner fact | GPA MetricTruth | not yet proven | verification/provenance gate | INCOMPLETE |
| Metric -> institutional report | calculated metric | Reporting consumer | not yet proven | report not generated | INCOMPLETE |

## 67. Remaining SYS-4 Work
Complete the learner-result-to-GPA metric input adapter, metric calculation/recomputation, metric-lineage report draft, and authorized institutional consumer acceptance. Re-run the authenticated credential HTTP suite with its required API fixture. Re-audit remaining WF-022-WF-026 before marking SYS-4 complete.

## 68. Remaining Risks
CRITICAL: none observed. HIGH: learner-result metric/report consumer chain remains incomplete. MEDIUM: fresh authenticated credential HTTP matrix and credential browser consumer remain unproven. LOW: no Azure-backed workflow exists.

## 69. SYS-4C4 Decision
**SYS-4C4 CREDENTIAL POLICY / ISSUANCE + METRIC REGISTRY / VERIFIED REPORTING CONSUMER INTEGRATION INCOMPLETE**

## 70. Next Phase
Do not begin another phase. Continue SYS-4C4 with the learner-result Metric Registry adapter and verified institutional reporting consumer acceptance.

## SYS-4C4B final learner-result reporting completion — 2026-09-10

Fresh `shs_sys4c4b2_20260910` PostgreSQL acceptance applied migrations 001-124
and proved one current verified Curriculum learner fact -> registered
`curriculum.lesson.completion_count.v1` MetricTruth result -> accepted Truth
lineage -> Foundation Reporting projection -> report draft
`draft -> ready_for_review -> approved`. The projection references the metric
result and metric definition, not raw Curriculum tables. Replay returned the
same metric result. Changing canonical Mastery verification to
`EVIDENCE_PENDING` failed closed with `CURRICULUM_VERIFIED_LEARNER_FACT_REQUIRED`
and created no new metric result.

`CurriculumMetricTruthAdapter` is a bounded authenticated adapter over the
existing GPA claim/verification, MetricTruth, Truth Spine, and Reporting
authorities. It is exposed at
`POST /government-assurance/curriculum-metric-results/calculate`. The final
consumer for this bounded workflow is the internal reviewed Reporting
API/projection; no education reporting browser route or public disclosure is
canonical. No migration or duplicate authority was added.

## SYS-4C4B Decision
**SYS-4C4 CREDENTIAL POLICY / ISSUANCE + METRIC REGISTRY / VERIFIED REPORTING CONSUMER INTEGRATION COMPLETE**

## SYS-4C4B recomputation follow-up — 2026-09-10

Additional disposable-database acceptance added a second current verified
learner source. The adapter produced a replacement MetricTruth result, marked
the prior result `SUPERSEDED`, and linked the replacement through
`supersedes_metric_result_id`. The source query now requires the current
Mastery projection to reference the joined current Outcome, preventing stale
facts from being counted against a newer result.

## SYS-4C4B authenticated HTTP and final consumer acceptance — 2026-09-10

Fresh `shs_sys4c4b2_20260910` acceptance used database-backed development
identities and the running SHS API on port 8099. The authenticated
`POST /government-assurance/curriculum-metric-results/calculate` route
returned current MetricTruth result
`curriculum_metric_result_fc514e51-3774-4270-88ee-ca3f000e2428` for Org A and
the configured program. Wrong-program input returned
`CURRICULUM_VERIFIED_LEARNER_FACT_REQUIRED` with HTTP 400. Wrong organization
context returned HTTP 403, and a revoked reviewer membership caused HTTP 401.

The existing authenticated Reporting routes created report
`report_5b5212fa-cc82-4624-b09d-65c9b7127348`, transitioned it through
`draft -> ready_for_review -> approved`, and the final Reporting API read
returned HTTP 200 with the approved status, MetricTruth result ID, and
registered metric/version lineage. PostgreSQL confirmed the same approved
report and lineage. The existing `report.created` outbox event was emitted;
the canonical terminal consumer for this bounded workflow is the internal
reviewed Reporting API/projection, so no separate education delivery consumer
is required by the current architecture.

The route error mapper was minimally corrected so canonical Curriculum
eligibility failures are returned as client errors rather than internal 500s.
No migration or duplicate authority was introduced.
