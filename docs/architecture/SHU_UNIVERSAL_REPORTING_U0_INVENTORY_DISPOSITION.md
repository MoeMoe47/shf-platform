# SHU Universal Reporting U0 Inventory and Disposition

**Status:** Complete as an inventory and disposition baseline

**Repository:** `/Users/mikeslate/Projects/shrv1`

**Branch:** `studio-v1-plus-development`

**Observed HEAD:** `444b03e47c154156d831d87f6cb9733ce2794fe9`

**Observed dirty-file count:** 78 before this document was added. Existing owner work was preserved.

**Status hash:** `218b4559135c95554237aaddd1976df088fa5a3866db08102d336df10d629ba9`

**Latest migration:** `106_civicsure_report_r1_foundation.sql`

**U0 rule:** No deletion, consolidation, migration, schema change, or runtime behavior change is performed by this document.

## 1. Executive Result

U0 confirms one canonical Reporting authority exists in `apps/shs-api/src/domain/reporting/`. CivicSure is the reference implementation. The rest of the repository contains product projections, domain artifacts, frontend report configuration, local structured exports, browser print paths, and legacy/parallel UI concepts that require controlled disposition.

The correct U1 boundary is a thin product/report-family adapter contract feeding Shared Reporting. No second artifact, rendering, history, storage, or publication authority should be created.

## 2. Repository Baseline

The current branch is `studio-v1-plus-development` at `444b03e47c154156d831d87f6cb9733ce2794fe9`. The worktree contains 78 dirty paths, including owner modifications and untracked implementation/documentation work. U0 does not stage, reset, clean, stash, discard, or otherwise alter those paths.

Reporting-related areas include:

- `apps/shs-api/src/domain/reporting/`
- `apps/shs-api/src/domain/government-assurance/`
- `apps/shs-api/migrations/106_civicsure_report_r1_foundation.sql`
- `src/shared/reporting/`
- `src/data/shsReports/`
- `src/pages/admin/reports/`
- `src/pages/admin/reporting/`
- `src/system/persistence/repositories/reportsRepository.js`
- product pages and utilities containing local exports or print paths

## 3. Canonical Shared Reporting

The following is formally designated `CANONICAL_SHARED_REPORTING`:

- `ReportArtifactService`
- `ReportR1Service`
- `ReportTemplateRegistry`
- `CivicSureRenderAdapter`
- `ReportFileStorage`
- `report_artifacts`
- `report_payload_snapshots`
- `report_rendered_files`
- `report_templates`
- Reporting routes and scoped retrieval
- artifact history and rendered-file metadata
- classification and report permissions
- Public Disclosure/publication boundary
- report audit events

Shared Reporting receives authorized projections. It does not independently expand product data access and does not replace product artifact authorities.

## 4. Second Frontend Report System

The second frontend system consists of `src/data/shsReports/`, `src/pages/admin/reports/`, `src/pages/admin/reporting/`, and `src/system/persistence/repositories/reportsRepository.js`.

### `src/data/shsReports/`

| File | Current ownership observed | U0 disposition |
|---|---|---|
| `shsReportRegistry.js` | Frontend report catalog/lookup | `KEEP_AS_PRODUCT_UI`; later feed from Shared Reporting registry |
| `shsReportTypes.js` | UI report-type definitions and labels | `REUSE_AS_ADAPTER_INPUT`; canonical report identity must remain API-owned |
| `shsReportTemplates.js` | Frontend presentation/template metadata | `KEEP_AS_PRODUCT_UI` for screen composition; do not make it artifact authority |
| `shsReportLifecycle.js` | UI lifecycle labels and transitions | `KEEP_AS_PRODUCT_UI` only where it reflects API state; governed lifecycle remains server-owned |
| `shsReportVisibility.js` | UI visibility/audience presentation | `KEEP_AS_PRODUCT_UI`; enforce through server permissions/publication |
| `shsReportReadiness.js` | UI readiness checks and display state | `KEEP_AS_PRODUCT_UI` or adapter input; server readiness remains authoritative |
| `shsReportStorage.js` | Frontend/local storage model or storage façade | `MIGRATE_TO_SHARED_REPORTING` for official artifact storage; never canonical localStorage |
| `shsReportLaunchPoints.js` | Navigation/launch metadata | `KEEP_AS_PRODUCT_UI` |
| `shsReportSeedData.js` | Demo/fixture presentation data | `LEGACY` or test-only after fixture ownership review; never production authority |

