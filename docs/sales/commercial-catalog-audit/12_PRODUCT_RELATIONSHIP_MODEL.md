# Product Relationship Model

Future registry relationships should be explicit records, not inferred from names.

Recommended relationship fields:

```text
relationship_id
from_commercial_product_id
to_commercial_product_id
relationship_type
required_status
notes
provenance
status
```

Allowed relationship types:

- `STANDALONE_PRODUCT`
- `BASE_PRODUCT`
- `ADD_ON`
- `BUNDLE_COMPONENT`
- `PREREQUISITE`
- `OPTIONAL_MODULE`
- `UPSELL`
- `CROSS_SELL`
- `RENEWAL`
- `EXPANSION`
- `SPONSORSHIP_ASSOCIATION`
- `PARTNER_REQUIRED`
- `FUNDING_SUPPORTED`

Examples for future use:

- Metaverse Access License can be a `BASE_PRODUCT`; Metaverse Simulation Content can be an `ADD_ON`.
- Learning Arcade Institutional License can have `SPONSORSHIP_ASSOCIATION` for branded missions, if legal/tax review approves.
- Service Catalog / Entitlements may be a prerequisite for Studio, Career Center, Reporting, or Arcade access.
- Employer Workforce Incentive Intelligence is not a funding approval product; funding-supported relationships must remain `REVIEW_REQUIRED` until verified.
