# Commercial Universe

The commercial universe is everything that Silicon Heartland might legitimately sell, license, sponsor, package, implement, support, or commercially deliver after authority review. This audit does not declare sellability from existence.

## Inspected Repositories

| Repository | Path | Treatment |
|---|---|---|
| SHRV1 | `/Users/mikeslate/Projects/shrv1` | Primary repository; docs only were written under this audit directory. |
| SHF-Next | `/Users/mikeslate/shf-next` | Read-only secondary inspection. |

## Evidence Surfaces

| Surface | Evidence paths | Commercial meaning |
|---|---|---|
| Curriculum/content | `src/content/lessons/`, `apps/shs-api/src/domain/curriculum-catalog/`, `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json` | Content and platform capabilities exist, but commercial license packaging is absent. |
| Career/workforce | `src/router/CareerRoutes.jsx`, `apps/shs-api/src/domain/career-pathways/`, `docs/career/` | Career Center and pathway capability exists; buyer/product terms absent. |
| Service catalog/entitlements | `apps/shs-api/migrations/084_service_catalog_entitlements.sql`, `apps/shs-api/src/domain/service-catalog/` | Canonical service access authority exists; not a commercial product registry. |
| Arcade | `apps/shs-api/src/domain/arcade/`, `src/data/arcade.js` | Learning Arcade authority exists for activities/results; Classic Arcade surfaces are less authoritative. |
| Metaverse | `apps/shs-api/src/domain/metaverse/`, `src/system/metaverse/` | City/simulation registries exist with strong authority boundaries. |
| Civic/financial | `src/router/CivicRoutes.jsx`, `src/router/TreasuryRoutes.jsx`, `src/router/DebtRoutes.jsx`, `src/router/CreditRoutes.jsx` | Civic/Treasury/Debt surfaces exist but must remain separate authorities. |
| SHS institutional tech | `docs/AGENT_*`, `src/data/agents/`, `apps/shs-api/src/domain/studio/`, SHF-Next ops/studio pages | Platform/professional-service candidates exist. |
| Assurance/reporting | `apps/shs-api/src/domain/government-assurance/`, `apps/shs-api/src/domain/reporting/`, `docs/EVIDENCE_PACKAGE_LAYER_V1.md`, `docs/DATA_VERIFICATION_LAYER_V1.md` | Strong assurance/reporting candidates exist; verification authority must stay outside Sales. |
| SHF V1 programs | SHF-Next `docs/shf-v1-audit/` | Many SHF programs are concept/documentation-only and not sellable today. |

## Non-Authority Findings

- `src/data/catalogOfferings.js` is not product authority; it self-labels entries as seed/demonstration.
- SHF-Next Sales consumes product/catalog facts but is not product authority.
- Migrations 151/152 and prior Sales remediation were not revisited beyond documenting dependency context.

## Universe Boundary

The future Product Registry should index candidates only when an authoritative source exists or an explicit `NEEDS_REVIEW`/`NOT_SELLABLE` record is needed to prevent overclaiming. Sales should never create operational facts merely to display a card.