### `src/pages/admin/reports/`

`ShsReportsCommandPage`, `ShsCreateReportPage`, `ShsReportHistoryPage`, `ShsExportMetadataPage`, `ShsPremiumReportPreviewPage`, their components, CSS, status cards, metadata panels, history tables, branding panels, and readiness panels form an administrative report experience. They are useful UI and presentation primitives, but they must consume Shared Reporting APIs for official artifact state.

Disposition: `KEEP_AS_PRODUCT_UI` plus `REUSE_AS_ADAPTER_INPUT` for product labels and layout patterns. Any local history, storage, lifecycle, or artifact mutation logic is `MIGRATE_TO_SHARED_REPORTING` when it claims official report authority.

### `src/pages/admin/reporting/`

The command surface, export panels, audit/verification surface, reporting actions, command model, readiness, trace, bridge records, export history adapter, and Oracle adapters combine UI orchestration, evidence/briefing exports, analyst memo composition, readiness, traceability, and audit display.

Disposition: retain as product/operator UI and projection clients. Do not treat analyst memos, action logs, Oracle comparisons, trace views, or audit panels as a second universal artifact authority without a named domain owner and Shared Reporting adapter.

### `src/system/persistence/repositories/reportsRepository.js`

This is a frontend persistence/repository surface that can represent report-like UI state or local report data. It is not the API Reporting authority. Any official artifact or history persistence here is a duplicate and should migrate to Shared Reporting in a later bounded wave. Keep until consumers are mapped.

## 5. Second System Disposition

| Component category | Disposition | Rule |
|---|---|---|
| Report navigation/catalog | `KEEP_AS_PRODUCT_UI` | UI may organize available reports. |
| Report labels/types | `REUSE_AS_ADAPTER_INPUT` | Server registry remains canonical. |
| UI templates/preview components | `KEEP_AS_PRODUCT_UI` | They may render screens, not own durable artifacts. |
| UI lifecycle/readiness badges | `KEEP_AS_PRODUCT_UI` | Must reflect server state. |
| Local report storage/history | `MIGRATE_TO_SHARED_REPORTING` | Official artifacts require server snapshot/history. |
| Product-specific evidence/briefing composition | `REUSE_AS_ADAPTER_INPUT` | Must name a canonical product owner. |
| Frontend seed/demo data | `LEGACY` / test-only | Must never become official production data. |
| Distinct legal, portfolio, QA, or evidence artifacts | `KEEP_SEPARATE_AUTHORITY` | Reporting may project them but cannot replace them. |
| Unclear report-like logic | `UNKNOWN` | Owner decision required before U1 migration. |

No U0 component is deleted.

## 6. Shared Reporting Clients

| Client | Current interpretation | Disposition |
|---|---|---|
| `curriculumReportingClient.js` | Curriculum projection/read client | `REUSE_AS_ADAPTER_INPUT` |
| `workforceEmploymentReportingClient.js` | Workforce outcome projection/read client | `REUSE_AS_ADAPTER_INPUT` |
| `publicImpactReportingClient.js` | Public impact/public projection client | `PUBLIC PROJECTION`; Public Disclosure remains separate |
| `grantBinderClient.js` | Grant binder/domain artifact client | `STRUCTURED_DOMAIN_CLIENT`; may feed reports |
| `donorSummaryAuthorizationClient.js` | Authorized donor summary projection | `PRODUCT PROJECTION CANDIDATE` |
| `exchangeFundingCommitmentReportingClient.js` | Funding commitment projection | `PRODUCT PROJECTION CANDIDATE` |
| `hubReferralReportingClient.js` | Hub/referral projection | `PRODUCT PROJECTION CANDIDATE` |
| `shsReportDraftClient.js` | Report draft client | `DRAFT CLIENT`; ownership must remain with draft authority until final artifact |

These clients do not create a second Shared Reporting authority by themselves. They require explicit scope, classification, and product ownership before adapter registration.

