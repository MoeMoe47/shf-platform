// Pure presentation-math helpers for MET-15E1's river/rapids motion layer.
// No DOM, no React — kept separate from the component so the masking/
// rotation/time-of-day math is directly unit-testable, mirroring the
// metaverseVehicleMotion.js / metaverseRoadTraceRegistry.js pattern used
// throughout the rest of the metaverse system. Presentation only: this
// module has no authority, no vehicle/road registry access or mutation.
//
// MET-15K — DEBUG / REFERENCE ONLY. MetaverseRiverMotionLayer.jsx (the
// component that used to consume this module to render rapids/whitewater)
// was deleted: the runtime-traced river-motion system is
// RETIRED_FROM_PRODUCTION (the traced water motion did not read as
// convincing). Nothing in the production render path imports this file
// anymore. Kept because the clip-path/time-of-day/layer-selection math is
// still useful reference for the future Cinematic Living City Layer
// (MET-16) — see docs/metaverse/MET-15K_CLEANUP_NOTES.md. Do not re-wire
// this into production without owner review.

import { resolvePolylinePosition } from "./metaverseVehicleMotion.js";

// Converts a set of scene points (0-100, same convention as every other
// metaverse registry) directly into a CSS clip-path polygon() value. No
// bounding-box normalization is needed because every water layer this
// feeds is positioned inset:0 across the full 0-100 scene box (the same
// convention MetaverseRoadTraceDebugLayer/MetaverseVehicleLayer already
// use) — so a zone's own registry coordinates ARE its clip-path
// percentages, with zero risk of the visual mask drifting from the
// authoritative geometry in metaverseRiverFlowRegistry.js.
export function polygonPointsToClipPath(points) {
  return `polygon(${points.map((point) => `${point.x}% ${point.y}%`).join(", ")})`;
}

// atan2-based headings (0deg = pointing right/+x, standard math
// convention, matching metaverseVehicleMotion.js) need converting to CSS
// <gradient-angle> convention (0deg = pointing up, clockwise positive) to
// orient a repeating-linear-gradient flow-streak layer along real mapped
// flow direction instead of an arbitrary/guessed angle.
export function headingDegToCssGradientAngle(headingDeg) {
  return (90 - headingDeg + 360) % 360;
}

// First-segment heading of a flow path, in CSS gradient-angle degrees —
// the actual value MetaverseRiverMotionLayer uses to orient a zone's flow
// streaks, derived from real metaverseRiverFlowRegistry.js points rather
// than an arbitrary constant.
export function flowPathToCssAngle(flowPath) {
  if (!flowPath || !Array.isArray(flowPath.points) || flowPath.points.length < 2) return 90;
  const heading = resolvePolylinePosition(flowPath.points, 0)?.headingDeg ?? 0;
  return headingDegToCssGradientAngle(heading);
}

// MET-15E1 Phase 11: DAY/DUSK/NIGHT presentation tuning. Foam/whitewater
// stays a restrained neutral tone at every mode — this only adjusts
// opacity/brightness, never introduces a glow or bright-white/neon result,
// per the explicit "restrained" requirement. Production still has one base
// plate + CSS tint (per MET-15A/B), so this tunes overlay presentation
// only; it does not select or invent separate source images.
export const METAVERSE_RIVER_TIME_OF_DAY_PROFILES = {
  DAY: { foamOpacity: 0.55, streakOpacity: 0.22, brightness: 1.05, tint: "rgba(226, 240, 248, 1)" },
  DUSK: { foamOpacity: 0.42, streakOpacity: 0.16, brightness: 0.92, tint: "rgba(255, 214, 170, 1)" },
  NIGHT: { foamOpacity: 0.26, streakOpacity: 0.1, brightness: 0.68, tint: "rgba(150, 178, 205, 1)" },
};

export function resolveRiverTimeOfDayProfile(timeOfDay) {
  const normalized = String(timeOfDay || "DUSK").toUpperCase();
  return METAVERSE_RIVER_TIME_OF_DAY_PROFILES[normalized] || METAVERSE_RIVER_TIME_OF_DAY_PROFILES.DUSK;
}

// MET-15E1 Phase 13: which water layers are active for a given performance
// state. LOW keeps exactly one restrained rapids presentation (the static
// foam base) and drops the secondary turbulence + streak layers entirely,
// rather than removing the river/rapids presentation altogether.
//
// Reduced motion is deliberately NOT modeled here as "layer removal": per
// Phase 12 the preferred behavior is a static subtle water presentation,
// so streak/turbulence layers still render at STANDARD performance under
// reduced motion — only their CSS animation stops (via the existing
// .met-shell[data-reduced-motion="true"] pattern already used everywhere
// else in this codebase, applied to .met-river-streak-line/.met-river-wash
// — see metaverse-city.css). `animated` is exposed for callers that want
// to know the motion state without re-deriving it.
export function resolveActiveWaterLayers({ reducedMotion = false, performanceMode = "STANDARD" } = {}) {
  if (performanceMode === "LOW") {
    return { rapidsFoam: true, rapidsStreaks: false, turbulence: false, calmStreaks: false, animated: false };
  }
  return {
    rapidsFoam: true,
    rapidsStreaks: true,
    turbulence: true,
    calmStreaks: true,
    animated: !reducedMotion,
  };
}
