# SHU Universal Reporting Capability Audit

**Audit status:** Complete

**Audit scope:** Read-only review of the Silicon Heartland Universe reporting, export, print, artifact, public-disclosure, and product-domain capabilities.

**Repository:** `/Users/mikeslate/Projects/shrv1`

**Branch:** `studio-v1-plus-development`

**Observed HEAD:** `444b03e47c154156d831d87f6cb9733ce2794fe9`

**Observed dirty-file count:** 76. Existing owner work was preserved and was not staged, reset, cleaned, or modified by this audit.

## Findings

1. CivicSure is the current reference implementation for immutable report payloads, versioned templates, HTML/PDF rendering, durable rendered files, hashes, scoped retrieval, history, and Public Disclosure separation.
2. The existing Reporting authority is suitable to become SHU Shared Reporting, but its current registry and renderer are CivicSure-branded and GPA-shaped. Universalization requires a thin product/report-family adapter boundary, not a second Reporting system.
3. The repository contains a second frontend-oriented SHS report registry, lifecycle, storage, seed, and presentation surface under `src/data/shsReports` and `src/pages/admin/reports`. Its ownership must be clarified before consolidation; it must not become a competing artifact authority.
4. Allocation, Credit, civic portfolio, treasury, curriculum, career, employer, sales, and other screens contain local JSON exports or `window.print()` paths. These are not equivalent to governed reports and should remain convenience exports or migrate to Shared Reporting only when they become official artifacts.
5. Most products have canonical report-worthy data but no product-specific projection into Shared Reporting. OAS and Registry report families in particular are proposed capabilities, not verified current report generators.
6. The current artifact schema has organization and tenant scope and report metadata, but no first-class durable `product_key` field. Product identity is currently carried by report type/template metadata and would need a bounded future extension for ecosystem-wide cataloging and querying.

## 1. Executive Result

The repository can support one Universal Reporting Architecture by reusing the existing CivicSure Reporting authority as the shared artifact, template, rendering, storage, retrieval, history, classification, and Public Disclosure boundary. Product teams should own only authorized domain projections and report contracts. No duplicate Reporting authority should be created.

The architecture is **partially universal today**: CivicSure is operationally complete, while other SHU products are primarily data authorities, UI exports, document artifacts, or report candidates. The correct next step is a bounded universal contract and product adapter program, preceded by disposition of duplicate frontend report logic.

## 2. Repository Baseline

The audited repository is `/Users/mikeslate/Projects/shrv1` on `studio-v1-plus-development` at HEAD `444b03e47c154156d831d87f6cb9733ce2794fe9`. The worktree contained 76 dirty paths before this audit; those paths are preserved owner work. Latest migration observed is `106_civicsure_report_r1_foundation.sql`; migration 107 does not exist.

Primary reporting paths include:

- `apps/shs-api/src/domain/reporting/`
- `apps/shs-api/src/domain/government-assurance/service/phase8b-service.ts`
- `apps/shs-api/src/domain/government-assurance/api/routes.ts`
- `apps/shs-api/migrations/106_civicsure_report_r1_foundation.sql`
- `src/shared/reporting/`
- `src/data/shsReports/`
- `src/pages/admin/reports/`
- `src/pages/admin/reporting/`
- `src/system/persistence/repositories/reportsRepository.js`

## 3. Canonical Shared Reporting Authority

The canonical authority is the API Reporting domain in `apps/shs-api/src/domain/reporting`. Its core services are `ReportArtifactService`, `ReportR1Service`, `ReportTemplateRegistry`, `CivicSureRenderAdapter`, and `ReportFileStorage`, backed by `report_artifacts`, `report_payload_snapshots`, `report_rendered_files`, and `report_templates`.

The authority exposes artifact creation, immutable payload snapshots, template lookup, rendering, rendered-file metadata, scoped retrieval, history, publication, distribution, and Public Disclosure operations. Reporting routes are protected by reporting service entitlement and report permissions. Public Disclosure, publication eligibility, public snapshots, and public release remain separate authorities.

This is the correct authority to reuse. It should be generalized through a bounded adapter contract, not replaced or duplicated.

## 4. Universal Reporting Primitives

