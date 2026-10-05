# Revenue Leadership Compatibility

The future catalog must support Revenue Command, commission, leadership ladder, team production, personal revenue, team revenue, margin, renewal, expansion, and social selling attribution.

Required Product Registry fields:

- `commission_eligible_status`
- `leadership_override_eligible_status`
- `margin_status`
- `revenue_classification`
- `renewal_model`
- `expansion_paths`
- `sourced_revenue_policy`
- `influenced_revenue_policy`
- `selling_entity`
- `delivery_entity`
- `commercial_form`
- `pricing_status`
- `contract_required`
- `implementation_requirement`
- `support_requirement`
- `partner_required`
- `grant_supported`
- `sponsorship_association_type`

Rules:

- Recruiting alone must never create product revenue or commission.
- A lead, social touch, or influenced relationship must not count as sourced revenue without source policy.
- Commission eligibility must be product-level and approval-level, not inferred from a closed opportunity.
- Margin classification requires pricing/cost/delivery authority that does not exist in this phase.
- Sponsorship and grant-supported offerings need separate treatment from ordinary commercial sales.