## 7. Local Exports

| Surface | Format/mechanism | Classification | Disposition |
|---|---|---|---|
| `src/apps/allocation/AllocationApp.jsx` | JSON Blob, localStorage export history | Convenience/model export | `STRUCTURED_DOMAIN_EXPORT`; govern later if official |
| `src/pages/CreditReport.jsx` | JSON download | Convenience export | `CONVENIENCE_EXPORT` |
| `src/pages/civic/Portfolio.jsx` | JSON export | Portfolio/domain export | `STRUCTURED_DOMAIN_EXPORT`; Portfolio remains owner |
| `src/pages/civic/ConstitutionJournal.jsx` | JSON/Markdown export | User document export | `STRUCTURED_DOMAIN_EXPORT` |
| `src/pages/civic/TreasurySnapshots.jsx` | JSON export | Treasury/domain snapshot | `STRUCTURED_DOMAIN_EXPORT`; Treasury remains owner |
| `src/pages/employer/Exports.jsx` and related employer paths | Download/export actions | Employer domain export | `GOVERNED_REPORT_CANDIDATE` if official; otherwise convenience |
| `src/pages/sales/Exports.jsx` and sales utilities | Download/export actions | Sales/client material | `PRODUCT_EXPORT`; not universal authority |
| Grant binder/export panels | JSON/document-oriented output | Grant binder artifact | `KEEP_SEPARATE_AUTHORITY`; may feed a governed report |
| Curriculum/career exports | JSON/print/download paths | Student/learning data | `GOVERNED_REPORT_CANDIDATE` only after privacy policy |
| Archived and patch-backup paths | Historical implementation copies | No current authority | `LEGACY`; excluded from U1 scope |

No official report should use browser localStorage or sessionStorage as canonical storage.

## 8. Screen Print Paths

| Product/page | Mechanism | U0 classification | Future disposition |
|---|---|---|---|
| `src/pages/AdminCompare.jsx` | `window.print()` | `SCREEN_PRINT` | Keep as convenience unless official comparison report is required |
| `src/pages/CareerPathways.jsx` | `window.print()` | `SCREEN_PRINT` | Governed report candidate only with privacy-approved projection |
| `src/pages/sales/DemoProposal.jsx` | `window.print()` | `SCREEN_PRINT` | Keep as sales convenience |
| Career/curriculum portfolio views | Browser print styles/buttons | `SCREEN_PRINT` | Product-specific; governed candidate for approved evidence reports |
| CivicSure Reports | Shared HTML/PDF renderer | `GOVERNED_REPORT` | Canonical Shared Reporting path |

Screen printing must not be represented as immutable official reporting.

## 9. Separate Artifact Authorities

| Artifact | Canonical owner | Can feed Shared Reporting? | May Shared Reporting replace it? |
|---|---|---:|---:|
| Portfolio artifact | Portfolio authority | Yes, authorized references | No |
| Studio Build Packet | Studio authority | Yes | No |
| Studio QA run | Studio/QA authority | Yes | No |
| Review submission/decision | Studio review authority | Yes | No |
| Evidence | Evidence/Truth authority | Yes | No |
| Audit workpaper/sample | Audit authority | Yes | No |
| Public Impact projection | Impact/Public Disclosure authority | Yes | No |
| Legal artifact | Legal/document authority | Conditional | No |
| Credential | Credential authority | Conditional | No |
| Institutional Decision | Decision authority | Yes as reference | No |
| AI session/security event | AI Governance/Input Security authority | Yes when authorized | No |

Shared Reporting formats authorized projections of these artifacts; it does not become their system of record.

## 10. CivicSure

CivicSure remains the reference implementation and is not changed in U0.

| Family | Current state | U0 disposition |
|---|---|---|
| Executive Assurance | R2 implementation | Keep canonical Shared Reporting path |
| Program Assurance | R3 implementation | Keep; future product adapter exemplar |
| Provider Assurance | R3 implementation | Keep; preserve Investigation/privacy boundary |
| Funding Lineage | R3 implementation | Keep; preserve canonical lineage/gap semantics |
| Audit Packet | Registered/future family | Keep as planned family; Audit remains owner |

