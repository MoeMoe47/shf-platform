# CivicSure Report System R2: Executive Assurance

**Status:** Implemented  
**Product:** CivicSure — Government Program Assurance Platform  
**Report:** Executive Assurance Report  
**Migration:** 106; no migration 107 added  
**Authority:** Existing `ReportArtifactService`, `report_artifacts`, R1 snapshots, and Public Disclosure services remain canonical.

## Presentation Contract

R2 uses the existing pipeline:

```text
canonical GPA services
  -> Phase 8B reporting projection
  -> immutable R1 payload snapshot
  -> ExecutiveAssurancePresentationModel
  -> versioned CivicSure template
  -> HTML or Letter PDF renderer
  -> report_rendered_files / scoped retrieval
```

`buildExecutiveAssurancePresentation` is a presentation projection over the immutable report payload. It does not query live data, create official metrics, infer findings, or own canonical facts. Missing fields remain explicitly unavailable.

## Template and Renderer

The Executive Assurance template is registered as:

- template key: `civicsure-executive-assurance`
- report type: `EXECUTIVE_ASSURANCE`
- template version: `2`
- renderer: `civicsure-r2`
- formats: JSON, HTML, PDF

R1 template version 1 remains available for historical artifacts. Existing Program, Provider, Funding Lineage, and Audit Packet templates remain on R1 version 1 until their dedicated report waves.

HTML and PDF are generated from the same trusted HTML template. PDF rendering is isolated behind `CivicSureRenderAdapter.renderPdf` and uses local Playwright Chromium with JavaScript disabled, no remote URL navigation, no external scripts, and no user-supplied HTML interpolation.

## Report Structure

The R2 institutional report includes:

1. CivicSure cover with Government Program Assurance identity, jurisdiction, reporting period, generated date, version, classification, Silicon Heartland attribution, and an abstract Ohio-inspired outline motif.
2. Executive Summary answering funding, delivery, verification, attention, and decisions-required questions.
3. Assurance Scorecard using canonical counts/statuses rather than an invented composite score.
4. Funding Assurance with Funded, Obligated, Reported/Paid, and Verified Expenditure fields where available.
5. Program Assurance.
6. Provider Assurance.
7. Verified Outcomes, limited to accepted canonical Truth facts in the snapshot.
8. Items Requiring Attention.
9. Findings and Corrective Actions.
10. Data Quality and Source Health.
11. Decisions Required, sourced only from canonical payload facts.
12. Assurance Activity.
13. Methodology and limitations.
14. Evidence and Lineage Appendix.
15. Generation Metadata.

The primary report uses plain-language labels while retaining canonical IDs and references in the appendix and metadata.

## Visual and Print Contract

The report uses CivicSure navy, slate, warm ivory, paper white, restrained Ohio red, readable sans-serif body text, and serif section headings. It intentionally avoids official Ohio seals, state endorsement claims, gradients, decorative charts, and dashboard styling.

The renderer defaults to US Letter and supports:

- print backgrounds;
- repeated table headers;
- row-safe page breaks;
- appendix page breaks;
- classification header/footer markings;
- PDF page numbers using Chromium `pageNumber` / `totalPages` tokens;
- responsive HTML preview for desktop and tablet, with horizontal scrolling for dense tables.

The abstract Ohio motif is decorative and separate from the future CivicSure logo slot. County branding fields remain configuration slots and do not authorize use of a county seal.

## Artifact and Security Behavior

Executive Assurance generation requests JSON, HTML, and PDF from one immutable R1 snapshot. Each file is persisted through `report_rendered_files` with MIME type, byte length, SHA-256, template version, renderer version, classification, safe filename, and scoped storage reference.

The existing retrieval route remains protected by `reports.view`, organization/tenant scope, classification metadata, private no-store caching, `nosniff`, sanitized `Content-Disposition`, and hash verification. Internal artifact creation does not publish data. Public output still requires the existing Public Disclosure eligibility, approval, snapshot, and publication authorities.

Production deployments must set `SHS_REPORT_STORAGE_ROOT` to an approved durable private storage location. The R2 storage adapter fails closed when `NODE_ENV=production` and the setting is absent; local tests retain an isolated temporary fallback.

## AI Boundary

R2 does not add AI-generated narrative. `aiInvolvement` is recorded as `No` for Executive Assurance generation. Official facts are locked in the canonical snapshot before rendering and cannot be supplied by an LLM or recalculated by the browser, HTML, or PDF renderer.

## UI Contract

The existing Reports UI now exposes the minimum R2 controls without becoming a full report-workspace redesign:

- report type selection;
- scope and subject input;
- Generate report;
- HTML preview;
- Executive PDF download when available;
- bounded JSON download;
- artifact version and classification metadata;
- existing scoped artifact history.

The preview uses the generated immutable HTML file in a sandboxed iframe. The PDF download uses the same rendered-file retrieval authority.

## Failure and Immutability Rules

- A PDF renderer failure prevents successful PDF file metadata creation and does not alter an older artifact.
- An existing snapshot is never regenerated from live data during retrieval.
- A new generation creates a new artifact and new file hashes.
- Hash mismatch during retrieval fails the request rather than returning corrupted bytes.
- Unsupported formats remain explicit errors.
- Organization and tenant scope are enforced by existing artifact repositories and permission middleware.

## Verification Evidence

Focused API tests cover R1 regression plus R2 HTML structure, canonical values, classification, absence of executable scripts, PDF MIME/hash, Letter PDF generation, and multi-page output: **4 passed, 0 failed**.

The Phase 8 browser harness was updated to require Executive Assurance report version 2, JSON/HTML/PDF outputs, successful PDF retrieval, and the PDF download control. The remaining full browser run should be executed in the disposable acceptance environment after integration.

API typecheck passed. No migration 107 was added. Existing migration 106 remains the R1 persistence baseline.

## R3 Inheritance

Later report types should inherit these bounded primitives and authority rules:

- cover and classification mark;
- report header/footer and page numbering;
- assurance summary;
- metric/fact rows;
- institutional tables;
- attention section;
- methodology section;
- evidence appendix;
- generation metadata;
- safe filename and scoped file retrieval;
- immutable payload and versioned template contract.

Later report waves must add new templates and presentation models, not new Reporting authorities or report-local calculations.
