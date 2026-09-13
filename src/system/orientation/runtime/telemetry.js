const ALLOWED_EVENTS = new Set(["orientation.offered", "orientation.started", "orientation.skipped", "orientation.dismissed", "orientation.completed", "orientation.resumed", "tour.step_viewed", "tour.step_skipped", "tour.anchor_missing", "tour.completed", "documentation.opened_from_orientation", "companion.opened_from_orientation", "next_action.opened_from_orientation", "whats_changed.viewed"]);

export function emitOrientationExperienceEvent(event, payload = {}, sink = null) {
  if (!ALLOWED_EVENTS.has(event)) return false;
  const safe = { event, orientationId: payload.orientationId || null, tourId: payload.tourId || null, stepId: payload.stepId || null, destinationId: payload.destinationId || null, reason: payload.reason || null, at: new Date().toISOString() };
  if (typeof sink === "function") sink(safe);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ogl:experience-event", { detail: safe }));
  return true;
}

export { ALLOWED_EVENTS };
