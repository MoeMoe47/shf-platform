# Audit And Lineage

4I uses canonical `audit_events` and the lineage table `commercial_product_production_onboardings`.

Lineage records:

- candidate id
- canonical product id
- organization
- onboarding operator
- source resolution id and version
- review decision ids, versions, authorities, and evidence references
- eligibility snapshot
- candidate audit/catalog source references
- source authority references
- lifecycle, readiness, and sellability at onboarding time
- authorized timestamp

Successful execution records `commercial_product_registry.production_onboarding_attempted` and `commercial_product_registry.production_onboarding_succeeded`. Rejections that occur after transactional eligibility recomputation record `commercial_product_registry.production_onboarding_rejected`.