The current R3 service-level query defect (`gpa_data_quality_evaluations.created_at` versus schema `evaluated_at`) is an existing acceptance issue outside U0 scope and must be resolved before further universalization.

## 11. OAS

Existing OAS public content includes standard definitions, control domains, purpose boundaries, risk classification, and OAS-1 pages. The repository does not show a completed OAS report generator.

| Candidate family | Readiness | Disposition |
|---|---|---|
| Standard Conformance | `NEEDS_PROJECTION` | Define OAS-owned conformance projection |
| Traceability | `NEEDS_PROJECTION` | Define links from standard/control to evidence |
| Testing/Evidence | `NEEDS_PROJECTION` | Define canonical test/evidence authority |
| Standards Change | `NEEDS_AUTHORITY_DECISION` | Establish version/change ownership |

Standards remain OAS-owned; Reporting is only a rendering destination.

## 12. Registry

Agent package, agent registry submission, and related records exist in the API domain, but no complete Registry report family was confirmed. Registry remains distinct from OAS Standard, Conformance, and Trust Bureau.

Candidate Registration Record, Status, Verification History, Ownership/Operator, and Conformance Evidence reports are `NEEDS_PROJECTION`. Trust conclusions are `NEEDS_AUTHORITY_DECISION` and must not be inferred by Reporting.

## 13. Studio

Studio provides project, workspace, revisions, Build Packet, QA, review, delivery, resource, and evidence authorities. Build Packets and review decisions are existing artifacts, not report artifacts.

Project Report, QA Report, Review Report, Completion Report, and Portfolio Evidence Export are `READY_FOR_ADAPTER` only after a bounded Studio projection contract. A report may reference Build Packet and evidence IDs but must not replace or mutate them.

## 14. BOS / ARAG

BOS and ARAG provide operating awareness, controlled orchestration, workflow, release assurance, and work-order policy authorities. Operating Review, Workflow Performance, Governance/Control, Release Assurance, and Control Exception families are `NEEDS_PROJECTION`.

AI workforce and tool activity reports require AI Governance and Input Security approval. ARAG release packets remain ARAG-owned evidence and can be referenced by Shared Reporting.

## 15. Foundation

Foundation/impact data includes grants, community impact, workforce, cohorts, participant outcomes, and public impact projections. Program Impact and Grant/Funder reports are `NEEDS_PRIVACY_POLICY` plus `NEEDS_PROJECTION`. Public impact reports additionally require `NEEDS_PUBLICATION_POLICY`.

Participant-level reports remain restricted unless a valid purpose, classification, consent/legal authority, and audience are established.

## 16. Curriculum / Career

Curriculum/Career authorities include progress, completion, assessment, skills, portfolio, credentials, cohorts, career readiness, and employer outcomes. Candidate reports are `NEEDS_PRIVACY_POLICY` and `NEEDS_PROJECTION`.

Academic scoring must not be merged with OAS/technical conformance. Portfolio and credential artifacts remain independent authorities.

## 17. Solutions

Solutions includes service agreements, entitlements, onboarding, funding/grants, impact attribution, client operations, implementation, and service delivery. Client Operating, Service Delivery, Executive Business Review, and Assurance/Compliance reports are `NEEDS_PROJECTION` and customer authorization.

No completed Solutions report artifact integration was found.

## 18. AI Governance

AI Governance owns sessions, delegations, model/provider controls, policy enforcement, tool/MCP access, input-security findings, and release assurance. Candidate reports are `NEEDS_PROJECTION` and `NEEDS_PRIVACY_POLICY`.

Secrets, prompts, credentials, protected resources, and investigation content must not be copied into a report unless the AI Governance authority explicitly authorizes the exact projection.

## 19. Legal

Legal artifacts, authority mappings, formation readiness, and compliance evidence remain legal/document-owned. Formation Readiness, Legal Artifact Register, and Legal Evidence Packet are `NEEDS_AUTHORITY_DECISION` before any adapter is built.

Shared Reporting must not become the legal record or legal advice authority.

## 20. Duplicate Authority Matrix

