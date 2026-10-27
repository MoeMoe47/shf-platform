# Test and validation results

All final checks completed against the integrated OAS worktree, source commit `0b2d996` and its generated public snapshot. See validation-results.json and individual logs for captured commands and exit codes.

| Check | Result |
| --- | --- |
| npm run oas:test | 15 passed, 0 failed, 0 skipped, including committed snapshot reproduction |
| npm run oas:validate | All 8 strict Draft 2020-12 schemas compile; source and semantic checks pass |
| npm run oas:check | Public snapshot matches generation from committed source bytes |
| Independent Python hashlib verification | Artifact, manifest and all Git-source file digests pass |
| npm run oas:typecheck | Pass; affected OAS pages and compatibility adapter |
| npm run oas:build | Pass; all 5 existing OAS HTML routes build |
| npm run build | Pass; full MPA built in 38.33 seconds; existing lesson static/dynamic import and large-chunk warnings |
| Existing report-u2-studio-oas.test.ts | 5 passed, 0 failed; includes headless Chrome hashed Letter PDF |
| check:registry | Pass, 57 official layer rows |
| check:proposal | Pass |
| check:truth | Pass |
| manifests:validate | Pass, 17 manifests |
| ui:validate | Pass, 1 contract |
| git diff --check | Pass |
| Repository commit hooks | Direct ledger and Registry guard pass |

Prepublication runs skipped the public artifact test until the source commit existed; the final suite has no skips. Initial Vite config-cache and Chrome/PDF sandbox restrictions were resolved by approved elevated validation; checks were rerun successfully. Initial newly introduced schema composition/type-inference errors were corrected and final checks pass. Existing tests were not weakened. The PDF test uses the existing renderer and makes no OAS evaluation decision.

No visual redesign, live server mutation, production deploy, Registry consumption, API/database migration, authentication or trust scoring changes were made. Source review confirms identical domain names/order and preserved presentation descriptions, markup/routes and unavailable specification actions. Visual screenshots were not required for this data/adapter change; no claim of pixel-level browser comparison is made. The normal build configuration is unchanged; a separate focused OAS build config was added. Two optional parameter defaults formalize existing OAS component behavior for type checking.

The remaining blocker is standards content/authority: the normative specification and individually authored requirements are absent, and profiles have not been defined. Successful machine validation does not adopt a standard or certify conformance. CI workflow is added but remote CI execution is not claimed by local results.