| Primitive | Status | Audit finding |
|---|---|---|
| Immutable payload snapshot | COMPLETE | CivicSure payload snapshots are persisted with hash and canonical references. |
| Report artifact | COMPLETE | `report_artifacts` is the durable artifact authority. |
| Report type/version | COMPLETE | Present, currently strongly CivicSure/GPA-oriented. |
| Template version | COMPLETE | `report_templates` and registry support versioned templates. |
| HTML | COMPLETE | Shared renderer supports trusted generated HTML. |
| PDF | COMPLETE | Local trusted Playwright path exists for CivicSure. |
| Print | PARTIAL | Browser print paths exist; governed print artifacts are not universal. |
| File hash | COMPLETE | SHA-256 is stored and checked for rendered files. |
| Storage | COMPLETE / BOUNDED | `ReportFileStorage` is scoped and traversal-protected; production storage configuration and retention require deployment policy. |
| Safe filename | COMPLETE / PRODUCT-SPECIFIC | Current implementation is CivicSure-branded and must become product-parameterized. |
| Classification | PARTIAL | `INTERNAL`, `RESTRICTED_EXTERNAL`, and `PUBLIC` are enforced; product-specific requirements need policy review. |
| Organization/tenant scope | COMPLETE | Artifact and rendered-file records are scoped. |
| Permissions | COMPLETE / PARTIAL | Reporting permissions exist; composition with product/domain permission is not yet universal. |
| Preview/retrieval | COMPLETE / CIVICSURE | Implemented through Reporting routes, not all products. |
| History | COMPLETE / FOUNDATION | Shared artifact history exists; product cataloging is incomplete. |
| Supersession | PARTIAL | Artifact lineage support exists but universal product workflow is not established. |
| Approval preparation | PARTIAL | Publication and Decision infrastructure exists; universal report approval is not imposed. |
| Public Disclosure separation | COMPLETE | Internal artifacts do not automatically become public. |
| Audit events | COMPLETE / CIVICSURE | Material CivicSure report actions are auditable; product-wide event coverage is not uniform. |
| Universal observability | PARTIAL | Product key, family, duration, and renderer telemetry are not yet a universal contract. |

## 5. CivicSure

CivicSure is the current reference implementation. Its report families are Executive Assurance, Program Assurance, Provider Assurance, Funding Lineage, and Audit Packet. Executive Assurance is implemented through R2; Program, Provider, and Funding Lineage are implemented through R3; Audit Packet is registered but remains a future specialized implementation.

Its authoritative source is the Government Program Assurance domain. Its projections consume canonical funding, program, provider, claim, verification, metric, Truth, monitoring, reconciliation, data quality, finding, corrective action, audit, and source-health authorities. It supports immutable payloads, HTML/PDF rendering, durable files, history, classification, scoped retrieval, and Public Disclosure separation. CivicSure must be treated as the strongest implementation of Shared Reporting, not as the owner of ecosystem reporting.

## 6. OAS

OAS has dedicated public MPA entrypoints and pages for the Open Autonomous Standard, control domains, purpose boundaries, risk classification, and OAS-1 content. The audited repository did not show a dedicated OAS report artifact service or Shared Reporting projection.

Potential report families are Standard Conformance, Agent Specification, OAS Compliance/Conformance Summary, Testing and Evidence, Standards Traceability, and Standards Version/Change. These remain proposed until an OAS canonical projection, audience, classification policy, and approval boundary are defined. OAS standard authority must remain distinct from Registry and Trust Bureau authority.

## 7. Autonomous Registry

The repository does not expose a verified Autonomous Registry report generator comparable to CivicSure. Registry-like records and agent-registry concepts must be kept distinct from standards, conformance, and trust decisions.

Potential report families are Registry Record, Agent Registration Summary, Registration Status, Verification History, Trust/Status, Ownership/Operator Record, and Conformance Evidence Summary. These should be generated only from a Registry-owned projection and must not cause Shared Reporting to become a registry or trust authority.

## 8. Studio

Studio has canonical project, workspace, revision, Build Packet, QA, review submission, review decision, delivery, resource, and evidence routes under `apps/shs-api/src/domain/studio/api/studio-project-routes.ts`. These are report-worthy sources, but no Studio-specific Shared Reporting adapter was located.

