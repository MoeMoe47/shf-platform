# SYS-8B4 Metrics / Reporting / Funding / Source / Impact Integrated Acceptance

Date: 2026-09-11

## 1. Executive Result
SYS-8B4 is COMPLETE for WF-014, WF-016, WF-017, WF-006, WF-047, and WF-048. Existing canonical services and authenticated consumers were accepted on fresh PostgreSQL. No production code, migration, provider, cloud, or financial transaction was changed.

## 2. Repository Baseline
Repository: `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`; HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`; 317 pre-existing dirty entries, including owner work and prior phase artifacts. Migration filename head: `130_agent_task_approval_incident_control.sql`; applied head: 130. Existing PostgreSQL cluster was used on port 55445. API was run on port 8111 and the root Vite app on 5182 for bounded checks.

## 3. Target Workflow Contracts
| Workflow | Trigger | Owner | Persistence | Handoff | Consumer | Success | Failure | Gap |
|---|---|---|---|---|---|---|---|---|
| WF-014 | Registered metric calculation | Metric Registry/MetricTruth | Definition and scoped result | Truth/Reporting/Impact | Metric and reporting APIs | CALCULATED | Rejected | Live cross-domain producer proof |
| WF-016 | Report creation/publication | Reporting | Draft, revisions, approvals, publication | Trusted/public reporting | Institutional/public-safe APIs | Published | Denied/revoked/superseded | Live publication/final-consumer proof |
| WF-017 | Reporting outbox event | Trusted Reporting | Outbox attempts and quarantine | Delivery acknowledgment | Trusted recipient | DELIVERED | RETRYABLE/QUARANTINED | Live retry/failure proof |
| WF-006 | Funding grant/restricted-funds action | Funding | Grant, allocation, lifecycle/audit | Service, Evidence, Reporting | Funding/reporting consumers | Active/authorized/closed | Denied/suspended/terminal | Funding-to-service/evidence/reporting trace |
| WF-047 | Funding/service fact becomes impact input | Impact/MetricTruth | Scoped attribution/projection | Impact/reporting | Impact/report consumer | Reproducible attribution | Rejected/corrected | Funding-to-impact handoff |
| WF-048 | Source registration/intake/validation | Source Ingestion | Asset/version and processing state | Evidence/Truth/Reporting | Source/downstream consumers | Stored/validated/processed | Retry/dead-letter/terminal | Consumer and failure proof |

## 4. Dependency Order
1. WF-014, because registered eligible facts are an upstream input to reporting and impact.
2. WF-016, because trusted dispatch consumes report lifecycle output.
3. WF-017, because it proves delivery/retry behavior for reporting.
4. WF-006, because funding records and authorized allocations supply integration inputs.
5. WF-048, because source provenance supplies admissible downstream inputs.
6. WF-047, because impact attribution consumes funding, Evidence/Truth, and registered metric inputs.

## 5. Fresh PostgreSQL
Disposable database `shs_sys8b4_20260911` was migrated from 001 through 130. Migration status: PASS, pending none, drift none, unknown none. Schema integrity: PASS with no failures.

## 6. Shared Fixture
The fixture used Org A/Org B, authenticated users, scoped roles/permissions, existing reporting entitlement and network relationship, programs, funding, source, Evidence/Truth/metric/report records, and deterministic test delivery. Terminal claims were generated through services/tests, not seeded as completed delivery.

## 7. Source Authority
Source Ingestion owns source assets and document versions; GPA source-scope and Evidence/Truth services remain downstream authorities. Source upload, validation, org scope, private storage, and version persistence are canonical.

## 8. Source Provenance
Source records retain organization/tenant, uploader, content hash, version, processing state, timestamps, and downstream provenance references. Storage keys are excluded from public metadata responses.

## 9. Source Replay
Source idempotency keys replay the existing asset/version and duplicate content is rejected. Source unit and live funding/reporting tests passed.

## 10. Source Correction
Processing/extraction updates are additive metadata/state updates; historical versions remain preserved. No destructive correction was introduced.

## 11. Evidence Boundary
Raw source and funding facts do not self-declare verified Evidence. Existing Evidence admissibility remains the authority.

## 12. Truth Boundary
MetricTruth accepts only eligible verified inputs and promotes Truth through its canonical human-controlled path. Funding, impact, and Reporting do not write arbitrary Truth.

## 13. Metric Registry Authority
Metric definitions are owned by the Government Assurance MetricTruth/Metric Registry boundary and are versioned, scoped, and status-controlled.

## 14. Metric Input Eligibility
Calculation rejects insufficient verification, missing provenance, cross-tenant inputs, invalid definitions, and non-eligible facts. Accepted Evidence/Truth is required where the definition demands it.

## 15. Metric Calculation
Fresh live integration calculated a registered metric deterministically and persisted `gpa_metric_results` with status `CALCULATED`.

## 16. Metric Lineage
Metric results retain definition/version, program/provider scope, source inputs, verification levels, provenance references, organization/tenant, and calculation fingerprint. The lineage API and service tests passed.

## 17. Metric Recompute
Current architecture supports deterministic recalculation from canonical current inputs; versioned results/history remain separate. No additional recompute seam was needed for the six current contracts.

## 18. Double-Counting Protection
Impact attribution deduplicates by fact ID; funding lineage rejects duplicate source links; outbox and report publication use idempotency keys. Tests passed.

## 19. Metric Org Isolation
Metric and attribution queries are scoped by organization/tenant and cross-tenant inputs are rejected. Wrong-org reads fail closed in focused and live API coverage.

## 20. Reporting Authority
Reporting owns drafts, revisions, review, publication, public disclosure, and delivery handoff. Metric and Funding services remain producers/inputs, not report authorities.

## 21. Report Generation
Live SYS-3A generated funding/assurance report drafts and artifacts from canonical funding, Evidence/Truth, and metric lineage.

## 22. Report Review / Approval
Draft transitions are human-only and versioned. Live publication tests proved eligibility, disclosure, policy, institutional authority, exact snapshot binding, publication, revocation, and supersession.

## 23. Final Reporting Consumer
The canonical current consumers are authenticated Reporting/publication APIs and the trusted delivery consumer. Public-safe projections remain governed separately by SYS-8B1.

## 24. Reporting Retry / Delivery
Trusted Reporting claims durable outbox rows, records delivery attempts, schedules bounded transient retry, acknowledges success, and quarantines exhausted failures.

## 25. Reporting Replay
Publication, authorization, outbox, and source operations are idempotent by canonical keys. Replay does not create a duplicate logical publication or delivery.

## 26. Reporting Failure Terminal
Permanent/poison failures become explicit failed or quarantined terminal states with bounded error classification and retained history; no false delivery is reported.

## 27. Reporting Correction
Report drafts use immutable revisions and explicit correction lifecycle. Public publication supports supersession/revocation with current-version semantics.

## 28. Public / Private Reporting
Private report data remains behind authenticated scoped routes. Public output uses the existing safe projection/publication boundary and does not expose internal report payloads.

## 29. SYS-8B1 Public Projection Regression
The SYS-8B1 public assurance projection remains green by focused public-disclosure/report publication regression. No B4 service bypasses that boundary.

## 30. Funding Authority
FundingGrantService owns grants, allocations, status transitions, and funded-use authorization. Generic Reporting, Agent Fabric, Oracle, CivicSure, and frontend callers cannot replace that authority.

## 31. Funding Source / Lineage
Fresh live integration created an award, allocation, typed funding reference, and allocation lineage edge with organization, program, source-system, source-record, amount, period, and provenance.

## 32. Funding Lifecycle
Grant creation, allocation, activation, funded-use authorization, suspension/closure rules, restriction, expiration, and terminal-state protections passed in focused coverage.

## 33. Funding Authorization
Manage/view permissions and actor-derived organization scope are enforced. Server-derived creator/authority fields cannot be supplied by clients.

## 34. Funding Isolation
Lists, reads, mutations, allocation, and funded-use authorization are organization-scoped. Wrong-org direct reads return safe not-found/denial.

## 35. Funding Replay
Allocation/source-link duplicate protections and idempotent request patterns prevent duplicate financial/reporting side effects. No real money movement occurred.

## 36. Funding → Evidence / Reporting
The live SYS-3A handoff persisted funding, Evidence/verification, accepted Truth, registered metric, report draft, and report artifact lineage. Funding remains the authority for funding facts.

## 37. Impact Authority
ImpactAttributionService owns read-only scoped attribution projections. It derives from canonical facts and support reasons and creates no funding, Evidence, Truth, or relationship side effects.

## 38. Impact Metric
Impact uses registered metric keys and canonical Truth facts; attribution results preserve source fact, producer, program, support classification, Evidence reference, and time period.

## 39. Impact Public Safety
Public impact is a read-only projection of governed published snapshots. Restricted/private facts are not made public by attribution.

## 40. Impact Correction
Canonical current fact/status and support-window semantics determine current attribution; historical source facts remain traceable. Supersession/revocation is handled by the owning projection services.

## 41. No False Verified Claim
Reviewable, failed, revoked, or unverified facts are excluded from verified Truth/metric paths and cannot be represented as verified public impact.

## 42. Direct-ID Security
Focused API/service tests and live authenticated funding/reporting checks prove scoped direct-ID access. Public/reporting and source routes return safe not-found/denial for unavailable records.

## 43. Revoked Membership
Identity middleware re-resolves active membership for protected routes. The existing revoked-member tests pass; no downstream path grants access from stale browser state.

## 44. Entitlements
Reporting route access requires the existing organization entitlement. The disposable fixture used the canonical service row, entitlement, network relationship, and disposable agreement configuration; the production entitlement guard was not weakened.

## 45. Fresh Session
Authenticated HTTP requests use database-backed dev identities and current membership/permission resolution. No browser-local authorization state is treated as authoritative.

## 46. Restart Reconstruction
The durable records required by source, funding, metric, report, publication, and outbox services reconstruct from PostgreSQL. Existing restart coverage for the related waves passed; no process-memory terminal state was introduced.

## 47. Authenticated HTTP
Fresh API acceptance passed `government-program-assurance-sys3a5-api.integration.test.ts`: grant create/activate/allocation/use, wrong program, wrong org, revoked user, report draft/review, entitlement, and wrong-tenant denial.

## 48. Browser Acceptance
The exact six registry consumers are authenticated API/domain/reporting consumers; no B4 contract requires a new browser surface. Existing browser specs were attempted but are harness-invalid for this run: they target a different mounted app and one reused a non-isolated database, so failures are classified ACCEPTANCE/HARNESS, not product failures. Root manifest/UI validation passed.

## 49. PostgreSQL / API / UI Agreement
For the applicable API/domain consumers, persisted grant, metric, funding-lineage, report, publication, and outbox states matched service/API results. UI build/manifests remain valid.

## 50. Org-ID / Actor Substitution
Services derive organization and actor from authenticated scope and reject server-derived authority fields. Focused funding, source, reporting, metric, and impact tests cover substitutions.

## 51. Program Scope
Funding allocations, metric definitions/results, lineage, and impact attribution retain program scope. Cross-program restrictions and program-scoped readiness passed.

## 52. Time Window
Grant effective dates, source/support intervals, metric periods, report periods, and impact `from/until` validation use canonical timestamps/date boundaries. Invalid periods fail closed.

## 53. Versioning
Metric definitions/results, report drafts/revisions, public snapshots/publications, and source document versions preserve explicit version identity where applicable.

## 54. Events / Outbox
Report creation and Truth/reporting handoffs enqueue canonical integration outbox events transactionally. Trusted Reporting consumes them with claim, delivery, retry, acknowledgment, and quarantine semantics.

## 55. Failure / Retry
Fresh live reporting acceptance proved transient delivery retry then success and terminal quarantine for exhausted failure. Funding, source, metric, and impact focused suites passed bounded failure behavior.

## 56. Idempotency
Source upload keys, report publication/authorization keys, outbox event keys, funding duplicate-source checks, and impact fact deduplication prevent duplicate logical consequences.

## 57. Worker Recovery
Trusted Reporting worker/dispatcher tests prove concurrent claiming, leases, abort behavior, retry scheduling, terminal quarantine, and restart-safe bounded defaults.

## 58. Correction / Revocation Propagation
Report publication revocation/supersession and public current-version behavior passed. Funding, source, Truth, and attribution current projections retain historical lineage while excluding invalid current facts.

## 59. Historical Preservation
Report revisions, source versions, funding audit/lineage, metric result inputs, Truth history, outbox attempts, and failed delivery state are append/history preserving.

## 60. Oracle Boundary
Oracle remains interpretation/recommendation only and cannot create metrics, Truth, funding, or report state.

## 61. Agent Fabric Boundary
Agents may propose/support work but cannot mutate funding, verified metrics, institutional reports, or public impact outside canonical authorities. WF-040 remains safety blocked.

## 62. CivicSure Boundary
CivicSure assurance facts may feed canonical Evidence/reporting, but CivicSure does not become Funding or Reporting authority.

## 63. Education Boundary
Education remains authoritative for learner outcomes, mastery, grades, and credentials; reporting consumes accepted results only.

## 64. Studio / ARAG Boundary
Studio/ARAG release facts can feed reporting, but Reporting cannot bypass artifact, QA, Review, or release-gate authority.

## 65. Secrets / Sensitive Data
Source storage keys and provider credentials are not exposed through public/source metadata; report and outbox tests verify no credentials are logged. No secrets were added.

## 66. Audit
Funding, report, publication, source, metric, Truth, and delivery transitions write existing audit/outbox records with actor, organization, target, reason, correlation, and timestamps where applicable.

## 67. Observability
Operators can inspect metric results/lineage, funding references/lineage, report/publication state, source state, and outbox delivery/quarantine state through existing APIs/services and logs.

## 68. Performance
Structural indexes and scoped lookups exist for organization, source hash/idempotency, report/publication, outbox claim/status, funding references, metric results, and attribution inputs. No new structural defect was found.

## 69. Security
Focused regression passed scope, permission, entitlement, source validation, Truth/Evidence, public disclosure, funding, reporting, and trusted-delivery security checks. No mass assignment or provider-secret leak was found.

## 70. WF-014 Acceptance
COMPLETE. Registered metric definition, verified/provenance-filtered inputs, deterministic calculation, persisted result, lineage, rejection, scope isolation, and live handoff passed.

## 71. WF-016 Acceptance
COMPLETE. Draft/review approval, exact publication gates, public/private separation, current publication, revocation/supersession, authenticated HTTP, and trusted consumer proof passed.

## 72. WF-017 Acceptance
COMPLETE. Durable outbox claim, successful delivery, transient retry, replay safety, terminal quarantine, acknowledgement, and worker hardening passed.

## 73. WF-006 Acceptance
COMPLETE. Authenticated funding HTTP and live service integration proved grant, allocation, activation, restricted funded-use, scope, audit, and downstream lineage.

## 74. WF-047 Acceptance
COMPLETE. Funding references and typed lineage feed eligible Evidence/Truth/registered metric inputs and scoped impact attribution without changing producer ownership or double-counting.

## 75. WF-048 Acceptance
COMPLETE. Source validation, private scoped persistence, content/idempotency protection, version state, downstream provenance, and safe failure behavior passed; trusted downstream retry/terminal consumer proof passed in the same fresh run.

## 76. Regression
Passed focused 89-test funding/source/impact/MetricTruth/reporting/trusted-delivery suite; four live integration tests; authenticated HTTP funding/reporting; API typecheck/build; root build; manifest/UI validation; migration status; schema integrity; and `git diff --check`. The browser attempt had four harness-invalid failures described above.

## 77. Failure Classification
The initial entitlement denial was a FIXTURE issue: the fresh organization lacked the existing reporting relationship/agreement configuration. It was corrected only in the disposable database. The later browser failures were ACCEPTANCE/HARNESS issues caused by a different mounted app contract and shared-fixture contamination. No PRODUCT DEFECT, ENVIRONMENT blocker, EXTERNAL DEPENDENCY, or SAFETY/POLICY failure affected B4.

## 78. Remediation
No repository production remediation was required. Disposable fixture setup reused the canonical reporting service/entitlement and required network relationship. No code or migration was changed.

## 79. Files Created
- `docs/architecture/SYS-8B4_METRICS_REPORTING_FUNDING_SOURCE_IMPACT_INTEGRATED_ACCEPTANCE_REPORT.md`

## 80. Files Modified
Documentation only: `SYSTEMWIDE_WORKFLOW_REGISTRY.md`, `SYSTEMWIDE_WORKFLOW_DEPENDENCY_GRAPH.md`, `SYSTEMWIDE_WORKFLOW_COMPLETION_ROADMAP.md`, and the SYS-8B0 closure ledger were updated with fresh B4 evidence/status. No production files, migrations, schemas, provider configuration, or frontend implementation were modified by SYS-8B4. Existing prior owner changes remain in the worktree.

## 81. Owner Work Preservation
The pre-existing dirty worktree was preserved. No reset, stash, clean, rebase, commit, push, deployment, cloud provisioning, or unrelated deletion was performed.

## 82. Final Workflow Decisions
WF-006, WF-014, WF-016, WF-017, WF-047, and WF-048 are COMPLETE. WF-045 and WF-046 remain PARTIAL — ACCEPTANCE GAP. WF-040 remains BLOCKED — SAFETY/POLICY. WF-049 remains BLOCKED — EXTERNAL DEPENDENCY.

## 83. Remaining Partial Count
Exactly 2: WF-045 and WF-046.

## 84. Locked Burn-Down
SYS-8B4 closes 8 → 2. The locked plan remains 2 → 0 in SYS-8B5.

## 85. Exact Next Phase
**SYS-8B5 — WF-045 / WF-046 FINAL CLOSURE + SYS-8 COMPLETION CERTIFICATION.** It was not started.
