# Commercial Form Model

Commercial form describes how an offering may be packaged commercially. It does not assign price, eligibility, revenue recognition, or commission.

Allowed forms:

- `PER_STUDENT_LICENSE`
- `PER_COHORT_LICENSE`
- `PER_SITE_LICENSE`
- `PER_INSTITUTION_LICENSE`
- `ANNUAL_LICENSE`
- `SUBSCRIPTION`
- `IMPLEMENTATION_FEE`
- `PROFESSIONAL_SERVICE`
- `MANAGED_SERVICE`
- `ASSESSMENT`
- `CUSTOM_DEVELOPMENT`
- `SPONSORSHIP`
- `TRAINING`
- `SUPPORT`
- `USAGE_BASED`
- `ENTERPRISE_CONTRACT`
- `PARTNER_DELIVERED`
- `GRANT_SUPPORTED`
- `EMPLOYER_SUPPORTED`

## Multi-Form Support

A product may have multiple forms only when the authority references support each form. Example: a platform package may be both `ANNUAL_LICENSE` and `IMPLEMENTATION_FEE`; a workforce package may be `PER_COHORT_LICENSE`, `TRAINING`, and `EMPLOYER_SUPPORTED`.

## Required Fields

- `commercial_forms`
- `primary_commercial_form`
- `form_status`: `UNKNOWN`, `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `BLOCKED`, `RETIRED`
- `form_authority_reference`
- `form_limitations`

`UNKNOWN` is the default for underdefined concepts.

