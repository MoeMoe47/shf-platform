# Sales Product Read Model

The Sales-facing read model is a projection for discovery, qualification, and safe selling. It must show blockers and provenance.

## Conceptual Output

```json
{
  "commercial_product_id": "cp_example",
  "name": "Example Product",
  "family": "INSTITUTIONAL_TECH_SHS",
  "short_description": "Sales-safe summary.",
  "buyer_fit": ["SCHOOL_DISTRICT"],
  "readiness": "YELLOW",
  "sellability": "PILOT",
  "pricing_status": "NOT_DEFINED",
  "funding_relationship": "POTENTIAL",
  "implementation_status": "UNDER_REVIEW",
  "support_status": "UNKNOWN",
  "commission_eligibility": "UNKNOWN",
  "renewal_model": "UNKNOWN",
  "expansion_paths": [],
  "review_blocks": ["pricing_readiness", "legal"],
  "source_provenance": [],
  "last_verified_at": null
}
```

## Projection Rules

- Omit unsupported operational facts.
- Include blockers before calls to action.
- Preserve `PILOT`, `DEVELOP`, `NEEDS_REVIEW`, and `NOT_SELLABLE` states.
- Never convert potential funding into eligibility.
- Never convert recruiting, advocacy, or influence into revenue.
- Surface external authority boundaries for regulated products.

