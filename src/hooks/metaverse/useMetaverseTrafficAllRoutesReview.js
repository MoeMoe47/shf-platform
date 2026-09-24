// MET-16C — Dev-Only All-Routes Live Preview: production runtime controller.
//
// Drives ONE shared requestAnimationFrame loop for every APPROVED,
// CAR-eligible route simultaneously — never one loop per route. Reuses
// the exact same per-vehicle engine (advanceVehicleState,
// resolveTrafficCorridorVehicleAppearance, computeDeterministicVehicleOffsets)
// useMetaverseTrafficCorridor.js already uses, composed for many routes at
// once by advanceRouteFleetVehicles. Entirely separate from
// useMetaverseTrafficAuthoring.js and useMetaverseTrafficCorridor.js: it
// never reads/writes authoring state and is gated by its own
// resolveTrafficAllRoutesReviewEnabled flag.
import { useEffect, useMemo, useRef, useState } from "react";
import trafficRouteData from "@/system/metaverse/traffic/metaverseTrafficRoutes.json";
import { computeDeterministicVehicleOffsets, createVehicleState } from "@/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";
import {
  ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE,
  advanceRouteFleetVehicles,
  resolveAllRoutesReviewEligibility,
  resolveTrafficCorridorVehicleAppearance,
} from "@/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";

export default function useMetaverseTrafficAllRoutesReview({ enabled, reducedMotion = false } = {}) {
  const eligibility = useMemo(() => resolveAllRoutesReviewEligibility(trafficRouteData.routes), []);
  const routes = eligibility.selected;
  const [renderedVehicles, setRenderedVehicles] = useState([]);

  const vehicleStatesRef = useRef(new Map());
  const previousHeadingsRef = useRef(new Map());
  const routeElapsedRef = useRef(new Map());

  // Section 16 — reduced motion: every route's vehicles render once, at
  // their fixed starting offsets, with no rAF loop and no start-stagger
  // delay (there is nothing to stagger the arrival of if nothing moves).
  useEffect(() => {
    if (!enabled || !routes.length) {
      setRenderedVehicles([]);
      return undefined;
    }
    if (reducedMotion) {
      const staticVehicles = [];
      for (const route of routes) {
        const offsets = computeDeterministicVehicleOffsets(ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE);
        offsets.forEach((offset, slot) => {
          const state = createVehicleState(offset);
          const appearance = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: state, previousHeadingDeg: undefined, headingSmoothingFactor: 1 });
          if (appearance) staticVehicles.push({ key: `${route.id}:${slot}`, routeId: route.id, ...appearance });
        });
      }
      setRenderedVehicles(staticVehicles);
      return undefined;
    }

    vehicleStatesRef.current = new Map();
    previousHeadingsRef.current = new Map();
    routeElapsedRef.current = new Map();

    let frame;
    let lastTimestamp = null;
    const runFrame = (timestamp) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dtSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      const nextRendered = advanceRouteFleetVehicles({
        routes,
        vehicleCountPerRoute: ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE,
        dtSeconds,
        vehicleStates: vehicleStatesRef.current,
        previousHeadings: previousHeadingsRef.current,
        routeElapsed: routeElapsedRef.current,
      });
      setRenderedVehicles(nextRendered);
      frame = requestAnimationFrame(runFrame);
    };
    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [enabled, reducedMotion, routes]);

  return {
    enabled: Boolean(enabled && routes.length),
    routes,
    skippedRoutes: eligibility.skipped,
    renderedVehicles,
  };
}
