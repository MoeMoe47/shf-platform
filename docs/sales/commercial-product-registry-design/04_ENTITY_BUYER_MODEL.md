# Entity And Buyer Model

## Selling And Delivery Entity Fields

- `selling_entity`
- `delivery_entity`
- `partner_required`
- `partner_type`
- `joint_structure_required`
- `entity_review_flags`
- `entity_authority_reference`

Allowed entity classifications:

- `SHF`
- `SHS`
- `PARTNER`
- `JOINT_STRUCTURE_REVIEW_REQUIRED`
- `UNKNOWN`

## Review Flags

- `LEGAL_REVIEW_REQUIRED`
- `TAX_REVIEW_REQUIRED`
- `REGULATORY_REVIEW_REQUIRED`
- `PROCUREMENT_REVIEW_REQUIRED`
- `FUNDING_REVIEW_REQUIRED`

The registry records review needs and outcomes. It does not determine legal, tax, regulatory, procurement, or funding outcomes.

## Buyer Compatibility

Buyer compatibility is governed metadata, not unrestricted tagging. Allowed buyer types:

- `K12_SCHOOL`
- `SCHOOL_DISTRICT`
- `CHARTER_SCHOOL`
- `PRIVATE_SCHOOL`
- `COLLEGE`
- `UNIVERSITY`
- `CAREER_TECH`
- `WORKFORCE_BOARD`
- `AMERICAN_JOB_CENTER`
- `MUNICIPALITY`
- `COUNTY`
- `STATE_AGENCY`
- `NONPROFIT`
- `YOUTH_PROGRAM`
- `AFTER_SCHOOL_PROVIDER`
- `SUMMER_PROGRAM`
- `LIBRARY`
- `EMPLOYER`
- `DATA_CENTER_OPERATOR`
- `HEALTHCARE_EMPLOYER`
- `HOSPITAL`
- `NURSING_FACILITY`
- `FIRE_DEPARTMENT`
- `PUBLIC_SAFETY_AGENCY`
- `UTILITY`
- `CONTRACTOR`
- `LOGISTICS_EMPLOYER`
- `UNION`
- `APPRENTICESHIP_SPONSOR`
- `BANK`
- `CREDIT_UNION`
- `FOUNDATION`
- `PHILANTHROPY`
- `COMMUNITY_ORGANIZATION`
- `TRAINING_PROVIDER`
- `ENTERPRISE`

## Buyer Fit Fields

- `buyer_types`
- `buyer_fit_status`: `UNKNOWN`, `POTENTIAL`, `DOCUMENTED`, `VERIFIED`, `BLOCKED`
- `buyer_fit_authority_reference`
- `buyer_limitations`
- `excluded_buyer_types`

Compatibility is not procurement eligibility, funding eligibility, or legal approval.

