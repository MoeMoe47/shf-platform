# GEO-1 Wave 5D IEP County API Contract

## Status

This is a contract definition, not a live API implementation. Repository
inspection found no IEP county-bearing backend model, route, serializer, DTO,
or persistence migration. Current IEP records are frontend-controlled demo,
static, or derived runtime data.

## Canonical Field

```text
countyFips: string | null
```

When non-null, the value is an explicit, validated Ohio county relationship.
It must be exactly five digits, begin with `39`, and belong to the qualified
88-county Census identity set. It is stored as a string so identity formatting
cannot lose leading zeroes.

`null` means that no authoritative county relationship is supplied or known.
It never means Franklin County, a default, or permission to infer from a name,
address, entity, or parent that does not guarantee county ownership.

## Authority Boundary

The IEP/domain producer owns the relationship between an IEP record and
`countyFips`. The U.S. Census source owns the geometry for that county FIPS.
Spatial coordinates the two authorities; it does not assign county identity.

## Producer Rules

Only a domain source, validated administrative input, canonical import, or
explicitly guaranteed domain relationship may set `countyFips`. Invalid values
must be rejected or represented as `null`; they must not be normalized into a
different county.

## Consumer Rules

Consumers may validate, display, join by exact FIPS, or remain unresolved.
`countyName` may remain as additive display metadata, but it is not identity
authority. Consumers must not use `entityToCounty`, fuzzy matching, address
inference, or a Franklin default.

## Compatibility and Persistence

Where a future API carries county identity, the field is additive alongside
any retained `countyName`. No API version change or database migration is
authorized by this contract. A real producer and persistence authority must be
identified before either is implemented.

## Current Readiness

Repository-controlled records are ready to consume this contract: valid
records carry explicit FIPS and unresolved records remain `null`. Future
production data ingestion remains `FUTURE_IMPLEMENTATION_REQUIRED` because no
authoritative IEP API/backend model was found.
