# Implementation Recommendation

Recommended next phase: `SHU-COMMERCIAL-PRODUCT-REGISTRY-DESIGN-2`.

Scope:

1. Approve registry vocabulary and schema fields.
2. Define read-only source adapters for service catalog, curriculum, career/pathways, arcade, metaverse, reporting, assurance, Studio, Agent Fabric, and SHF program docs.
3. Create a governance workflow for `NEEDS_REVIEW`, `NOT_SELLABLE`, `PILOT`, and future `SELL_NOW`.
4. Define review gates for SHF/SHS/entity/legal/tax/regulatory/procurement/funding.
5. Define product relationship records.
6. Define required provenance and freshness rules.
7. Define tests that prevent Store demo data or Sales static packages from becoming product authority.

Explicitly out of scope for the next phase unless separately approved:

- Product Registry database table creation.
- Pricing logic.
- Commission logic.
- Solution Builder recommendation engine.
- Funding eligibility claims.
- Credential/licensure authority.

Acceptance recommendation: a future implementation should fail closed. No record, no card. No authoritative source, no operational fact. No verified evidence, no verified claim.
