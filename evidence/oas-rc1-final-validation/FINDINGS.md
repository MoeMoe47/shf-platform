# Findings and dispositions

Review target: `1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8`. Accepted content source: `517cc23426e7485c352a1672c8fe4614291d552a`. Review branch: `review/oas-1.0.0-rc.1-final-validation`.

This is a fresh Codex repository review, not a human adoption decision, implementation certification or external standards consensus. RC1 is immutable; no issued source, schema, membership or artifact is edited.

No material defect was found in the issued RC1 artifact, the 14 normative requirements, domain coverage, declaration 1.1.0 contract or repository-level RC authorization. **RC2 is not required by this review.** Engineering observations and outstanding final-stage gates remain explicit below.

## F-01 — object check alone does not enforce exact file encoding

Severity: medium operational risk when a consumer runs only the object check; non-blocking for this RC validation because the existing independent raw-file verifier was also run and passed. Confidence: high; reproduced in memory without changing a file. Location: scripts/oas-rc1-release.mjs:63–70 and checkRelease at 103–107.

publicationLock computes artifact_file_checksum from serialize(rc), and checkRelease parses the file before validating. A whitespace-only re-encoding has different raw bytes but the same parsed object; validateIssuedRc accepts that object. The issuer's assertImmutable raw-string check rejects changed bytes, and scripts/verify-oas-rc1-checksums.py compares the actual file bytes to the issued checksum and rejects them. IMMUTABILITY_PROBE.json records this distinction.

Consequence: npm run oas:rc1:check alone is insufficient evidence of exact issued file bytes. Required operator disposition: always run the independent file-checksum verifier plus compare against the issuance commit; this review does both. Smallest maintenance direction: make the checker compare readFileSync bytes directly with artifact_file_checksum and the issued reference, retaining semantic checks. No production fix or assertion change was made in this review. This can be repaired without changing RC1 or its accepted source, so it does not require RC2.

Reproduction sketch (in memory): append an LF to the issued byte string; its SHA-256 differs from lock.artifact_file_checksum; assertImmutable(mutated, issued) throws; validateIssuedRc(JSON.parse(mutated), lock) succeeds. No mutation is written to the repository.

## F-02 — final-target adoption/publication has not been demonstrated

Classification: outstanding final-adoption readiness gates, not an RC1 requirement defect. Confidence: high from the absence of a final target/decision and the explicit validation-only authorization.

The current issuer is hard-coded to RC1, the RC schema admits only release_candidate with effective_date=null, and the existing historical catalog generator preserves public-review.1. Existing root release/requirement schemas can describe adopted metadata, but no reviewed final-target package, release/effective dates, complete final binding/deterministic publication proof or new human final-adoption decision is supplied. The already-issued FINAL_ADOPTION_GATES.md requires a new decision for exact final bytes and dates, then separate authorized publication/recovery details.

Do not infer a final artifact or final generator from an RC test pass. A separately authorized final preparation step must bind the exact final source/content and release metadata and demonstrate its schema/consumer mapping and deterministic checksums before an unconditional adoption decision executes. Publication remains a subsequent separately authorized operation. Do not create or adopt final 1.0.0 in this review.

## F-03 — historical prose retains historical present-tense status

Severity: low; non-blocking, confidence high. Bound preparation documents and old review snapshots say no acceptance/RC exists; the actual later designation, acceptance and issuance are explicit separate records. New review evidence must explain chronology, not rewrite RC1-bound bytes. Future release documentation should link historical and current records clearly without changing the historical artifacts.

## Post-1.0 scope observations

The seven requirement notes are informative guidance opportunities. Deferred 0011/0013/0015, sector/runtime assurance, evidence authenticity/retention and real profiles require later scoped governance; none blocks the accepted descriptive baseline. Full Vite build chunk-size warnings are implementation housekeeping, not normative defects or grounds to mutate RC1.
