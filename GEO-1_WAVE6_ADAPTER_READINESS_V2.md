# GEO-1 Wave 6 Adapter Readiness V2

Statuses reflect current evidence and do not authorize implementation.

| Domain / client | Status | Evidence |
| --- | --- | --- |
| Metaverse Quick Map | `QUALIFIED_WITH_CONDITIONS` | Spatial client is accepted; 15 legacy records remain unmapped/provisional. |
| IEP county map | `QUALIFIED` | Census adapter, explicit countyFips, client parity, browser certification, and Spatial-default cutover are complete. |
| Exchange / Capital | `BLOCKED` | Mapbox token/platform dependency, remote county source provenance/license, mixed marker identity, and publication boundaries remain unresolved. |
| SHF public impact | `BLOCKED` | Current impact records are sample/draft and all `publicApproved:false`. |
| ODOT operational geography | `QUALIFIED_WITH_CONDITIONS` | Official TIMS match, stable FIPS, and distinct operational value; reuse terms, snapshot governance, and adapter scope remain. |
| Metaverse regional geography | `PARTIAL` | Strong presentation registry and assets, but no confirmed geographic source authority or registered production feature contract. |
| CivicSure | `NOT_JUSTIFIED` | No confirmed geographic source/coordinate contract in current evidence. |
| Career | `NOT_JUSTIFIED` | No confirmed canonical geographic records. |
| Opportunities | `NOT_JUSTIFIED` | Domain surfaces exist without qualified spatial authority. |
| Events | `NOT_JUSTIFIED` | No accepted event geography/publication contract. |
| Traffic | `PARTIAL` | Metaverse traffic presentation exists; geographic authority and source identity are not confirmed. |
| Water Mobility | `PARTIAL` | Regional mobility slots exist, but configured routes and authority are pending. |
| Transit / Sky Bridge | `BLOCKED` | No confirmed production transit authority. |
| Emergency / Dispatch | `BLOCKED` | No confirmed production emergency authority. |
| Workforce | `NOT_JUSTIFIED` | No evidence sufficient for an independent adapter. |
| Projects | `NOT_JUSTIFIED` | No evidence sufficient for an independent adapter. |

## Recommended Next Qualification

ODOT operational county geography is the sole recommended Wave 6B candidate.
It should first pass a rights/version/scope gate. No ODOT adapter, source
registration, or consumer migration is authorized by this matrix.
