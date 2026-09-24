// MET-16B/16C — First Live Traffic Corridor: production runtime controller.
//
// Drives a SINGLE shared requestAnimationFrame loop (never one interval per
// vehicle — same rule as useMetaverseTrafficLivePreview.js) for exactly one
// hardcoded, owner-approved corridor. This hook is entirely separate from
// useMetaverseTrafficAuthoring.js / useMetaverseTrafficLivePreview.js: it
// never reads or writes authoring state (selected route, draw mode, edit
// handles) and is gated by its own `enabled` flag
// (resolveTrafficCorridorReviewEnabled), never by
// resolveTrafficAuthoringEnabled — the two surfaces must never require one
// another and must never be on at the same time by coincidence of one flag.
//
// MET-16C adds the reference-corridor-only vehicle composition (class mix,
// color, irregular spacing, class-specific scale) — all scoped to THIS
// hook only, never to advanceRouteFleetVehicles/useMetaverseTrafficAllRoutesReview.js,
// per metaverseTrafficCorridorRuntime.js's own section comment.
import { useEffect, useMemo, useRef, useState } from "react";
import trafficRouteData from "@/system/metaverse/traffic/metaverseTrafficRoutes.json";
import { advanceVehicleState, createVehicleState } from "@/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";
import {
  TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS,
  resolveTrafficCorridorProgressPerSecond,
  resolveTrafficCorridorReviewVehicleClass,
  resolveTrafficCorridorVehicleAppearance,
  resolveTrafficVehicleClassScale,
  resolveTrafficVehicleColorForSlot,
  selectTrafficCorridorRoute,
} from "@/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";

function buildVehicleEntry({ key, slot, appearance }) {
  const vehicleClass = resolveTrafficCorridorReviewVehicleClass(slot);
  const color = resolveTrafficVehicleColorForSlot(slot);
  const classScale = resolveTrafficVehicleClassScale(vehicleClass);
  return {
    key,
    ...appearance,
    scale: appearance.scale * classScale,
    vehicleClass,
    bodyColor: color.body,
    accentColor: color.accent,
  };
}

export default function useMetaverseTrafficCorridor({ enabled, reducedMotion = false } = {}) {
  const route = useMemo(() => selectTrafficCorridorRoute(trafficRouteData.routes), []);
  const [renderedVehicles, setRenderedVehicles] = useState([]);

  const vehicleStatesRef = useRef(new Map());
  const previousHeadingsRef = useRef(new Map());

  // Section 15 — irregular (not evenly-spaced), deterministic starting
  // positions, one per reference-corridor vehicle slot.
  const offsets = TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS;

  // Section 16 — reduced motion: render each vehicle at its fixed starting
  // position, once, with no rAF loop at all (paused/static, not merely slow).
  useEffect(() => {
    if (!enabled || !route) {
      setRenderedVehicles([]);
      return undefined;
    }
    if (reducedMotion) {
      const staticVehicles = offsets.map((offset, slot) => {
        const state = createVehicleState(offset);
        const appearance = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: state, previousHeadingDeg: undefined, headingSmoothingFactor: 1 });
        return appearance ? buildVehicleEntry({ key: `${route.id}:${slot}`, slot, appearance }) : null;
      }).filter(Boolean);
      setRenderedVehicles(staticVehicles);
      return undefined;
    }

    vehicleStatesRef.current = new Map(offsets.map((offset, slot) => [`${route.id}:${slot}`, createVehicleState(offset)]));
    previousHeadingsRef.current = new Map();

    let frame;
    let lastTimestamp = null;
    const runFrame = (timestamp) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dtSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const nextRendered = [];
      offsets.forEach((offset, slot) => {
        const key = `${route.id}:${slot}`;
        const rate = resolveTrafficCorridorProgressPerSecond(route.speed_class, slot);
        const current = vehicleStatesRef.current.get(key) || createVehicleState(offset);
        // Section 10 — continuous corridor: loop=true, so a vehicle that
        // reaches the route end holds briefly off-screen (the model's own
        // respawn pause) before re-entering at the start, rather than
        // popping back mid-road or driving in reverse.
        const advanced = advanceVehicleState(current, dtSeconds, rate, { loop: true });
        vehicleStatesRef.current.set(key, advanced);
        const previousHeadingDeg = previousHeadingsRef.current.get(key);
        const appearance = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: advanced, previousHeadingDeg });
        if (appearance) {
          previousHeadingsRef.current.set(key, appearance.headingDeg);
          nextRendered.push(buildVehicleEntry({ key, slot, appearance }));
        }
      });
      setRenderedVehicles(nextRendered);
      frame = requestAnimationFrame(runFrame);
    };
    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [enabled, reducedMotion, route, offsets]);

  return { enabled: Boolean(enabled && route), route, renderedVehicles };
}
