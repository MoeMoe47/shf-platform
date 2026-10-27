# RC1 acceptance-package validation

Real acceptance is missing; this phase validates the exact prepared bindings and the safe maintainer-action package. It does not claim validation of an issued RC. Commands/exit codes are recorded in validation-results.json with captured logs.

| Check | Result |
| --- | --- |
| oas:rc1:test | 9 passed, 0 failed, 0 skipped |
| oas:closure:test | Existing 17 passed |
| oas:governance:test | Existing 12 passed |
| oas:first:test | Existing 20 passed |
| oas:test | Existing 15 passed |
| Existing report-u2-studio-oas.test.ts | 5 passed, including headless Chrome hashed Letter PDF |
| oas:rc1:verify / acceptance:check | Exact unchanged checkpoint bindings, pinned source/artifacts and deterministic package pass |
| All existing schema checks | Pass; no bound schema was edited |
| Five type checks | New acceptance tool plus closure/governance/first-release/OAS checks pass |
| Existing generation checks | Catalog, first-release, governance and scope closure reproduce |
| Independent Python hashlib | Request, expected-file/source/supporting/contract digests, pending record and public-review history verified |
| Focused/full build | Five OAS HTML entries and full applicable MPA pass; existing import/chunk warnings retained |
| Architecture/manifests/UI | Pass; 57 layer rows, 17 manifests, 1 UI contract |
| Whitespace | Working/staged checks pass; captured Vite trailing whitespace normalized |

Total: 78 tests passed with no skips. New tests exercise exact 14-member scope, excluded deferred IDs, eight domains, no profiles, no stale/rebound expected bindings, synthetic structural acceptance versus real authority/consent, pending real record, rejection of blanks/invalid dates/final adoption, deterministic request/statement/views and no issued/final artifact. Synthetic fixture records remain in-memory test data and never become a governance decision.

No existing assertions were weakened or changed. Prepared source/scope/contracts and EXPECTED_ACCEPTANCE_BINDINGS.json remain byte-for-byte unchanged. The new verifier caches only immutable Git reads while rechecking current filesystem bytes and digests on every verification; it does not cache mutable consent or authority facts. Software structure/hash validation does not authenticate a maintainer or establish that they accepted anything.

The canonical record remains AWAITING_REAL_MAINTAINER_ACCEPTANCE. No actor, designation evidence, real acceptance statement/time/reference or authorization is fabricated. No RC metadata/publication/membership freeze or final 1.0.0 exists. Actual RC artifact validation and RC-level Registry testing are therefore blocked. Registry files, runtime reporting, UI, database, authentication and certification logic are untouched. No merge/deployment occurred and remote CI success is not asserted.
