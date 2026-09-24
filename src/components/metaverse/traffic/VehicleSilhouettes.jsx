import React from "react";

// MET-16C — Reference Corridor Vehicle Realism.
//
// Replaces the MET-16B placeholder assets (public/assets/metaverse/traffic/
// vehicles/*.svg — flat single-color rounded rectangles with two window
// cutouts and a baked-in shadow) with inline, parametrized silhouettes.
// That change was necessary, not cosmetic-only: a static <image href> file
// bakes in ONE fixed body color per class, so "realistic restrained color
// variety, deterministic per vehicle slot" (this phase's color-palette
// requirement) was not achievable without either a combinatorial file per
// color (not maintainable) or moving the silhouette into React so color is
// a prop. All three shapes below share the same local coordinate
// convention the old assets used — a 220x100 box, nose at the HIGH-x end
// (x=220 side), so heading 0deg still means "pointing along +x" with no
// per-asset base rotation offset, and every existing spline/heading math
// in metaverseTrafficLivePreviewModel.js / metaverseTrafficCorridorRuntime.js
// is untouched.
//
// No ground-contact shadow is drawn here — that stays centralized in
// TrafficVehicleMarker.jsx.
//
// MET-16C.2 — owner visual review found CAR/SUV still reading as
// "capsule-like": the prior body corner radius (rx=18 on a 40-tall body,
// rx=11 on a 60-tall body) was close to half the body height, which
// renders as a near-semicircular cap at the TAIL end specifically (the
// nose already had a wedge polygon breaking its roundness, but the tail
// did not). Every body/cabin corner radius below is reduced to a small
// fraction of its own height (never more than ~20%) so the tail reads as
// a rounded-but-square trunk edge, not a pill cap. Cabin/glass width was
// also narrowed on both classes per this phase's "narrower cabin/glass
// area" note.

const WHEEL_ARCH_COLOR = "#0b0f16";
const GLASS_COLOR = "#7dd3fc";
// MET-16C.2 Section 7 — the MET-16C.1 outline (opacity 0.45) read as
// visibly "traced"/cartoon-like at normal city zoom. Reduced so the
// stroke still separates a body panel from the busy road texture behind
// it without itself being a legible line.
const BODY_STROKE = "rgba(0,0,0,0.24)";
const BODY_STROKE_WIDTH = 1.1;
const CABIN_STROKE_WIDTH = 0.6;

function WheelArches({ positions, rx = 9, ry = 6 }) {
  return (
    <>
      {positions.map(([cx, cy], index) => (
        <ellipse key={index} cx={cx} cy={cy} rx={rx} ry={ry} fill={WHEEL_ARCH_COLOR} opacity={0.62} />
      ))}
    </>
  );
}

function CenterlineHighlight({ x, width, y = 48, height = 3 }) {
  return <rect x={x} y={y} width={width} height={height} rx={height / 2} fill="#ffffff" opacity={0.08} />;
}

// CAR (sedan) — body longer than tall (182x36, ~5:1), a small rx=7
// corner radius (not a semicircle), a tapered nose wedge, and a narrowed
// cabin (58 wide, was 76) so the glass area reads as a compartment on the
// body rather than nearly the whole body being "glass". Front windshield
// stays brighter/larger than the rear window for a front/rear read.
export function SedanSilhouette({ bodyColor, accentColor }) {
  return (
    <g>
      <rect x={18} y={32} width={182} height={36} rx={7} fill={bodyColor} stroke={BODY_STROKE} strokeWidth={BODY_STROKE_WIDTH} />
      <polygon points="206,50 182,34 182,66" fill={bodyColor} stroke={BODY_STROKE} strokeWidth={BODY_STROKE_WIDTH} strokeLinejoin="round" />
      <rect x={18} y={32} width={64} height={36} rx={7} fill={accentColor} opacity={0.42} />
      <rect x={78} y={24} width={58} height={52} rx={8} fill="#0f172a" stroke={BODY_STROKE} strokeWidth={CABIN_STROKE_WIDTH} />
      <rect x={116} y={29} width={20} height={42} rx={6} fill={GLASS_COLOR} opacity={0.7} />
      <rect x={84} y={29} width={18} height={42} rx={6} fill={GLASS_COLOR} opacity={0.3} />
      <WheelArches positions={[[160, 29], [160, 71], [58, 29], [58, 71]]} rx={9} ry={6} />
      <CenterlineHighlight x={22} width={174} />
    </g>
  );
}

