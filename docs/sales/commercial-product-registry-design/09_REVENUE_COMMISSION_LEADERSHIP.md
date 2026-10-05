# Revenue, Commission, And Leadership Compatibility

The registry supports future Revenue Command, commission, and leadership systems by carrying eligibility and classification metadata. It does not create financial truth or compensation logic.

## Commission Fields

- `commission_eligible_status`
- `commission_policy_reference`
- `leadership_override_eligible`
- `renewal_commission_eligible`
- `expansion_commission_eligible`

Allowed commission status:

- `NOT_ELIGIBLE`
- `ELIGIBLE_AFTER_APPROVAL`
- `UNDER_REVIEW`
- `APPROVED`
- `BLOCKED`
- `UNKNOWN`

Recruiting alone must never create product revenue or commission. Leadership overrides must be based on legitimate customer revenue or team production under future policy.

## Revenue Classification

Supported commercial revenue classes:

- `ONE_TIME`
- `RECURRING`
- `IMPLEMENTATION`
- `SUBSCRIPTION`
- `LICENSE`
- `PROFESSIONAL_SERVICE`
- `MANAGED_SERVICE`
- `SPONSORSHIP`
- `GRANT_SUPPORTED`
- `EMPLOYER_SUPPORTED`
- `RENEWAL`
- `EXPANSION`

Supported revenue event perspectives:

- `BOOKED_REVENUE`
- `COLLECTED_REVENUE`
- `PIPELINE_REVENUE`
- `EXPANSION_REVENUE`
- `RENEWAL_REVENUE`
- `REVENUE_AT_RISK`

Revenue event truth belongs to future Revenue Command or finance authority, not the registry.

## Policy Rules

- A lead, social touch, or influenced relationship is not sourced revenue without policy authority.
- Closed opportunities do not automatically create commission eligibility.
- Sponsorship and grant-supported offerings require separate handling from ordinary commercial sales.
- Margin class must come from pricing, cost, and delivery authority.

