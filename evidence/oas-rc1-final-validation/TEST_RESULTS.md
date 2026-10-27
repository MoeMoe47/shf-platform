# Fresh tests, builds and validation results

Reviewed exact issuance commit `1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8` on `review/oas-1.0.0-rc.1-final-validation`. Original issuance logs are not reused or edited. All 80 OAS tests and 5 reporting tests passed, with zero failures/skips. No assertions, tests or implementation files changed.

| Check | Command | Exit | Evidence |
| --- | --- | --- | --- |
| rc1-tests | `npm run oas:rc1:test` | 0 | rc1-tests.log |
| scope-closure-tests | `npm run oas:closure:test` | 0 | scope-closure-tests.log |
| governance-review-tests | `npm run oas:governance:test` | 0 | governance-review-tests.log |
| canonical-catalog-tests | `npm run oas:test` | 0 | canonical-catalog-tests.log |
| first-release-tests | `npm run oas:first:test` | 0 | first-release-tests.log |
| rc1-release-check | `npm run oas:rc1:check` | 0 | rc1-release-check.log |
| acceptance-check | `npm run oas:rc1:acceptance:check` | 0 | acceptance-check.log |
| acceptance-bindings | `npm run oas:rc1:verify` | 0 | acceptance-bindings.log |
| acceptance-gate | `npm run oas:rc1:require-acceptance` | 0 | acceptance-gate.log |
| scope-schema | `npm run oas:closure:validate` | 0 | scope-schema.log |
| governance-schema | `npm run oas:governance:validate` | 0 | governance-schema.log |
| catalog-schema | `npm run oas:validate` | 0 | catalog-schema.log |
| first-release-schema | `npm run oas:first:validate` | 0 | first-release-schema.log |
| scope-reproduction | `npm run oas:closure:check` | 0 | scope-reproduction.log |
| governance-reproduction | `npm run oas:governance:check` | 0 | governance-reproduction.log |
| catalog-reproduction | `npm run oas:check` | 0 | catalog-reproduction.log |
| first-release-reproduction | `npm run oas:first:check` | 0 | first-release-reproduction.log |
| rc1-typecheck | `npm run oas:rc1:typecheck` | 0 | rc1-typecheck.log |
| closure-typecheck | `npm run oas:closure:typecheck` | 0 | closure-typecheck.log |
| governance-typecheck | `npm run oas:governance:typecheck` | 0 | governance-typecheck.log |
| catalog-typecheck | `npm run oas:typecheck` | 0 | catalog-typecheck.log |
| first-release-typecheck | `npm run oas:first:typecheck` | 0 | first-release-typecheck.log |
| independent-checksums | `python3 scripts/verify-oas-rc1-checksums.py` | 0 | independent-checksums.log |
| architecture-registry | `npm run check:registry` | 0 | architecture-registry.log |
| architecture-proposal | `npm run check:proposal` | 0 | architecture-proposal.log |
| architecture-truth | `npm run check:truth` | 0 | architecture-truth.log |
| manifest-validation | `npm run manifests:validate` | 0 | manifest-validation.log |
| ui-contracts | `npm run ui:validate` | 0 | ui-contracts.log |
| reporting-tests | `node --import tsx --test apps/shs-api/tests/report-u2-studio-oas.test.ts` | 0 | reporting-tests.log |
| oas-build | `npm run oas:build` | 0 | oas-build.log |
| full-build | `npm run build` | 0 | full-build.log |
| read-only-immutability-and-determinism-probe | `node /private/tmp/oas-final-review-probes.mjs` | 0 | IMMUTABILITY_PROBE.json |
| independent-governance-provenance | `python3 /private/tmp/oas-complete-final-review.py` (governance-provenance subcheck) | 0 | REVIEW_PROVENANCE.json |
| unchanged-outside-review-evidence | `git diff --exit-code 1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8 -- . :(exclude)evidence/oas-rc1-final-validation` | 0 | REVIEW_PROVENANCE.json |

Coverage and limits:

- RC1 acceptance/release suite: 16 tests; scope closure: 17; governance review: 12; canonical catalog: 15; first-release source: 20. These retain their existing historical and negative assertions. Green historical-source tests do not create final adoption.
- Reporting compatibility: 5 tests, including actual Chrome PDF rendering through the existing shared renderer. This is not a Registry ingestion or ATB assessment test.
- Strict schema validation and five TypeScript configurations passed, including the explicit issuer check. JS semantic validation and the independent standard-library Python checksum implementation agree.
- Deterministic RC generation was evaluated in memory and compared to issued bytes. No issuer/generate write command was run. Raw whitespace mutation existed only as a memory string.
- Both focused OAS and full application builds passed. Full build retains the existing non-blocking chunk-size warning; full log retained. No source was changed to suppress it.
- Chrome launch and Vite shared node_modules cache writes ran outside the sandbox under explicit tool approval. Other checks ran in the workspace sandbox. Logs and receipts were written only here.
- Raw-file checksum comparison is mandatory alongside parsed-object validation (F-01). Final-target schema/generation/output are not present and were not falsely reported as validated (F-02).
- Whitespace and evidence-only changed-surface checks are completed after writing review evidence, with final receipts in validation-results.json.

Review outcome: RC1 validation passes. Final-adoption readiness remains WITH CONDITIONS because exact final-target preparation, a new human decision and later publication/recovery authorization are still required. No final OAS 1.0 is created/adopted; RC2 is not required by this review.
