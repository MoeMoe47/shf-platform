# PR-2 Data Lineage, Privacy, Retention & Recovery Report

Date: 2026-09-12
Repository: `/Users/mikeslate/Projects/shrv1`
Phase: PR-2 - Data Lineage, Privacy, Retention & Recovery

## PR-2 Scoped Gap Ledger

| PR0 Gap ID | Starting Status | Work Performed | Final Status | Evidence |
|---|---|---|---|---|
| PR0-GAP-010 | OPEN | Verified local private source/report storage, added hash-checked local file backup/restore support, and documented production object-store dependency. | BLOCKED — EXTERNAL DEPENDENCY | `apps/shs-api/src/domain/source-ingestion/storage/source-storage.ts`; `apps/shs-api/src/domain/reporting/report-file-storage.ts`; `apps/shs-api/src/recovery/pr2-local-backup.ts`; PR-2 tests pass. |
| PR0-GAP-011 | OPEN | Verified explicit auth, permission scope, size/type validation, private storage, safe download headers, audit metadata, and documented scanner/quarantine dependency. | BLOCKED — EXTERNAL DEPENDENCY | `apps/shs-api/src/domain/source-ingestion/api/routes.ts`; `apps/shs-api/src/domain/source-ingestion/service/source-validation.ts`; `apps/shs-api/src/domain/source-ingestion/service/source-service.ts`; `tests/pr2LineagePrivacyRecovery.test.mjs`. |
| PR0-GAP-012 | OPEN | Added repository-local backup/restore helpers, secret-safe DB backup plan, local restore drill test, and recovery runbook. | BLOCKED — EXTERNAL DEPENDENCY | `apps/shs-api/src/recovery/pr2-local-backup.ts`; `apps/shs-api/tests/pr2-data-governance-recovery.test.ts`; `docs/architecture/PR-2_RECOVERY_RUNBOOK.md`. |
| PR0-GAP-017 | OPEN | Added machine-checkable privacy classification, legal-hold no-delete decisioning, scoped subject-export filter, and fail-closed retention behavior evidence. | RESOLVED | `apps/shs-api/src/recovery/pr2-data-governance.ts`; `apps/shs-api/src/db/lifecycle-manager.ts`; PR-2 tests pass. |
| PR0-GAP-024 | OPEN | Added representative machine-checkable lineage chains for education, CivicSure, Studio, ARAG-1, Agent Fabric, and program/service delivery; preserved real-data external blocker. | BLOCKED — EXTERNAL DEPENDENCY | `apps/shs-api/src/recovery/pr2-data-governance.ts`; `apps/shs-api/tests/pr2-data-governance-recovery.test.ts`. |
| PR0-GAP-025 | OPEN | Added correction propagation contract requiring event detection, recompute, projection refresh, metric refresh, report supersession, and public projection refresh. | RESOLVED | `apps/shs-api/src/recovery/pr2-data-governance.ts`; `tests/pr2LineagePrivacyRecovery.test.mjs`; publication boundary tests. |

## 1. Executive Result

PR-2 repository-local work is complete. All six PR-2-owned PR0 gaps were addressed without starting payments, provider activation, observability platform, load testing, deployment, Agent Fabric production execution, or real-organization pilot work.

Final PR-2 result: 2 gaps RESOLVED, 4 gaps BLOCKED — EXTERNAL DEPENDENCY, 0 gaps OPEN — REPOSITORY WORK REMAINS. No PR-2 P0 appeared and no repository-local PR-2 P1 remains.

## 2. Repository Baseline

| Item | Evidence |
|---|---|
| `pwd` | `/Users/mikeslate/Projects/shrv1` |
| Git top-level | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| Starting HEAD | `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061` |
| Last commit | `9eaaa0c (HEAD -> studio-v1-plus-development, tag: fe8-frontend-program-complete-2026-09-11, origin/studio-v1-plus-development) checkpoint: complete FE-8 final frontend acceptance` |
| Upstream | `origin/studio-v1-plus-development` |
| Remote | `git@github.com:MoeMoe47/shf-platform.git` |
| Tracked modifications at start | PR-1 modified API/frontend files plus generated test snapshot/state were preserved. |
| Untracked files at start | PR-0/PR-1 reports, PR-1 security files/tests, runtime artifacts, and temporary audit scripts were preserved. |
| Git safety | No reset, clean, stash, rebase, commit, push, or tag mutation performed. |

