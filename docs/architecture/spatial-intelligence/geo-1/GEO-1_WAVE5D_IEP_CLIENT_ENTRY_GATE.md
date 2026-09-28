# GEO-1 Wave 5D IEP Client Entry Gate

## Gate

The IEP Spatial client may be designed around the county contract when:

- `countyFips: string | null` is explicit and validated.
- valid values are members of the qualified 88-county Ohio set.
- `null` remains geographically unresolved.
- joins use `record.countyFips === countyFeature.sourceRecordId` only.
- the canonical path has no `entityToCounty` or Franklin dependency.
- publication and authorization are unchanged.
- Census remains geometry authority and IEP remains domain relationship
  authority.

## Current Decision

```text
READY_FOR_CLIENT_ADAPTER_WITH_PRODUCTION_API_CONDITION
```

Repository-controlled client data satisfies the identity boundary. A future
production API producer is still required before claiming production data
ingestion readiness. The IEP map and production Spatial client remain
unchanged in this phase.
