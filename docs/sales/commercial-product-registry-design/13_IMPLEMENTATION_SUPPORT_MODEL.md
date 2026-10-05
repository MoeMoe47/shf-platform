# Implementation And Support Model

The registry captures implementation and support metadata without inventing commitments.

## Implementation Fields

- `implementation_required`
- `implementation_tier`
- `implementation_owner`
- `implementation_status`
- `implementation_authority_reference`
- `implementation_dependencies`

Allowed implementation tier:

- `NONE`
- `LIGHT`
- `STANDARD`
- `COMPLEX`
- `CUSTOM`
- `UNKNOWN`

Allowed implementation status:

- `NOT_REQUIRED`
- `DEFINED`
- `UNDER_REVIEW`
- `READY`
- `BLOCKED`
- `UNKNOWN`

## Support Fields

- `support_required`
- `support_tier`
- `managed_service_available`
- `SLA_status`
- `training_required`
- `professional_development_available`
- `support_authority_reference`

Allowed support tier:

- `NONE`
- `BASIC`
- `STANDARD`
- `ENHANCED`
- `ENTERPRISE`
- `UNKNOWN`

Allowed SLA status:

- `NOT_DEFINED`
- `DRAFT`
- `UNDER_REVIEW`
- `APPROVED`
- `ACTIVE`
- `BLOCKED`
- `UNKNOWN`

Support commitments require source authority. Sales read models must show support status and blockers when support is incomplete.

