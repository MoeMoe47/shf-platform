# Registry Schema Design

Do not create the database table in this phase.

Recommended canonical record:

```text
commercial_product_id
canonical_name
display_name
commercial_family
subfamily
description
source_authority
source_record_id
source_repository
source_paths
selling_entity
delivery_entity
buyer_types
commercial_form
product_type
delivery_model
pricing_model
pricing_status
readiness
sellability_status
funding_relationship_status
evidence_status
implementation_requirement
support_requirement
regulatory_review
legal_review
tax_review
procurement_review
funding_review
margin_status
commission_eligible_status
leadership_override_eligible_status
renewal_model
expansion_paths
dependencies
required_entitlements
required_partner_structure
authority_sources
provenance
last_verified_at
version
status
```

Required controlled vocabularies:

- `sellability_status`: `SELL_NOW`, `PILOT`, `DEVELOP`, `NOT_SELLABLE`, `NEEDS_REVIEW`
- `readiness`: `RED`, `YELLOW`, `GREEN`, `BLUE`, `UNKNOWN`
- `evidence_status`: `FOUND`, `PARTIAL`, `PLANNED`, `NOT_FOUND`
- `selling_entity` / `delivery_entity`: `SHF`, `SHS`, `PARTNER`, `JOINT_STRUCTURE_REVIEW_REQUIRED`, `UNKNOWN`
- `pricing_status`: `NOT_DEFINED`, `DRAFT`, `APPROVED`, `RETIRED`, `UNKNOWN`
- `commission_eligible_status`: `NOT_ELIGIBLE`, `ELIGIBLE_AFTER_APPROVAL`, `APPROVED`, `UNKNOWN`

Hard rule: `source_authority` and `authority_sources` must be required before `SELL_NOW` can ever be selected.
