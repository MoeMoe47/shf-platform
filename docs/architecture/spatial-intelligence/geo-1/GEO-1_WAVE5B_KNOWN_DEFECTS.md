# GEO-1 Wave 5B Known Defects and Conditions

| Item | Classification | Status | Evidence / implication |
| --- | --- | --- | --- |
| Unknown entity defaults to Franklin County | DEFECT / MIGRATION BLOCKER | Confirmed | `src/system/resolvers/entityToCounty.js:4-9`; desired future result is null/unknown. |
| SHF entry-route behavior | DEPENDENCY / REGRESSION WATCH | Changed, requires browser confirmation | Foundation route declares `impact`; separate entry behavior must remain tested. |
| Missing Mapbox token | EXTERNAL DEPENDENCY | Expected condition | Existing component renders a visible token-needed fallback. |
| Remote county GeoJSON provenance | PROVENANCE GAP | Confirmed | Remote Plotly dataset URL is used; license/source acceptance is not part of the component. |
| Legacy Quick Map source IDs | MIGRATION BLOCKER | Confirmed | 15 registry markers lack accepted source authority and source record identity. |
| SHF impact publication | MIGRATION BLOCKER | Confirmed | Current records are sample/unapproved and must remain suppressed publicly. |
| Disconnected globe mount status | DEPENDENCY / DISPOSITION GAP | Confirmed | Components exist, but no accepted active-client relationship was established. |
| Persisted geometry ownership | PROVENANCE GAP | Unknown | Local geometry exists; durable domain ownership and persistence contract remain open. |

Known defects are not treated as passing behavior. They are preserved as explicit conditions for later remediation.
