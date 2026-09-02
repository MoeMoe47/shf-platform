# SHF Source Asset + Curriculum Ingestion Foundation

## Phase 1 boundary

Phase 1 accepts authenticated organization-scoped source material as input only. It does not create courses, units, lessons, assignments, learner progress, assessment results, evidence, competencies, credentials, metrics, or reports.

## Ownership

`source_assets` is the canonical record of the exact original binary uploaded by an authorized staff actor. Its generated identity, organization, storage key, byte size, and SHA-256 content hash are established by the server. The original file is private by default and the raw filename is metadata only.

`source_document_versions` is a separate, organization-scoped processing boundary. Every initial upload creates version 1 with a foreign-keyed provenance link to its Source Asset. It records processing and extraction state, parser version, metadata, and the actor who created the version. Phase 1 does not perform extraction.

## Security and tenant boundary

Upload and read/download routes require an authenticated active organization context and the narrow permissions `curriculum.source.upload` or `curriculum.source.view`. All reads are constrained by the actor's active organization. Storage keys are generated UUID-based keys and never use the original filename. Download rechecks the scoped database record and returns `404` for an unavailable or retired asset.

The database stores organization and tenant identifiers, organization-scoped hash/idempotency uniqueness, and same-organization composite foreign keys for document versions. No browser-supplied organization, ID, or hash is trusted.

## Validation and storage

The initial accepted set is PDF, DOCX, TXT, and Markdown. The server enforces a 25 MB limit, extension/MIME agreement, PDF signature validation, ZIP-container validation for DOCX, text NUL-byte rejection, and unsafe filename rejection. SHA-256 is computed from the received bytes. Exact duplicate hashes are rejected within an organization; separate organizations cannot collide at the record layer.

The storage interface is deliberately narrow (`put`, `get`, `remove`). The Phase 1 local implementation writes mode-0600 files below a configurable private root, not the existing public `/uploads` mount. Database insertion occurs after storage and compensates by removing the stored object if the transaction fails. An optional `Idempotency-Key` replays the existing organization-scoped record.

## Processing and malware boundary

There is no repository malware scanner or document extraction worker to reuse. Uploads therefore record `scan_status = UNAVAILABLE` and document `extraction_status = UNAVAILABLE`; this is explicit and honest, not a claim that scanning or parsing occurred. The records are not curriculum resources and no downstream learner-truth path consumes them. A future processing phase must replace these states only through an authorized, auditable processor.

## Provenance and audit

The asset records uploader, organization, original filename, media type, extension, byte size, SHA-256, storage provider/key, and timestamps. The version records source asset, organization, version number, processing/extraction state, metadata, creator, and timestamps. A successful upload writes an existing SHS security audit event (`source_asset.uploaded`). This is operational provenance, not a learner achievement or Truth Spine event.

## Explicit non-goals

No Source Document extraction, OCR, embeddings, RAG, AI generation, curriculum resource, course/unit/lesson catalog, publication/review lifecycle, curriculum release, assignment linkage, upload UI, deletion workflow, public verification URL, or learner-facing reporting was added in Phase 1.
