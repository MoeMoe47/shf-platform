// A marker/overlay percentage only stays attached to the same source-image
// pixel if the box it is percentaged against has the SAME aspect ratio as
// the source image, at every container size. Any box whose aspect ratio
// tracks the *container* instead (the pre-MET-15A behavior) crops the image
// differently per viewport, so a fixed x/y percentage lands on different
// image content depending on window shape. Locking the box's own aspect
// ratio to the image removes that dependency: background-size: cover then
// has nothing left to crop (box aspect === image aspect), so any x/y
// percentage of the box is exactly that percentage of the source image,
// regardless of container width/height.
export const METAVERSE_SCENE_IMAGE_ASPECT_RATIO = 1672 / 941;

// MET-16C.4 — LOCKED ARCHITECTURE: two independent concepts that MET-16C.3
// accidentally coupled through a single uniform box-scale factor.
//
//   A. VISIBLE CAMERA FRAMING — what fraction of the source image is
//      visible at rest (pan = 0, zoom = 1). This is a *design* choice
//      ("show essentially the full city"), not a safety constraint.
//   B. WORLD OVERSCAN BUFFER — the hidden margin around that visible
//      framing that panning can reveal before running off the edge of
//      the source image.
//
// Under this box-transform architecture (world box sized to
// overscan * containerSize, `background-size: cover`, panned via CSS
// `translate3d(x%, y%, 0)`, which is a FIXED pixel shift — x%/y% resolve
// against the box's own un-scaled layout size, and `scale(zoom)` composes
// afterward, so zoom only ever *increases* the safety margin around the
// box's own center, never decreases it), the visible-at-rest fraction of
// the image is mathematically exactly `1 / overscan`. That is the whole
// bug: MET-16C.3 raised `overscan` from 1.08 to ~1.84 to make a big pan
// range safe, which — under this same formula — also collapsed the
// default visible fraction from 92.6% to 54.4% (a provable, not
// eyeballed, regression; see tests/metaverseCameraOverscanSeam.test.mjs).
// There is no way to size ONE uniform box-scale factor that is
// simultaneously "close to 1" (full-city framing) and "large enough to
// safely absorb a wide pan range" — those two asks are in direct
// mathematical tension under this architecture.
//
// The fix inverts MET-16C.3's dependency direction. Overscan is now the
// fixed, framing-driven source of truth (restored to the original 1.08,
// i.e. the original ~92.6% default visible framing), and the pan bounds
// are DERIVED from it (resolveSafePanBoundPercent, the exact inverse of
// resolveSafeCameraOverscan below) so they are mathematically guaranteed
// never to expose an edge — rather than being an independently-chosen
// "feels generous" number as they were before MET-16C.3 ever touched
// this file (±22%/±18%, which — per that phase's own math — were NEVER
// actually safe against ANY overscan close to 1.08; the seam was latent
// from the moment those bounds were set, not introduced by MET-16C.3).
export const METAVERSE_CAMERA_WORLD_OVERSCAN = 1.08;

// Returns the minimum overscan factor at which the world box, panned to
// its absolute clamp limit on EITHER axis (at zoom = 1, the worst case —
// zooming in only ever increases the box's rendered size around its own
// center, which strictly increases the edge margin, so zoom never makes
// this worse), still fully covers the container with no exposed edge.
//
// Derivation (one axis, e.g. y — x is symmetric): let H = container
// height, k = overscan. World box height = k*H, centered, so it extends
// H*(k-1)/2 beyond the container on each side. Panning by y% shifts the
// box by (y/100)*k*H (percent is of the box's OWN height). The shrinking
// side's remaining margin must stay >= 0:
//   H*(k-1)/2 >= (y/100)*k*H  =>  k*(1 - 2*y/100) >= 1  =>  k >= 1/(1 - 2*y/100)
// `marginFactor` adds a small safety margin on top of the exact
// breakeven value (browsers can round sub-pixel box dimensions). Kept as
// a general, independently-usable derivation (also used the other
// direction by resolveSafePanBoundPercent below, and exercised directly
// by tests) even though the shipped constants below now flow the
// opposite way (overscan fixed, pan bounds derived).
export function resolveSafeCameraOverscan(panBounds, marginFactor = 1.03) {
  const breakevenFor = (panPercent) => {
    const p = Math.max(0, Math.min(49, panPercent)) / 100;
    return 1 / (1 - 2 * p);
  };
  return Math.max(breakevenFor(panBounds.x), breakevenFor(panBounds.y)) * marginFactor;
}

// The exact algebraic inverse of resolveSafeCameraOverscan: given a fixed
// overscan (chosen for default-framing fidelity, not safety), returns the
// maximum pan percentage that is still mathematically guaranteed not to
// expose an edge — `marginFactor` shrinks it slightly below the exact
// breakeven point for the same sub-pixel-rounding cushion
// resolveSafeCameraOverscan adds on its side.
//   k*(1 - 2*p) >= 1  =>  p <= (1 - 1/k) / 2 = (k-1) / (2*k)
export function resolveSafePanBoundPercent(overscan = METAVERSE_CAMERA_WORLD_OVERSCAN, marginFactor = 1.03) {
  const breakevenFraction = (overscan - 1) / (2 * overscan);
  return (breakevenFraction / marginFactor) * 100;
}

