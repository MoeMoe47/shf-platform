# Scope closure test and validation results

Final checks run after committing source revision 517cc23426e7485c352a1672c8fe4614291d552a. The source proof verifies every current content input against that full Git commit; generated evidence is committed separately to avoid a self-referential checksum/revision. validation-results.json and individual logs capture commands and exit codes.

| Check | Result |
| --- | --- |
| oas:closure:test | 17 passed, 0 failed, 0 skipped |
| oas:governance:test | 12 passed, 0 failed, 0 skipped |
| oas:first:test | 20 passed, 0 failed, 0 skipped |
| oas:test | 15 passed, 0 failed, 0 skipped |
| Existing report-u2-studio-oas.test.ts | 5 passed, including headless Chrome hashed Letter PDF |
| Closure/review/first-release/catalog schemas | Six new strict Draft 2020-12 closure schemas and all existing schemas compile and validate |
| All four generation/check commands | Pass; terminal mapping, effective scope catalog, human views, historical reviews and published draft reproduce |
| Independent Python hashlib / git show | Current input/source commit, scope/acceptance/requirements digests and unchanged historical draft/Git input checksums verified |
| Four type checks | Closure, governance, first-release tooling and existing OAS page/adapter checks pass |
| Focused/full builds | All five OAS HTML entries and full applicable MPA build pass; existing import/chunk warnings retained |
| Architecture checks | Registry/layer, proposal and Truth Spine checks pass (57 layer rows) |
| Manifests/UI contracts | Pass, 17 manifests and 1 UI contract |
| Whitespace | Working/staged checks pass; captured build log trailing whitespace normalized |

Total: 69 tests passed with no skips. New tests cover all blocking-question dispositions, final revised/HOLD decisions, exact approved membership, unchanged IDs/normative text, eight-domain concept coverage, terminal mapping/quarantine rejection, pinned declarations with explicit applicability/evidence and NOT_EVALUATED, RC contract membership/digest constraints, absent real acceptance, committed source pinning, no placeholder RC/final release, historical draft preservation and deterministic projections.

Existing assertions were not weakened. One historical mapping-document assertion now reads the exact archived preimage and compares it to its original Git bytes, while new tests independently validate the updated current canonical projection and every quarantined label. The old generator targets that archive, and its existing generated-view checks continue to pass. No normative authoring record or published draft/schema is rewritten to force green tests.

Before source commit, the source-revision gate correctly failed; after source commit the proof passes. Initial strict-schema composition error was corrected without suppressing Ajv strict mode. Acceptance syntax/digests cannot authenticate a maintainer; the operator must independently check the real authority/decision evidence. Synthetic declaration/RC fixtures exist only in tests and do not issue a release.

The final readiness matrix is 13 PASS / 2 FAIL. Both failed gates derive from the same missing real founding acceptance (Q10). A passing technical suite does not fabricate that acceptance. No Registry files, runtime reporting logic, production UI, database, authentication, conformance scoring, certification or deployment were changed. Remote CI success is not asserted.
