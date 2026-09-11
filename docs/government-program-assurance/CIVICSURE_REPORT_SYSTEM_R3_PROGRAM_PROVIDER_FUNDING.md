# CivicSure Report System R3: Program, Provider, and Funding

## Status

R3 extends the accepted R1 immutable report-artifact foundation and the R2 CivicSure institutional renderer with three deterministic report families:

- Program Assurance Report
- Provider Assurance Report
- Funding Lineage Report

The existing `report_artifacts` and `ReportArtifactService` remain the canonical Reporting authority. R3 adds no competing artifact, Truth, Metric, Verification, Investigation, or Public Disclosure authority.

## Architecture Inheritance

```text
Canonical GPA authorities
  -> Reporting projection
  -> immutable report payload snapshot
  -> R3 presentation model
  -> versioned template registry entry
  -> CivicSure R2 renderer
  -> durable HTML/PDF/JSON rendered files
  -> scoped retrieval and report history
```

The presentation models are derived from `report.canonicalFacts` after server-side subject validation. They contain display-ready values only; they do not calculate or promote official facts.

## Presentation Models

`civicsure-r3-presentations.ts` provides:

- `ProgramAssurancePresentationModel` behavior for program identity, funding, providers, assurance counts, verified outcomes, attention items, monitoring, audit references, and evidence references.
- `ProviderAssurancePresentationModel` behavior for provider identity, program participation, funding exposure, findings, corrective actions, and source quality.
- `FundingLineagePresentationModel` behavior for funding overview, forward lineage stages, program/provider distribution, verified outcomes, and explicit lineage gaps.

Only accepted Truth records are rendered as Verified Outcomes. Missing funding edges are reported as incomplete lineage; no causal relationship is inferred.

## Templates and Rendering

The registry now maps these version-one templates to `civicsure-r3`:

- `civicsure-program-assurance.v1`
- `civicsure-provider-assurance.v1`
- `civicsure-funding-lineage.v1`

The shared `CivicSureRenderAdapter` produces JSON, HTML, and PDF from the same immutable presentation model. The R2 institutional tokens, Ohio-inspired decorative motif, classification marking, Letter pagination, headers, footers, and page numbering are inherited without creating a new visual system.

## Scope Validation and Security

Program, Provider, and Funding Lineage reports require a canonical subject reference. The server validates that the subject is present in the scoped canonical funding records and rejects missing or unknown subjects. Artifact and rendered-file retrieval continues to enforce `reports.view`, organization, tenant, classification, storage scope, and hash verification.

Provider reports intentionally exclude raw Investigation records, protected participant data, and unsupported fraud language. A bounded privacy note may be shown, but restricted identifiers are not copied into the report.

R3 does not publish reports. Public Disclosure eligibility, approval, snapshot, and release remain separate canonical controls. `PUBLIC` classification is not publication approval.

## Funding Lineage Semantics

Funding reports use stored canonical references and lineage edges when available:

```text
Funding source -> award/allocation -> program -> provider -> expenditure/payment
  -> service -> claim -> evidence -> verification -> verified outcome
```

The current report payload includes bounded funding lineage edges. If an edge or outcome is absent, the report states that the link is incomplete rather than filling the gap with a derived relationship.

## Reports UI

The existing Reports workspace continues to use the same generate, preview, download, and history controls. R3 changes only the report-family output path and uses generic PDF download wording; it does not create a second Reports UI or artifact history.

## Tests and Verification

The focused R3 suite covers HTML scoping for all three families and PDF generation through the shared renderer. The fixtures verify CivicSure branding, canonical values, classification, evidence appendix presence, provider Investigation exclusion, and SHA-256 output integrity.

R3 must retain the existing R1/R2 immutability, organization/tenant retrieval, Public Disclosure separation, and no-AI-facts constraints.

## R4 Readiness

R4 Audit Packet can inherit the same R1 artifact model, R2 institutional renderer, and R3 subject-specific presentation pattern. Audit-specific workpaper, sample, evidence, finding, corrective action, and decision projections must be supplied by canonical GPA services before an R4 template is added.

No migration 107 is required for R3; migration 106 remains the report persistence baseline.
