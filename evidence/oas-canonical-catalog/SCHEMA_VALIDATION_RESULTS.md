# Schema validation results

Draft 2020-12 schemas: catalog-source, public catalog, standard, release, profile, requirement, declaration, supersession. Ajv 8 strict mode with ajv-formats validates schemas and instances. Source catalog and synthetic positive/negative fixtures pass focused validation. Required fields, closed objects, date formats, immutable ID formats, draft/adopted release rules, provenance fields, declaration NOT_EVALUATED and reference integrity are exercised.

Semantic validation additionally checks global ID uniqueness, release/version equality, known domains/R-levels, profile membership, same-release declaration references, reciprocal same-standard supersession, self-links/cycles, population-state truth, manifest digests and artifact digest. JSON Schema alone does not perform reference resolution, verify publisher identity, establish normative adoption, or evaluate conformance. Use scripts/oas-catalog.mjs validation alongside the schemas.

The public catalog release schema reuses the same conditional release definition as the editorial source while requiring snapshot provenance. Schema IDs use urn:oas:schema:<entity>:1; none implies a deployed HTTP schema service.

See validation-results.json and unit-tests.log for final command exit codes, fixture results and the committed snapshot reproducibility check. A prepublication test run intentionally skipped only the absent not-yet-generated snapshot; final validation includes it without skips.
