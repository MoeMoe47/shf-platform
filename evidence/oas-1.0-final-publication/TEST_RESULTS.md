# Final publication validation results

All 45 selected stage-appropriate commands passed. **109 distinct tests passed, zero final failures/skips**: original checkpoint tests 95, final publication tests 9, reporting tests 5. Unchanged original tests: final preparation 9, adoption 6, RC1 acceptance/release 16, scope closure 17, governance review 12, catalog 15, first release 20.

Fresh execution contexts are explicit in validation-results.json. The historical suites and pre-publication generators/verifiers run from exact detached adoption commit 164798c8a684e4c3605fc89492918ca00552e70b; their source and assertions are unmodified. They truthfully require no final publication at that stage. The current publication worktree separately validates every pre-existing OAS file against that checkpoint and verifies the new explicit authorization, published artifact, lock, generated human view and currentness. This prevents a checkpoint pass from hiding current historical drift.

The initial prepublication-red-reproduction.log shows authorization tests green while final-artifact tests fail because no final file exists, before the authorized publisher ran. Diagnostic direct runs against the later published worktree (diagnostic-live-results.json and diagnostic-live-*.log) fail only stage-specific no-final directory assertions (four assertions across three suite commands). Those are retained, investigated and run unchanged at their actual immutable stage; they are not weakened, deleted or relabeled as current-state passes. CI selects the correct contexts and adds mandatory current publication/freeze checks. All other direct current-state diagnostic commands passed. Live probe output is supplemental; the complete final checkpoint logs are the selected original-suite evidence.

The nine final publication tests cover real separate authority bindings; rejection of rehashed identity/time/content/membership/approval mutations; independent literal full-file/payload/requirement hashes; whitespace and normative/domain/member/declaration drift; lock/currentness mutation; historical-role separation; no Registry integration/assessment; final pinned attributable scoped NOT_EVALUATED declarations rejecting overclaims; and idempotent publication preserving every byte and original publication time. No real provider declaration is created.

All original schemas and bound digests remain unchanged and valid. The strict new publication-authorization schema and existing adopted final-artifact/requirement/release/declaration schemas validate. Eight TypeScript configurations passed (seven original plus publication). Independent standard-library Python checks raw bytes, original source, real immutable decision references, dates, all fourteen IDs/eight domains, content/schema/source hashes, declaration pin/profiles, currentness, historical snapshots and untouched protected systems. OAS CI YAML parses and the added script entry points resolve.

Focused OAS and full builds pass, including actual Chrome PDF reporting. The full build retains its existing non-blocking chunk-size warnings. Runtime commands required approved outside-sandbox access for Chrome and the shared Vite cache; no hosting deployment occurred. Remote GitHub CI execution is not claimed. Whitespace/protected-surface results are recorded alongside this report.

