# Entitlement And Funding Boundary

## Entitlement Boundary

The registry may reference entitlements but must not own entitlement authority.

Fields:

- `required_entitlement_ids`
- `optional_entitlement_ids`
- `entitlement_authority`
- `entitlement_status_reference`
- `entitlement_review_gate`

Service Catalog and Entitlements remain the authority for access and service enablement. The registry may describe that a product requires entitlement records; it may not mint or modify those entitlements.

## Funding Boundary

Funding compatibility is not eligibility. Eligibility is not approval. Approval is not payment.

Allowed funding relationship status:

- `POTENTIAL`
- `DOCUMENTED`
- `VERIFIED`
- `NOT_FOUND`
- `REVIEW_REQUIRED`

Fields:

- `funding_relationship_status`
- `funding_sources`
- `funding_authority_reference`
- `funding_limitations`
- `eligibility_authority_required`
- `approval_authority_required`
- `payment_authority_required`

Supported future funding reference types:

- Grants.
- Workforce funding.
- Employer contributions.
- Apprenticeship funding.
- Union partnerships.
- Philanthropy.
- Sponsorship.
- Institutional purchasing.
- SHS commercial revenue.

The registry may support discovery and filtering. It must not claim a buyer is eligible, approved, reimbursable, or paid without external authority.

