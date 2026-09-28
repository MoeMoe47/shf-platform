# GEO-1 Wave 6B ODOT Rights Matrix

## Applicability Ledger

| Source | Applicability | Public access | Reuse / redistribution / modification evidence |
| --- | --- | --- | --- |
| `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer/0` | Exact County layer | Service exposes the 88-county layer and credits ODOT Office of Technical Services | No license or explicit reuse terms in layer metadata |
| `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer` | Boundaries/County service family, same item ID | Service describes boundaries of 88 Ohio counties and annual updates | No additional grant of redistribution or modification rights |
| `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/MapServer/info/iteminfo` | Exact County MapServer item | `licenseInfo` says the dataset is maintained by ODOT and deemed public information | Provides disclaimer and liability language, not a complete open-data license |
| General ODOT/TIMS policy | Not proven applicable | No repository evidence establishes a broader policy applies to this layer | Not imported into this decision |
| Unrelated ODOT datasets | Not applicable | Excluded | Terms cannot be transferred |

## Rights Decision Matrix

| Right | Status | Evidence | Remaining uncertainty |
| --- | --- | --- | --- |
| Public access | `CONFIRMED` | Exact layer/service is publicly queryable; item calls the data public information | None for access to the current service |
| Internal use | `CONFIRMED_WITH_CONDITIONS` | Public-information statement and official service access | Retain disclaimer and attribution; confirm SHS operational use in writing |
| Local snapshot storage | `CONFIRMED_WITH_CONDITIONS` | Governed local analysis snapshot is consistent with controlled use | Written confirmation should cover retained historical copies |
| Display | `CONFIRMED_WITH_CONDITIONS` | Public layer is intended for map access | Confirm derived display and authorized/public deployment scope |
| Redistribution | `PARTIAL` | No explicit redistribution grant found | Raw or derived redistribution terms are unanswered |
| Modification | `UNKNOWN` | No explicit derivative/modification permission found | Processing for rendering versus publishing modified data is unanswered |
| Commercial use | `UNKNOWN` | No commercial-use term found | SHS commercial/for-profit use needs confirmation |
| Attribution | `CONFIRMED_WITH_CONDITIONS` | `ODOT Office of Technical Services` appears as credit/access information | Confirm required wording and placement |

## Rights Gate

`RIGHTS_GATE_REQUIRES_WRITTEN_CLARIFICATION`

The initial internal adapter concept requires access, local storage, internal
processing, display, and attribution. Raw redistribution and modification are
not required for the first internal adapter, but commercial/public deployment
and historical snapshot retention require clarification.
