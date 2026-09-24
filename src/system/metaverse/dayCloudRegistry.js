// DAY CLOUD PLACEMENT V1 — canonical Day cloud composition.
//
// Six owner-approved cloud assets (public/assets/metaverse/clouds/day/),
// each assigned to one fixed canonical role and placed at the exact
// approved starting composition. This is DAY-only: no Dusk/Night cloud
// assets or roles exist here, and MetaverseDayCloudLayer only renders
// when the resolved time-of-day is DAY.
//
// Positioning is expressed in the SAME 0-100 scene-percentage coordinate
// system every other living-city layer uses (left/top/width as % of the
// shared world box that also sizes the background plate and markers —
// see MetaverseCamera.jsx's worldBoxStyle / metaverseCameraProjection.js).
// Clouds are rendered inside that same box, so panning/zooming the camera
// moves clouds exactly like the city plate and markers do, rather than
// clouds staying pinned to the browser viewport.
//
// Horizontal drift is expressed as a pixel-based translateX keyframe
// range (start/end, in px) rather than element-relative CSS `%` (which
// resolves against the cloud's OWN box, not the scene box, and would
// require per-cloud math anyway to guarantee off-screen loop
// boundaries). start/end are calibrated so the cloud is genuinely off the
// visible frame at both keyframe boundaries (see the calibration script
// in this phase's report) — the animation loops via
// `animation-iteration-count: infinite`, and because the reset only ever
// happens while the cloud is off-screen, it is never a visible jump
// ("no abrupt resets"). durationSeconds is derived from the requested
// px/s speed against a 1400px reference width — a deliberate approximate
// calibration (the brief's own speeds are labeled "suggested starting
// speeds"), not a live per-viewport remeasurement; see the phase report
// for the P1 note on true viewport-independent speed.
//
// driftDelaySeconds (DAY CLOUD VISIBILITY DIAGNOSTIC fix): a negative
// `animation-delay`, so playback begins as if already `-driftDelaySeconds`
// into the cycle. Without this, t=0 (page load) IS the off-screen `from`
// keyframe by construction (see above), so every cloud would be fully
// invisible until the animation had run for however long it takes to
// drift from off-screen to its approved left/top anchor — up to ~93s for
// the slowest clouds. The negative delay is set to exactly that time-to-
// anchor, so the cloud is already AT its approved anchor position at
// t=0, while the off-screen loop/reset mechanics above are completely
// unchanged (only the playback starting point shifts).
//
// verticalDrift is a small, independent ease-in-out oscillation
// (amplitude/duration both vary per cloud, so none of the six ever
// synchronize) layered on top via a second, always-alternating keyframe
// — alternating is fine for this tiny (4-10px) vertical wobble; it is
// the *horizontal* drift that must never bounce, per the brief.

// MET convention (see metaverseVisualAssets.js's dayAsset/duskAsset/
// nightAsset entries, and metaverseTrafficLivePreviewModel.js's vehicle
// assets): store the path WITH the "public/" prefix and no leading
// slash, resolved at render time via publicAssetUrl() (which strips
// "public/" and prepends import.meta.env.BASE_URL) rather than a
// hardcoded absolute "/assets/..." path, so this keeps working correctly
// even if the app's Vite base path ever changes from the current root.
export const DAY_CLOUD_ASSET_BASE = "public/assets/metaverse/clouds/day";

// DAY CLOUD THICKNESS TUNING V2 — primary width/opacity raised modestly
// for fuller existing cloud masses (placement anchors and direction remain
// unchanged). See
// DAY_CLOUD_COMPANION_ROLES further down for the thickness companions
// added in this same pass.
export const DAY_CLOUD_ROLES = [
  {
    id: "far_a",
    role: "FAR_SKY_CLOUD_A",
    asset: `${DAY_CLOUD_ASSET_BASE}/far_a.png`,
    left: 8,
    top: 10,
    width: 18,
    opacity: 0.54,
    blurPx: 0.75,
    direction: "ltr",
    speedPxPerSecond: 12,
    driftStartPx: -396,
    driftEndPx: 1348,
    durationSeconds: 145,
    driftDelaySeconds: -32.9,
    verticalDrift: { amplitudePx: 6, durationSeconds: 22 },
  },
  {
    id: "far_b",
    role: "FAR_SKY_CLOUD_B",
    asset: `${DAY_CLOUD_ASSET_BASE}/far_b.png`,
    left: 42,
    top: 8,
    width: 21,
    opacity: 0.51,
    blurPx: 0.5,
    direction: "ltr",
    speedPxPerSecond: 10,
    driftStartPx: -900,
    driftEndPx: 872,
    durationSeconds: 177,
    driftDelaySeconds: -89.9,
    verticalDrift: { amplitudePx: 8, durationSeconds: 28 },
  },
  {
    id: "far_c",
    role: "FAR_SKY_CLOUD_C",
    asset: `${DAY_CLOUD_ASSET_BASE}/far_c.png`,
    left: 73,
    top: 11,
    width: 18,
    opacity: 0.53,
    blurPx: 0.5,
    direction: "ltr",
    speedPxPerSecond: 14,
    driftStartPx: -1292,
    driftEndPx: 438,
    durationSeconds: 124,
    driftDelaySeconds: -92.6,
    verticalDrift: { amplitudePx: 5, durationSeconds: 24 },
  },
  {
    id: "skyline_band",
    role: "MAIN_SKYLINE_CLOUD_BAND",
    asset: `${DAY_CLOUD_ASSET_BASE}/skyline_band.png`,
    left: 6,
    top: 26,
    width: 66,
    opacity: 0.45,
    blurPx: 1,
    direction: "rtl",
    speedPxPerSecond: 18,
    driftStartPx: 1376,
    driftEndPx: -1020,
    durationSeconds: 133,
    driftDelaySeconds: -76.43,
    verticalDrift: { amplitudePx: 4, durationSeconds: 32 },
  },
  {
    id: "city_right",
    role: "SECONDARY_RIGHT_CITY_CLOUD",
    asset: `${DAY_CLOUD_ASSET_BASE}/city_right.png`,
    left: 73,
    top: 32,
    width: 28,
    opacity: 0.36,
    blurPx: 1,
    direction: "rtl",
    speedPxPerSecond: 16,
    // THICKNESS V2: driftEndPx widened -1410 -> -1425 (and
    // driftDelaySeconds re-derived to match) purely so the wider 28%
    // cloud is still genuinely offscreen at its "to" keyframe — the
    // approved width increase alone would otherwise leave a ~10px
    // sliver visible at the loop reset. Travel/implied speed and the
    // t=0 anchor position are unchanged in every way a human can see.
    driftStartPx: 438,
    driftEndPx: -1425,
    durationSeconds: 116,
    driftDelaySeconds: -27.27,
    verticalDrift: { amplitudePx: 7, durationSeconds: 26 },
  },
  {
    id: "city_left",
    role: "LOWER_LEFT_CITY_PASS_CLOUD",
    asset: `${DAY_CLOUD_ASSET_BASE}/city_left.png`,
    left: 2,
    top: 34,
    width: 23,
    opacity: 0.28,
    blurPx: 1,
    direction: "ltr",
    speedPxPerSecond: 20,
    // THICKNESS V1.1: driftStartPx widened -340 -> -360 (and
    // driftDelaySeconds re-derived to match) for the same reason as
    // city_right above — the wider 23% cloud needs a little more
    // offscreen runway at its "from"/wrap keyframe. Travel/implied
    // speed and the t=0 anchor position are unchanged.
    driftStartPx: -360,
    driftEndPx: 1432,
    durationSeconds: 89,
    driftDelaySeconds: -17.88,
    verticalDrift: { amplitudePx: 9, durationSeconds: 20 },
  },
];

