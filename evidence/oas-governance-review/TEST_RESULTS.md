# Governance review test and validation results

Fresh checks against this integrated branch; reviewed checkpoint 47b12e3066ca6d83650eed62ae780ce03bf8e6e7. Detailed commands, exit codes and captured output are recorded in validation-results.json and individual logs. No existing assertion was weakened.

| Check | Result |
| --- | --- |
| oas:governance:test | 12 passed, 0 failed, 0 skipped |
| oas:first:test | Existing 20 passed, 0 failed, 0 skipped |
| oas:test | Existing 15 passed, 0 failed, 0 skipped |
| report-u2-studio-oas.test.ts | Existing 5 passed, including headless Chrome hashed Letter PDF |
| oas:governance:validate | New strict Draft 2020-12 review-ledger schema and semantic checks pass |
| oas:first:validate / oas:validate | Existing review/catalog schemas, references and normative source citations pass |
| oas:governance:check | Generated matrix, details, revisions, question/mapping dispositions, scope, gate/readiness reports, changelog/decision record and manifest reproduce |
| oas:first:check | Revised authoring views and per-domain sheets reproduce |
| oas:check | Historical public-review.1 remains byte-for-byte reproducible from Git |
| Independent Python hashlib | Review/input/authoring/decision/17 before-after record digests and historical artifact/manifest/Git digests pass |
| oas:governance:typecheck / oas:first:typecheck / oas:typecheck | All pass |
| oas:build / build | Focused five-page OAS and full applicable MPA build pass |
| check:registry / check:proposal / check:truth | Pass; 57 layer rows and unchanged Truth Spine boundaries |
| manifests:validate / ui:validate | Pass; 17 manifests and 1 UI contract |
| Whitespace | Working and staged diff checks pass; saved Vite reporter trailing whitespace normalized |

Tests exercise one disposition per candidate, complete reviewed metadata, unchanged/non-reused IDs, exact recorded editorial deltas, deterministic consideration membership, exclusion of HOLD/REJECT/revision-pending/unknown IDs, duplicate membership rejection, question disposition/source consistency, seven mapping holds, invalid alias rejection, absent institutional authorization, no released status/1.0.0/RC artifact, null RC source/checksum, deterministic review digests and exact historical-source preservation. Synthetic negative cases are tests, not governance decisions.

Final source review distinguished the Q03 label clarification from its unresolved multiple-party/identifier policy questions; Q03 is DEFERRED, not RESOLVED, and every canonical question remains open. The final tests and generated views verify that corrected state.

The applicable builds retain existing lesson-import and large-chunk warnings. Build/cache and Chrome execution use approved environment permissions; no deployment occurred. Remote CI execution is not asserted. No OAS public UI/report implementation, published catalog input/schema/generator/artifact, Registry file, database, authentication or certification logic changed. The original first-release tests remain unchanged and pass despite the explicitly recorded authoring revisions.

A green suite validates repository data and boundaries; it does not appoint an OAS authority, verify a human identity, adopt a release, evaluate a provider or authorize publication. All release gates and no-issuance findings remain explicit in RELEASE_GATE_STATUS.md. Review-source digests are never reported as an RC checksum.
