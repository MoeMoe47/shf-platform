# Renewal And Expansion Model

Renewal and expansion metadata supports future Customer Success and Revenue Command. This design does not implement automated renewal logic.

## Fields

- `renewal_model`
- `renewal_term`
- `renewal_window`
- `expansion_paths`
- `upsell_paths`
- `cross_sell_paths`
- `renewal_authority_reference`
- `expansion_authority_reference`

Allowed renewal model:

- `NONE`
- `MANUAL`
- `ANNUAL`
- `MULTI_YEAR`
- `EVERGREEN`
- `PROJECT_BASED`
- `UNKNOWN`

Allowed path status:

- `POTENTIAL`
- `DOCUMENTED`
- `APPROVED`
- `BLOCKED`
- `UNKNOWN`

Renewal or expansion paths do not imply pricing, commission eligibility, or entitlement availability. Each path must reference product relationship records and applicable authority.

