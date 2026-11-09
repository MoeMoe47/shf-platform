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
import { createTrafficContinuitySignatures, reconcileTrafficContinuity } from "@/system/metaverse/traffic/metaverseTrafficContinuity.js";
import { computeDeterministicVehicleOffsets, createVehicleState } from "@/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";
import {
  ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE,
  advanceRouteFleetVehicles,
  resolveAllRoutesReviewEligibility,
  resolveTrafficCorridorVehicleAppearance,
} from "@/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";

const EMPTY_OPTIONS = {};

export default function useMetaverseTrafficAllRoutesReview({ enabled, reducedMotion = false,
  routeSource = trafficRouteData.routes, allowCalibrated = false, routeOptions = EMPTY_OPTIONS,
  playing = true, restartKey = 0, quality, preserveCompatibleRoutes = false,
  vehicleCountPerRoute = ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE, slotActivation = null, intersectionControls = null,
} = {}) {
  // Other scenes can supply an explicitly scoped source. Defaults preserve
  // existing city behavior; [] must remain empty rather than select city roads.
  const eligibility = useMemo(() => resolveAllRoutesReviewEligibility(routeSource, { allowCalibrated }), [routeSource, allowCalibrated]);
  const routes = eligibility.selected;
  const signatures = useMemo(() => createTrafficContinuitySignatures(routes, routeOptions), [routes, routeOptions]);
  const revision = useMemo(() => JSON.stringify([...signatures]), [signatures]);
  const [rendered, setRendered] = useState({ vehicles: [], revision: null });

  const vehicleStatesRef = useRef(new Map());
  const previousHeadingsRef = useRef(new Map());
  const routeElapsedRef = useRef(new Map());
  const continuityRef = useRef({ signatures: new Map(), restartKey });

  useEffect(() => {
    if (preserveCompatibleRoutes) return;
    vehicleStatesRef.current = new Map();
    previousHeadingsRef.current = new Map();
    routeElapsedRef.current = new Map();
  }, [routes, restartKey, preserveCompatibleRoutes]);

  useEffect(() => {
    if (!preserveCompatibleRoutes) return;
    reconcileTrafficContinuity({ previous: continuityRef.current.signatures, next: signatures,
      restart: continuityRef.current.restartKey !== restartKey,
      vehicleStates: vehicleStatesRef.current, previousHeadings: previousHeadingsRef.current,
      routeElapsed: routeElapsedRef.current });
    continuityRef.current = { signatures, restartKey };
  }, [signatures, restartKey, preserveCompatibleRoutes]);

  // Section 16 — reduced motion: every route's vehicles render once, at
  // their fixed starting offsets, with no rAF loop and no start-stagger
  // delay (there is nothing to stagger the arrival of if nothing moves).
  useEffect(() => {
    if (!enabled || !routes.length) {
      setRendered({ vehicles: [], revision });
      return undefined;
    }
    if (reducedMotion) {
      if (routeOptions === EMPTY_OPTIONS) {
        const staticVehicles = [];
        for (const route of routes) {
          const offsets = computeDeterministicVehicleOffsets(ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE);
          offsets.forEach((offset, slot) => {
            const state = createVehicleState(offset);
            const appearance = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: state, previousHeadingDeg: undefined, headingSmoothingFactor: 1 });
            if (appearance) staticVehicles.push({ key: `${route.id}:${slot}`, routeId: route.id, ...appearance });
          });
        }
        setRendered({ vehicles: staticVehicles, revision });
        return undefined;
      }
    }

    let frame;
    let lastTimestamp = null;
    let lastDraw = 0;
    const paused = reducedMotion || !playing;
    const interval = quality === "Low" ? 50 : quality === "Medium" ? 34 : quality === "High" ? 34 : 0;
    const runFrame = (timestamp) => {
      if (!paused) frame = requestAnimationFrame(runFrame);
      if (lastTimestamp === null) lastTimestamp = timestamp;
      if (document.hidden) {
        lastTimestamp = timestamp;
        return;
      }
      if (timestamp - lastDraw < interval) {
        return;
      }
      lastDraw = timestamp;
      const dtSeconds = paused ? 0 : Math.min(0.1, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;
      const nextRendered = advanceRouteFleetVehicles({
        routes,
        vehicleCountPerRoute,
        slotActivation,
        intersectionControls,
        dtSeconds,
        vehicleStates: vehicleStatesRef.current,
        previousHeadings: previousHeadingsRef.current,
        routeElapsed: routeElapsedRef.current,
        routeOptions,
      });
      setRendered({ vehicles: nextRendered, revision });
    };
    runFrame(performance.now());
    return () => cancelAnimationFrame(frame);
  }, [enabled, reducedMotion, routes, playing, restartKey, quality, routeOptions, revision, vehicleCountPerRoute, slotActivation, intersectionControls]);

  return {
    enabled: Boolean(enabled && routes.length),
    routes,
    skippedRoutes: eligibility.skipped,
    renderedVehicles: rendered.revision === revision && enabled ? rendered.vehicles : [],
  };
}