Prior restore tags for SYS backend, FE-0 through FE-8, and ecosystem runtime routing resolved successfully and were not altered.

## 3. PR-0 Gap IDs Owned by PR-2

| Gap ID | Gap | Severity | Existing Evidence | Canonical Owner | Closure Requirement | Dependency |
|---|---|---|---|---|---|---|
| PR0-GAP-010 | Object/evidence/report storage | P1 | Local private storage and report file storage exist. | Source ingestion/reporting storage. | Scoped keys, encryption/versioning, access denial, retention, backup/restore proof. | Production object store/encryption/lifecycle. |
| PR0-GAP-011 | Upload security | P1 | Source ingestion protected; legacy uploads route 501. | Source ingestion and upload boundary. | Size/type scanning, auth scope, storage isolation, quarantine, audit, safe download. | Malware/content scanner provider. |
| PR0-GAP-012 | Backup / restore | P1 | No operational restore drill in PR-0. | Repository recovery helpers plus deployment owner later. | Backup jobs, protected storage, restore drill, RPO/RTO. | Production backup infrastructure and schedule. |
| PR0-GAP-017 | Privacy / retention / deletion / legal hold / SAR | P1 | Retention contract and lifecycle manager existed but all-store enforcement was not proven. | Data governance/lifecycle manager. | Schedules, inventory, retention, deletion/archive, legal hold, scoped export. | Counsel/customer durations remain policy input. |
| PR0-GAP-024 | Real-data lineage | P1 | Representative code lineage existed; real data not accepted. | Domain owners plus source owners. | End-to-end lineage packets through reports/public projections. | Real or approved production-like pilot data. |
| PR0-GAP-025 | Recompute / correction propagation | P1 | Correction/supersession patterns existed; all derived systems not proven. | Domain services, Metric Registry, Reporting/Public projection. | Correction drills with recompute, supersession, withdrawal/republication. | Real-data proof tracked by PR0-GAP-024. |

## 4. Scope Boundaries

PR-2 changed only lineage/privacy/recovery documentation and small provider-neutral recovery helpers. It did not implement payments, payment security, provider activation, production observability, load testing, deployment infrastructure, real-organization pilot work, or unrestricted Agent Fabric execution.

## 5. Canonical Data Lineage Model

The canonical lineage model is source fact -> operational event -> evidence/source reference -> verification/truth or domain projection -> metric -> report snapshot/artifact -> publication/public-safe projection where applicable. `REPRESENTATIVE_LINEAGE_CHAINS` makes the representative chains machine-checkable without creating a parallel lineage database.

## 6. Education Lineage

Education lineage is traceable from enrollment/assignment/curriculum release through learner outcomes, program completion, and report artifacts. Evidence: `curriculum_learner_outcomes` stores provenance/evidence/source versions; `ProgramCompletionService` records requirements version, definition hash, evidence refs, source versions, and completion hash.

## 7. CivicSure Lineage

CivicSure lineage is traceable from funding/requirements to claims, verification, Truth, Metric Registry results, report snapshots, publication authorization, and public-safe projection. CivicSure remains assurance/reporting infrastructure and not a payment source of record.

## 8. Studio Lineage

Studio lineage is traceable from project to workspace revision, QA run, review submission, decision, finalized handoff, and release artifact. The representative chain preserves immutable revision and approved-submission references.

## 9. ARAG-1 Lineage

ARAG-1 lineage is traceable from repository/work order to policy, gate evaluation, human approval, release record, and evidence packet hash. PR-2 did not alter ARAG authorization or release authority.

## 10. Agent Fabric Lineage

Agent Fabric lineage is auditable for governed sessions: agent identity, session, task/policy, tool invocation, approval, and audit event. WF-040 remains intentionally blocked; unrestricted production execution was not enabled.

## 11. SHF / SHS Program Lineage

Program/service lineage is traceable from organization to service entitlement, program, participation/delivery evidence, and report artifact where product capability exists. PR-2 did not invent lineage for not-yet-real pilot operations.