// DAY CLOUD THICKNESS TUNING V2 — companion duplicates for far_b,
// far_c, and skyline_band ONLY (far_a, city_right, city_left stay
// single-layer). Each companion uses the SAME PNG as its parent, a
// small position offset (in scene-percentage points, added to the
// parent's own left/top), and a low opacity — the pair reads as one
// thicker cloud mass rather than two distinct clouds. A companion has
// NO motion fields of its own: resolveDayCloudCompanions() below
// copies direction/speed/drift range/duration/delay/vertical-drift
// straight from the parent role, and the component reuses the
// parent's own `metCloudDrift-<parentId>` CSS keyframe (see
// MetaverseDayCloudLayer.jsx), so a companion drifts in exact lockstep
// with its parent — never a second, independently-timed motion.
export const DAY_CLOUD_COMPANION_ROLES = [
  {
    id: "far_b_companion",
    parentId: "far_b",
    role: "FAR_SKY_CLOUD_B_COMPANION",
    width: 22,
    opacity: 0.2,
    horizontalOffsetPct: 1.8,
    verticalOffsetPct: 0.8,
  },
  {
    id: "far_c_companion",
    parentId: "far_c",
    role: "FAR_SKY_CLOUD_C_COMPANION",
    width: 19,
    opacity: 0.19,
    horizontalOffsetPct: -1.6,
    verticalOffsetPct: 0.7,
  },
  {
    id: "skyline_band_companion",
    parentId: "skyline_band",
    role: "MAIN_SKYLINE_CLOUD_BAND_COMPANION",
    width: 68,
    opacity: 0.18,
    horizontalOffsetPct: 1.2,
    verticalOffsetPct: 0.9,
  },
];

// Resolves each companion role into a fully-positioned/motion-carrying
// cloud object: same asset/blur/direction/speed/drift range/duration/
// delay/vertical-drift as its parent (looked up by parentId from
// DAY_CLOUD_ROLES — never hand-copied, so parent tuning changes can
// never silently desync a companion), left/top = parent's left/top
// plus this companion's own offset, and its own width/opacity.
export function resolveDayCloudCompanions() {
  return DAY_CLOUD_COMPANION_ROLES.map((companion) => {
    const parent = DAY_CLOUD_ROLES.find((role) => role.id === companion.parentId);
    if (!parent) {
      throw new Error(`DAY cloud companion "${companion.id}" references unknown parentId "${companion.parentId}"`);
    }
    return {
      ...companion,
      asset: parent.asset,
      left: parent.left + companion.horizontalOffsetPct,
      top: parent.top + companion.verticalOffsetPct,
      blurPx: parent.blurPx,
      direction: parent.direction,
      speedPxPerSecond: parent.speedPxPerSecond,
      driftStartPx: parent.driftStartPx,
      driftEndPx: parent.driftEndPx,
      durationSeconds: parent.durationSeconds,
      driftDelaySeconds: parent.driftDelaySeconds,
      verticalDrift: parent.verticalDrift,
    };
  });
}

// Lower-scene clearance (brief section "LOWER-SCENE CLEARANCE"): every
// role's `top` stays at or above this line, so cloud coverage never
// heavily crosses into the bridge/traffic-corridor/river-foreground/
// Mini-Map band lower in the frame.
export const DAY_CLOUD_LOWER_CLEARANCE_LINE = 45;

export function isDayCloudRoleWithinLowerClearance(cloudRole) {
  return cloudRole.top <= DAY_CLOUD_LOWER_CLEARANCE_LINE;
}
