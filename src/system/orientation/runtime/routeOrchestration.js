export const ROUTE_TRANSITION_STATES = Object.freeze(["STEP_ACTIVE", "NAVIGATION_REQUESTED", "ROUTE_TRANSITION", "WAITING_FOR_TARGET", "TARGET_READY", "TARGET_TIMEOUT"]);

export function createRouteTransition(input = {}) {
  return { state: "STEP_ACTIVE", orientationId: input.orientationId || null, orientationVersion: input.orientationVersion || null, tourId: input.tourId || null, tourVersion: input.tourVersion || null, fromRoute: input.fromRoute || null, toRoute: input.toRoute || null, nextStepId: input.nextStepId || null, organizationId: input.organizationId || null, reason: null };
}

export function transitionRoute(current, state, patch = {}) {
  if (!ROUTE_TRANSITION_STATES.includes(state)) throw new Error("ROUTE_TRANSITION_STATE_INVALID");
  return { ...current, ...patch, state };
}

export function requiresContextResolution(previous = {}, next = {}) {
  return previous.organizationId !== next.organizationId || previous.destinationId !== next.destinationId || previous.serviceKey !== next.serviceKey || previous.workflowRevision !== next.workflowRevision || previous.permissionRevision !== next.permissionRevision;
}

export function waitForTarget(findTarget, { timeoutMs = 1200, intervalMs = 80 } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    let timer;
    const check = () => {
      const target = findTarget();
      if (target) return resolve({ target, state: "TARGET_READY" });
      if (Date.now() - started >= timeoutMs) return resolve({ target: null, state: "TARGET_TIMEOUT" });
      timer = setTimeout(check, intervalMs);
    };
    timer = setTimeout(check, 0);
    return () => clearTimeout(timer);
  });
}
