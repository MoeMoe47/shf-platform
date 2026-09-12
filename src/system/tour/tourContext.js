export function isSafeTourRoute(route) {
  return typeof route === "string" && route.startsWith("/") && !/^(\/\/|https?:|javascript:|data:)/i.test(route);
}

export function createTourReturnTarget(input = {}) {
  if (!isSafeTourRoute(input.route)) return null;
  return {
    route: input.route,
    service: input.service || null,
    resourceType: input.resourceType || null,
    resourceId: input.resourceId || null,
    workflow: input.workflow || null,
    step: input.step || null,
    section: input.section || null,
  };
}

export function createTourContext(input = {}) {
  return {
    tourId: input.tourId || null,
    role: input.role || null,
    organizationId: input.organizationId || null,
    service: input.service || null,
    workflow: input.workflow || null,
    resourceType: input.resourceType || null,
    resourceId: input.resourceId || null,
    guidanceId: input.guidanceId || null,
    requirementId: input.requirementId || null,
    actionTarget: createTourReturnTarget(input.actionTarget || {}),
    returnTarget: createTourReturnTarget(input.returnTarget || {}),
  };
}
