# World Audio Engine (Phase 9)

The World Audio Engine presents authoritative or simulated events. It does not create the underlying event.

Code: `src/shared/experience/audio/` (`worldAudioEngine.js`, `worldPresentation.js`). Content lives in `src/shared/experience/sensory/profiles/regionalWorldSensoryProfile.js`.

## Reuse

The engine extends the Sensory Experience Foundation (`docs/experience/SENSORY_EXPERIENCE_FOUNDATION.md`) and does not replace it.

- Every sound is a Sound Registry entry built by `buildSensoryRegistry`; unknown sound ids are rejected.
- Every world event goes through `buildSensoryEvent` and `planSensoryPresentation` (the Sensory Director), with its existing alert arbitration.
- Phase 9 adds 13 `world.*` sounds, 9 world presentation entries, 4 environment profiles and `policy.regional-world`, which has no camera motion, no flashing and requires captions.
- Every asset is `asset:pending`; no audio files are added.
- `POWER_*` events keep their Phase 7 data-center entries.

## Audio source contract

Each source has these fields:

- `sourceId`
- `soundId`
- `systemId`
- `environmentId`
- `spatialRef`
- `position` (`{x, y}` or `null`)
- `looping`
- `priority`, `priorityClass`
- `state`
- `volumeClass`
- `occlusionClass`
- `indoor`
- `worldEventRef`
- `startedAt`

Any other field, including browser audio internals, is refused by validation.

## Spatial audio

Spatial audio is deterministic:

- linear rolloff up to the sound's `maxDistance`;
- pan from the horizontal offset;
- occlusion is bounded: `PARTIAL` and `FULL` apply only across an indoor/outdoor boundary;
- a source and listener in different coordinate spaces are never mixed (`CROSS_COORDINATE_SPACE`).

## Districts and landmarks

District profiles exist only for existing places:

- city core (central plaza);
- river;
- port (container yard);
- oil rig;
- the Phase 7 main data center.

Landmarks anchor to calibrated Quick Map locations or regional scenes.

## Priority and concurrency

Priority order, highest first:

1. `CRITICAL_ALERT`
2. `PUBLIC_SAFETY`
3. `MISSION_ALERT`
4. `OPERATIONAL`
5. `VEHICLE`
6. `AMBIENCE`
7. `MUSIC`
8. `CELEBRATION`

Concurrency is capped at 12 playing sources (64 registered) by default. When over the cap, lower classes degrade first; a `CRITICAL_ALERT` is never dropped. Celebrations are ducked while any alert is active.

## Dynamic music

Music has six states: `EXPLORATION`, `MISSION_START`, `PROBLEM`, `ESCALATION`, `RECOVERY` and `SUCCESS`. Transitions are a deterministic table, and the only exit from escalation is `RESOLVED`, which moves to `RECOVERY`.

## City mood

City mood is one of `CALM`, `ACTIVE`, `BUSY`, `ALERT`, `EMERGENCY`, `RECOVERY` or `CELEBRATION`.

- It is derived from simulated state (critical/major events, open incidents, impacts, clearing).
- Emergency always outranks celebration.
- City mood has `affectsWorldState: false`.

## Signage and storytelling

- Each sign message comes from a fixed list and must cite its `sourceEventId` and source authority; `validateSign` rejects an uncited sign.
- Storytelling cues cite their source event and never change world state.

## Accessibility mixer

Mixer channels:

- `master`
- `music`
- `effects`
- `environment`
- `vehicles`
- `voicePa`
- `missionAlerts`
- `celebrations`

Mixer toggles: `haptics`, `particles`, `cameraShake`, `flashing`, `backgroundMusic`. `music` and `celebrations` are the optional channels.

The engine also honors the learner's sensory accessibility settings (the existing `ACCESSIBILITY_SENSORY_KEYS`):

| Toggle | Effect |
| --- | --- |
| No audio | All gain is 0; captions and visual alerts are kept |
| Reduced sensory | Optional effects (celebration, particles, music) are suppressed |
| Captions | Captions are always produced for alerts |

## Boundaries

`getMix()` reports `createsEvents: false` and `affectsWorldState: false`. The engine reads events; it never publishes to MOL.

## Not built (out of scope)

- every audio asset;
- stadium audio;
- Creator Studio sound tools.
