# Source Authority Model

The Commercial Product Registry summarizes and projects source truth. It does not overwrite source truth.

## Authority Reference Fields

Each material claim must have one or more source authority references:

- `source_authority_type`
- `source_authority_id`
- `source_repository`
- `source_domain`
- `source_record_id`
- `source_version`
- `source_status`
- `source_last_verified_at`
- `source_provenance`
- `claim_supported`
- `claim_scope`
- `verification_status`

## Supported Authority Types

- `PROGRAM_REGISTRY`
- `CURRICULUM`
- `CAREER_REGISTRY`
- `SERVICE_CATALOG`
- `ENTITLEMENTS`
- `FUNDING`
- `EVIDENCE`
- `TRUTH_SPINE`
- `ORACLE`
- `REPORTING`
- `CONTRACTS`
- `DELIVERY_SYSTEM`
- `QA`
- `CLIENTOPS`
- `CREDENTIAL_AUTHORITY`
- `REGULATORY_AUTHORITY`
- `OTHER`

## Multiple Authorities

A product may require multiple authorities. Example: a curriculum pathway may reference curriculum source records, career pathway records, entitlement records, funding relationship references, and regulated-program review records.

Multiple authorities must be attached claim-by-claim. A curriculum source may support content existence but cannot support pricing, legal approval, funding eligibility, or credential claims.

## Verification Rules

- `source_last_verified_at` is required for `GREEN`, `BLUE`, and `SELL_NOW`.
- Stale source references force related review gates to `STALE` or `PENDING`.
- Missing source authority keeps operational claims out of Sales read models.
- Source summaries must preserve the source status and provenance.

