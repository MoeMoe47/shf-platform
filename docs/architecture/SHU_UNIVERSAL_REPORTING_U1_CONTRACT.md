# SHU Universal Reporting U1 Contract

Status: implementation baseline

U1 generalizes the existing API Reporting domain into the SHU contract for one Reporting authority and many product-specific report families. It does not add product report families beyond the registered CivicSure families.

## Authority and flow

The sole artifact authority remains `apps/shs-api/src/domain/reporting/`. Product authorities provide an already-authorized projection; Shared Reporting snapshots, templates, renders, stores, retrieves, and audits that projection.

```text
Product authority
  -> authorized product projection adapter
  -> Shared Reporting
  -> immutable payload snapshot
  -> product/family template
  -> shared HTML/PDF renderer
  -> durable rendered artifact
  -> scoped history/retrieval/review/distribution
```

Reporting never expands a product principal's domain access and never becomes the authority for Truth, Metrics, Verification, Investigation, or Public Disclosure.

## Product and family identity

`ProductKey` is a bounded trusted identifier. The initial keys are:

`civicsure`, `oas`, `registry`, `studio`, `bos`, `foundation`, and `solutions`.

Curriculum, Career, Legal, and AI Governance are not registered as independent keys in U1 because the repository evidence does not establish them as separate top-level product authorities. Their future ownership must be decided by the relevant product authority before adapter work begins.

Report family is separate from product, template version, renderer version, and report type. Existing GPA report types remain compatible through the mapping:

| Product | Family | Existing report type | State |
| --- | --- | --- | --- |
| CivicSure | executive-assurance | EXECUTIVE_ASSURANCE | ACTIVE |
| CivicSure | program-assurance | PROGRAM_ASSURANCE | ACTIVE |
| CivicSure | provider-assurance | PROVIDER_ASSURANCE | ACTIVE |
| CivicSure | funding-lineage | FUNDING_LINEAGE | ACTIVE |
| CivicSure | audit-packet | AUDIT_PACKET | ACTIVE |

The registry fails closed for unknown products, families, versions, or inactive definitions.

## Authorized projection contract

The bounded adapter contract is represented by `ProductReportProjectionAdapter` in `product-report-contract.ts`:

```ts
interface ProductReportProjectionAdapter {
  productKey: ProductKey
  supports(reportFamily: string): boolean
  project(input: unknown, actorContext: unknown): Promise<AuthorizedReportProjection>
}
```

`AuthorizedReportProjection` carries product key, family, subject, organization/tenant scope, reporting period, classification, generated timestamp, canonical references, source versions, provenance, and an opaque domain payload. The adapter owns domain authorization, subject validation, purpose/data-use controls, redaction, and canonical provenance. Shared Reporting accepts the envelope; it does not independently query product data.

The current Phase 8B GPA service is the CivicSure reference adapter boundary. It performs the existing GPA authorization and scoped projection work, then hands a `civicsure` projection to `ReportR1Service`.

## Persistence and migration 107

Migration `107_shu_universal_reporting_contract.sql` adds product and family identity to the existing Reporting tables:

* `report_artifacts`
* `report_payload_snapshots`
* `report_rendered_files`
* `report_templates`

Product identity is nullable for unknown historical rows so U1 does not misclassify unrelated legacy artifacts. Known CivicSure report types are explicitly backfilled as `civicsure` with their established family. New GPA artifacts, snapshots, rendered files, and templates carry product/family identity.

Product/family indexes support scoped history and catalog queries. Existing CivicSure rows remain valid and immutable. No second artifact table or storage system was introduced.

## Registry, templates, and renderer

`ReportTemplateRegistry` now resolves exact `(productKey, reportFamily, templateVersion)` definitions. It preserves the compatibility `get(reportType, version)` lookup for current CivicSure callers. Definitions contain formats, renderer identifier, projection adapter key, branding key, filename prefix, classification behavior, public eligibility mode, and status.

The existing CivicSure renderer remains the shared renderer implementation. U1 formalizes its boundary rather than rewriting PDF generation. The reusable base concerns are the existing trusted HTML shell, escaping, classification handling, Letter PDF rendering, print CSS, tables, evidence/metadata structures, page headers/footers, pagination, hashes, and scoped file retrieval. Product-specific templates and branding remain product concerns.