// SUV — taller/boxier footprint from above (186x56, ~3.3:1, vs the
// sedan's ~5:1) is what carries "SUV-ness" now that MET-16C.2 caps its
// absolute size below the sedan's (see TRAFFIC_VEHICLE_CLASS_SCALE.SUV):
// a longer cabin (84 wide vs the sedan's 58) and a taller stance read as
// SUV-shaped independent of final on-screen size. Corner radius kept
// modest (rx=9 on a 56-tall body, ~16%) — boxier than the sedan but not
// a plain rectangle.
export function SuvSilhouette({ bodyColor, accentColor }) {
  return (
    <g>
      <rect x={16} y={22} width={186} height={56} rx={9} fill={bodyColor} stroke={BODY_STROKE} strokeWidth={BODY_STROKE_WIDTH} />
      <polygon points="202,50 184,27 184,73" fill={bodyColor} stroke={BODY_STROKE} strokeWidth={BODY_STROKE_WIDTH} strokeLinejoin="round" />
      <rect x={16} y={22} width={68} height={56} rx={9} fill={accentColor} opacity={0.42} />
      <rect x={68} y={14} width={84} height={72} rx={10} fill="#0f172a" stroke={BODY_STROKE} strokeWidth={CABIN_STROKE_WIDTH} />
      <rect x={124} y={20} width={26} height={66} rx={8} fill={GLASS_COLOR} opacity={0.7} />
      <rect x={76} y={20} width={24} height={66} rx={8} fill={GLASS_COLOR} opacity={0.3} />
      <WheelArches positions={[[158, 23], [158, 79], [54, 23], [54, 79]]} rx={10} ry={7} />
      <CenterlineHighlight x={20} width={178} height={4} />
    </g>
  );
}

// SMALL_TRUCK — distinct cab (front third) + open flatbed (rear two
// thirds) with a lighter bed-floor panel and raised side-rail lines,
// blunter/more upright nose than the sedan. Not part of this corridor's
// active mix (see metaverseTrafficCorridorRuntime.js's class-mix
// comment — its NEAR-scale width exceeds the measured lane) but kept
// defined/exported for a future, wider-laned corridor.
export function SmallTruckSilhouette({ bodyColor, accentColor }) {
  return (
    <g>
      <rect x={12} y={28} width={196} height={44} rx={8} fill={bodyColor} stroke={BODY_STROKE} strokeWidth={BODY_STROKE_WIDTH} />
      <polygon points="206,50 194,29 194,71" fill={bodyColor} stroke={BODY_STROKE} strokeWidth={BODY_STROKE_WIDTH} strokeLinejoin="round" />
      <rect x={16} y={34} width={118} height={32} rx={4} fill={accentColor} opacity={0.55} stroke={BODY_STROKE} strokeWidth={CABIN_STROKE_WIDTH} />
      <line x1="44" y1="34" x2="44" y2="66" stroke={accentColor} strokeWidth="2" opacity={0.5} />
      <line x1="72" y1="34" x2="72" y2="66" stroke={accentColor} strokeWidth="2" opacity={0.5} />
      <line x1="100" y1="34" x2="100" y2="66" stroke={accentColor} strokeWidth="2" opacity={0.5} />
      <rect x={142} y={18} width={64} height={64} rx={8} fill="#0f172a" stroke={BODY_STROKE} strokeWidth={CABIN_STROKE_WIDTH} />
      <rect x={162} y={24} width={30} height={52} rx={7} fill={GLASS_COLOR} opacity={0.6} />
      <WheelArches positions={[[180, 26], [180, 74], [46, 26], [46, 74]]} rx={10} ry={7} />
      <CenterlineHighlight x={16} width={110} height={3} />
    </g>
  );
}

export const VEHICLE_SILHOUETTES = {
  CAR: SedanSilhouette,
  SUV: SuvSilhouette,
  SMALL_TRUCK: SmallTruckSilhouette,
};

export function resolveVehicleSilhouette(vehicleClass) {
  return VEHICLE_SILHOUETTES[vehicleClass] || VEHICLE_SILHOUETTES.CAR;
}
