# Duplicate / Overlap Analysis

| Finding | Evidence | Recommendation |
|---|---|---|
| Store catalog cards overlap with real candidates but are seed/demo | `src/data/catalogOfferings.js` honesty note | Do not migrate cards directly into Product Registry; use as discovery only. |
| Data Center appears as curriculum, pathway, Store card, Metaverse simulation, employer validation, and career pathway | Data Center content/docs/metaverse/store files | Create one base product family with explicit add-ons/relationships; do not duplicate records. |
| Service Catalog overlaps commercial product concepts | `service_catalog` has broad services | Treat service catalog as entitlement/source authority, not Product Registry. |
| Reporting appears as public reporting, trusted reporting, grant reporting, impact reporting, dashboards | reporting docs/domain and Store card | Create one reporting family with distinct packages and authority sources. |
| Evidence/Verification/Truth/Oracle overlap in language | Evidence Package, Data Verification, Truth Spine, Oracle docs | Preserve separate authority states; do not market verification as Truth approval. |
| Metaverse access/content/custom/sponsorship can be confused | City registry and simulations | Model commercial forms separately. |
| Learning Arcade vs Classic Arcade | Arcade backend vs classic arcade UI | Keep distinct families/subfamilies. |
| SHF V1 programs are report-row/concept-only in SHF-Next | SHF V1 audit docs | Create `NOT_SELLABLE` or `NEEDS_REVIEW` guard records if needed. |
| Healthcare/logistics/trades fixtures look like priced products | `src/data/career-pathways.json` includes tuition/duration | Treat as fixture/discovery until authority review. |
| SHS ops/studio/web builder surfaces imply services | SHF-Next ops/studio data | Require production delivery and commercial packaging review. |

Do not merge anything in this phase.
