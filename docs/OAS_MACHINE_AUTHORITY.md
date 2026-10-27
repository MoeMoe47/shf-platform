# OAS machine authority

OAS is the independent standards and interoperability authority. Repository co-location with SHS does not transfer that authority. OAS owns standard IDs, explicit versions, releases, domain taxonomy, profiles, normative requirements, declaration schema, and their supersession metadata. This catalog foundation does not adopt a normative standard or certify a system.

Autonomous Registry independently owns identity, registration, provenance, agent version, lifecycle and public records. Registry may resolve and record pinned OAS references and attributed provider declarations. Registry may cache the exact OAS artifact with provenance; it may not maintain a competing standards catalog, redefine identifiers, populate fictional OAS profiles, rewrite normative wording, convert draft status to release, or infer certification. External systems cannot write directly to canonical Registry records.

Autonomous Trust Bureau independently owns trust and assessment opinions. OAS neither assigns Bureau scores nor treats declarations as Bureau findings. SHS BOS owns operational/business systems; its reporting projections are consumers, not OAS publication or evaluation authorities. The existing reporting adapter remains NOT_EVALUATED.

## Publication and public projection

Canonical editorial source: `standards/oas/catalog.json`. Schemas: `schemas/oas/*.schema.json` (Draft 2020-12, stable URN IDs, not claims of hosted endpoints). The generated public snapshot is `public/oas/catalogs/OAS-1@0.0.0-public-review.1.json`. It contains only standards/release/profile/requirement metadata, public domain/risk vocabulary, explicit legacy taxonomy warnings, source Git revision, repository-relative digest manifest, schema ID, evaluation boundary and digest. No private provider data, governance deliberations, approval identities, credentials, evidence contents or internal assessment data belongs in this source or public artifact. The strict schemas reject additional fields. A repository-relative path identifies reproducible public source, not a personal local path.

Public schema files are available from this Git repository; this phase does not deploy them or promise a network API. A consumer obtains the artifact and schemas at a full Git commit, validates them, resolves explicit IDs and verifies checksums. Public hosting/domain adoption remains a separate publication decision. The existing website's disabled full-spec/PDF/schema navigation stays disabled: catalog metadata is not the full normative specification.

## Publication lifecycle

Working draft is editable standards work, not an adopted standard. Public review is a working draft exposed for review. Released means explicitly adopted normative content with release date and non-prerelease version. Deprecated means an adopted release is discouraged for new use but remains addressable. Superseded means an explicit replacement is recorded. These states do not establish implementation evaluation, Registry authorization or execution permission.

Current snapshot: `OAS-1@0.0.0-public-review.1`, Public Working Draft/Public Review, normative source not published, release/effective dates null. `0.0.0-public-review.1` is a newly allocated catalog snapshot version, not an assertion that OAS previously adopted semantic version 1.0. Artwork Version 1.0 does not confer release authority. Profiles and normative requirements are deliberately empty pending authored/adopted source content.

Every published snapshot, including a public-review pin, is immutable. Allocate another explicit version for content changes. Maintain older artifacts and Git commits. The live editorial catalog may add replacement observations, but historical snapshots and declarations retain original pins; latest status is an as-of observation in a newer catalog, not a mutation of history. No floating latest is authoritative.

## Reproducibility and limits

Commit canonical inputs before running `npm run oas:generate`. The generator reads exact input bytes from their last source commit and refuses uncommitted input drift. source_revision is that full commit, generated_at is its committer time normalized to UTC (a deterministic generation epoch, not execution wall-clock time), source_files lists SHA-256 digests of catalog/schema/generator bytes. source_checksum hashes the serialized manifest. Each release carries the same snapshot provenance. artifact_checksum hashes the public artifact with only artifact_checksum omitted, serialized as two-space JSON plus one LF. `npm run oas:check` reproduces the file from Git and compares bytes. Digests detect byte changes; no signatures, identity proof, external timestamping or cryptographic trust chain is implemented.

For another snapshot, allocate a new prerelease/version and versioned output path in the generator; never overwrite existing unequal bytes. For an adopted release, publish reviewed normative content and dates through OAS governance first. No automated release-status promotion exists. New schema contracts require explicit schema-version migration.
