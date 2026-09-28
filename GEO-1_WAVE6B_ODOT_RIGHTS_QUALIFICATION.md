# GEO-1 Wave 6B ODOT Rights Qualification

## Decision

ODOT TIMS County is a legitimate official public-information source, but the
available metadata does not establish a complete open-data license. A future
adapter is therefore `QUALIFIED_WITH_CONDITIONS`, not unconditionally cleared.

## Official Evidence

- Feature layer: `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer/0`
- Service item: `5a65fb89de864e0b97bbcb346dd761f3`
- MapServer item: `1a9458e0170e41a0a3b204edb5745e37`
- Publisher/credit: `ODOT Office of Technical Services`
- Item metadata: `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/MapServer/info/iteminfo`
- The item describes the data as maintained by ODOT and deemed public
  information, with an accuracy/reliability/suitability disclaimer and no
  liability assumed by ODOT or the developers.

## Use Matrix

| Use | Status | Basis / condition |
| --- | --- | --- |
| Public access | `CONFIRMED` | Official service and item metadata expose the layer as public information. |
| Reuse | `CONFIRMED_WITH_CONDITIONS` | Public-information statement supports controlled use; retain source credit and disclaimer. No broader license grant is stated. |
| Redistribution | `PARTIAL` | No explicit redistribution permission was found in the retrieved metadata. |
| Modification | `UNKNOWN` | No explicit modification or derivative-work permission was found. |
| Snapshot storage | `CONFIRMED_WITH_CONDITIONS` | A governed internal/repository snapshot is plausible, but external redistribution terms require written confirmation. |
| Attribution | `CONFIRMED_WITH_CONDITIONS` | Preserve `ODOT Office of Technical Services` and the disclaimer in source metadata/documentation. |
| Commercial use | `UNKNOWN` | No commercial-use term was found. |

## Required Clarification

Before an ODOT snapshot is distributed as production source data, obtain
written confirmation from the ODOT TIMS/GIS data owner or applicable ODOT
open-data authority covering redistribution, modification, snapshot storage,
and commercial use. Do not infer those permissions from the copyright or
public-information text alone.

## Scope

This qualification covers county boundary geometry and source metadata only.
It does not grant publication eligibility to SHS operational events, traffic
records, overlays, or other domain data.
