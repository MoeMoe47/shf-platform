# Content and frozen-artifact integrity

The authoritative release is complete; website incompleteness must not reopen it. Exact frozen publication commit: 9fc98273119dd1ccb43078b56abb1de02071214f. Verified in an isolated temporary sparse clone with installed existing tooling, never restored into the audited working tree.

- OAS-1@1.0.0: released/published; release and effective date 2026-10-27.
- Catalog raw checksum: sha256:9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e.
- Requirements: sha256:37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d.
- Scope: sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4.
- Exactly 14 requirements, canonical IDs 0001–0010, 0012, 0014, 0016, 0017, across D01–D08. No profiles. Declaration contract 1.1.0; NOT_EVALUATED.
- Final Python publication verifier passes raw/payload/content hashes, source/schema pins, explicit authorization provenance, immutable history/currentness and authority separation.

Current checkout HEAD efe541e... predates publication; it lacks public/oas and dedicated release tooling. Live /oas/catalogs/OAS-1@1.0.0.json, human Markdown and currentness return HTML fallback, not standards bytes. The website continues Working Draft/Public Review branding in metadata, quick facts, shared footer and cover art. This is a source/deployment/content integration P0. A decision about the correct website source baseline is required; do not merge/reset a dirty tree or copy a different standard silently.

The eight public domain labels/order match the frozen domain mapping, but they are manually duplicated and do not expose canonical IDs. No website section presents the exact fourteen requirements or 1.1.0 declaration contract. The final scope is a version-scoped description/declaration baseline. Risk is informative only; site claims of a complete control model, ensuring safe agents and mandatory risk-dependent controls need qualification against the frozen text. No positive OAS certification, Registry certification or ATB endorsement result is produced, but the scope language can overpromise runtime safety/verification. OAS must not become an execution authority.

Actual frozen artifacts and publication Git objects were untouched. Fingerprints and before/after source checks are in PRESERVATION.json. Current source verification cannot be claimed as a pass for absent files: the passing final check explicitly belongs to the immutable publication snapshot. See release-verification.json and TEST_COVERAGE.md for contexts.
