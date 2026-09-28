# GEO-1 Wave 5B Regression Catalog

| mapId | Test suite | Behavior protected | Current status | Defect/dependency | Migration implication |
| --- | --- | --- | --- | --- | --- |
| `metaverse.quick-map` | Wave 4 suites + estate integrity | Asset, 15 markers, uncertainty, controls, selection, privacy | PASS | No production source mapping | Preserve; mapping blocked |
| `metaverse.master-city` | Spatial and Metaverse coordinate suites | Separate verified scene coordinate space | PASS | No transform | Keep separate |
| `metaverse.regional-scenes` | route/registry tests | 15-stop presentation route and null destination refs | PASS | Route authority remains Metaverse | No Spatial route authority |
| `exchange.unified-truth` | Exchange regression suite | Mapbox token gate and remote county dependency | PASS | External token/GeoJSON provenance | Adapter partial |
| `shs.operations-mapbox` | Exchange regression suite | Map initialization and missing-token fallback | PASS | `VITE_MAPBOX_TOKEN` required | Preserve fallback |
| `shf.public-impact` | SHF regression suite | Route declaration and publication suppression | PASS | Current records draft/unapproved | Mapping blocked |
| `iep.ohio-county` | IEP regression suite | Local geometry loading and county identifiers | PASS | Geometry provenance/license unresolved | Candidate only |
| `shf.ohio-engine` | Disconnected forensic suite | Exportability and no Spatial registration | PASS | Test/unrouted, hardcoded metrics | Restoration candidate |
| `globe.operational` | Disconnected forensic suite | Export and external asset/dependency visibility | PASS | Importer/mount status unresolved | Preserve pending disposition |
| `globe.real` | Disconnected forensic suite | Export and remote geometry dependency | PASS | Unverified remote source | Preserve pending disposition |
| `exchange.outcome-globe` | Disconnected forensic suite | Presentation-only arcs | PASS | No confirmed source authority | Deprecation candidate |

No test in this catalog creates a production source mapping.
