# Schema validation results

Existing catalog contracts remain byte-for-byte unchanged, and all eight strict Draft 2020-12 schemas compile and validate through oas:validate/oas:check. New contracts are isolated under schemas/oas/review/ so they do not change the historical catalog generator's source manifest or schema IDs.

Four review-only schemas: authoring, requirement, domain-mapping and declaration. They enforce closed records, complete authoring metadata, original serial ID syntax, existing domain IDs, no normative R-level conditioning, null actual release/introduction/adoption/publication, explicit candidate status, versioned review declarations and NOT_EVALUATED. Per-requirement declaration state conditionals require a nonblank not-applicable reason and offered evidence references for declared-satisfied. Published declaration v1 remains unchanged.

Semantic checks additionally resolve actual domains, question IDs, exact baseline source text/line citations, statement-bound review decisions, duplicate IDs/normalized normative text, deterministic namespaced aliases, unknown/ambiguous/unmapped label rejection, supersession cycles, source/statement digest pins, and released catalog membership with matching governance metadata/effective date. JSON Schema alone does not prove these cross-document relationships or adoption authenticity.

See review-schemas.log, catalog-schemas.log, first-release-tests.log, historical-reproduction.log, review-reproduction.log and independent-checksums.log. No candidate is accepted as an adopted obligation solely because schema validation passes.