| Check | Command | Context | Exit | Log |
| --- | --- | --- | --- | --- |
| adoption-tests | `node --test tests/oasFinalAdoption.test.mjs` | immutable adoption checkpoint | 0 | adoption-tests.log |
| adoption-record | `node scripts/oas-final-adoption.mjs verify` | immutable adoption checkpoint | 0 | adoption-record.log |
| adoption-typecheck | `./node_modules/.bin/tsc -p tests/oas-final-adoption.tsconfig.json` | immutable adoption checkpoint | 0 | adoption-typecheck.log |
| adoption-independent-checksums | `python3 scripts/verify-oas-final-adoption.py` | immutable adoption checkpoint | 0 | adoption-independent-checksums.log |
| final-preparation-tests | `npm run oas:final:test` | immutable adoption checkpoint | 0 | final-preparation-tests.log |
| final-preparation-check | `npm run oas:final:check` | immutable adoption checkpoint | 0 | final-preparation-check.log |
| dated-adoptable-target | `npm run oas:final:require-adoptable-target` | immutable adoption checkpoint | 0 | dated-adoptable-target.log |
| final-preparation-typecheck | `npm run oas:final:typecheck` | immutable adoption checkpoint | 0 | final-preparation-typecheck.log |
| final-independent-checksums | `python3 scripts/verify-oas-final-preparation.py` | immutable adoption checkpoint | 0 | final-independent-checksums.log |
| rc1-tests | `npm run oas:rc1:test` | immutable adoption checkpoint | 0 | rc1-tests.log |
| scope-closure-tests | `npm run oas:closure:test` | immutable adoption checkpoint | 0 | scope-closure-tests.log |
| governance-review-tests | `npm run oas:governance:test` | immutable adoption checkpoint | 0 | governance-review-tests.log |
| canonical-catalog-tests | `npm run oas:test` | immutable adoption checkpoint | 0 | canonical-catalog-tests.log |
| first-release-tests | `npm run oas:first:test` | immutable adoption checkpoint | 0 | first-release-tests.log |
| rc1-release-check | `npm run oas:rc1:check` | immutable adoption checkpoint | 0 | rc1-release-check.log |
| acceptance-check | `npm run oas:rc1:acceptance:check` | immutable adoption checkpoint | 0 | acceptance-check.log |
| acceptance-bindings | `npm run oas:rc1:verify` | immutable adoption checkpoint | 0 | acceptance-bindings.log |
| acceptance-gate | `npm run oas:rc1:require-acceptance` | immutable adoption checkpoint | 0 | acceptance-gate.log |
| scope-schema | `npm run oas:closure:validate` | immutable adoption checkpoint | 0 | scope-schema.log |
| governance-schema | `npm run oas:governance:validate` | immutable adoption checkpoint | 0 | governance-schema.log |
| catalog-schema | `npm run oas:validate` | immutable adoption checkpoint | 0 | catalog-schema.log |
| first-release-schema | `npm run oas:first:validate` | immutable adoption checkpoint | 0 | first-release-schema.log |
| scope-reproduction | `npm run oas:closure:check` | immutable adoption checkpoint | 0 | scope-reproduction.log |
| governance-reproduction | `npm run oas:governance:check` | immutable adoption checkpoint | 0 | governance-reproduction.log |
| catalog-reproduction | `npm run oas:check` | immutable adoption checkpoint | 0 | catalog-reproduction.log |
| first-release-reproduction | `npm run oas:first:check` | immutable adoption checkpoint | 0 | first-release-reproduction.log |
| rc1-typecheck | `npm run oas:rc1:typecheck` | immutable adoption checkpoint | 0 | rc1-typecheck.log |
| closure-typecheck | `npm run oas:closure:typecheck` | immutable adoption checkpoint | 0 | closure-typecheck.log |
| governance-typecheck | `npm run oas:governance:typecheck` | immutable adoption checkpoint | 0 | governance-typecheck.log |
| catalog-typecheck | `npm run oas:typecheck` | immutable adoption checkpoint | 0 | catalog-typecheck.log |
| first-release-typecheck | `npm run oas:first:typecheck` | immutable adoption checkpoint | 0 | first-release-typecheck.log |
| independent-checksums | `python3 scripts/verify-oas-rc1-checksums.py` | immutable adoption checkpoint | 0 | independent-checksums.log |
| architecture-registry | `npm run check:registry` | immutable adoption checkpoint | 0 | architecture-registry.log |
| architecture-proposal | `npm run check:proposal` | immutable adoption checkpoint | 0 | architecture-proposal.log |
| architecture-truth | `npm run check:truth` | immutable adoption checkpoint | 0 | architecture-truth.log |
| manifest-validation | `npm run manifests:validate` | immutable adoption checkpoint | 0 | manifest-validation.log |
| ui-contracts | `npm run ui:validate` | immutable adoption checkpoint | 0 | ui-contracts.log |
| final-publication-tests | `npm run oas:publication:test` | current published worktree | 0 | publication-final-tests.log |
| final-publication-check | `node scripts/oas-final-publication.mjs check` | current published worktree | 0 | post-final-publication-check.log |
| publication-authorization | `node scripts/oas-final-publication.mjs verify-authorization` | current published worktree | 0 | post-publication-authorization.log |
| publication-typecheck | `./node_modules/.bin/tsc -p tests/oas-final-publication.tsconfig.json` | current published worktree | 0 | post-publication-typecheck.log |
| publication-independent | `python3 scripts/verify-oas-final-publication.py` | current published worktree | 0 | post-publication-independent.log |
| reporting-tests | `node --import tsx --test apps/shs-api/tests/report-u2-studio-oas.test.ts` | current published worktree | 0 | reporting-tests.log |
| oas-build | `npm run oas:build` | current published worktree | 0 | oas-build.log |
| full-build | `npm run build` | current published worktree | 0 | full-build.log |
