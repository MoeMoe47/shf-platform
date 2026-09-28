const DOMAIN_STATES = new Set([null, "NEXT", "SCHEDULED", "MISSION_ACTIVE", "EMERGENCY", "CLOSED", "COMPLETED", "UNAVAILABLE"]);
const CLOSED_MODIFIERS = ["SELECTED", "HIGHLIGHTED", "STALE", "UNVERIFIED"];

const textForState = (state, dimensions) => {
  if (state === "SCHEDULED") return dimensions.temporalState ? `Scheduled ${dimensions.temporalState}` : "Scheduled: Date not provided";
  if (state === "EVENT_SOON") return "Starting soon";
  if (state === "EVENT_LIVE") return "Live now";
  if (state === "MISSION_ACTIVE") return "Mission active";
  if (state === "EMERGENCY") return dimensions.modifiers.includes("UNVERIFIED") ? "Unverified emergency report" : "Emergency";
  if (state === "UNAVAILABLE") return dimensions.availabilityReason === "STALE_POLICY" ? "Unavailable: information is out of date" : "Unavailable";
  if (state === "RESTRICTED") return "Restricted";
  if (state === "COMPLETED") return "Completed";
  if (state === "CLOSED") return "Closed";
  if (state === "NEXT") return "Next step";
  if (state === "SELECTED") return "Selected";
  return "Normal";
};

export function resolvePresentationState({ domainState, temporalState, selectionState, highlightState, availabilityState, availabilityReason, freshnessState, verificationState, publicationState, emergencyConfirmed, timeAwareCapability = true }) {
  const modifiers = [];
  if (selectionState === "SELECTED") modifiers.push("SELECTED");
  if (highlightState) modifiers.push("HIGHLIGHTED");
  if (freshnessState === "STALE") modifiers.push("STALE");
  if (verificationState === "UNVERIFIED") modifiers.push("UNVERIFIED");
  const resolvedVisualState = availabilityState === "UNAVAILABLE"
    ? "UNAVAILABLE"
    : publicationState === "RESTRICTED"
      ? "RESTRICTED"
      : domainState === "EMERGENCY" && emergencyConfirmed
        ? "EMERGENCY"
        : ["NEXT", "SCHEDULED", "MISSION_ACTIVE", "CLOSED", "COMPLETED", "UNAVAILABLE"].includes(domainState)
          ? domainState
          : timeAwareCapability && temporalState === "soon"
            ? "EVENT_SOON"
            : timeAwareCapability && temporalState === "live"
              ? "EVENT_LIVE"
              : selectionState === "SELECTED"
                ? "SELECTED"
                : "NORMAL";
  const dimensions = Object.freeze({
    domainState,
    temporalState,
    selectionState,
    availabilityState,
    availabilityReason,
    verificationState,
    publicationState,
    highlightState: highlightState || null,
    freshnessState,
    resolvedVisualState,
    modifiers: Object.freeze([...modifiers]),
  });
  return Object.freeze({ dimensions, stateText: textForState(resolvedVisualState, dimensions) });
}

export { CLOSED_MODIFIERS, DOMAIN_STATES };
