# Avalon Village — Traffic Checkpoint G3

## Objective
Increase seasonal private-preview traffic to a target of
five vehicles: two rear-west and three front-garden,
subject to verified geometry and collision safety.

## Baseline
- Existing seasonal tests: 3 passed, 0 failed.
- Autumn Day/Dusk/Night static clearance:
  63 model-pair comparisons, 0 collisions.
- Winter rear-west remains withheld.
- Intersection controls remain OFF.

## Implementation boundaries
1. Preserve existing shared Traffic Engine behavior by default.
2. Add optional per-slot activation only if needed.
3. Never use interior starting offsets to simulate spawning.
4. Activate each vehicle at route progress 0.
5. Stagger vehicle entry using deterministic scheduling.
6. Preserve off-screen exit and respawn behavior.
7. Preserve route and asset eligibility verification.
8. Preserve reduced-motion, pause and resume behavior.
9. Do not modify production traffic eligibility.
10. Do not modify stop-sign or intersection controls.

## Required tests
- All six seasonal calibrations remain hash-bound.
- Existing three regression tests remain passing.
- Every new vehicle enters from a verified off-screen position.
- Mixed eligible vehicle models maintain safe body clearance.
- No visible respawn or teleportation.
- No collisions during continuous driving.
- No vehicle activates before its scheduled time.
- Pause freezes both vehicle movement and scheduling.
- Route changes invalidate incompatible vehicle states.
- Winter rear-west remains disabled.
- Production traffic behavior remains unchanged.
- Browser preview confirms realistic vehicle movement.

## Acceptance
G3 is complete only when automated tests and
private browser verification both pass.

Static clearance alone is not acceptance.
