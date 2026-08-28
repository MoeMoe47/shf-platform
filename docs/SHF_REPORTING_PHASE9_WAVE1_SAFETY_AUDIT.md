# SHF Reporting Phase 9 Wave 1 Safety Audit

This wave removes false institutional reporting paths without creating missing
producers or migrating data. Migration classifications remain authoritative in
`SHF_REPORTING_SURFACE_REGISTRY.v1.json`; this document records the separate
Wave 1 safety disposition.

## Target dispositions

| Surface ID | Starting classification | Safety disposition | Evidence / remaining boundary |
| --- | --- | --- | --- |
| `surface.shs.dashboard` | REMOVE | SUPPRESSED | `shsReportStorage.js` returns no records when canonical browser records are absent; seed fallback removed. |
| `surface.shs.export` | REMOVE | SUPPRESSED | Seed-backed report lookup removed; export metadata has an explicit unavailable state when no real record exists. |
| `surface.hub.imports` | REMOVE | SUPPRESSED | Static KPI strip, readiness percentage/date, and recent-record fixture rows removed from the production-visible surface. |
| `surface.iep.dashboard` | REMOVE | SAFE_DEMO | Visible demonstration-data notice; no canonical ingestion or Truth projection is introduced. |
| `surface.iep.command` | REMOVE | SAFE_DEMO | Visible demonstration-data notice; analyst memo export disabled. |
| `surface.sales.impact_forecast` | DEMO_ONLY | SAFE_DEMO | Projection language is explicit and says the values are not verified institutional data. |
| `surface.sales.funding` | DEMO_ONLY | SAFE_DEMO | Estimate language is explicit; ROI is labeled estimated. |
| `surface.loo.outcomes` | DEMO_ONLY | SAFE_DEMO | Layout-level demonstration notice; official-looking export disabled. |
| `surface.impact.command` | PROVENANCE_INSUFFICIENT | SUPPRESSED | Command center returns a pending-verification state before static KPIs, program values, or exports render. |
| `surface.impact.ohio` | PROVENANCE_INSUFFICIENT | SUPPRESSED | Map returns a pending-verification state before static county values render. |
| `surface.exchange.public` | PROVENANCE_INSUFFICIENT | SUPPRESSED | Current audited components render no quantitative values; no new public values were introduced. |

## Deferred browser paths

`surface.shs.create`, `surface.shs.history`, `surface.exchange.investor`,
`surface.hub.workspace`, `surface.grant.binder`, `surface.attendance`,
`surface.placement.kpis`, and `surface.microcerts` remain migration work. Their
browser or legacy sources were not promoted, removed wholesale, or migrated in
Wave 1. They remain tied to the existing Phase 8 backlog until authenticated
ingestion, evidence, and metric contracts are implemented.

## Safety rule

No Wave 1 demo, seed, static, fabricated, or browser-derived value is accepted
as canonical Truth, a Metric Registry input, or a Reporting Service result.
Missing canonical data is represented as suppressed, unavailable, or visibly
demonstration-only data.
