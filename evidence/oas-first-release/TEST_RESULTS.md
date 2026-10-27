# First-release test and validation results

Final validation against the integrated review branch; baseline 35d2bdfd3d8014658789430c2288d20418bc7dcb. Commands, logs and exit codes are recorded in validation-results.json.

| Check | Result |
| --- | --- |
| npm run oas:first:test | 20 passed, 0 failed, 0 skipped |
| npm run oas:test | Existing 15 passed, 0 failed, 0 skipped |
| Existing report-u2-studio-oas.test.ts | 5 passed, including headless Chrome hashed Letter PDF |
| npm run oas:first:validate | Four new strict Draft 2020-12 review schemas and semantic/source validation pass |
| npm run oas:validate | All eight existing catalog schemas and semantic validation pass |
| npm run oas:first:check | Generated human views, per-domain sheets, metadata, issues and changelog match source |
| npm run oas:check | Historical source/Git revision reproduces public-review.1 byte-for-byte |
| Independent Python hashlib | Review source/all 17 statement checksums and historical artifact/manifest/Git file digests reproduce |
| npm run oas:typecheck | Pass, existing affected OAS page/adapter scope |
| npm run oas:first:typecheck | Pass, new review validator/generator and imported catalog code |
| npm run oas:build | Pass, all five existing OAS HTML entries |
| npm run build | Pass, complete applicable MPA build; existing lesson import and large-chunk warnings |
| check:registry / check:proposal / check:truth | Pass; 57 layer rows and unchanged authority/Truth Spine contracts |
| manifests:validate / ui:validate | Pass, 17 manifests and 1 UI contract |
| git diff --check | Pass; staged whitespace also checked before commit |

New tests cover ID uniqueness, normalized duplicate statements, exact canonical domains, complete text/applicability/source citations, absent review/release authority, statement-bound decisions, all five declaration states, evidence/reason requirements, stale/unknown references, deterministic namespaced aliases, unresolved alias rejection, supersession integrity/cycles, valid released catalog membership/governance/effective-date guard, deterministic generated views, digests and exact historical-source/artifact preservation. Synthetic approved/adopted fixtures are test-only and never published catalog facts.

Initial new typecheck configuration used NodeNext, which did not match this repository's Ajv CommonJS typing resolution. It was corrected to the existing Bundler/ESNext convention without production-code changes or suppressed diagnostics. Sandbox restrictions initially blocked Vite's shared config cache and Chrome/PDF launch; approved reruns pass. The global keyword scan uses POSIX word boundaries supported by local git grep; audit totals reflect the corrected full-corpus scan. Final tests contain no skips and existing assertions were not weakened. Trailing whitespace in saved Vite reporter output is normalized for repository whitespace checks.

No OAS public page, existing report implementation, published catalog input/schema/generator/artifact, Registry file, database, authentication or deployment was changed. Human normative proposals are repository documentation generated from the canonical authoring source; no visual redesign or browser screenshot comparison is claimed. The review tool validates structure, evidence references and recorded data, not authenticity of an approver, truth of provider evidence, runtime effectiveness, conformance or certification. Local validation does not claim remote CI success or governance approval.