| Surface | Current owner | Current role | Duplicates Shared Reporting? | Disposition | Future owner |
|---|---|---|---:|---|---|
| API Reporting domain | Reporting | Canonical artifact/render/storage/history | No | Keep | Shared Reporting |
| `src/data/shsReports` registry | Frontend SHS UI | Catalog/types/templates/lifecycle | Partially | Split UI metadata from contract | UI plus Shared Reporting registry |
| Admin report pages | SHS UI | Preview/history/commands | Partially | Keep UI, move official state server-side | Product UI + Shared Reporting |
| `reportsRepository.js` | Frontend persistence | Local report state | Potentially | Migrate official state later | Shared Reporting |
| R1/R2/R3 CivicSure adapters | GPA | Product projection | No | Keep | CivicSure/GPA adapter |
| Portfolio artifacts | Portfolio | Canonical artifact | No | Keep separate | Portfolio |
| Build Packets | Studio | Canonical evidence artifact | No | Keep separate | Studio |
| Workpapers/samples | Audit | Canonical audit artifact | No | Keep separate | Audit |
| Local JSON exports | Product pages | Convenience/domain export | No, unless official | Keep or adapter later | Product domain/Shared Reporting |
| Browser print | Product pages | Screen convenience | No | Keep or governed candidate | Product UI/Shared Reporting |
| Public snapshots | Public Disclosure | Public release snapshot | No | Keep separate | Public Disclosure |

## 21. Export Matrix

| Product | Export | Format | Official? | Immutable? | Governed? | Disposition |
|---|---|---|---:|---:|---:|---|
| CivicSure | Assurance reports | JSON/HTML/PDF | Yes | Yes | Yes | Keep Shared Reporting |
| Allocation | Model export | JSON | No/unclear | No | No | Structured domain export |
| Civic portfolio | Portfolio export | JSON | Domain-owned | Domain-dependent | Domain | Keep Portfolio authority |
| Civic treasury | Snapshot export | JSON | Domain-owned | Domain-dependent | Domain | Keep Treasury authority |
| Credit | Credit report export | JSON | No/unclear | No | No | Convenience export |
| Curriculum/Career | Learning/evidence exports | JSON/print | Potentially | No/shared absent | Partial | Adapter candidate after privacy review |
| Grant binder | Binder/export | Domain format | Yes as binder | Binder-owned | Domain | Keep separate; report projection possible |
| Public impact | Public projection | JSON/API | Public projection | Snapshot/public policy | Yes | Public Disclosure path |
| Sales/employer | Client exports | JSON/CSV/print | Product-dependent | Usually no | Partial | Product-specific until official need |

## 22. Print Matrix

| Product/page | Print mechanism | Screen print | Governed report | Keep/migrate |
|---|---|---:|---:|---|
| CivicSure Reports | Shared HTML/PDF renderer | Optional | Yes | Keep canonical |
| Admin Compare | `window.print()` | Yes | No | Keep convenience |
| Career Pathways | `window.print()` | Yes | No | Keep; future privacy-approved candidate |
| Sales Demo Proposal | `window.print()` | Yes | No | Keep convenience |
| Portfolio/curriculum | Print CSS/buttons | Yes | No shared artifact | Keep; future adapter candidate |
| Foundation transparency | Public page/browser print | Yes | Public snapshot depends on policy | Keep Public Disclosure boundary |

## 23. Artifact Matrix

| Artifact | Canonical owner | Report input? | Shared Reporting replace? |
|---|---|---:|---:|
| Portfolio artifact | Portfolio | Yes | No |
| Studio Build Packet | Studio | Yes | No |
| QA run | Studio QA | Yes | No |
| Review decision | Studio Review | Yes | No |
| Evidence record | Evidence/Truth | Yes | No |
| Audit workpaper/sample | Audit | Yes | No |
| Public impact projection | Impact/Public Disclosure | Yes | No |
| Credential | Credential | Conditional | No |
| Decision | Decision | Yes | No |
| Legal artifact | Legal | Conditional | No |
| AI security event | AI Governance/Input Security | Conditional | No |

## 24. Report Family Readiness

