# RC1 test and validation results

Acceptance recorded; RC1 issued for validation only. Final adoption: NOT ADOPTED.

80 OAS tests and 5 reporting compatibility tests passed. All 15 readiness gates pass. All validation commands below exited 0. The final acceptance/issuance suite was rerun after provenance/CLI fixes; the issuer is explicitly included in the RC1 TypeScript configuration.

| Check | Command | Result |
| --- | --- | --- |
| acceptance-tests | `npm run oas:rc1:test` | PASS |
| closure-tests | `npm run oas:closure:test` | PASS |
| governance-tests | `npm run oas:governance:test` | PASS |
| first-release-tests | `npm run oas:first:test` | PASS |
| catalog-tests | `npm run oas:test` | PASS |
| reporting-tests | `node --import tsx --test apps/shs-api/tests/report-u2-studio-oas.test.ts` | PASS |
| acceptance-bindings | `npm run oas:rc1:verify` | PASS |
| acceptance-package | `npm run oas:rc1:acceptance:check` | PASS |
| require-acceptance | `npm run oas:rc1:require-acceptance` | PASS |
| rc1-publication | `npm run oas:rc1:check` | PASS |
| closure-schemas | `npm run oas:closure:validate` | PASS |
| governance-schemas | `npm run oas:governance:validate` | PASS |
| first-release-schemas | `npm run oas:first:validate` | PASS |
| catalog-schemas | `npm run oas:validate` | PASS |
| closure-reproduction | `npm run oas:closure:check` | PASS |
| governance-reproduction | `npm run oas:governance:check` | PASS |
| first-release-reproduction | `npm run oas:first:check` | PASS |
| catalog-reproduction | `npm run oas:check` | PASS |
| acceptance-typecheck | `npm run oas:rc1:typecheck` | PASS |
| closure-typecheck | `npm run oas:closure:typecheck` | PASS |
| governance-typecheck | `npm run oas:governance:typecheck` | PASS |
| first-release-typecheck | `npm run oas:first:typecheck` | PASS |
| oas-typecheck | `npm run oas:typecheck` | PASS |
| architecture-registry | `npm run check:registry` | PASS |
| architecture-proposal | `npm run check:proposal` | PASS |
| architecture-truth | `npm run check:truth` | PASS |
| manifests | `npm run manifests:validate` | PASS |
| ui-contracts | `npm run ui:validate` | PASS |
| independent-checksums | `python3 scripts/verify-oas-rc1-checksums.py` | PASS |
| whitespace | `git diff --check` | PASS |
| focused-build | `npm run oas:build` | PASS |
| full-build | `npm run build` | PASS |

Initial execution issues were investigated and retained in validation-results.json: Chrome PDF rendering required an authorized run outside the sandbox (5/5 passed); Vite required shared node_modules cache writes outside the sandbox (both builds passed); a circular CLI import was fixed and its check rerun; terminal-log trailing whitespace was normalized before the final whitespace check. No tests were skipped or weakened.

Full build has a non-blocking chunk-size warning. No UI, Registry or deployment change was made. Focused build covers every OAS entry point; full build covers the existing ecosystem entry points.

The scope-closure and governance-review checks reproduce their historical prepared views. Their null approvals and no-issuance statements remain historical facts; live acceptance, current readiness, immutable RC1 bytes and independent source/digest verification are checked separately. All accepted inputs, the original request/expected bindings and historical public-review.1 remain unchanged.

Rerun `npm run oas:rc1:check`, `npm run oas:rc1:test`, `npm run oas:closure:test`, `npm run oas:rc1:typecheck` and `python3 scripts/verify-oas-rc1-checksums.py` at the containing issuance commit. The issuer is pinned by that commit while the artifact source_revision identifies the separately accepted immutable content snapshot.
