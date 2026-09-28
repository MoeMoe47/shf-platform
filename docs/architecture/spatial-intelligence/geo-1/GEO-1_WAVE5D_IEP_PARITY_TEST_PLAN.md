# GEO-1 Wave 5D IEP Parity Test Plan

Planning inventory: 24 acceptance cases. No Wave 5D production tests are
implemented in this planning pass.

## Unit and contract cases

| ID | Category | Requirement | Evidence/owner |
| --- | --- | --- | --- |
| P01 | Route | `capital.html#/iep-command-v2` remains mounted | existing route harness |
| P02 | Geometry | 88 county features are available | Census adapter + client |
| P03 | Identity | all 88 validated FIPS values are preserved | adapter/client |
| P04 | Geometry | projected geometry equals qualified source geometry | dual-run comparator |
| P05 | Labels | visible county labels preserve current values | client parity |
| P06 | Immutability | input geometry and legacy asset are not mutated | adapter/client |
| P07 | Projection | all qualified counties pass the production pipeline | adapter integration |
| P08 | Client boundary | output is an allowlisted IEP view model | client contract |
| P09 | Join | explicit `countyFips` joins domain data | domain fixture |
| P10 | Join safety | missing FIPS is unresolved | domain fixture |
| P11 | Join safety | name-only matching is rejected | domain fixture |
| P12 | Privacy | private IEP records remain hidden | publication fixture |
| P13 | Publication | public geometry does not grant record publication | publication fixture |
| P14 | Authority | no `entityToCounty` dependency in adapter/join | static/dependency test |
| P15 | Selection | county selection remains single and equivalent | interaction test |
| P16 | Hover | hover presentation remains equivalent | interaction test |
| P17 | Detail | county click preserves current detail-panel behavior | UI test |
| P18 | Navigation | `OPEN_RECORD` remains request-only | interaction test |
| P19 | Accessibility | keyboard/focus behavior does not regress | browser test |
| P20 | Failure | load/projection failure is visible and non-fabricating | error test |
| P21 | Coordinates | no coordinate transform occurs | contract test |
| P22 | Isolation | METAVERSE/unknown spaces cannot enter the IEP client | contract test |
| P23 | Dual run | legacy and Spatial outputs match by FIPS/geometry/label | dev comparator |
| P24 | Browser parity | route, rendering, selection, privacy, and accessibility match | Chromium test |

## Required browser scenarios

Chromium certification must cover the active route, 88 rendered counties,
county selection and hover, domain-data visibility, keyboard/focus behavior,
controlled error behavior, and absence of Franklin fallback for unknown data.
External services are mocked or avoided.

## Acceptance classification

Each case is classified `PASS`, `KNOWN_LEGACY_GAP`, `BLOCKED_BY_DOMAIN_IDENTITY`,
`BLOCKED_BY_PROVENANCE`, `REGRESSION`, or `UNEXPECTED_FAILURE`. A production
switch requires zero regressions and zero unexpected failures; blockers must
be resolved rather than hidden behind label matching.