## 12. Provenance

Representative chains require owner, stable source ID, scope, provenance, and version at each node. Tests reject incomplete lineage nodes.

## 13. Version / Revision Tracking

Version/revision context exists for curriculum releases, learner outcomes, program completion requirements, Studio revisions, QA/review decisions, report artifacts, public snapshots, publication records, ARAG policies/gates, and Agent Fabric policy snapshots.

## 14. Correction Model

Corrections must be explicit source corrections, amendments, supersessions, retractions, or re-publications. Silent destructive rewrite is not an accepted PR-2 path for canonical history.

## 15. Recompute / Propagation

The PR-2 correction contract requires event detection, recompute, projection refresh, metric refresh, report supersession, and public projection refresh. This closes repository-local PR0-GAP-025; real-data proof remains blocked by PR0-GAP-024.

## 16. Stale Data Review

Existing public publication code rejects stale public snapshots and requires current eligibility/disclosure decisions. Publication requires exact snapshot hash/version binding and explicit supersession of current publications.

## 17. Metric Recompute

Metric Registry remains the metric authority. PR-2 did not create frontend-only institutional metric authority. Metric recompute is part of the correction propagation contract and real-data validation remains tied to PR0-GAP-024.

## 18. Report Supersession

Reports/publications preserve immutable snapshot/hash/version history. Supersession uses `supersedes_publication_id`, `markNotCurrent`, and revocation handling rather than overwriting historical publications.

## 19. Public Projection Correction

Public projections are derived from canonical publication rows only, require `projection_status = 'PUBLISHED'` and `source_type = 'CANONICAL_PUBLICATION'`, and expose allowlisted public fields only.

## 20. Data Classification

PR-2 defines machine-checkable data classes: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, PARTICIPANT_PII, STUDENT_DATA, PROVIDER_CONFIDENTIAL, GOVERNMENT_ASSURANCE_INTERNAL, and IMMUTABLE_INSTITUTIONAL_HISTORY.

## 21. Privacy Enforcement

Privacy enforcement evidence includes source metadata scoping, private storage visibility, safe response stripping of storage keys, public projection DTO allowlists, lifecycle allowlists, legal-hold no-delete behavior, and scoped subject-export filters.

## 22. Retention

The lifecycle manager remains allowlisted to bounded operational/security tables only. Missing production policy durations produce no-delete behavior. Canonical history and protected classes are not automatically deleted.

## 23. Archival

PR-2 treats archival as separate from deletion. PUBLIC/INTERNAL classes are archive-only until an owner-approved policy says otherwise; protected/canonical classes default to no automatic delete.

## 24. Deletion

Deletion is controlled and allowlisted. Retention helpers fail closed for unknown or protected classes, legal hold prevents deletion, and lifecycle cleanup cannot target arbitrary tables.

## 25. Legal Hold

Legal hold is supported repository-locally as a no-delete override in `retentionDecision()`. Legal conclusions and customer-specific hold procedures remain external policy inputs.

## 26. Subject Access / Export

Subject export is scoped to records owned by the subject user or learner user and excludes internal-only, restricted, provider-confidential, government-internal, and immutable institutional history records.

## 27. Subject Correction

Subject correction must not rewrite Evidence/Truth/report history directly. Corrections route through explicit source correction and recompute/supersession behavior.

## 28. Publication Boundary

Publication remains separate from report creation and approval. Public-safe projection requires eligibility, disclosure policy, institutional authority, release approval, exact snapshot binding, and publication execution.

## 29. Durable Store Inventory

