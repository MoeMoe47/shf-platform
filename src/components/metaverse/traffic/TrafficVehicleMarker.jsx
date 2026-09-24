import React from "react";
import { TRAFFIC_PREVIEW_VEHICLE_VISUALS } from "@/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";
import { resolveTrafficCorridorLightTreatment } from "@/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";
import { resolveVehicleSilhouette } from "./VehicleSilhouettes.jsx";

// MET-16B / MET-16C — the ONE vehicle-rendering component every production
// traffic review surface uses (MetaverseTrafficCorridorLayer.jsx,
// MetaverseTrafficAllRoutesReviewLayer.jsx). Extracted so adding a second
// review surface never means a second copy of this SVG/lighting logic —
// there is exactly one visual "engine" for a moving vehicle, same as there
// is exactly one spline/heading/perspective engine
// (metaverseTrafficAuthoringModel.js / metaverseTrafficLivePreviewModel.js).
//
// MET-16C replaced the flat single-color <image href> assets
// (public/assets/metaverse/traffic/vehicles/*.svg) with the inline,
// parametrized silhouettes in VehicleSilhouettes.jsx — a static file
// reference could only ever have one fixed body color per class, which
// made "realistic restrained per-vehicle color variety" unreachable. A
// vehicle without a resolved vehicleClass/bodyColor (e.g. the all-routes
// review, which intentionally does not set those — see
// metaverseTrafficCorridorRuntime.js's composition-scoping comment) still
// renders correctly: CAR / a neutral silver body by default.
const DEFAULT_VEHICLE_CLASS = "CAR";
const DEFAULT_BODY_COLOR = "#9aa5b1";
const DEFAULT_ACCENT_COLOR = "#78828d";
const CAR_FOOTPRINT = TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN; // base length/width for every class; class-specific scale (see runtime) grows/shrinks SUV/SMALL_TRUCK subtly from here rather than each class owning its own footprint.

// MET-16C.2 Section 6 — plate blending: the SVG vehicle render is
// mathematically crisp, while the city plate is a photographic/AI
// render, so at normal zoom the vehicle reads as "pasted on top." A
// small CSS blur on the detail layer only (not the shadow, not the
// endpoint-fade opacity) removes the vector edge without visibly
// softening the shape — deliberately inside the brief's suggested
// 0.15-0.35px range, not the "noticeably blur the vehicle" it warns
// against.
const PLATE_BLEND_FILTER = "blur(0.22px)";

function VehicleLights({ length, width, treatment }) {
  if (!treatment.headlightGlow && !treatment.taillightGlow) return null;
  // MET-16C.2 Section 4/5 — owner visual review found the prior glow
  // radius (width*0.26 / width*0.2) large enough to read as a separate
  // blob rather than an attached light. Cut roughly in half and pulled
  // in from the exact nose/tail tip so each light sits ON the body
  // rather than floating past its edge. Still attached to the vehicle's
  // own local space (so it rotates with heading via the parent <g>), and
  // still a single small circle — no streak, no halo, no second glow
  // layer to avoid a "detached blob" read.
  const frontX = length * 0.44;
  const rearX = -length * 0.44;
  return (
    <>
      {treatment.headlightGlow ? (
        <circle cx={frontX} cy={0} r={width * 0.13} fill="#fff3c4" opacity={0.36} />
      ) : null}
      {treatment.taillightGlow ? (
        <circle cx={rearX} cy={0} r={width * 0.1} fill="#ff5a5a" opacity={0.3} />
      ) : null}
    </>
  );
}

export default function TrafficVehicleMarker({ vehicle, timeOfDay }) {
  if (!vehicle || vehicle.occluded) return null;
  const scale = vehicle.scale || 1;
  const length = CAR_FOOTPRINT.length * scale;
  const width = CAR_FOOTPRINT.width * scale;
  const treatment = resolveTrafficCorridorLightTreatment(timeOfDay);
  const opacity = vehicle.opacity ?? 1;
  const vehicleClass = vehicle.vehicleClass || DEFAULT_VEHICLE_CLASS;
  const bodyColor = vehicle.bodyColor || DEFAULT_BODY_COLOR;
  const accentColor = vehicle.accentColor || DEFAULT_ACCENT_COLOR;
  const Silhouette = resolveVehicleSilhouette(vehicleClass);
  return (
    <g
      transform={`translate(${vehicle.x} ${vehicle.y}) rotate(${vehicle.headingDeg})`}
      opacity={opacity}
      data-traffic-vehicle="true"
      data-traffic-vehicle-class={vehicleClass}
      data-traffic-route-id={vehicle.routeId || undefined}
      aria-hidden="true"
    >
      {/* Section 8/9 — one restrained ground-contact shadow, tightened to
          a contact-patch size (was ~matching the full body footprint,
          which read as a second visible shape) and softened with the
          same subtle blur as the body, reduced (not removed) at night. */}
      <ellipse
        cx={0}
        cy={0}
        rx={length * 0.44}
        ry={width * 0.4}
        fill="#000000"
        opacity={treatment.shadowOpacity}
        style={{ filter: PLATE_BLEND_FILTER }}
      />
      {/* Section 8 (anchoring) — the local 220x100 silhouette box is
          translated/scaled so it exactly fills the length x width
          footprint centered on the sampled route point (the vehicle's
          own anchor), the same anchoring the old
          <image x={-length/2} y={-width/2}> produced. */}
      <g
        transform={`translate(${-length / 2} ${-width / 2}) scale(${length / 220} ${width / 100})`}
        style={{
          filter: treatment.bodyDarken ? `brightness(${1 - treatment.bodyDarken}) ${PLATE_BLEND_FILTER}` : PLATE_BLEND_FILTER,
        }}
      >
        <Silhouette bodyColor={bodyColor} accentColor={accentColor} />
      </g>
      <VehicleLights length={length} width={width} treatment={treatment} />
    </g>
  );
}
