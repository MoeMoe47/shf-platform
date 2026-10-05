# Solution Builder Contract

Solution Builder will ask what should be offered to a customer. It must consume the registry read contract and fail closed.

## Required Filters

Solution Builder must be able to filter by:

- Buyer.
- Industry.
- Population.
- Geography.
- Need.
- Goal.
- Budget model.
- Delivery capacity.
- Funding compatibility.
- Program readiness.
- Existing entitlements.
- Accessibility need.
- Employer relationship.
- Career pathway.
- Implementation capacity.
- Regulatory constraints.
- Support requirements.

## Required Exclusions

Solution Builder must not recommend:

- `NOT_SELLABLE` products.
- Products with blocked commercial, legal, regulatory, entitlement, pricing, support, or delivery gates.
- Products missing required source authority.
- Regulated offerings whose sales language or external authority is unresolved.
- Funding-supported offerings as eligible unless funding authority supports eligibility.

## Read Contract Fields

- `commercial_product_id`
- `display_name`
- `commercial_family`
- `buyer_types`
- `industry_fit`
- `population_fit`
- `geography_constraints`
- `needs_supported`
- `goals_supported`
- `budget_models`
- `delivery_capacity_status`
- `funding_relationship_status`
- `readiness`
- `sellability_status`
- `entitlement_requirements`
- `accessibility_requirements`
- `employer_relationship_requirements`
- `career_pathway_references`
- `implementation_status`
- `regulatory_constraints`
- `support_status`
- `review_blocks`
- `source_provenance`

The contract is read-only. Solution Builder may explain why an offering is excluded, but it cannot override registry gates.