| Store | Owner | Data Type | Backup Method | Frequency | Encryption | Restore Method | Restore Tested | Status |
|---|---|---|---|---|---|---|---|---|
| Relational DB | SHS API | Canonical rows, audit, reports, lineage | `pg_dump` plan | External | External | `pg_restore` isolated target | Plan only | BLOCKED — EXTERNAL DEPENDENCY |
| Local private source/evidence files | Source ingestion | Uploaded source bytes | PR-2 local JSON archive with hash | Operator-run | File-system permissions; external at prod | PR-2 restore helper | Yes local drill | BLOCKED — EXTERNAL DEPENDENCY for prod |
| Local report artifacts | Reporting | JSON/HTML/PDF artifacts | PR-2 local archive when local | Operator-run | File-system permissions; external at prod | PR-2 restore helper | Yes representative drill | BLOCKED — EXTERNAL DEPENDENCY for prod |
| Audit/events | SHS API | Audit/security/lineage events | DB backup | External | External | DB restore | Plan only | BLOCKED — EXTERNAL DEPENDENCY |
| Secrets/config | Deployment/secret manager | Credentials/config refs | Not backed up by repo | External | Secret manager | Rehydrate from secret manager | No | BLOCKED — EXTERNAL DEPENDENCY |

## 30. Backup Architecture

Repository-local backup architecture is provider-neutral: database backup plan generation plus local file-store archives with hashes, safe paths, classifications, and exclusive archive creation. Production scheduling, encryption, cloud lifecycle, and monitoring remain external.

## 31. Database Backup

`databaseBackupPlan()` requires `SHF_BACKUP_OUTPUT_DIR` and returns a `pg_dump --format=custom --no-owner --no-privileges` plan. It does not serialize `DATABASE_URL` or secret values.

## 32. File / Evidence Backup

`createLocalFileBackup()` walks a local source root, rejects unsafe relative paths, records SHA-256 and byte size, and writes an exclusive mode-restricted archive outside the repository in tests.

## 33. Report Artifact Backup

Report artifacts can use the same local backup helper where the canonical report store is local. Production report artifact backup remains dependent on the selected object store.

## 34. Restore Architecture

`restoreLocalFileBackup()` restores only safe relative paths into an isolated target and verifies hash/size before write. Existing files are not overwritten.

## 35. Database Restore

Database restore is documented as `pg_restore` into `RESTORE_DATABASE_URL`, followed by migration/status and lineage integrity validation. PR-2 did not run a destructive database restore over any active database.

## 36. File / Evidence Restore

The PR-2 local restore drill restored evidence/report files into an isolated temp root and verified content hashes and byte counts.

## 37. Restore Drill

Safe local drill performed by `apps/shs-api/tests/pr2-data-governance-recovery.test.ts`: create files -> backup archive -> restore to isolated root -> verify restored hashes/content. No production or owner database was touched.

## 38. Recovery Integrity

Recovery integrity is validated for local file artifacts by hash/byte count and for lineage by machine-checkable representative chains. Full DB/object production integrity drill remains external.

## 39. Privacy After Restore

The runbook requires validation that restore does not silently republish withdrawn projections, reactivate deleted/anonymized records, bypass legal hold, or expose internal evidence through public DTOs. Production proof remains tied to external restore drill.

## 40. Backup Security

Backups must live outside source control, avoid secret values, use restricted file modes, preserve classification metadata, and be restored only into isolated targets unless a separate incident procedure authorizes otherwise.

## 41. Recovery Runbook

Created `docs/architecture/PR-2_RECOVERY_RUNBOOK.md` covering authority, durable stores, backup, restore, privacy-after-restore, failed restore, and validation commands.

## 42. PR-2 Tests

Added `apps/shs-api/tests/pr2-data-governance-recovery.test.ts` and `tests/pr2LineagePrivacyRecovery.test.mjs`.

## 43. PR-0 Gap Closure Matrix

