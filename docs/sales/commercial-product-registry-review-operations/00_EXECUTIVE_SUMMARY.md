# Commercial Product Registry Review Operations

4D exposes the 4C human review history through authenticated SHS API operations. Humans and authoritative external systems remain the decision authorities; the API validates and records provenance but does not make decisions.

Review queue and packet identity are projected from the reviewed 4B manifest and 4C packet generator. Decision and source-resolution histories use the append-only tables from migration 155 and canonical `audit_events`. This phase does not write Product Registry product state, upgrade readiness/sellability, or execute onboarding.

The API is rooted at `/commercial-product-reviews`. All reads require `commercial_product.read` and an authenticated actor with active organization/tenant context. Writes require the gate-specific capability or source-authority capability. `sales.admin` and generic `commercial_product.edit` are not review authority.

No new migration, product seed, frontend, or production-onboarding route is introduced.
