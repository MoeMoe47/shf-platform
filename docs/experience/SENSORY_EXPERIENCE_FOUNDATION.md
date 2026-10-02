# Silicon Heartland Celebration, Audio & Sensory Experience Foundation (Phase 6.5)

Authoritative systems decide what happened. The Experience Layer decides how that event is presented, heard, celebrated, felt, and reflected in the world.

Celebrations may present authoritative or verified events; they must never manufacture the underlying achievement.

**Scope.** Phase 6.5 adds contracts only:
- pure, deterministic shared modules in `src/shared/experience/sensory/`;
- tests in `tests/sensoryFoundation.test.mjs`.

It adds no audio assets, effects engine, WebAudio or spatial audio, UI, routes or migration. The production registries are empty, and there is no Data Center sensory content.

## What already existed

| Existing | Role | Relationship |
|---|---|---|
| `src/experience/celebrations/celebrationPolicy.js` + `CelebrationProvider` | Live client celebration policy. Verified-achievement gating; tiers ACKNOWLEDGEMENT / ACHIEVEMENT / MAJOR_MILESTONE | Unchanged. `LEGACY_CELEBRATION_TIER_MAP` maps its tiers to TIER_1 / TIER_2 / TIER_4 for a later adaptation. |
| Accessibility preferences (`sensory.motionPreference`, `sensory.celebrationIntensity` FULL/SUBTLE/OFF) | The learner's preference | Unchanged. `accessibilitySensoryProfileFromPreferences` derives presentation booleans from it. |
| `src/shared/sfx/sfx.js` | WebAudio micro-tone player (UI cues), muted by default | Unchanged. A playback engine, not a registry. UI sounds can later reference it (`source: "synth:sfx.click"`). |
| `src/shared/dopamine` | Client XP event bus | Not authoritative, so never a sensory source. |

## Contracts

- **CelebrationTier.** Six bounded tiers:
  - `TIER_0_FEEDBACK`
  - `TIER_1_SMALL_WIN`
  - `TIER_2_ACTIVITY_COMPLETE`
  - `TIER_3_MISSION_SUCCESS`
  - `TIER_4_MAJOR_MILESTONE`
  - `TIER_5_INSTITUTIONAL_WORLD_EVENT`

  A tier comes from the registered celebration for an authoritative trigger. It is never chosen by the caller, and a mismatched tier is rejected. Each authoritative source has a ceiling:

  | Source | Highest tier |
  |---|---|
  | ui-interaction | TIER_0 (FEEDBACK only) |
  | arcade | TIER_2 |
  | mission-runtime, mission-team | TIER_3 |
  | curriculum, verified-evidence, credentials, careers | TIER_4 |
  | truth-spine, mol | TIER_5 |

  Unknown sources (browser events, client XP) are rejected.

- **SoundRegistry.** Fields: `soundId`, `category`, `source` (asset reference only), `environment`, `looping`, `spatial`, `maxDistance`, `priority`, `volumeClass`, `occlusionSupported`, `caption`, `accessibilityLabel`.
  - Rules: `maxDistance` is required for spatial sounds; every sound has a caption and an accessibility label.
  - Categories: UI, MUSIC, AMBIENCE, VEHICLE, WEATHER, WATER, INDUSTRIAL, PUBLIC_SAFETY, VOICE_PA, CROWD, MISSION, CELEBRATION, INFRASTRUCTURE.

- **CelebrationRegistry.** Fields: `celebrationId`, `triggerEvent`, `authoritySource`, `tier`.
  - **Cue references:** sound, music, particles, lighting, camera, NPC, signage, haptics.
  - **Timing:** `durationMs`, `repeatPolicy`, `cooldownMs`.
  - **Variants:** `reducedMotionVariant`, `reducedSensoryVariant`, `silentVariant`.
  - **`environmentRestrictions`.**

  Rules:
  - Each trigger has exactly one registered celebration.
  - Sound cues must reference registered non-MUSIC sounds; music cues must reference MUSIC sounds.
  - Every celebration at TIER_1 or above must declare all three variants, each with a caption key.
  - The silent variant has no sound or music. The reduced-motion variant has no particles or camera. The reduced-sensory variant has no music, particles, camera or haptics.

- **Sound and celebration profiles.** Named collections of registered ids, and nothing more.

- **SensoryEventContract.** Required fields:
  - `sourceEventType`, `sourceAuthority`, `sourceRecordId`, `correlationId`;
  - `presentationIntent`: FEEDBACK, ACKNOWLEDGE, CELEBRATE, AMBIENT, ALERT or CEREMONY, plus `alertSeverity` (required for ALERT, null otherwise);
  - `celebrationTier`;
  - `environmentRefs` (at most 8);
  - `accessibleAlternative`;
  - `replayPolicy`;
  - `worldStateRequirement` (null or a MOL `{molSystemId, stateKey}` reference).

  It carries `createsTruth`, `createsEvidence`, `createsMastery`, `createsCredential`, `createsCareerReadiness`, `createsEmployment`, `createsMissionSuccess` and `createsWorldTruth`, all **false**.

  Copying authoritative data is rejected. That includes payload, score, mastery, Evidence or credential ids, user or learner ids, accommodation or diagnosis, world state and result.

- **SensoryPresentationPolicy.** Default and allowed intensities, `maxTier`, camera, haptics and flashing permissions, and `requireCaptions`.

