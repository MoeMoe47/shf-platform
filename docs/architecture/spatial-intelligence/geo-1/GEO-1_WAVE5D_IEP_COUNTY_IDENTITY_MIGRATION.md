# GEO-1 Wave 5D IEP County Identity Migration

## Scope

This migration hardens the static demonstration profiles only. It does not
change the IEP map renderer, map asset, route, domain publication state, or
runtime geography path.

## Previous identity

Profiles were keyed by normalized display county labels such as `FRANKLIN` and
`VAN WERT`. Those keys remain for backward-compatible lookup but are not
canonical identity.

## Migration method

Each profile label is matched exactly, after trimming and case normalization,
against the qualified Census county-name manifest. No aliases, substring
matches, fuzzy matching, address inference, or entity inference are used.

## Result

- Profile entries audited: 88
- Profiles assigned validated `countyFips`: 88
- Unresolved profiles: 0
- Duplicate profile FIPS values: 0
- Conflicts: 0
- Default profile: `countyFips: null`

Examples:

```text
GEAUGA  -> 39055
FRANKLIN -> 39049
VAN WERT -> 39161
```

The qualified Census asset remains the identity authority. This exact mapping
is migration/validation data and must not become an ongoing county-inference
service for arbitrary records.

## Future records

New IEP records must provide explicit validated `countyFips`. Records without
one remain unassigned/unknown and must not receive a default county.
