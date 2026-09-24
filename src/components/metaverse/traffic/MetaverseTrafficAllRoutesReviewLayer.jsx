import React from "react";
import TrafficVehicleMarker from "./TrafficVehicleMarker.jsx";

// MET-16C — Dev-Only All-Routes Live Preview: production runtime layer.
//
// Renders every APPROVED, CAR-eligible route's vehicles simultaneously,
// through the exact same TrafficVehicleMarker MetaverseTrafficCorridorLayer.jsx
// uses — no route lines, no control-point handles, no authoring markers of
// any kind. The only thing distinguishing this from normal city view is
// the small dev-only badge below, itself gated by `enabled`.
export default function MetaverseTrafficAllRoutesReviewLayer({
  enabled,
  renderedVehicles = [],
  timeOfDay = "DAY",
  routeCount = 0,
  skippedRoutes = [],
}) {
  if (!enabled) return null;
  return (
    <div
      className="met-living-layer met-traffic-all-routes-review"
      aria-hidden="true"
      data-traffic-all-routes-review="DEV_ONLY"
      data-time-of-day={String(timeOfDay).toLowerCase()}
      data-route-count={routeCount}
      data-skipped-route-count={skippedRoutes.length}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="met-traffic-all-routes-review__svg">
        {renderedVehicles.map((vehicle) => (
          <TrafficVehicleMarker key={vehicle.key} vehicle={vehicle} timeOfDay={timeOfDay} />
        ))}
      </svg>
      {/* Dev-only badge — never rendered in normal production view, since
          this whole component returns null unless `enabled` (dev build +
          ?trafficAllRoutesReview=1) is true. */}
      <div className="met-traffic-review-badge" data-dev-only="true">
        ALL ROUTES TRAFFIC REVIEW
        <span className="met-traffic-review-badge__count"> · {routeCount} route{routeCount === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
