# Pricing And Margin Boundary

The registry may contain pricing and economics metadata, but it must not become uncontrolled pricing authority.

## Pricing Fields

- `pricing_status`
- `pricing_model`
- `pricing_authority`
- `pricing_reference`
- `price_effective_from`
- `price_effective_to`
- `currency`
- `discount_policy_reference`

Allowed pricing status:

- `NOT_DEFINED`
- `DRAFT`
- `UNDER_REVIEW`
- `APPROVED`
- `ACTIVE`
- `EXPIRED`
- `BLOCKED`

No actual prices are assigned in this design.

## Pricing Boundary

Pricing metadata may indicate whether pricing exists, who controls it, and where approved pricing can be found. The registry must not calculate, infer, or silently approve prices.

## Margin And Economics Fields

- `margin_status`
- `cost_model_reference`
- `gross_margin_class`
- `minimum_margin_policy`
- `commercial_viability_status`

Allowed margin status:

- `NOT_DEFINED`
- `DRAFT`
- `UNDER_REVIEW`
- `APPROVED`
- `ACTIVE`
- `BLOCKED`
- `UNKNOWN`

Allowed commercial viability status:

- `UNKNOWN`
- `NEEDS_REVIEW`
- `VIABLE`
- `CONDITIONALLY_VIABLE`
- `NOT_VIABLE`
- `BLOCKED`

The registry does not calculate margin. Future Revenue Command, pricing approval, deal approval, commission, and leadership override systems may reference these fields.

