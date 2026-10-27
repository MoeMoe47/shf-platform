# Final release freeze

Final OAS-1@1.0.0 is ADOPTED, separately AUTHORIZED, PUBLISHED in the canonical repository catalog and FROZEN. This is repository publication/branch delivery; no external hosting deployment, merge or Autonomous Registry integration is performed.

The final artifact must reproduce the literal adopted complete-file checksum. Full-file comparison detects re-encoding and whitespace-only changes as well as payload mutation. The guard verifies the exact 14 member IDs, every normative text and domain against original adopted source, all eight domains, contract 1.1.0, empty profiles and NOT_EVALUATED.

Canonical lock: standards/oas/governance/final-1.0.0/publication-lock.json. It pins artifact/payload/content/domain/scope/source, authorization/adoption/publication records, public human view, currentness and historical raw hashes. Once committed, the original first-addition commit also anchors these published files. Re-running publish verifies and preserves all original bytes and publication time; it never overwrites. An incomplete prior publication fails closed for explicit recovery.

CI runs npm run oas:publication:check, :test, :typecheck and :verify. Negative tests reject byte, normative, membership, domain, declaration, profiles, currentness, authorization and lock mutation, including rehashed records. Historical suites retain every original assertion at their actual stage. No ordinary writable Git repository makes malicious authorized code changes impossible; these are reproducible integrity/CI guards, not a tamper-proof external signature.

Later material standards changes require a later version and new human governance. Correction/withdrawal must retain old bytes and add an explicit status decision. Later currentness migration must be explicit; this release must not be silently mutated or deleted.