| PR0 Gap ID | Gap | Starting Classification | Work Performed | Tests | Final Classification | Remaining Dependency |
|---|---|---|---|---|---|---|
| PR0-GAP-010 | Object/evidence/report storage | OPEN | Verified scoped local storage and added local backup/restore support. | PR-2 recovery and static boundary tests. | BLOCKED — EXTERNAL DEPENDENCY | Production object storage, encryption, lifecycle, access control, restore proof. |
| PR0-GAP-011 | Upload security | OPEN | Verified explicit auth, permissions, validation, private storage, safe download, audit; preserved scanner boundary. | Source ingestion and PR-2 static tests. | BLOCKED — EXTERNAL DEPENDENCY | Malware/content scanning provider and quarantine acceptance. |
| PR0-GAP-012 | Backup / restore | OPEN | Added local file backup/restore drill, DB backup plan, and recovery runbook. | PR-2 recovery test. | BLOCKED — EXTERNAL DEPENDENCY | Scheduled production DB/object/report/config backups and deployed restore drill. |
| PR0-GAP-017 | Privacy / retention / deletion / legal hold / SAR | OPEN | Added classification, legal-hold no-delete, scoped export, and fail-closed retention decisions. | PR-2 data governance and lifecycle static tests. | RESOLVED | None for repository-local PR-2 scope. |
| PR0-GAP-024 | Real-data lineage | OPEN | Added representative machine-checkable lineage chains. | PR-2 data governance test. | BLOCKED — EXTERNAL DEPENDENCY | Real or approved production-like pilot source data and source-owner acceptance. |
| PR0-GAP-025 | Recompute / correction propagation | OPEN | Added correction propagation contract and verified report/public supersession boundaries. | PR-2 data governance and static boundary tests. | RESOLVED | None for repository-local PR-2 scope; real-data proof remains PR0-GAP-024. |

## 44. P0 / P1 Status

P0: zero. Repository-local PR-2 P1: zero. Remaining PR-2 blockers are external-environment or real-data dependencies.

## 45. Remaining External Blockers

Production object storage/encryption/lifecycle/access-control proof, malware/content scanning and quarantine provider, scheduled production DB/object/report/config backups, deployed restore drill, real or approved production-like source data, source-owner acceptance, and customer/counsel retention duration approval.

## 46. Files Created

- `apps/shs-api/src/recovery/pr2-data-governance.ts`
- `apps/shs-api/src/recovery/pr2-local-backup.ts`
- `apps/shs-api/tests/pr2-data-governance-recovery.test.ts`
- `tests/pr2LineagePrivacyRecovery.test.mjs`
- `docs/architecture/PR-2_RECOVERY_RUNBOOK.md`
- `docs/architecture/PR-2_DATA_LINEAGE_PRIVACY_RETENTION_RECOVERY_REPORT.md`

## 47. Files Modified

- `docs/architecture/PR-0_HISTORICAL_GAP_CLOSURE_AUDIT.md`

## 48. Owner Work Preservation

Pre-existing PR-1 tracked/untracked changes, generated snapshots, runtime artifacts, and temporary scripts were preserved. No destructive Git command, commit, push, tag mutation, PR-3 work, provider call, production restore, or deployment was performed.

## 49. Validation

Focused validation completed:

| Command | Result |
|---|---|
| `npx tsx --test apps/shs-api/tests/pr2-data-governance-recovery.test.ts` | PASS, 6/6 |
| `node --test tests/pr2LineagePrivacyRecovery.test.mjs` | PASS, 4/4 |

Full required validation:

| Command | Result |
|---|---|
| `npm run manifests:validate` | PASS, 17 manifests |
| `npm run ui:validate` | PASS, 1 UI contract |
| `npm run check:layers` | PASS, 57 registry rows/layers |
| `npm run check:truth` | PASS |
| `npm run check:oracle` | PASS |
| `node --test tests/fe*.mjs tests/ecosystemRuntimeRouting.test.mjs` | PASS, 29/29 |
| `npm --prefix apps/shs-api run build` | PASS |
| `npm run build` | PASS with existing Vite chunk/dynamic import warnings |
| `git diff --check` | PASS |

## 50. PR-2 Decision

PR-2 is COMPLETE for repository-local scope when full validation passes. All PR-2-owned gaps are resolved or precisely classified as external dependencies.

## 51. Exact Next Phase

PR-3 - Payments & Financial Operations Readiness. PR-3 was not started.

## Final Verdict Questions

