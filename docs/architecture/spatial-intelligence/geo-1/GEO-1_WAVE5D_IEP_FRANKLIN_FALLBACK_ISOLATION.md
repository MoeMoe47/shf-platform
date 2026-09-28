# GEO-1 Wave 5D IEP Franklin Fallback Isolation

## Existing defect

`src/system/resolvers/entityToCounty.js` returns Franklin County for unknown
entity identifiers. That behavior remains a known defect for other consumers
and is not globally removed in Wave 5D-ID.

## IEP canonical path

The active `IEPCommandCenterV2.jsx` no longer imports the resolver or the
selected-entity context for county identity. The canonical IEP identity module
also contains no resolver dependency. Its only accepted geographic join is an
explicit validated `countyFips` comparison.

## Guarantee

```text
missing/unknown countyFips -> unresolved
```

Never:

```text
missing/unknown countyFips -> Franklin County
```

The resolver remains available to unrelated legacy consumers until a separate
remediation approves broader removal. This phase proves isolation of the
canonical IEP identity path, not global resolver eradication.