Potential report families are Project Report, Build Packet, QA Report, Review Report, Approval Report, Student/Team Evidence Packet, Project Completion Report, and Portfolio Evidence Export. Build Packets and Portfolio artifacts remain their own authorities; a governed report should project authorized references into Shared Reporting rather than replace them.

## 9. BOS

BOS-related pages and API domains cover operating awareness, orchestration, agent fabric, release assurance, and business operations. No confirmed BOS report artifact adapter was located.

Potential report families are Operating Review, Workflow Performance, Governance/Control, AI Workforce Activity, Release Assurance, Evidence Packet, Organization Operating Summary, and Control Exception. ARAG-1 and other commercial products must retain distinct authority where applicable. Shared Reporting may render their authorized projections without merging their operational models.

## 10. Foundation

Foundation has public and internal impact, grant, curriculum, workforce, portfolio, and attribution capabilities. `publicImpactReportingClient.js` and the `/public/impact/curriculum-lesson-completions` route show a public impact projection path, but not a universal durable report-artifact workflow for all Foundation reports.

Potential report families are Program Impact, Grant/Funder, Participant Outcome, Cohort, Learning Outcome, Community Impact, Career Pathway Outcome, Verified Institutional Reporting, and Accessibility/Participation where policy allows. Participant privacy, consent, classification, and public-release controls are material prerequisites.

## 11. Solutions

Solutions/Silicon Heartland Services contains service agreements, entitlements, organization onboarding, funding/grants, and impact-attribution domains. No confirmed product report artifact integration was located.

Potential report families are Client Operating, Service Delivery, Executive Business Review, Implementation Status, Assurance/Compliance, and Operational Improvement. Customer and service data should be projected by Solutions authority and passed to Shared Reporting only after audience, organization, tenant, and classification authorization.

## 12. Curriculum / Career

Curriculum and Career have substantial canonical data through curriculum catalog, lesson completion, portfolio, workforce outcome, assessment, skill, credential, and career-readiness surfaces. They are treated as distinct domain authorities even where Foundation owns the product experience.

Potential report families include Student Progress, Course Completion, Evidence, Assessment, Skill Profile, Portfolio, Instructor/Class, Cohort, Career Readiness, Credential Evidence, and Employer/Partner Outcome. Academic scoring must remain separate from technical conformance. Participant and student PII must be minimized and redacted by projection policy.

## 13. Legal

Legal documents and readiness records exist in documentation and artifact-oriented areas, but no verified Legal report authority or Shared Reporting adapter was found. Formation Readiness, Legal Artifact Register, Compliance Readiness, Authority Mapping, and Legal Evidence Packet are possible future families.

The initial recommendation is to keep legal artifacts under their existing document/legal authority and use Shared Reporting only for an explicitly approved projection. Reporting must not become the legal record of authority or advice.

## 14. AI Governance

AI Governance and Agent Fabric expose delegations, resource classifications, models, sessions, evaluations, tool/MCP controls, and security events. No dedicated report artifact generator was located.

Potential families are Agent Session, AI Governance Activity, Policy Enforcement, Tool Access, MCP Governance, Prompt Injection/Security Event Summary, AI Administration, and Release Assurance Evidence Packet. Reports must omit secrets, protected prompts, and restricted content unless a canonical policy explicitly permits them. AI can explain authorized report facts but cannot create official values or bypass domain reporting permissions.

## 15. Truth / Evidence / Metrics

Truth Spine, operational events, Evidence, Metric Registry, Oracle, lineage, verification, and data-quality services are cross-domain canonical inputs. They should generally supply authorized product projections rather than generate product-neutral reports directly.

A product-neutral report is justified only when an explicit cross-domain authority, audience, data contract, and authorization model exist. Shared Reporting must format the projection; it must not independently query Truth, Evidence, Metrics, or protected domains to expand access.

## 16. Report Ownership Matrix

