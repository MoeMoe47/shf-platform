import React from "react";
import TrafficVehicleMarker from "./TrafficVehicleMarker.jsx";

// MET-16B — First Live Traffic Corridor: production runtime layer.
//
// Renders ONLY moving vehicles for the one approved corridor
// useMetaverseTrafficCorridor selected — no route line, no control-point
// handles, no start/end markers, no draft/perspective warning labels. This
// is the "normal city view" visual; every authoring-only marker lives
// exclusively in MetaverseTrafficAuthoringOverlay.jsx, which this
// component does not import and has no dependency on.
//
// Mounted inside MetaverseLivingCityLayer.jsx in the same transformed
// scene-coordinate box every other living-city layer uses (viewBox
// "0 0 100 100" == the shared 0-100 scene percentage system), gated by its
// own `enabled` prop (resolveTrafficCorridorReviewEnabled), never by the
// authoring tool's flag.
//
// Vehicle rendering itself lives in TrafficVehicleMarker.jsx, shared
// verbatim with MetaverseTrafficAllRoutesReviewLayer.jsx (MET-16C) — this
// file only composes the SVG root and the vehicle list for the
// single-corridor case.
export default function MetaverseTrafficCorridorLayer({ enabled, renderedVehicles = [], timeOfDay = "DAY" }) {
  if (!enabled) return null;
  return (
    <div
      className="met-living-layer met-traffic-corridor"
      aria-hidden="true"
      data-traffic-corridor="REVIEW_GATED"
      data-time-of-day={String(timeOfDay).toLowerCase()}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="met-traffic-corridor__svg">
        {renderedVehicles.map((vehicle) => (
          <TrafficVehicleMarker key={vehicle.key} vehicle={vehicle} timeOfDay={timeOfDay} />
        ))}
      </svg>
    </div>
  );
}