| # | Question | Answer |
|---:|---|---|
| 1 | Which PR0-GAP IDs belonged to PR-2? | PR0-GAP-010, PR0-GAP-011, PR0-GAP-012, PR0-GAP-017, PR0-GAP-024, PR0-GAP-025. |
| 2 | How many were RESOLVED? | 2. |
| 3 | How many remain OPEN? | 0 repository-local PR-2 gaps remain open. |
| 4 | How many are BLOCKED — EXTERNAL DEPENDENCY? | 4. |
| 5 | Did any P0 appear? | No. |
| 6 | Do any repository-local PR-2 P1 gaps remain? | No. |
| 7 | Is education lineage end-to-end traceable? | Yes for representative repository-local lineage; real-data proof remains external. |
| 8 | Is CivicSure lineage end-to-end traceable? | Yes for representative repository-local lineage; real-data proof remains external. |
| 9 | Is Studio lineage end-to-end traceable? | Yes. |
| 10 | Is ARAG-1 lineage traceable? | Yes. |
| 11 | Is Agent Fabric lineage sufficiently auditable? | Yes for governed/bounded execution; WF-040 remains blocked. |
| 12 | Is provenance preserved? | Yes for representative PR-2 chains. |
| 13 | Are source versions/revisions retained? | Yes for representative chains. |
| 14 | Can canonical source corrections propagate? | Yes by repository-local correction contract. |
| 15 | Are derived projections recomputed correctly? | Defined and test-covered at contract level; real-data proof remains external. |
| 16 | Can stale metrics survive corrections? | Repository-local contract says no; real-data acceptance remains PR0-GAP-024. |
| 17 | Are reports superseded/corrected safely? | Yes by exact snapshot/hash and supersession controls. |
| 18 | Do public projections update safely? | Yes through canonical publication/projection boundaries. |
| 19 | Is Metric Registry still authoritative? | Yes. |
| 20 | Is data classification defined? | Yes. |
| 21 | Is classification enforced? | Yes for repository-local PR-2 surfaces and tests. |
| 22 | Is retention defined? | Yes for repository-local classes/decisions; exact production durations remain policy input. |
| 23 | Is archival defined? | Yes as archive-only/no-delete separate from deletion. |
| 24 | Is deletion controlled? | Yes; allowlisted and fail-closed. |
| 25 | Is legal hold supported where required? | Yes as a no-delete override in repository-local policy. |
| 26 | Is subject access/export safe? | Yes for repository-local scoped filters. |
| 27 | Is subject correction safe? | Yes; it does not bypass institutional authority. |
| 28 | Is publication separate from report creation/approval? | Yes. |
| 29 | What durable stores exist? | Relational DB, local/private source/evidence files, local report artifacts, audit/events in DB, external secrets/config references. |
| 30 | Are database backups implemented? | Repository backup plan exists; production scheduled DB backups remain external. |
| 31 | Are file/evidence backups implemented? | Repository-local local-file backup/restore helper and drill pass; production object backup remains external. |
| 32 | Are report artifacts backed up? | Repository helper supports local report artifacts; production object backup remains external. |
| 33 | Is restore documented? | Yes. |
| 34 | Was a safe restore drill performed? | Yes, local isolated file restore drill. |
| 35 | Did restored data preserve lineage? | File integrity and representative lineage contracts are validated; production DB/object lineage drill remains external. |
| 36 | Did restore preserve scope/ownership? | Scope/ownership are preserved in representative chains and archive metadata; production proof remains external. |
| 37 | Can deleted/expired data be incorrectly resurrected? | Repository runbook forbids that and tests fail closed; production restore proof remains external. |
| 38 | Are backups protected? | Repository helpers use safe paths, mode restrictions, no secrets, and source-control exclusion guidance; production protection remains external. |
| 39 | Is a recovery runbook available? | Yes: `docs/architecture/PR-2_RECOVERY_RUNBOOK.md`. |
| 40 | Do all PR-2 tests pass? | Yes, focused PR-2 tests pass. |
| 41 | Do FE/runtime regression tests pass? | Yes, 29/29. |
| 42 | Does build pass? | Yes, root Vite build and API TypeScript build pass. |
| 43 | Do manifests/UI/Layer/Truth/Oracle checks pass? | Yes. |
| 44 | Does git diff --check pass? | Yes. |
| 45 | Are P0 defects zero? | Yes. |
| 46 | Are repository-local PR-2 P1 defects zero? | Yes. |
| 47 | Is PR-2 COMPLETE? | Yes if full validation passes. |
| 48 | Was PR-3 started? | No. |
| 49 | What exact phase comes next? | PR-3 - Payments & Financial Operations Readiness. |