| Product | Report family | Canonical owner | Main sources | Audience | Shared renderer | Public eligible |
|---|---|---|---|---|---|---|
| CivicSure | Executive, Program, Provider, Funding, Audit Packet | GPA authorities | Funding, claims, verification, Truth, monitoring, audit | County executive, program, provider, auditor | Yes | Only via Public Disclosure |
| OAS | Conformance, specification, traceability, change | OAS authority | Standards, controls, tests, evidence | Standards users, operators | Future | Possible by OAS policy |
| Registry | Registration, status, verification history | Registry authority | Registry records, ownership, status | Operators, authorized public users | Future | Only approved records |
| Studio | Project, Build Packet, QA, review, completion | Studio/Portfolio/Evidence | Projects, revisions, QA, reviews, evidence | Students, teams, reviewers, institutions | Future | Usually restricted |
| BOS | Operating, workflow, control, release assurance | BOS/ARAG/AI Governance | Operations, controls, releases, events | Operators, executives | Future | Usually internal |
| Foundation | Impact, grant, cohort, community | Foundation/impact authority | Grants, outcomes, curriculum, workforce | Funders, executives, public | Future | Policy-dependent |
| Solutions | Client operating, service delivery, EBR | Solutions/service authority | Agreements, entitlements, delivery | Customers, operators | Future | Customer policy |
| Curriculum/Career | Progress, assessment, skill, readiness | Curriculum/Career authority | Catalog, assessment, portfolio, outcomes | Learners, educators, employers | Future | Restricted or approved aggregate |
| Legal | Readiness, authority, evidence packet | Legal authority | Legal records and approvals | Counsel, authorized executives | Future/conditional | Rarely |
| AI Governance | Session, policy, tool, security, release | AI Governance authority | Sessions, policies, security events | Security, governance, executives | Future | Rarely |

## 17. Capability Matrix

| Product | Projection | Snapshot | HTML | PDF | Print | History | Classification | Approval | Public boundary |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| CivicSure | Yes | Yes | Yes | Yes | Partial | Yes | Yes | Partial | Separate Public Disclosure |
| OAS | No | No | No | No | Public/static only | No | No | No | OAS publication policy needed |
| Registry | Unclear | No | No | No | No | No | Partial | No | Registry/public policy needed |
| Studio | Domain data/partial | No shared | No | No | Partial | Domain artifacts | Domain | Domain review | Separate |
| BOS | Partial | No shared | Partial/local | Partial/local | Partial | Partial | Domain/ARAG | Separate |
| Foundation | Yes/partial | No shared | Partial/public impact | No shared | Partial | Partial | Domain | Publication partial | Separate |
| Solutions | Yes/partial | No shared | No shared | No shared | Partial | No shared | Domain | Domain | Separate |
| Curriculum/Career | Yes | No shared | No shared | No shared | Partial | Domain-specific | Domain | Domain | Separate |
| Legal | Document artifacts | No shared | No | No | Document-dependent | Document history | High sensitivity | Legal | Restricted |
| AI Governance | Canonical data | No shared | No shared | No shared | No | Event history | Restricted | Governance | Restricted |

## 18. Duplicate Reporting Logic

The following categories were found:

- **Canonical shared capability:** API Reporting domain, `ReportArtifactService`, `ReportR1Service`, `ReportTemplateRegistry`, `CivicSureRenderAdapter`, `ReportFileStorage`, artifact routes, rendered-file routes, and Public Disclosure services.
- **Product projection/adapters:** `src/shared/reporting/*` clients such as curriculum, workforce, public impact, hub referral, exchange funding, grant binder, donor summary, and SHS report draft clients. These are candidates for bounded adapters, not independent artifact authorities.
- **Second frontend report system:** `src/data/shsReports/*`, `src/pages/admin/reports/*`, `src/pages/admin/reporting/*`, and `src/system/persistence/repositories/reportsRepository.js` contain registry, lifecycle, storage, readiness, templates, history, and preview concepts. They should be mapped to the API Reporting authority before further expansion.
- **Local convenience exports:** Allocation localStorage/JSON export, Credit Report JSON, civic Portfolio/Constitution/Treasury exports, and various domain exports. These should not be treated as official reports unless migrated through Shared Reporting.
- **Screen print:** `window.print()` paths in Admin Compare, Career Pathways, Sales Demo Proposal, and other screens. These are convenience prints, not immutable governed reports.
- **Separate artifact authorities:** Portfolio artifacts, Build Packets, evidence records, public impact projections, legal records, and audit workpapers must remain their own authorities and can feed authorized report projections.

## 19. Export Formats

Shared Reporting supports JSON, HTML, and PDF. Printable output exists through browser print and report HTML. CSV and other structured exports appear in domain-specific clients and pages; they are not universal governed artifacts. No confirmed shared DOCX or XLSX report renderer was found.

