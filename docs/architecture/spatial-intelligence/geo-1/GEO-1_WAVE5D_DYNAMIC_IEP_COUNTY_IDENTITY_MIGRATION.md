# GEO-1 Wave 5D Dynamic IEP County Identity Migration

## Static and derived data

- 88 county profiles were migrated by exact qualified Census name reference.
- 132 nested priority-case view records receive FIPS only through their
  county-owned profile parent.
- Four standalone dashboard students have no authoritative county source and
  are explicitly `countyFips: null`.
- Risk events and command-center priority cases preserve supplied FIPS or
  remain null; they do not infer geography.
- Simulation/detail payloads carry the profile FIPS when the payload is derived
  from a county profile.

## No production-source invention

No API schema, persisted record, school, district, provider, organization, or
student was assigned a county FIPS without an explicit source relationship.
Future production records must supply `countyFips` at the domain boundary.

## Unresolved behavior

Unresolved records remain valid non-geographic data. They are excluded from
county joins and do not receive geometry or a default county.
