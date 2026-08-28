# SHF Canonical Report File Authority Contract

## Purpose

This contract separates canonical report composition metadata from the
immutable rendered bytes that may later be delivered externally. It applies to
Donor Summary and future funder, institutional, partner, and grant reports.

The required chain is:

`canonical composition -> report_artifact -> immutable rendered bytes ->
integrity identity -> governed authorization -> delivery adapter -> factual
delivery event`

No current component completes that chain.

## Current decision

`SERVER_RENDERER_EXISTS_BUT_DURABLE_STORAGE_MISSING`

The repository contains server-side PDF renderers, including the Agent Fabric
institutional/funder builders and the SHF report engine. They create bytes, but
none is a canonical bytes owner for `report_artifacts`. The report engine writes
local output files from fixture/simulation inputs, and the Agent Fabric builders
return in-memory bytes from legacy/advisory payloads. Neither establishes the
required scoped, immutable file record.

## Artifact versus file

`report_artifacts` remains the institutional composition and provenance
authority. A future report file record must separately reference:

- exact `artifact_id` and `artifact_version`;
- canonical composition type and version;
- server-derived tenant, organization, and generating actor/service;
- immutable storage reference and MIME type;
- byte length and hash of the exact persisted bytes;
- generated timestamp and file version;
- scoped read authorization and audit identity.

The artifact manifest references canonical report IDs and versions only. Raw
Truth, Evidence, participant, employer, and verification payloads must not be
copied into file authority.

## Rendering authority

Canonical rendering must be server-side and must consume the approved
composition and Reporting Service outputs. A browser-created PDF, canvas
download, local file, or page-local export is not institutional authority.
Existing renderers are `RENDERER_ONLY` until they are bound to the exact
artifact/version and a durable file owner.

## Storage and integrity

A future durable file subsystem must provide server-owned storage references,
tenant/org isolation, authorized reads, immutable or versioned bytes, retention
and correction semantics, and auditability. `content_hash` is null until real
bytes are persisted. The hash must be computed over those exact bytes using the
approved cryptographic convention; metadata, IDs, and frontend state are not
file hashes.

Changed content requires a new file/artifact version. Existing externally
authorizable bytes must never be silently overwritten.

## Current candidate classification

| Candidate | Classification | Finding |
| --- | --- | --- |
| `services/shf-agent-fabric/fabric/reports/institutional/builder.py` and `funder_report.py` | `RENDERER_ONLY` | ReportLab builders return bytes from legacy/advisory payloads; no durable scoped file owner or artifact linkage. |
| `services/shf-agent-fabric/fabric/reports/pdf_report.py` | `RENDERER_ONLY` | In-memory PDF renderer; no canonical Donor Summary contract or durable file record. |
| `services/shf-report-engine/src/render.js` | `RENDERER_ONLY` | Playwright renders fixture HTML to local `outputs/*.pdf`; no tenant/org/artifact binding or governed storage. |
| `services/shf-agent-fabric/fabric/reports/proof_pack.py` | `RENDERER_ONLY` | Hashes supplied bytes for a proof package; does not own storage or report artifact identity. |
| `services/shf-audit-service/routes/exports.py` | `DELIVERY_ADAPTER_ONLY` | Signs/verifies JSON export payloads; it is not file storage or delivery authority. |
| `src/utils/downloads.js`, `src/utils/download.js`, `src/utils/exports.js` | `LEGACY_PRESENTATION_EXPORT` | Browser Blob/data-URL/localStorage downloads; no durable server ownership or audit. |
| `apps/shs-api/src/domain/reporting/export-history.store.ts` | `LEGACY_PRESENTATION_EXPORT` | Process-memory export history, not durable artifact/file authority. |
| `services/shf-report-engine/outputs/*.pdf` and published report files | `DEMO_ONLY / MOCK_ONLY` | Existing files are local/static outputs without canonical artifact linkage or scoped access. |

No reusable `CANONICAL_BYTES_OWNER` or `CANONICAL_DELIVERY_CANDIDATE` was
found. No email, secure external link, partner portal, or file-transfer path
proves delivery semantics for this reporting chain.

## Access and delivery boundary

Future restricted files must reject cross-tenant and cross-organization reads,
client-supplied storage paths, client-supplied hashes, arbitrary artifact/file
associations, and public access to restricted bytes. `AUTHORIZED_FOR_DISTRIBUTION`
continues to mean only that the exact artifact/version passed the existing
authorization gates. It does not mean sent, shared, delivered, opened, or
read.

Any later delivery adapter must distinguish request acceptance from actual
recipient delivery and must add its own factual, append-only event. No
`SENT`/`DELIVERED` state is introduced by this contract.

## Donor Summary application

Donor Summary v1 contains only the aggregate statement:

`X verified employment starts were recorded during the reporting period.`

Its existing metadata artifact may be authorized for restricted distribution,
but no canonical PDF or bytes owner exists. A future implementation must bind a
server-rendered, immutable file to the exact `DONOR_SUMMARY` v1 artifact and
workforce report version, compute the hash from persisted bytes, and retain
aggregate-only content. It must not add placement, retention, wage, success, or
impact claims.

## Critical-path decision

Delivery and file persistence are a separate product workstream. The current
Trusted Reporting chain is already truthful through
`AUTHORIZED_FOR_DISTRIBUTION`; internal canonical reporting correctness does
not require pretending that a file was delivered. Public Impact Snapshot and
other public work remain governed by their own eligibility and privacy gates,
not by an assumed delivery event.

The next bounded implementation slice, if externally delivered artifacts are
actually required, is a server-side Donor Summary renderer plus durable,
scoped, immutable file storage linked to `report_artifacts`. No existing
renderer should be promoted without that ownership contract.
