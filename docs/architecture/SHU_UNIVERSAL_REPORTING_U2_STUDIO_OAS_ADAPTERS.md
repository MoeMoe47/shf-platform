# SHU Universal Reporting U2 — Studio and OAS Product Adapters

## 1. Purpose

U2 proves that the U1 universal reporting contract supports non-CivicSure product projections without creating a second report engine. Studio and OAS projections enter the existing Shared Reporting authority, which owns immutable payload snapshots, versioned templates, HTML/PDF/JSON rendering, durable files, hashes, scoped retrieval, and history.

## 2. Authority Flow

```text
Studio or OAS canonical authority
  -> authorized product projection adapter
  -> Shared Reporting artifact and snapshot
  -> registered product/family template
  -> shared HTML/PDF/JSON renderer
  -> product-scoped durable artifact
```

`apps/shs-api/src/domain/reporting/` remains the sole artifact, template, renderer, storage, history, and retrieval authority. Product adapters are responsible for domain authorization, subject validation, redaction, provenance, and canonical references. Shared Reporting never queries Studio or OAS tables as an independent data authority.

## 3. Studio Adapter

`StudioReportProjectionAdapter` uses `StudioProjectService` for the canonical project, workspace, Build Packet, QA, review, and delivery views. Active families are:

| Family | Subject | Canonical inputs | Boundary |
| --- | --- | --- | --- |
| `project-report` | Studio project | project, workspace, Build Packet, QA, review, delivery | Summary projection only |
| `qa-report` | Studio project | project, workspace, current QA | Does not create or alter QA |
| `review-report` | Studio project | project, review submission and decision | Preserves submission authority |
| `project-completion` | Studio project | project, QA, review, delivery | Requires canonical finalized delivery or delivered lifecycle state |
| `build-packet-evidence` | Studio project | Build Packet and linked project references | Report about the Build Packet; does not replace it |

The adapter preserves project, Build Packet, QA, review, evidence, portfolio, and lifecycle ownership in their existing domains. Protected learner, reviewer, and submitted-work payload details are not copied into the report projection.

## 4. OAS Adapter and Boundary

The repository currently contains OAS-1 public working-draft definitions and control-domain content, but no backend OAS conformance/evidence/test authority. `OasReportProjectionAdapter` therefore provides a deliberately bounded standard projection:

* supported version is explicitly `OAS-1`;
* supported families are `conformance`, `traceability`, and `testing-evidence`;
* requirements are represented as `NOT_EVALUATED` without canonical evidence;
* missing evidence is not converted into non-conformance;
* no certification, approval, Registry status, Trust Bureau status, or trust score is produced;
* OAS Standard, Autonomous Registry, and Trust Bureau remain separate authorities.

Future OAS conformance requires a separately governed OAS subject/evidence/test authority. The adapter will fail closed for unknown standard versions and missing subjects.

## 5. Product Registration

Studio and OAS definitions are registered in `ReportTemplateRegistry` with exact product/family identity, template version `1`, `shu-universal-r1` renderer selection, supported JSON/HTML/PDF formats, product branding, and `PUBLIC_DISCLOSURE_SEPARATE` publication behavior. Existing CivicSure type compatibility remains unchanged.

## 6. Shared Rendering and Artifacts

The existing renderer gained one trusted generic product-report branch. It uses the same immutable presentation model for HTML and PDF, Letter pagination, headers/footers, classification markings, escaped text, safe tables, and Playwright PDF rendering. No second PDF engine was added.

Product identity and family identity are persisted on artifacts, payload snapshots, rendered files, and templates through the existing migration-107 contract. Storage references and filenames remain sanitized and product-scoped. Rendered bytes remain immutable and hash-verified on retrieval.

## 7. Routes and History

Product generation routes are bounded under the Shared Reporting entitlement:

* `POST /reporting/studio/reports`
* `POST /reporting/oas/reports`

The routes require `reports.export`. Studio data access is additionally enforced by the existing `STUDIO_PROJECT_VIEW` authority inside `StudioProjectService`. Shared artifact, file, and history routes continue to enforce organization and tenant scope. Public classification does not publish an artifact; Public Disclosure remains separate.

## 8. Test Coverage

The U2 focused suite verifies:

* exact Studio/OAS registration and product-family mismatch rejection;
* Studio delegation and completion gating;
* OAS version validation and non-certifying boundary language;
* shared branded HTML rendering;
* Playwright-backed hashed Letter PDF generation.

The existing R1, R2, R3, U1, API typecheck/build, root build, UI validation, and migration replay remain required regression checks.

## 9. No Migration 108

Migration 107 already provides product and report-family identity on the Shared Reporting records. U2 adds no product-specific schema fields and therefore does not add migration 108.

## 10. U3 Readiness

Foundation, Curriculum, and Career adapters should follow the same contract but require additional authority and privacy decisions before implementation. Their projections must define participant-sensitive redaction, aggregate-vs-individual reporting, funder/publication policy, credentials, learner progress, and employer-outcome boundaries. No U3 report family is registered by U2.
