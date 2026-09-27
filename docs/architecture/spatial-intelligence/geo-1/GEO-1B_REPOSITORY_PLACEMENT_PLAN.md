# GEO-1B Repository Placement Plan

Repository inspection found existing frontend shared modules under `src/shared`, system modules under `src/system`, map and Metaverse clients under `src/components/maps` and `src/components/metaverse`, backend domains under `apps/shs-api/src/domain`, and tests under `tests`.

## Recommended Future Paths

| Concern | Recommended path | Reason |
|---|---|---|
| Shared contracts | `src/shared/spatial/contracts/` | Matches existing frontend shared contract/client pattern and avoids a new top-level architecture |
| Shared registries | `src/shared/spatial/registries/` | Keeps coordinate/layer registry data importable by frontend tests and clients |
| Frontend spatial runtime | `src/system/spatial/` | Existing `src/system/*` contains command/event/runtime concerns |
| Frontend map clients | existing `src/components/maps/`, `src/components/metaverse/`, and page folders | Preservation-first; do not relocate existing maps during GEO-1B |
| Frontend domain adapters | `src/shared/spatial/adapters/` or existing domain shared folders with adapter exports | Keeps read-only projection adapters separate from map rendering |
| Backend projection adapters | `apps/shs-api/src/domain/spatial/` after approval | API already groups domain runtime by bounded context |
| Backend shared contracts | `apps/shs-api/src/domain/spatial/model/` | Mirrors API domain model folders |
| Test utilities | `tests/helpers/spatial/` | Existing helper convention under `tests/helpers` |
| Contract tests | `tests/spatial*.test.mjs` initially | Existing root test naming pattern |
| UI/pilot tests | `tests/ui/spatial-*.spec.mjs` when browser behavior begins | Existing Playwright UI convention |

## Placement Rules

Do not create production files during GEO-1B. Future implementation should start with shared contracts and tests, then add runtime modules only after placement is accepted.
