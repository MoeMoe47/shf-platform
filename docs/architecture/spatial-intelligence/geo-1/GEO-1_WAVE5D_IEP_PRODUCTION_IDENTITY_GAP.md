# GEO-1 Wave 5D IEP Production Identity Gap

## Finding

No active `apps/shs-api` IEP route, service, model, serializer, DTO, seed, or
database migration was found that owns county-bearing IEP records. The active
IEP surfaces are frontend-controlled demonstration/static/derived structures:

- `src/pages/iep/IEPDashboardPage.jsx` owns demonstration student records.
- `src/pages/iep-command-v2/countyProfiles.js` owns static county profiles.
- `src/apps/iep/iepRiskAdapter.js` derives risk presentation records.
- `src/pages/iep-command/IEPCommandCenter.jsx` consumes the frontend
  `window.__SHS_EDU__` snapshot.

## Classification

```text
Production IEP backend: NO_PRODUCTION_MODEL
Current client readiness: READY_WITH_CONDITIONS
Future production data readiness: FUTURE_IMPLEMENTATION_REQUIRED
```

## Required Future Evidence

Before production ingestion or persistence is implemented, identify the owning
domain schema and define a producer that supplies `countyFips: string | null`
with validation, authorization, publication, and audit semantics. The producer
must distinguish unresolved identity from a valid county and must not rely on
the Franklin fallback.

No speculative database migration is appropriate in the current repository.
