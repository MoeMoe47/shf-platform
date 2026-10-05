# Regulated Program Model

Regulated pathways require safe commercial representation. The registry must distinguish SHU curriculum, readiness, and simulation assets from external certification, licensure, accreditation, or training authority.

Applicable areas include:

- Healthcare.
- STNA.
- Nursing.
- Phlebotomy.
- Fire/Public Safety.
- EMS.
- Aviation.
- Apprenticeship.
- Other regulated pathways.

## Fields

- `regulated_program`
- `regulatory_authority`
- `external_training_authority_required`
- `credential_authority`
- `partner_required`
- `partner_type`
- `scope_limitations`
- `sales_language_restrictions`
- `regulatory_review_gate`
- `credential_claim_status`

## Safe Representation Rules

- SHU curriculum can be described as curriculum only when curriculum authority supports it.
- Simulations can be described as simulations only when simulation authority supports it.
- Readiness language must not imply certification, licensure, employment eligibility, or regulatory approval.
- Partner-delivered pathways must identify partner dependency and review status.
- `SELL_NOW` is blocked for regulated products until legal/regulatory gates and source authority are approved.