Recommended universal minimum is HTML, PDF, and governed Print, with JSON retained for machine-readable report payloads. CSV, DOCX, and XLSX should remain product-specific until a clear canonical use case and security contract exist.

## 20. Permission Model

Existing Reporting permissions include `reports.view`, `reports.preview`, `reports.export`, and Public Disclosure/publication permissions. This is a usable base. Universal Reporting should require both:

1. product/domain authority for the requested subject and fields; and
2. report action permission for view, preview, generate, export, approve, or release.

Do not add a universal permission that can retrieve data across product boundaries. Future `reports.generate`, `reports.approve`, and `reports.release` should be introduced only if existing permissions and Decision/publication infrastructure cannot express the need.

## 21. Data Access Boundary

Reporting may format authorized data. Reporting must not independently expand access. A projection may include only fields and references that the requesting principal is authorized to see in the product/domain context.

Product adapters must enforce organization, tenant, subject, classification, purpose, Data Use, provider/participant privacy, and restricted Investigation rules before creating an immutable payload. Shared Rendering receives a trusted payload; it does not query product databases or canonical services to fill gaps.

## 22. Cross-Product Reports

Future SHU Executive, Organization 360, or institution-wide evidence reports are feasible only through explicit approved composition contracts. They require a named composition authority, source-product approvals, field-level classification and redaction, tenant/org scope rules, retention, audience, and release policy.

They must not be implemented by giving Shared Reporting broad read access. Until those contracts exist, cross-product reports are deferred.

## 23. Product Report Registry

The minimal recommended registry shape is:

`product_key → report_family → authorized projection → template version → renderer → formats`

The existing `ReportTemplateRegistry` should be extended conceptually, while retaining its authority, to include product identity and report-family metadata. Product adapters should register contracts; they should not register arbitrary database queries or bypass permissions.

## 24. Product Branding

One renderer can serve all products. Product identity should be supplied by a trusted product report definition containing display name, logo/mark reference, design-token key, terminology map, classification treatment, and report-family template. CivicSure, OAS, Registry, Studio, BOS, Foundation, and Solutions should not require separate renderer engines.

Current renderer styles are CivicSure-specific, so product branding is a future adapter/template concern rather than a complete universal capability today.

## 25. Universal vs Product Design

Universal design should own page sizing, print pagination, accessibility structure, classification markings, headers/footers, evidence and metadata appendix primitives, table safety, filename sanitization, artifact integrity, and retrieval security.

Product design should own logo, accent colors, typography accents, cover composition, terminology, report sections, narrative rules, and product-specific evidence presentation. Product design must not change the universal artifact or security contract.

## 26. Template Inheritance

Recommended inheritance is:

`Universal Report Base → Product Report Base → Report Family Template → Version`

For example: `Universal Report Base → CivicSure Report Base → Executive Assurance v2`, or `Universal Report Base → OAS Report Base → Conformance v1`.

This should initially be composition of trusted renderer primitives and template metadata rather than a large inheritance framework.

## 27. Classification

The current shared schema supports `INTERNAL`, `RESTRICTED_EXTERNAL`, and `PUBLIC`. These are a workable initial ecosystem baseline and must not be weakened. Product-specific sensitivity, including participant, legal, investigative, AI security, and financial data, should be handled by canonical classification policy and projection redaction.

Do not broaden the classification enum during this audit. A later extension should be a deliberate schema and policy change with migration and compatibility analysis.

## 28. Public Reporting

Shared Reporting does not imply public release. CivicSure public transparency, OAS public standards, Registry public records, and Foundation impact reports may be public only when the product’s Public Disclosure or publication authority determines eligibility, approves release, creates a safe snapshot, and controls distribution.

Accepted Truth, a generated internal report, or `PUBLIC` metadata alone must not make a report public.

## 29. Privacy

High-risk domains include student/participant data, provider investigations, organization secrets, AI prompts, legal records, security events, and financial records. Product projections must omit unnecessary PII, investigative theories, secrets, protected prompts, and unsupported fraud language.

Public and funder reports should prefer bounded aggregate facts and evidence references. Restricted matter indicators may be shown only where existing policy permits them.

## 30. Approval