| Product/family | Status |
|---|---|
| CivicSure Executive/Program/Provider/Funding | `READY_FOR_ADAPTER` / reference implementation |
| CivicSure Audit Packet | `NEEDS_PROJECTION` / Audit-specific contract |
| OAS Conformance/Traceability | `NEEDS_PROJECTION` |
| Registry Registration/Status | `NEEDS_PROJECTION` |
| Studio Project/QA/Completion | `READY_FOR_ADAPTER` after projection contract |
| BOS Operating/Release Assurance | `NEEDS_PROJECTION` |
| Foundation Impact/Grant | `NEEDS_PRIVACY_POLICY` and `NEEDS_PROJECTION` |
| Curriculum/Career | `NEEDS_PRIVACY_POLICY` and `NEEDS_PROJECTION` |
| Solutions Client/Service | `NEEDS_PROJECTION` |
| AI Governance Activity/Security | `NEEDS_PRIVACY_POLICY` and `NEEDS_PROJECTION` |
| Legal reports | `NEEDS_AUTHORITY_DECISION` |
| Cross-product SHU reports | `DEFERRED` |

## 25. Frontend Registry Ownership

Recommendation: **C, split into UI metadata plus Shared Reporting contract.**

`src/data/shsReports` should remain a product UI catalog for labels, launch points, presentation hints, and route grouping. Official report family identity, supported formats, versions, renderer, classification behavior, and artifact lifecycle should move conceptually into the API Shared Reporting registry during U1/U2. No U0 migration or deletion is performed.

## 26. Draft / Revision Ownership

Frontend draft/revision concepts are mixed. Some represent composition drafts, some document drafts, some UI state, and some report preview/readiness state. They must not be assumed to be immutable governed report revisions.

Recommendation: draft composition remains with its product/domain owner; final official report artifact revisions and supersession remain Shared Reporting-owned. Existing report drafts remain under their current authority until mapped.

## 27. History Ownership

- Shared Reporting artifact history: canonical history for official report artifacts.
- Frontend `shsReports` history: UI projection only; not authoritative.
- Domain event history: authoritative for product operations, not report artifact history.
- Draft history: owned by draft/document authority.
- Public disclosure history: owned by Public Disclosure/publication authority.

## 28. Storage Ownership

`ReportFileStorage` and `report_rendered_files` own official rendered report storage and metadata. Browser `localStorage`, `sessionStorage`, frontend repositories, and UI seed stores must not own official report artifacts.

Document storage, Portfolio artifacts, Build Packets, Evidence, Credentials, and Legal artifacts remain owned by their respective authorities. Shared Reporting stores a rendered projection/reference, not the source artifact.

## 29. Template Ownership

| Template type | Owner |
|---|---|
| Universal pagination/accessibility/file contract | Shared Reporting |
| CivicSure report family | CivicSure product layer registered through Shared Reporting |
| OAS/Registry/Studio/BOS/Foundation/Solutions report family | Product layer registered through Shared Reporting |
| UI preview template | Product frontend |
| Legal/document template | Legal/document authority |
| Legacy/demo template | Legacy/test-only |

Do not merge unrelated document templates into the Shared Reporting renderer without a contract.

## 30. Publication Ownership

Report generation is private by default. Public release must use the product’s publication authority and, where applicable, Public Disclosure eligibility, approval, snapshot, and distribution. Public impact and transparency paths remain separate from internal artifact generation.

## 31. Permission Ownership

The required composition is:

`domain access + report action access`

Existing report permissions include `reports.view`, `reports.preview`, and `reports.export`, with publication/public-disclosure permissions separately governed. A report permission must never expand access to Programs, Students, Providers, Investigations, AI resources, Legal records, or financial data.

Future generate/approve/release permissions should be added only if existing controls cannot express the action.

## 32. U1 Contract

U1 should implement the smallest contract necessary to register product report families and route authorized projections:

```text
product_key
  → report_family
  → authorized projection adapter
  → template version
  → renderer identifier/version
  → supported formats
  → Shared Reporting artifact/snapshot/history/retrieval
```

The adapter receives principal, organization, tenant, subject, reporting period, classification, and purpose context. It returns a complete immutable payload with canonical references and provenance. Shared Reporting does not query product authorities to fill missing fields.

## 33. Product Key Decision

**U0 recommendation: `SCHEMA_EXTENSION_RECOMMENDED` for U1, but no migration in U0.**

