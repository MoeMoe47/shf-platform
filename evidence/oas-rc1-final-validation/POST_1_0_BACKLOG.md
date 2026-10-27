# Non-blocking post-1.0 backlog

Review target: `1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8`. Accepted content source: `517cc23426e7485c352a1672c8fe4614291d552a`. Review branch: `review/oas-1.0.0-rc.1-final-validation`.

This is a fresh Codex repository review, not a human adoption decision, implementation certification or external standards consensus. RC1 is immutable; no issued source, schema, membership or artifact is edited.

These items do not become extra normative 1.0 obligations by appearing here. Priorities are review recommendations, not approved new scope. Final-target preparation, explicit adoption and publication/recovery authorization are mandatory next-stage gates in FINAL_ADOPTION_GATES.md, not backlog items to waive.

| Item | Proposed work | Owner/boundary | Why non-blocking |
| --- | --- | --- | --- |
| B-01 | Informative hosted/composite origin and dynamic capability/dependency manifest examples | OAS guidance; no mandatory vendor format | Existing version-identification and inventory obligations are inspectable |
| B-02 | Human intervention examples showing disjunctive oversight/override/stop claims | OAS guidance; operators retain control authority | Existing 0012 and accepted clarification already delimit the obligation |
| B-03 | Plans versus executed results examples; provider lifecycle vocabulary examples | OAS interoperability guidance | Current declaration stays NOT_EVALUATED and lifecycle is provider-defined |
| B-04 | Operational control efficacy (reserved 0011), escalation (0013), extended evidence model (0015) | New OAS scope/governance; ATB/operational authority kept separate | Explicitly excluded from descriptive first baseline; IDs remain reserved |
| B-05 | Real profiles only after concrete system-class/environment/subset use cases | OAS; approved IDs/versions/applicability and migration | Current common baseline needs no profile; null/empty is intentional |
| B-06 | Evidence authenticity/retention and identity assurance methods | Source authorities and separately authorized assessors | Reference resolution/documentation claims are deliberately not authentication or truth determination |
| B-07 | Actual bounded Registry ingestion/currentness/record projection tests | Registry owner using approved OAS interfaces | This review confirms OAS artifact testability, not Registry implementation |
| B-08 | Checker hardening to compare raw bytes directly against issued full-file hash | OAS tooling maintenance; preserve RC artifact | Existing independent verifier + issuance-commit comparison cover F-01; keep both mandatory until fixed |
| B-09 | Historical/current documentation navigation and full-build chunk splitting | OAS docs / existing UI build owners | Improves clarity/performance without changing normative scope or RC bytes |

If later work materially changes RC1 wording, meaning or membership before final adoption, it requires reviewed RC2 rather than a backlog note or in-place patch. Sector-specific safety, legal compliance claims and implementation certification require their own approved scope and authorities; none is inferred by this baseline.
