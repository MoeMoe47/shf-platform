# Data Aggregator Layer V1

## Role

Data Aggregator Layer V1 formalizes the existing SHS intake and aggregation boundary. It gathers raw or structured inputs from approved sources, attaches required metadata, classifies readiness for downstream handling, and prepares records for normalization, evidence packaging, Truth Spine review, Oracle review, Watchtower visibility, Reports, and public/data approval workflows.

This layer is not a new data system. It does not replace Truth Spine, Source Registry authority, SHF Impact Data Spine, Verified Aggregation, or report readiness gates.

## Canonical Boundary

Data Aggregator gathers and prepares. Truth Spine verifies what is true. Oracle decides what verified evidence supports. Watchtower observes coverage and risk. Reports communicate only verified/readiness-approved information. SHF Impact Data Spine remains the public impact data contract for SHF public surfaces.

## Owns

- Intake collection metadata.
- Source/provenance completeness checks.
- Intake classification by source type.
- Readiness signals for normalization and evidence packaging.
- Blocking signals for missing provenance or missing source metadata.
- Summary visibility for Reports and Watchtower.

## Must Not Own

- Claim verification.
- Source verification.
- Public approval.
- Report readiness.
- Oracle rulings.
- Watchtower risk decisions.
- LOO ranking.
- SHF Impact Data Spine structures.
- New database or registry authority.

## V1 Source Types

- `report`
- `csv`
- `manual`
- `operator_record`
- `document`
- `api_export`
- `unknown`

## Required Metadata

All intake records should include:

- `source_id`
- `title`
- `owner`
- `provenance`

Additional fields may be required by source type:

- `uri` for reports, CSV files, documents, and API exports.
- `evidence_type` for reports and documents.
- `schema_hint` for CSV inputs.
- `entered_by` for manual inputs.
- `record_id` for operator records.
- `exported_at` for API exports.

## Downstream Contract

Data Aggregator may route eligible inputs toward:

- Data Normalization.
- Evidence Package.
- Truth Spine.
- Reports.
- Watchtower.
- SHF Impact Data Spine.

It must preserve source/provenance metadata and must not claim a record is verified, public-approved, or report-ready.

## Truth Spine Gate

Inputs without source/provenance metadata remain blocked or draft before Truth Spine. Claim-like data must enter Truth Spine with source references. Truth Spine alone evaluates `verification_status`, `trust_level`, `public_approved`, and `report_ready`.

## Public Approval Gate

Data Aggregator cannot make data public-approved. A record is public-safe only when the downstream authority, including Truth Spine where factual claims are involved, marks it public-approved and report-ready for the intended use.

## Reports And Watchtower

Reports snapshots may include Data Aggregator status as intake context, not as verified truth. Watchtower may flag missing provenance, blocked intake, and low readiness as coverage concerns, not truth decisions.

## Existing SHF Impact Data Spine Boundary

SHF Impact Data Spine continues to own SHF public impact data structures and public filtering rules. Data Aggregator can prepare candidate inputs for that spine, but it cannot bypass `publicApproved`, `dataStatus`, `trustLevel`, or Truth Spine metadata requirements.

## V1 Endpoints

- `GET /data-aggregator/health`
- `GET /data-aggregator/sources`
- `GET /data-aggregator/intake-queue`
- `GET /data-aggregator/summary`
- `POST /data-aggregator/classify`

## V1 Status

Formalized V1. Safe scaffold only. No new persistence layer, no external data pulls, and no public data pipeline.
