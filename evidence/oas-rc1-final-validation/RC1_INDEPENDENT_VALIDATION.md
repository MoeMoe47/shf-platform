# RC1 independent post-issuance validation

Review target: `1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8`. Accepted content source: `517cc23426e7485c352a1672c8fe4614291d552a`. Review branch: `review/oas-1.0.0-rc.1-final-validation`.

This is a fresh Codex repository review, not a human adoption decision, implementation certification or external standards consensus. RC1 is immutable; no issued source, schema, membership or artifact is edited.

Verdict: **RC1 VALIDATED WITH CONDITIONS — FINAL ADOPTION NOT YET READY**. The issued candidate is intact, all 14 requirements form a coherent bounded baseline, no blocking RC1 content defect was found and RC2 is not required by this review. Exact final-target preparation and a new human adoption decision remain outstanding; no final OAS-1@1.0.0 is created or adopted.

## Immutable release proof

| Assertion | Independently checked result |
| --- | --- |
| Artifact | public/oas/catalogs/OAS-1@1.0.0-rc.1.json exists and exactly equals its bytes at the issuance commit |
| Release and source | OAS-1@1.0.0-rc.1; source_revision=517cc23426e7485c352a1672c8fe4614291d552a; status=release_candidate; effective_date=null |
| Membership | Exactly 14 unique, ordered approved IDs; no currently HOLD/deferred/rejected/unknown member |
| Domain coverage | OAS-1-D01 through D08; counts 2/3/2/2/1/1/1/2 |
| Full-file checksum | sha256:e18e8196dc38fdd3a835c5b098f00188c2ad8ad3bc0d0f49f520add1191b8fe5 |
| Payload checksum | sha256:4b73ab577c41ea790aa199ff695947110b5f6e90e5c3342825a28b888c96c7ae |
| Source-manifest checksum | sha256:3cbeb337efa5a8509c99013a73a037a7c7e111d38b61659a67a5a487a76510a4 |
| Requirements checksum | sha256:ac3e5aa8086552547b8b36c38c2826733585b9458f53584aa2ba0550643a1929 |
| Scope checksum | sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4 |
| Acceptance record checksum | sha256:936a4afab1589ecf899a75056cd66e5770e6ed0c59bd7b97da93a75690386cb2 |
| Historical public-review | Exact bytes at the issuance and original prepared checkpoints; independent original checksum verified |
| Final artifact | Absent; public catalog directory contains only public-review.1 and RC1 |
| Deterministic reproduction | Repeated generateRc() calls in memory equal the issued object/serialized bytes; no issue/generate write command is run |
| Byte mutation detection | Appended-LF variant exists only in memory; full-file hash differs and raw issuer immutability guard rejects it |

Full source/request/contract/supporting-file checks are independently verified by the standard-library Python checker, not only the JS emitter. Committed designation/acceptance references resolve to exact on-disk evidence. IMMUTABILITY_PROBE.json records the read-only mutation/determinism probe.

## Review findings and limits

- Requirement review: 7 READY FOR FINAL ADOPTION; 7 READY WITH NON-BLOCKING NOTE; 0 BLOCKING DEFECT. The 11 requested criteria are explicit for every ID in REQUIREMENT_REVIEW_MATRIX.md and REQUIREMENT_REVIEW_TRACE.json.
- F-01: object validation canonicalizes JSON, so npm run oas:rc1:check alone cannot prove raw byte equality. The raw issuer guard and existing independent checksum verifier do detect re-encoding. This review invokes both independent hashing and issuance-commit byte comparison. Keep them mandatory; a future tooling-only hardening does not require changing RC1 or issuing RC2.
- F-02: final-target dates/metadata/source/checksum bindings and deterministic final publication representation are not prepared/validated here. Existing issuer and closure schema are RC-specific. A future final package must be independently reviewed before an unconditional final adoption decision, followed by separately authorized publication/recovery. RC1 validation is not proof of that future output.
- Historical current-state wording is preserved as historical evidence, not silently rewritten or mistaken for final adoption.

The review is evidence for a human decision, not the decision itself or an external independent standards body's approval. It establishes repository-level attribution and software/content integrity, not legal title, cryptographic human authentication, runtime compliance, certification, Registry endorsement or ATB assessment.

Fresh command receipts, actual test counts, builds and environment are in TEST_RESULTS.md and validation-results.json. Original RC1 evidence, source, tests, schemas, request/bindings and Autonomous Registry remain unchanged. Full changed-file list and handoff accompany this review.
