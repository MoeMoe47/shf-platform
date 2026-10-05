# Product Relationships

Relationships are explicit records, not inferred from names, families, descriptions, or UI navigation.

## Relationship Types

- `STANDALONE_PRODUCT`
- `BASE_PRODUCT`
- `ADD_ON`
- `BUNDLE_COMPONENT`
- `PREREQUISITE`
- `OPTIONAL_MODULE`
- `UPSELL`
- `CROSS_SELL`
- `RENEWAL`
- `EXPANSION`
- `SPONSORSHIP_ASSOCIATION`
- `PARTNER_REQUIRED`
- `FUNDING_SUPPORTED`
- `REPLACES`
- `SUPERSEDES`

## Relationship Fields

- `relationship_id`
- `from_commercial_product_id`
- `to_commercial_product_id`
- `relationship_type`
- `direction`
- `cardinality`
- `required_status`
- `authority_reference`
- `status`
- `notes`

## Directionality

- `ADD_ON`: from add-on to base product.
- `BUNDLE_COMPONENT`: from bundle to component.
- `PREREQUISITE`: from dependent product to required product.
- `UPSELL` and `CROSS_SELL`: from starting product to recommended target.
- `RENEWAL` and `EXPANSION`: from original product to renewal or expansion product.
- `REPLACES`: from replacement product to replaced product.
- `SUPERSEDES`: from newer product/version to predecessor.

## Cardinality

- `ONE_TO_ONE`
- `ONE_TO_MANY`
- `MANY_TO_ONE`
- `MANY_TO_MANY`

## Cycle Control

Dependency relationships must be acyclic for `PREREQUISITE`, `REPLACES`, and `SUPERSEDES`. Recommendation relationships such as `UPSELL` and `CROSS_SELL` may be graph-like but must not be used to infer entitlement or sellability.

