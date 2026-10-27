# OAS canonical catalog migration

## Current state and target

See `evidence/oas-canonical-catalog/DISCOVERY.md` for source-verified facts and baseline. OAS currently publishes overview JSX, eight public domains, R0–R4 guidance and Public Working Draft/Public Review labels. SHS reports use a conflicting taxonomy and NOT_EVALUATED. No source-backed normative requirement population or profiles exist. Target: one OAS editorial JSON source, strict schema contracts, immutable reproducible public snapshots and bounded provider declarations.

## Identifier adoption

Retain OAS-1 as standard ID, separate it from its version. Allocate `0.0.0-public-review.1` solely for the current machine snapshot; pin `OAS-1@0.0.0-public-review.1`. Domain IDs are OAS-1-D01 through D08. Requirement IDs and profiles follow IDENTIFIER_RULES.md; identifiers never depend on translated labels. No global latest alias. Never interpret legacy reporting standardVersion OAS-1 as an immutable release pin. Its input behavior remains unchanged, requiring explicit future consumer migration.

## Taxonomy reconciliation and legacy mappings

Public page domain names are canonical; all three public domain-list pages now use the OAS source adapter. Existing descriptions, markup, route paths and layout remain intact. Canonical domain 06 records contextual alias Human Oversight. Deployment is risk guidance across domains, not a ninth domain. The complete conflicting SHS reporting vocabulary is retained under legacy taxonomy shs-oas-reporting-v1, with canonical_domain_id null and migration_status requires_semantic_review on every row. Numeric-position mapping is prohibited. Legacy reports retain original labels, references, input versions and NOT_EVALUATED. A future report contract version must adopt canonical IDs and precise reviewed semantic mappings; no existing report is relabeled retroactively.

## Releases

Import existing public status as public_review plus Public Working Draft publication label, with null dates and normative_status not_published. The new machine version is not a historical release claim. Retain draft snapshots and subsequent adopted releases at explicit paths/Git commits. Released/deprecated/superseded records require an adopted normative source and release date. Supersession requires reciprocal same-standard resolvable references and an acyclic graph. See SUPERSESSION_MODEL.md. Do not rewrite old declarations or source digests.

## Profiles

Schema/catalog structure exists; population_status not_defined and profiles empty. No fictional Registry display profiles are imported. OAS must author profiles, their versioned standard relationship, domains and actual requirement membership before a profile reference resolves. R0–R4 are risk levels, not profiles.

## Requirements

Requirement identifiers and schema support exact normative wording, repository-relative text reference/anchor, domain, risk levels, release relationship, status and replacement links. The catalog is empty with normative_source_not_published. Overview prose and matrix bands cannot be silently promoted to normative requirements. OAS must author/adopt individual requirements against a real specification before requirement-level integration. Populate one authoritative source and migrate future UI requirement views to it. Existing public overviews remain summaries; do not copy them as normative text.

## Declarations

OAS declaration schema version 1.0.0 defines a provider-authored scoped statement with exact standard pin, optional real profile, actual requirement references, attribution/time/status/evidence references/notes. Validation requires both schema validation and catalog resolution (`validateDeclaration`). Unknown profiles or requirements reject. A standard-only draft reference declaration is possible but has no conformance meaning. Private declarations are not put in the public standards catalog. Registry's later recording and public projection require a separately approved contract migration, not an OAS write into Registry.

## Registry integration readiness

Ready for repository-based, bounded read-only resolution of OAS-1, the explicit draft snapshot, public domains, empty populations, declaration shape and provenance. Not ready for adopted-standard, profile, normative requirement, conformance or certification claims. Remaining gates: publish the normative specification and individual requirements, govern any profiles, approve release/effective dates and publication location/transport, review legacy-report semantic mappings, and implement Registry consumption in a separate phase. See REGISTRY_INTEGRATION_READINESS.md. No Registry code, Registry-owned OAS catalog, authentication, lifecycle or trust scoring is introduced.

## Operations and rollback

Run oas:validate, oas:test, oas:typecheck, oas:build and architecture checks. Commit source inputs, generate snapshot, run oas:check and tests again, then commit artifact/evidence. CI verifies these contracts. Rollback the optional public-domain adapter to original arrays if needed; preserve published artifacts and identifiers. Normal MPA build/route definitions remain unchanged. This branch is not merged or deployed.
