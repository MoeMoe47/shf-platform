# GEO-1B Pilot Selection

| Candidate | Maturity | Authority clarity | Coordinate complexity | Data quality | Routing health | Testability | Public/private risk | Dependencies | Restoration complexity |
|---|---|---|---|---|---|---|---|---|---|
| Exchange / Capital | HIGH | PARTIAL | REAL_WORLD Mapbox | PARTIAL | HEALTHY | MEDIUM | MEDIUM | Mapbox token, remote GeoJSON | MEDIUM |
| SHS Operations | PARTIAL | PARTIAL | REAL_WORLD | PARTIAL | coupled to Exchange map | MEDIUM | MEDIUM | source-of-record policy | MEDIUM |
| SHF Public Impact | MEDIUM | BLOCKED | REAL_WORLD county | BLOCKED | STALE public route | HIGH | HIGH | publication approval, fallback fix | HIGH |
| Metaverse Quick Map | HIGH | CLEAR as client only | METAVERSE quick-map only | MEDIUM | HEALTHY | HIGH | LOW | coordinate isolation | LOW |

## Recommendation

Pilot with Metaverse Quick Map.

Reason: it has active client evidence and strong test coverage, avoids Mapbox token/config risk, avoids public real-world publication risk, and can validate core Spatial Engine client behavior while preserving coordinate-space separation. It must not become destination, traffic, mission, event, or emergency authority.
