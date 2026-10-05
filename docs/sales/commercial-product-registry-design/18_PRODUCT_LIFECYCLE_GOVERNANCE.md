# Product Lifecycle And Governance

## Canonical Lifecycle

```text
DISCOVERED
-> DEFINED
-> REVIEW
-> PILOT_READY
-> PILOT_ACTIVE
-> SALES_READY
-> ACTIVE
-> SUSPENDED
-> SUNSET
-> RETIRED
```

Not every product must visit every state. Transitions must preserve auditability and authority references.

## State Mapping

- `DISCOVERED`: readiness `UNKNOWN`, sellability `DEVELOP` or `NEEDS_REVIEW`, pricing `NOT_DEFINED`, gates `UNKNOWN`.
- `DEFINED`: readiness `UNKNOWN`, sellability `DEVELOP`, initial sources attached.
- `REVIEW`: readiness `UNKNOWN` or `YELLOW`, sellability `NEEDS_REVIEW` or `DEVELOP`, gates `PENDING`.
- `PILOT_READY`: readiness `YELLOW`, sellability `PILOT`, pilot gates approved.
- `PILOT_ACTIVE`: readiness `YELLOW`, sellability `PILOT`, pilot evidence accumulating.
- `SALES_READY`: readiness `GREEN`, sellability may become `SELL_NOW` only after required gates.
- `ACTIVE`: readiness `GREEN` or `BLUE`, sellability `SELL_NOW`, pricing active, gates approved.
- `SUSPENDED`: sellability blocked pending review.
- `SUNSET`: no new sales.
- `RETIRED`: inactive and archived.

## Capability Model

Use role/capability concepts only:

- `product_candidate_creator`: may create candidate records.
- `product_steward`: may edit descriptive commercial fields.
- `source_authority_reviewer`: may attach or verify source references.
- `readiness_approver`: may approve readiness transitions with evidence.
- `sellability_approver`: may approve sellability transitions with gates.
- `pricing_approver`: may approve pricing status references.
- `commission_policy_approver`: may approve commission eligibility status.
- `sponsorship_approver`: may approve sponsorship status.
- `legal_regulatory_approver`: may approve legal/regulatory gate references.
- `product_retirement_approver`: may sunset or retire products.

No single Sales role may self-approve all controls.

## Governance Rules

- Readiness and sellability require separate approvals.
- Pricing approval does not imply commission approval.
- Legal approval does not imply regulatory approval.
- Source authority review must precede verified claims.
- Retirement must preserve archival provenance and relationship history.