// MET-16C.4 — a deliberate "center this point" camera move (the sidebar's
// "jump to district/facility" focusCamera) legitimately needs a much
// bigger pan than free-roam drag/keyboard ever does (district markers sit
// up to ~28% off-center — see tests/metaverseCameraOverscanSeam.test.mjs
// for the exact measured range), which METAVERSE_CAMERA_PAN_BOUNDS (sized
// for framing fidelity, not this use case) does not safely cover at
// zoom = 1. Rather than either (a) clamping focusCamera to the tiny
// free-roam bound, which would make "jump to district" silently fail to
// actually reach most districts, or (b) giving it its own hardcoded pan
// range with no safety proof (the exact MET-16C.3/16C.4 mistake, a third
// time), this computes the MINIMUM zoom that keeps a specific requested
// pan distance safe, so focusCamera can zoom in exactly as much as that
// one jump needs (solving the same inequality as
// resolveSafeCameraOverscan/resolveSafePanBoundPercent for zoom instead
// of overscan/pan): zoom*k - 1 >= 2*(p/100)*k  =>  zoom >= 1/k + 2p/100.
export function resolveSafeZoomForPan(panPercent, overscan = METAVERSE_CAMERA_WORLD_OVERSCAN, marginFactor = 1.03) {
  const p = Math.abs(panPercent);
  return (1 / overscan + (2 * p) / 100) * marginFactor;
}

// The exact inverse of resolveSafeZoomForPan: given a chosen zoom level,
// the maximum pan percentage that stays seam-safe at that zoom. Used to
// clamp a requested pan as a last-resort safety net in the (currently
// unreached — every real marker/facility needs zoom <= ~1.53, well under
// the existing 1.8 max) case a target is far enough off-center that even
// the maximum zoom can't make centering on it fully safe.
export function resolveSafePanBoundPercentAtZoom(zoom, overscan = METAVERSE_CAMERA_WORLD_OVERSCAN, marginFactor = 1.03) {
  const safeZoom = zoom / marginFactor;
  return Math.max(0, (safeZoom - 1 / overscan) * 50);
}

// MET-16C.4 — derived FROM METAVERSE_CAMERA_WORLD_OVERSCAN (the opposite
// direction from MET-16C.3's `resolveSafeCameraOverscan()` call), so
// framing and pan-safety can never drift out of sync again, just from the
// other end: change the overscan (a framing decision) and the safe pan
// range recalculates with it automatically, rather than a hand-picked pan
// range silently outrunning whatever overscan happens to be set.
// Symmetric on x/y because the overscan itself is applied uniformly to
// both axes (see computeMetaverseCameraWorldRect) — there is no
// correctness reason for x and y to have independently-chosen bounds, and
// the previous asymmetric ±22/±18 pair was never derived from anything.
export const METAVERSE_CAMERA_PAN_BOUNDS = {
  x: resolveSafePanBoundPercent(METAVERSE_CAMERA_WORLD_OVERSCAN),
  y: resolveSafePanBoundPercent(METAVERSE_CAMERA_WORLD_OVERSCAN),
};

export function computeMetaverseCameraWorldRect({
  containerWidth,
  containerHeight,
  aspectRatio = METAVERSE_SCENE_IMAGE_ASPECT_RATIO,
  overscan = METAVERSE_CAMERA_WORLD_OVERSCAN,
}) {
  if (!containerWidth || !containerHeight || !aspectRatio) {
    return { width: 0, height: 0, left: 0, top: 0 };
  }
  const containerAspect = containerWidth / containerHeight;
  let width;
  let height;
  if (containerAspect > aspectRatio) {
    width = containerWidth;
    height = containerWidth / aspectRatio;
  } else {
    height = containerHeight;
    width = containerHeight * aspectRatio;
  }
  width *= overscan;
  height *= overscan;
  return {
    width,
    height,
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
  };
}

// Resolves a box-relative x/y percentage (0-100, the existing marker
// convention) to the fraction (0-1) of the underlying source image it lands
// on, by independently modeling what `background-size: cover` renders
// inside a box of rect.width x rect.height for a source image of
// imageWidth x imageHeight. This does not assume rect is aspect-locked to
// the image; it re-derives the cover-crop math from scratch so it can be
// used to prove (in tests) that computeMetaverseCameraWorldRect's output
// keeps this fraction constant across container sizes, rather than
// asserting a conclusion the rect math already assumes.
export function resolveSourceImageFraction(
  { x, y },
  rect,
  { imageWidth = 1672, imageHeight = 941 } = {},
) {
  if (!rect || !rect.width || !rect.height || !imageWidth || !imageHeight) {
    return { fractionX: null, fractionY: null };
  }
  const scale = Math.max(rect.width / imageWidth, rect.height / imageHeight);
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  const offsetX = (rect.width - displayedWidth) / 2;
  const offsetY = (rect.height - displayedHeight) / 2;
  const pointX = (x / 100) * rect.width;
  const pointY = (y / 100) * rect.height;
  return {
    fractionX: (pointX - offsetX) / scale / imageWidth,
    fractionY: (pointY - offsetY) / scale / imageHeight,
  };
}