Report lifecycle should be product-specific. County executive, public impact, legal, and compliance reports commonly need `DRAFT → REVIEW → APPROVED → RELEASED`. Internal operational reports may stop at generated or reviewed.

Reuse existing Decision, publication, and Public Disclosure authorities. Do not create a universal report-approval authority solely for presentation lifecycle.

## 31. Retention

Shared Reporting should support product-specific retention and supersession metadata, but no legal retention period should be invented. Retention, deletion, archival, and legal hold decisions belong to the product/domain owner and applicable agreement or policy.

## 32. Storage

`ReportFileStorage` is a strong starting point: scoped references, immutable bytes after generation, traversal protection, private retrieval, and SHA-256 integrity. For ecosystem use, the namespace should include product key, organization, tenant, artifact ID, and rendered-file ID, with collision-safe paths and no public directory.

The current local filesystem boundary is suitable for controlled environments. Production object storage, backup, retention, and disaster recovery remain deployment decisions and must be explicit before broad rollout.

## 33. File Naming

Recommended universal pattern:

`<Product>_<Report-Type>_<Subject>_<Period>_v<Version>.<format>`

Examples: `CivicSure_Executive-Assurance_Franklin-County_2026-H1_v2.pdf` and `OAS_Conformance_Agent-123_2026-09-07_v1.pdf`.

All segments require strict sanitization, bounded length, no path separators, no header injection, and no confidential values in filenames.

## 34. Observability

Material report events should include `product_key`, `report_family`, organization, tenant, classification, artifact ID, template version, renderer version, format, generation duration, payload hash, file hash, actor/system actor, and success/failure. This supports auditability, cost analysis, product isolation, and incident review.

## 35. Report UX

Recommended universal interaction pattern:

`Reports → Report Type → Subject → Scope → Period → Preview → Generate → Download/Print → History`

Each product may present the flow in its own shell, but subject validation, classification, authorized scope, artifact status, format availability, and history should remain consistent. Empty, failed, denied, and superseded states must be explicit.

## 36. Print Action Standard

Every report-capable product may expose **Print / Export Report**, but the action must distinguish governed report generation from a convenience print of the current screen. Official reports should use Shared Reporting to create a classified immutable artifact before download or print.

## 37. Screen Print vs Governed Report

**Screen Print** is a convenience rendering of the current UI state. It is not versioned, may reflect live data, and should not be presented as an official report.

**Governed Report** is an immutable, versioned, classified artifact generated from an authorized product projection, with metadata, references, hash, retrieval controls, and history. Official ecosystem reporting must use the governed path.

## 38. Universal Report API

The safest near-term API boundary is to keep product-specific generation endpoints responsible for authorization and projection, then call the existing Shared Reporting services for artifact, snapshot, template, rendering, storage, and retrieval. A future shared route can accept a registered product/report-family contract, but it must not become a general-purpose cross-product query endpoint.

Conceptually:

`POST /<product>/reports/generate → authorized projection → Shared Reporting artifact service`

Shared `/reporting` routes remain the artifact/history/retrieval boundary.

## 39. Product Projection Contract

Recommended minimal input contract:

```json
{
  "productKey": "civicsure",
  "reportFamily": "executive-assurance",
  "subject": { "type": "program", "reference": "..." },
  "scope": { "organization": "...", "tenant": "..." },
  "reportingPeriod": { "start": "...", "end": "..." },
  "classification": "INTERNAL"
}
```

The output is an authorized immutable payload containing only product-approved fields, canonical references, source/metric versions where available, and provenance. Domain payload fields should not be standardized beyond genuinely universal metadata.

## 40. Ecosystem Report Catalog