## Branding, filenames, and storage

Trusted product brand metadata is defined in the registry. CivicSure retains its existing name and report presentation. Other approved product keys have bounded placeholder branding metadata only; no report family is fabricated for them.

New rendered filenames use the safe pattern:

`<Product>_<Jurisdiction>_<Report-Type>_<Period>_v<Version>.<format>`

All display segments are sanitized and length-bounded. Storage references use the trusted product namespace:

`product / organization / tenant / artifact / rendered-file.format`

The raw reference is never exposed as a public URL. `ReportFileStorage` continues to enforce the configured root boundary, production storage-root requirement, immutable create-once writes, and retrieval by authorized artifact metadata.

## Artifact, snapshot, and rendered-file identity

Artifact rows carry product/family identity. Payload snapshots carry the same identity alongside the immutable payload hash, reporting period, classification, canonical-reference manifest, verification summary, and AI metadata. Rendered-file rows carry product/family, artifact/snapshot, template, renderer, format, MIME type, byte length, hash, classification, filename, and storage reference.

The existing organization/tenant scope remains authoritative. File retrieval still requires the authenticated organization/tenant path and validates the stored SHA-256 before returning bytes. History can filter by product and family through the existing `/reporting/artifacts` route without creating a broad cross-product query authority.

## API and permission boundary

Existing CivicSure generation routes remain compatible. Product-specific generation routes may be added in later adapter waves; Shared Reporting routes remain focused on artifact creation compatibility, scoped artifact/snapshot/file retrieval, history, and publication boundaries.

The current `reports.export`, `reports.preview`, and `reports.view` permissions remain in use. Domain authorization and report action authorization are both required. No reporting permission grants access to another product's domain data.

Public classification is not publication. Public Disclosure eligibility, authorization, snapshot, release, distribution, and publication remain separate authorities and routes.

Screen `window.print()` paths remain convenience paths. Official reports remain governed immutable artifacts. CSV, DOCX, and XLSX are not universalized in U1.

## Observability and audit

Material report audit state includes trusted product key and report family where the action concerns an artifact, payload snapshot, render request/completion, or retrieval. Existing audit authority remains the event owner; protected payload content is not logged. The artifact/render metadata provides product, family, organization, tenant, template, renderer, format, hash, and status context for future duration telemetry.

## Compatibility and safety

* CivicSure R1/R2/R3 templates and routes continue to resolve through compatibility mapping.
* Unknown product/family combinations fail closed.
* Product/family identity is not accepted from arbitrary HTML, CSS, renderer code, or storage paths.
* Existing unknown legacy Reporting rows remain nullable rather than being guessed as CivicSure.
* Shared Reporting cannot replace product artifact authorities such as Studio Build Packets, portfolio artifacts, legal records, audit workpapers, evidence, decisions, or QA artifacts. It can receive authorized projections from them later.

## U2 readiness

U1 deliberately does not implement product report families. The next adapter contracts require:

### Studio

An authorized Studio projection for Project Report, QA, Build Packet projection, Review, and Completion reports. Studio Build Packets and review artifacts remain Studio-owned canonical artifacts; Shared Reporting would render governed projections.

### OAS

An authorized OAS projection for Conformance, Traceability, and Testing/Evidence reports. Standard definitions, controls, versions, and conformance evidence remain OAS-owned. A report must not merge OAS Standard authority with Registry or Trust Bureau authority.

Each adapter must supply subject validation, organization/tenant scope, classification, permitted evidence, canonical references, and a product-owned report family before registration.

## Verification scope

U1 tests cover exact registry resolution and fail-closed combinations, projection-envelope validation, product-safe filenames, traversal-safe product storage references, and conservative migration ownership. Existing R1/R2/R3 report suites remain the compatibility regression baseline. API typecheck is required before adapter expansion.

No new Reporting authority, Public Disclosure authority, Truth authority, Metric authority, Verification authority, Investigation authority, or product report family is introduced by U1.
