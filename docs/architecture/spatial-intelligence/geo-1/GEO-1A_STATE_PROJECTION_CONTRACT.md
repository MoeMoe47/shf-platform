# GEO-1A State Projection Contract

Spatial presentation states describe how a projected feature should appear. The map must never fabricate a state.

| State | Allowed source authorities | Persisted or calculated | Time dependency | Verification dependency | Visual role | Reduced-motion equivalent |
|---|---|---|---|---|---|---|
| NORMAL | domain or projection default | calculated | no | no | base rendering | static symbol/label |
| SELECTED | Spatial selection context | calculated | no | no | selected emphasis | static outline and aria-selected |
| NEXT | route/domain workflow authority | calculated or supplied | optional | optional | next step cue | numbered/static marker |
| SCHEDULED | event/mission/domain authority | supplied | yes | optional | future planned marker | date label |
| EVENT_SOON | event authority | calculated from source time | yes | optional | soon cue | static badge |
| EVENT_LIVE | event authority | calculated from source time | yes | optional | live cue | static live label |
| MISSION_ACTIVE | mission authority | supplied | optional | optional | active mission marker | static mission status |
| EMERGENCY | emergency/dispatch authority | supplied | yes | required for public use | urgent marker | high-contrast static alert |
| RESTRICTED | identity/publication authority | supplied | optional | required | hidden or restricted marker | text restriction notice |
| CLOSED | domain authority | supplied | optional | optional | unavailable/closed marker | static closed label |
| COMPLETED | domain authority | supplied | optional | optional | completed marker | static completed label |
| UNAVAILABLE | domain, projection, or config authority | calculated or supplied | optional | optional | disabled/unavailable marker | static unavailable notice |

## Rule

Spatial may calculate presentation state only from eligible source state and time metadata. It may not infer emergency, live, verified, completed, or restricted states from visual context alone.