Metadata-only storage can support initial experiments, but an ecosystem catalog, history filters, observability, collision-safe filenames, and product-scoped authorization need durable product identity. A single bounded migration after 106 should add or normalize product/report-family metadata only after U1 confirms exact query and compatibility requirements. Do not add a migration during U0.

## 34. File Naming Generalization

Current `ReportFileStorage.safeReportFilename` is CivicSure-specific and generates `CivicSure_<jurisdiction>_<reportType>_<period>_v<version>.<format>`. U1 must parameterize the product segment, report family label, subject, period, version, and extension while retaining strict sanitization.

Affected locations include:

- `apps/shs-api/src/domain/reporting/report-file-storage.ts`
- report renderer metadata and filename inputs
- template registry metadata
- Reports UI download labels
- report documentation/examples

## 35. Branding Generalization

CivicSure assumptions currently appear in the renderer, R2/R3 HTML/CSS, CivicSure tokens, Ohio motif, report titles, template metadata, and filenames. U1 must separate:

- universal primitives: page sizing, pagination, tables, accessibility, classification, metadata, evidence appendix, file safety;
- product layers: wordmark, colors, typography accents, motif, terminology, cover, and report-family sections.

No new renderer engine is recommended.

## 36. Observability Generalization

U1 should add or standardize event/context fields for `product_key`, `report_family`, artifact ID, organization, tenant, classification, template version, renderer version, format, duration, actor/system actor, success/failure, payload hash, and rendered-file hash.

Current CivicSure audit events and Reporting logs are the starting point. Product adapters must emit context without duplicating audit authority.

## 37. Migration Recommendation

U0 adds no migration. U1 should first prove metadata-only compatibility, then decide whether one bounded post-106 migration is required for first-class `product_key` and report-family catalog queries. No unrelated schema changes may be bundled.

## 38. Deprecation Plan

For duplicate or legacy reporting code:

1. classify the exact owner and authority;
2. stop expanding duplicate artifact logic;
3. add a product adapter to Shared Reporting;
4. migrate consumers and history/retrieval paths;
5. verify output, permissions, classification, and hash parity;
6. mark the old path deprecated;
7. remove only in a later approved change.

U0 does not delete or rename files.

## 39. U1 Scope Boundary

U1 may touch only:

- Shared Reporting registry/contract metadata;
- bounded product projection adapter interfaces;
- product key/report family metadata;
- universal filename and observability parameterization;
- focused Reporting tests and disposable fixtures;
- the minimum Reports UI wiring needed to consume the shared registry.

U1 must not refactor every product, replace Portfolio/Studio/Evidence/Audit/Legal authorities, redesign all Reports UI, add cross-product reads, broaden classifications, or implement every proposed report family.

## 40. U2 Readiness

The strongest post-U1 candidates are:

- **Studio:** canonical project, QA, review, Build Packet, and evidence sources already exist.
- **OAS:** public standard/control content exists, but conformance/test authority must be defined first.
- **Foundation:** impact and grant data exist, but privacy, aggregation, and publication policy must be completed.

Registry, BOS, Solutions, Curriculum/Career, AI Governance, and Legal require additional authority/projection decisions before they are U2-ready. Cross-product reporting remains deferred.

## 41. Documentation

This file is the authoritative U0 inventory and disposition document:

`docs/architecture/SHU_UNIVERSAL_REPORTING_U0_INVENTORY_DISPOSITION.md`

## 42. Files Created

- `docs/architecture/SHU_UNIVERSAL_REPORTING_U0_INVENTORY_DISPOSITION.md`

## 43. Files Modified

None. No runtime files, schemas, migrations, API routes, UI components, Reporting services, renderer code, or artifact authorities were modified.

## 44. Runtime Integrity

Migration `106` remains the latest migration; migration `107` was not added. The canonical Shared Reporting authority, CivicSure R1/R2/R3 implementation, Public Disclosure boundary, product artifact authorities, and existing runtime behavior remain unchanged. Existing dirty owner work remains preserved.

**Final verdict:**

SHU UNIVERSAL REPORTING U0 INVENTORY DISPOSITION COMPLETE — READY FOR UNIVERSAL REPORTING CONTRACT
