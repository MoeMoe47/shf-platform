# GEO-1 Wave 5D Dynamic IEP County Identity Contract

## Record contract

Every dynamic IEP record that may participate in county geography carries:

```text
countyFips: string | null
```

Non-null values must be five-digit qualified Ohio FIPS strings. `null` means
the record is valid domain data but geographically unresolved.

## Allowed origins

1. `SOURCE_SUPPLIED` from an authoritative API/domain record.
2. `DOMAIN_VALIDATED` after source-level validation.
3. `EXPLICIT_PARENT_RELATIONSHIP` for a derived record whose county-owned
   parent guarantees the relationship.
4. `MIGRATED_EXACT_REFERENCE` for repository-controlled static/demo data.

Name guesses, addresses, entities, fuzzy matching, defaults, and Franklin
fallbacks are forbidden.

## Derived propagation

`propagateCountyFipsFromCountyOwnedParent` requires the explicit relationship
marker `COUNTY_OWNED_DERIVED`. Unrelated parent records produce `null`.

## Join

```text
record.countyFips === countyFeature.sourceRecordId
```

No runtime name matching is permitted.

## Publication

County identity does not change authorization, ownership, visibility,
`publicApproved`, publication state, or workflow state.
