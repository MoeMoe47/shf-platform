# CivicSure Wave 1 Assurance Proof Loop

Wave 1 is a single bounded workforce-training assurance case. The orchestration
service composes existing authorities; it does not create a case master, Truth
store, metric registry, provider master, payment system, or decision layer.

## Canonical Flow

External source registration and GPA funding lineage reference an external
award. The existing organization/program/provider/service references then feed a
GPA claim, an admissible evidence link, and an independent verification. A
passed verification permits a GPA metric result and determination. The
determination is sent through the existing IntegrationOutboxRepo and signed
Agent Fabric ingestion path to PostgreSQL Truth Spine. Oversight records use the
existing monitoring activity as the bounded warning signal, then canonical
finding, corrective-action, decision, and audit services. Public output remains
the existing Reporting/Public Disclosure snapshot and publication pipeline.

## Authority Boundaries

- External systems own source records and funding execution.
- GPA owns source registration, lineage, claims, evidence linkage,
  verification, reconciliation, and assurance determinations.
- Truth Spine owns accepted institutional Truth.
- Platform Metric Registry owns metric definitions and versions.
- Agent Fabric may analyze or recommend, but cannot determine Truth, close a
  finding, authorize publication, release payment, or make a consequential
  government decision.
- Reporting/Public Disclosure owns public eligibility, disclosure review,
  publication authorization, snapshots, and public projections.

## Acceptance Case

The acceptance identifiers use `wave1-` and represent test data only: one
funding source and award, one program/provider/service chain, one completion
claim, one evidence reference, one independent verification, one canonical
metric result, one warning, one finding, one corrective action, one human
decision, one audit workpaper, and one public report publication.

The `AssuranceProofLoopService` is intentionally an orchestrator. Its returned
digest is a correlation aid, not an authority. Each durable record remains
owned and authorized by its existing service and database domain.

## Negative Paths

Existing GPA and Wave 0 tests continue to enforce unknown sources, failed
verification, unresolved reconciliation, inactive metrics, scope violations,
AI authority denial, publication denial, and public DTO sanitization. The
proof-loop acceptance test additionally verifies that a failed verification
stops before metric/Truth promotion.

## Public Boundary

The public report must be registered as
`report.gpa.program_assurance_public_summary.v1`, use the registered metric
identity, pass eligibility and disclosure review, create an immutable snapshot,
and publish through Reporting. No internal GPA table, evidence, note, source
record, AI recommendation, or frontend fixture is a public source.
