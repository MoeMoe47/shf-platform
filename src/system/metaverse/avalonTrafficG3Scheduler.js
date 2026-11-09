// Avalon G3 — private-preview vehicle-entry scheduling.
// Pure functions. No production traffic authority.

export const AVALON_G3_TARGETS = Object.freeze({
  'rear-west': 2,
  'front-garden': 3,
});

export function createAvalonG3Schedule(routes, {
  progressPerSecond = 0.018,
  spacingProgress = 0.16,
} = {}) {
  if (!Number.isFinite(progressPerSecond) || progressPerSecond <= 0) {
    throw new Error('G3 requires a positive finite progress rate');
  }
  if (!Number.isFinite(spacingProgress) ||
      spacingProgress <= 0 || spacingProgress >= 1) {
    throw new Error('G3 requires valid progress spacing');
  }

  const schedule = new Map();

  for (const route of routes) {
    const count = AVALON_G3_TARGETS[route.view] ?? 0;
    if (!count) continue;

    const gapSeconds = spacingProgress / progressPerSecond;

    schedule.set(route.id, Array.from(
      { length: count },
      (_, slot) => ({
        key: `${route.id}:${slot}`,
        routeId: route.id,
        slot,
        startProgress: 0,
        activateAtSeconds: slot * gapSeconds,
      })
    ));
  }

  return schedule;
}

export function activeAvalonG3Slots(schedule, routeId, elapsedSeconds) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    return [];
  }

  return (schedule.get(routeId) ?? []).filter(
    entry => elapsedSeconds >= entry.activateAtSeconds
  );
}
