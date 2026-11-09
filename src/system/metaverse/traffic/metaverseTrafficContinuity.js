// Reconcile caller-owned maps used by advanceRouteFleetVehicles. No motion clock,
// route approval, geometry transfer, intersection control, or asset authority.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, canonical(value[key])]),
  );
  return value;
}

export function createTrafficContinuitySignatures(routes, routeOptions = {}) {
  return new Map(routes.map((route, index) => [route.id,
    JSON.stringify(canonical({ route, options: routeOptions[route.id] || {}, index })),
  ]));
}

export function reconcileTrafficContinuity({ previous, next, vehicleStates, previousHeadings,
  routeElapsed, slotStates = new Map(), restart = false }) {
  const retainedRouteIds = [...next.keys()].filter(id => !restart && previous.get(id) === next.get(id));
  const retained = new Set(retainedRouteIds);
  for (const map of [vehicleStates, previousHeadings, slotStates]) {
    for (const key of map.keys()) {
      const routeId = key.slice(0, key.lastIndexOf(':'));
      if (!retained.has(routeId)) map.delete(key);
    }
  }
  for (const id of routeElapsed.keys()) if (!retained.has(id)) routeElapsed.delete(id);
  return { retainedRouteIds, invalidatedRouteIds: [...previous.keys()].filter(id => !retained.has(id)) };
}

export function isDecodedTrafficPlate(decodedIdentity, requestedIdentity) {
  return Boolean(requestedIdentity && decodedIdentity === requestedIdentity);
}
