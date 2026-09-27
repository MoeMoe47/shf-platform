# GEO-1B State Engine Plan

The state engine produces presentation states from eligible domain, selection, temporal, verification, and publication inputs.

## State Ownership

| State | Spatial may calculate | Must be supplied by domain/authority |
|---|---:|---:|
| NORMAL | YES | NO |
| SELECTED | YES | NO |
| NEXT | PARTIAL | YES when workflow-dependent |
| SCHEDULED | NO | YES |
| EVENT_SOON | YES from source times | YES for event source |
| EVENT_LIVE | YES from source times | YES for event source |
| MISSION_ACTIVE | NO | YES |
| EMERGENCY | NO | YES |
| RESTRICTED | YES from eligibility | YES from auth/publication source |
| CLOSED | NO | YES |
| COMPLETED | NO | YES |
| UNAVAILABLE | YES from missing config/data | optional |

## Priority

`RESTRICTED` and `UNAVAILABLE` override normal visual states. `EMERGENCY` outranks event and mission states only when supplied by a confirmed emergency authority. `SELECTED` is a presentation modifier, not a truth state.

## Reduced Motion

Every animated or pulsing state must have a static equivalent: outline, badge, label, high-contrast marker, or text status.