| Priority | Product | Report | Purpose | Audience | Sensitivity | Public eligible |
|---|---|---|---|---|---|---|
| P0/reference | CivicSure | Executive Assurance | Institutional program assurance | County executives, oversight | Internal/restricted | Approved transparency only |
| P0/reference | CivicSure | Program/Provider/Funding | Subject assurance and lineage | Operators, providers, finance | Internal/restricted | Conditional |
| P1 | Studio | Build Packet, QA, Completion | Evidence of project delivery | Students, reviewers, institutions | Internal/restricted | Usually no |
| P1 | OAS | Conformance, Traceability | Standards conformance evidence | Standards users | Internal/public by policy | Possible |
| P1 | Foundation | Impact, Grant/Funder | Outcomes and funder accountability | Funders, executives | Restricted/aggregate | Conditional |
| P2 | Curriculum/Career | Progress, Skill, Readiness | Learning and career evidence | Learners, educators, employers | High sensitivity | Aggregate only |
| P2 | BOS | Operating and Release Assurance | Operational controls and performance | Operators, executives | Internal/restricted | Rarely |
| P2 | AI Governance | Policy/Tool/Security Activity | Governed AI accountability | Security and governance | Restricted | Rarely |
| P2 | Registry | Registration/Status | Registry record and status | Operators/public users | Product-specific | Conditional |
| P2 | Solutions | Client Operating/EBR | Client service accountability | Customers, operators | Confidential | Customer policy |
| P3 | Legal | Readiness/Authority | Legal evidence organization | Counsel, executives | Restricted | Rarely |
| P3 | SHU cross-product | Executive/360 | Explicitly governed composition | Approved executives | Highest applicable | Only approved composition |

## 41. Priorities

- **P0:** Preserve CivicSure Shared Reporting as the reference authority; resolve duplicate frontend report ownership; keep Public Disclosure separate.
- **P1:** Studio, OAS, and Foundation adapters where canonical projections and audiences are already sufficiently defined.
- **P2:** Curriculum/Career, BOS/AI Governance, Registry, and Solutions adapters after privacy, classification, and product contracts are explicit.
- **P3:** Legal reporting and cross-product SHU reports after authority/composition governance is approved.

## 42. Implementation Waves

### U0 — Inventory and Disposition

Map `src/data/shsReports`, admin report pages, local exports, print paths, and product artifacts. Decide which are convenience views, product projections, or duplicate artifact logic.

### U1 — Universal Reporting Contract

Add the smallest product/report-family registry and projection adapter boundary. Parameterize product metadata, filenames, observability, and template registration without creating a new artifact authority. Evaluate a bounded `product_key` metadata/schema extension only if querying/cataloging requires it.

### U2 — Studio and OAS

Build authorized projections for Studio evidence/build workflows and OAS conformance/traceability. Reuse shared snapshots, templates, renderers, storage, history, and permissions.

### U3 — Foundation, Curriculum, and Career

Add privacy-aware impact, learning, career, and evidence projections with aggregate/public boundaries.

### U4 — BOS and AI Governance

Add operational, release assurance, and AI governance/security projections with restricted-content controls.

### U5 — Registry, Solutions, Legal, and Cross-Product Governance

Add remaining product adapters and only then consider explicitly approved composition reports.

## 43. Migration Impact

No migration is required for this audit. Current migration `106` supports the CivicSure R1 artifact foundation. Its metadata can carry product identity through template and payload metadata today, but a durable product/report-family catalog query may eventually justify one bounded schema extension. That decision belongs in U1 and must not be bundled with unrelated work.

## 44. Architecture Decision

**Recommendation: Option A with a thin adapter boundary.** Existing CivicSure Reporting should become SHU Shared Reporting directly. Product-specific authorities should produce authorized projections and invoke the existing Reporting artifact, snapshot, template, renderer, storage, retrieval, history, classification, and Public Disclosure boundaries.

Do not create a second universal Reporting service, a product-local artifact registry, or a broad Reporting read authority. Generalize the current authority through product metadata, registered report-family contracts, and product-specific projection adapters.

## 45. Audit Document

This file is the authoritative read-only audit and design input:

`docs/architecture/SHU_UNIVERSAL_REPORTING_CAPABILITY_AUDIT.md`

## 46. Files Created

- `docs/architecture/SHU_UNIVERSAL_REPORTING_CAPABILITY_AUDIT.md`

## 47. Files Modified

None. No runtime code, API, schema, migration, UI, renderer, deployment, or Reporting authority files were modified.

## 48. Runtime Integrity

Runtime integrity was preserved. No migration was added; migration `106` remains latest. No report type, template, renderer, schema, API route, UI route, or public-disclosure boundary was changed. Existing dirty owner work remains preserved and unmodified.

**Final audit verdict:**

SHU UNIVERSAL REPORTING CAPABILITY AUDIT COMPLETE — READY FOR ECOSYSTEM REPORTING ARCHITECTURE
