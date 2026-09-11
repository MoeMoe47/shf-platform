# CivicSure Reports R1 Foundation

## Status

R1 establishes the canonical foundation for durable CivicSure report generation. It does not implement the final Executive Assurance PDF design.

## Authority Reuse

Reporting remains owned by the existing `ReportArtifactService`, `ReportArtifactRepo`, `/reporting` routes, GPA Phase 8B reporting adapter, audit events, and Public Disclosure services. The R1 tables and services extend that authority; they do not create a parallel report system.

## Pipeline

```text
Canonical GPA authorities
  -> GPA Reporting projection
  -> immutable report payload snapshot
  -> versioned report template
  -> R1 render adapter
  -> JSON or HTML rendered bytes
  -> scoped durable storage reference and hash
  -> report_artifacts / report_rendered_files metadata
  -> authorized history and retrieval
```

## Immutable Snapshot Model

`report_payload_snapshots` stores the exact server-composed payload, report type/version, organization, tenant, reporting period, classification, canonical reference manifest, verification summary, metric-version metadata, AI-involvement metadata, generated actor, and SHA-256 payload hash. The snapshot is associated one-to-one with `report_artifacts` and is never updated by the R1 service. A later generation creates a new artifact and snapshot.

The snapshot contains a bounded reporting projection, not a second Truth, Metric, Claim, Evidence, or Verification authority. Raw restricted source payloads are not introduced into the file model.

## Template Registry

`ReportTemplateRegistry` defines versioned CivicSure R1 templates for:

- Executive Assurance
- Program Assurance
- Provider Assurance
- Funding Lineage
- Audit Packet

Each definition has a stable template key/id, report type, template version, supported formats, renderer identifier, classification behavior, lifecycle status, effective metadata, and product identity. The service persists definitions idempotently in `report_templates`.

## Render Adapter

`CivicSureRenderAdapter` is the format boundary. Its contract accepts an immutable payload, a resolved template, and a requested format, returning bytes, MIME type, byte length, SHA-256 hash, and renderer version.

R1 implements:

- JSON: deterministic serialized immutable payload;
- HTML: escaped, server-produced, bounded preview document;
- PDF: registered in the template contract but explicitly reserved for R2 until the repository renderer is bound to artifact identity and durable file ownership.

The Reporting domain does not depend directly on a PDF library.

## Durable Storage

`ReportFileStorage` stores bytes under a configured `SHS_REPORT_STORAGE_ROOT`, defaulting to an OS runtime directory outside the frontend source/watch tree. Storage references are generated server-side beneath the artifact directory, path traversal is rejected, and writes use exclusive creation. The database stores only the scoped reference and metadata in `report_rendered_files`.

The deployment must provide a durable, access-controlled filesystem or object-storage mount for this root before production use. R1 intentionally does not create public buckets or permanent public URLs.

## Rendered File Metadata

`report_rendered_files` records rendered file ID, artifact/snapshot IDs, organization/tenant, format, MIME type, byte length, SHA-256 hash, template ID/version, renderer version, storage reference, classification, retrieval state, actor, timestamps, and future supersession linkage.

Retrieval verifies the database scope, retrieval state, file hash, and `reports.view` permission. Responses use private no-store caching, `nosniff`, inline/attachment disposition, and sanitized filenames.

## Metadata Contract

R1 extends `report_artifacts` with report type/version, jurisdiction, subject, structured reporting-period fields, AI involvement, and payload/content hash linkage. The payload snapshot preserves canonical references and available metric/verification provenance without inventing missing versions.

## History and Supersession

Existing artifact list/read routes remain the history foundation. R1 adds snapshot and rendered-file reads, and each artifact retains its own immutable snapshot and rendered files. The rendered-file schema includes retrieval state and a future supersession reference. R1 does not add a new approval authority or mutate old artifacts.

## Preview and Routes

Existing GPA generation now creates the R1 snapshot and JSON/HTML files. Reporting routes provide:

- `GET /reporting/artifacts`
- `GET /reporting/artifacts/:artifactId`
- `GET /reporting/artifacts/:artifactId/snapshot`
- `GET /reporting/artifacts/:artifactId/rendered-files`
- `GET /reporting/rendered-files/:fileId`

All routes retain Reporting permission and organization/tenant scope. Public output remains on the separate Public Disclosure path.

## Classification and Public Disclosure

R1 preserves the current artifact classifications: `INTERNAL`, `RESTRICTED_EXTERNAL`, and `PUBLIC`. It passes classification through payload and rendered-file metadata and leaves visual classification marking for R2. It does not broaden classification or equate internal generation with public release. Public Disclosure eligibility, policy, snapshots, release approval, and publication remain separate authorities.

## Security and Failure Handling

The R1 boundary rejects invalid templates/formats, path traversal, unsupported PDF rendering, missing scope, unavailable files, and hash mismatches. Renderer/storage/database failures are not represented as successful rendered files. Future production deployment must add storage backup, retention, revocation operations, and object-store lifecycle controls at the deployment boundary.

## Audit Events

Existing artifact generation audit events remain in place. R1 adds `report_render.completed` events containing artifact, snapshot, format, hash, and byte-length references. Render-failure and retrieval audit expansion remain bounded follow-up work where the repository’s audit policy requires it.

## Migration

R1 adds migration `106_civicsure_report_r1_foundation.sql`. It extends `report_artifacts` and creates `report_templates`, `report_payload_snapshots`, and `report_rendered_files`. No unrelated schema change is included.

## Future R2–R5 Contract

- R2: bind a trusted server renderer to the exact R1 artifact/template contract and deliver the Executive Assurance PDF design.
- R3: add typed Program, Provider, and Funding report templates and complete lineage appendices.
- R4: add the restricted Audit Packet renderer.
- R5: expose durable report history, approval references, retention, supersession, revocation, and governed distribution.

No future wave may create browser-derived official numbers, a second Reporting authority, or a public path outside Public Disclosure.