- **SensoryIntensityProfile.** CALM, STANDARD, ENERGETIC, CINEMATIC. These set particle level, music, camera and maximum duration, always with `affectsOutcome: false`.

- **EnvironmentAudioProfile.** An environment reference (MOL system or zone), ambience sounds (ambient categories only), `maxConcurrentSounds`, `defaultVolumeClass` and `worldStateDriven`. A world-state-driven profile reacts to MOL events and never writes world state.

- **AccessibilitySensoryProfile.** Eight presentation booleans: reducedMotion, reducedSensory, noAudio, noFlashing, hapticsOff, screenReaderAlternative, captions, visualSoundIndicators. It carries no accommodation, diagnosis or grant detail.

## Experience / Sensory Director

AUTHORITATIVE EVENT → EXPERIENCE / SENSORY DIRECTOR → PRESENTATION POLICY → AUDIO / MUSIC / PARTICLES / LIGHTING / CAMERA / HAPTICS / NPC / SIGNAGE / CEREMONY.

`EXPERIENCE_SENSORY_DIRECTOR_CONTRACT` records `ownsPresentationOnly: true`, `ownsDomainTruth: false` and `writes: []`.

`planSensoryPresentation` is the deterministic reference contract. It returns a plan and runs nothing. It:
1. validates the event;
2. finds the registered celebration for the authoritative trigger;
3. applies the policy's tier cap (above the cap, the result is SUPPRESSED);
4. chooses the intensity;
5. selects the accessibility variant;
6. enforces channel removals that no combination can reintroduce.

The plan carries a `dedupeKey`, `worldStateWrites: []` and all non-authority flags. `arbitrateSensoryPlans` resolves concurrent plans (see below), so Mission Runtime, Arcade, MOL, the Metaverse, UI, NPCs and a future MOCC cannot fire conflicting effects.

## Presentation priority and arbitration

Celebration tier expresses celebration significance; it is not operational priority.

Safety, emergency and operational alerts cannot be suppressed by celebration or ceremony presentation.

**Priority vocabulary**, highest first: CRITICAL_ALERT, ALERT, OPERATIONAL, CEREMONY, CELEBRATION, FEEDBACK, AMBIENT.

**How priority is assigned:**
- Priority is derived only from the declared `presentationIntent`, and the plan keeps the intent, priority and severity. Priority is never inferred from celebration id or tier, and clients never supply a number.
- An `ALERT` event must declare a bounded `alertSeverity`, which maps CRITICAL → CRITICAL_ALERT, WARNING → ALERT and OPERATIONAL → OPERATIONAL. CELEBRATE and ACKNOWLEDGE map to CELEBRATION.
- Each authority has a severity ceiling:

  | Authority | Highest alert severity |
  |---|---|
  | mol, mission-runtime | CRITICAL |
  | mission-team, truth-spine | WARNING |
  | curriculum, arcade, verified-evidence, credentials, careers | OPERATIONAL |
  | ui-interaction | Cannot raise alerts |

- A policy's celebration-tier cap never suppresses an alert.
- Alerts are always captioned and are shown visually (`visualAlert`) when they cannot be heard.

**`arbitrateSensoryPlans`** is channel-aware and deterministic, not a scheduler:
1. Duplicates of one authoritative event collapse to the single highest-priority copy.
2. Alert-class plans (CRITICAL_ALERT, ALERT, OPERATIONAL) claim their channels first, in priority order. Celebration tier plays no part in this ordering.
3. While an alert is active, non-alert plans may keep only a free subtle channel (`LIGHTING`) plus captions (role SUBDUED); otherwise they are DEFERRED. Interruptive channels (audio, music, particles, camera, haptics, NPC, signage, ceremony) are never taken from an alert.
4. Without an alert, the highest-priority non-alert plan plays in the foreground, with ties broken by celebration tier. The rest are captions only (role BACKGROUND).

Arbitration only removes channels, so accessibility removals made when a plan is built still hold afterwards.

## Future compatibility (not built)

MOL authoritative world events, MOCC read-only observation, World Audio Engine, City Mood System, Dynamic Signage, Ceremony Engine and Environmental Storytelling consume Director plans and registries. They never bypass the Director or own domain truth.

## Phase 7 additions

- **The Data Center sensory profile is the first registered content.** It lives in `profiles/dataCenterSensoryProfile.js`; see `docs/workforce/DATA_CENTER_REFERENCE_IMPLEMENTATION.md`.
- **Registered sound ≠ audio file.** A sound `source` must be `asset:` or `synth:`. `asset:pending[:id]` marks a registered sound with no file, and `soundAssetStatus` reports PENDING_ASSET, ASSET_REFERENCE or SYNTHESIZED.
- **`buildSensoryRegistry()`** with no argument builds the production registry. With an explicit argument it builds exactly those lists, so injected content never mixes with production content.
- **`buildSensoryEvent(trigger, record)`** builds an event from a declared trigger and a real authoritative record id.

## Program connection

`ProgramPackage.sensoryRefs` (`soundProfileRef`, `celebrationProfileRef`, `environmentAudioProfileRef`, `sensoryPolicyRef`) is optional and holds references only. `WorkforceFoundationService.resolveProgram` reports `{kind, id, resolved}` for each, with `ownedByProgram: false`.
