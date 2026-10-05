# Review Gates

Review gates are governed controls. No gate may be auto-marked `APPROVED` without an authoritative source.

## Gate States

- `NOT_REQUIRED`
- `PENDING`
- `APPROVED`
- `BLOCKED`
- `STALE`
- `UNKNOWN`

## Required Gate Types

- `commercial_readiness`
- `legal`
- `tax`
- `regulatory`
- `procurement`
- `funding`
- `delivery_capacity`
- `evidence_readiness`
- `support_readiness`
- `pricing_readiness`
- `margin_readiness`
- `entitlement_readiness`
- `partner_readiness`

## Gate Fields

- `gate_type`
- `gate_state`
- `authority_reference`
- `review_owner_capability`
- `reviewed_at`
- `expires_at`
- `blocker_reason`
- `conditions`
- `notes`

## Approval Rules

- `APPROVED` requires source authority and reviewer capability.
- `STALE` is required when authority expires or source references are outdated.
- `BLOCKED` must include blocker reason and source/provenance.
- `UNKNOWN` fails closed for `SELL_NOW`.
- `NOT_REQUIRED` requires authority explaining why no review is required.

