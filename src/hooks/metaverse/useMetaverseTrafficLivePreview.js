// MET-16B — Calibrated Route Live Traffic Preview: React controller hook.
//
// Drives a SINGLE shared requestAnimationFrame loop for every previewed
// vehicle (never one loop per vehicle — see metaverseTrafficLivePreviewModel.js
// Section 22 note), and only ever reads `routes`/`activeRouteId` from the
// existing MET-16A authoring controller — it never mutates a route's
// points/perspective/occlusion_segments. This is a developer-only preview:
// nothing here calls any production traffic/entry/unlock client, and no
// route status change here (including selecting a CALIBRATED/APPROVED
// route) has any production effect.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TRAFFIC_PREVIEW_DEFAULT_ROUTE_SCOPE,
  TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER,
  TRAFFIC_PREVIEW_DEFAULT_VEHICLE_COUNT,
  TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE,
  TRAFFIC_PREVIEW_VEHICLE_VISUALS,
  advanceVehicleState,
  applyBaseRotationOffset,
  computeDeterministicVehicleOffsets,
  createVehicleState,
  resolvePreviewVehicleScale,
  resolveTrafficPreviewProgressPerSecond,
  resolveVehicleAppearance,
  resolveVehicleVisualForRoute,
  selectRoutesForPreviewScope,
} from "@/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

export default function useMetaverseTrafficLivePreview({ enabled, routes, activeRouteId }) {
  const [status, setStatus] = useState("STOPPED"); // STOPPED | PLAYING | PAUSED
  const [routeScope, setRouteScope] = useState(TRAFFIC_PREVIEW_DEFAULT_ROUTE_SCOPE);
  const [vehicleCount, setVehicleCount] = useState(TRAFFIC_PREVIEW_DEFAULT_VEHICLE_COUNT);
  const [speedMultiplier, setSpeedMultiplier] = useState(TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER);
  const [loop, setLoop] = useState(false);
  // MET-16B real-vehicle-assets patch Section 6 — dev-only global scale
  // multiplier for judging vehicle footprint against the roadway. Applied
  // on top of (multiplied with) each route's own perspective scale; never
  // touches route geometry or any per-route data.
  const [previewVehicleScale, setPreviewVehicleScale] = useState(TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE);
  // Section 17 — Active Route Debug toggles. Defaults match the
  // recommended first calibration step: route line + real vehicle on,
  // ghost off (flip Ghost on afterward to compare against the real
  // vehicle on the same spline).
  const [showRouteLine, setShowRouteLine] = useState(true);
  const [showControlPoints, setShowControlPoints] = useState(true);
  const [showGhost, setShowGhost] = useState(false);
  const [showRealVehicle, setShowRealVehicle] = useState(true);
  const [renderedVehicles, setRenderedVehicles] = useState([]);

  const vehicleStatesRef = useRef(new Map());
  const previousHeadingsRef = useRef(new Map());

  const activeRoutes = useMemo(
    () => (enabled ? selectRoutesForPreviewScope(routes, routeScope, activeRouteId) : []),
    [enabled, routes, routeScope, activeRouteId],
  );

  const hasDraftRouteInScope = useMemo(() => activeRoutes.some((route) => route.status === "DRAFT"), [activeRoutes]);

  const seedVehicleStates = useCallback(() => {
    const map = new Map();
    for (const route of activeRoutes) {
      computeDeterministicVehicleOffsets(vehicleCount).forEach((offset, slot) => {
        map.set(`${route.id}:${slot}`, createVehicleState(offset));
      });
    }
    vehicleStatesRef.current = map;
    previousHeadingsRef.current = new Map();
  }, [activeRoutes, vehicleCount]);

  const start = useCallback(() => {
    if (!activeRoutes.length) return;
    if (vehicleStatesRef.current.size === 0) seedVehicleStates();
    setStatus("PLAYING");
  }, [activeRoutes.length, seedVehicleStates]);

  const pause = useCallback(() => setStatus((previous) => (previous === "PLAYING" ? "PAUSED" : previous)), []);

  const restart = useCallback(() => {
    seedVehicleStates();
    setStatus(activeRoutes.length ? "PLAYING" : "STOPPED");
  }, [seedVehicleStates, activeRoutes.length]);

  const stop = useCallback(() => {
    vehicleStatesRef.current = new Map();
    previousHeadingsRef.current = new Map();
    setRenderedVehicles([]);
    setStatus("STOPPED");
  }, []);

  // Per-frame update, called with real elapsed seconds by the rAF effect
  // below. Kept as its own function (rather than inline in the effect) so
  // it always closes over the LATEST activeRoutes/vehicleCount/speed/loop
  // via the tickRef indirection, without restarting the rAF loop itself
  // every time one of those changes mid-playback.
  const tick = useCallback(
    (dtSeconds) => {
      const rate = resolveTrafficPreviewProgressPerSecond(speedMultiplier);
      const globalScale = resolvePreviewVehicleScale(previewVehicleScale);
      const nextRendered = [];
      for (const route of activeRoutes) {
        // Section 3 — one visual per route, derived from the route's own
        // declared vehicle_classes (falls back to a deterministic per-slot
        // cycle only if the route declares no recognized class at all);
        // every vehicle spawned on this route shares it.
        const vehicleType = resolveVehicleVisualForRoute(route, 0);
        const visual = TRAFFIC_PREVIEW_VEHICLE_VISUALS[vehicleType] || TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN;
        const offsets = computeDeterministicVehicleOffsets(vehicleCount);
        offsets.forEach((offset, slot) => {
          const key = `${route.id}:${slot}`;
          const current = vehicleStatesRef.current.get(key) || createVehicleState(offset);
          const advanced = advanceVehicleState(current, dtSeconds, rate, { loop });
          vehicleStatesRef.current.set(key, advanced);
          const previousHeadingDeg = previousHeadingsRef.current.get(key);
          const appearance = resolveVehicleAppearance({ route, vehicleState: advanced, previousHeadingDeg });
          if (appearance) {
            previousHeadingsRef.current.set(key, appearance.headingDeg);
            nextRendered.push({
              key,
              routeId: route.id,
              routeName: route.name,
              routeStatus: route.status,
              vehicleType,
              ...appearance,
              // Section 6 — the global preview multiplier is layered on
              // top of the route's own perspective scale, never replacing
              // it. Section 5 — the per-asset base rotation offset is
              // applied here (always 0 for the assets shipped with this
              // patch, but never assumed to be) rather than by altering
              // route direction.
              scale: appearance.scale * globalScale,
              headingDeg: applyBaseRotationOffset(appearance.headingDeg, visual.baseRotationOffsetDeg),
              vehicleLength: visual.length,
              vehicleWidth: visual.width,
              vehicleAsset: visual.asset,
            });
          }
        });
      }
      setRenderedVehicles(nextRendered);
    },
    [activeRoutes, vehicleCount, speedMultiplier, loop, previewVehicleScale],
  );

  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (status !== "PLAYING") return undefined;
    let frame;
    let lastTimestamp = null;
    const runFrame = (timestamp) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dtSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      tickRef.current(dtSeconds);
      frame = requestAnimationFrame(runFrame);
    };
    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  // Stopping authoring mode entirely (enabled -> false) must not leave a
  // stray rAF loop or stale vehicles behind.
  useEffect(() => {
    if (!enabled) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    enabled,
    status,
    routeScope,
    vehicleCount,
    speedMultiplier,
    loop,
    previewVehicleScale,
    showRouteLine,
    showControlPoints,
    showGhost,
    showRealVehicle,
    activeRoutes,
    hasDraftRouteInScope,
    renderedVehicles,
    actions: {
      start,
      pause,
      restart,
      stop,
      setRouteScope,
      setVehicleCount,
      setSpeedMultiplier,
      setLoop,
      setPreviewVehicleScale,
      setShowRouteLine,
      setShowControlPoints,
      setShowGhost,
      setShowRealVehicle,
    },
  };
}
