// MET-16A — Manual Traffic Authoring Tool: React controller hook.
//
// Owns all authoring state (routes, active mode, selection, ghost playback)
// and exposes it plus an `actions` object to both the fixed developer panel
// (MetaverseTrafficAuthoringPanel, rendered outside the camera-transformed
// box) and the in-world overlay (MetaverseTrafficAuthoringOverlay, rendered
// inside it) so they always operate on the same shared state. Instantiated
// exactly once, only when `resolveTrafficAuthoringEnabled(...)` is true —
// see MetaverseCityPage.jsx.
//
// This hook grants no application authority: it never calls any Metaverse
// entry/unlock/fast-travel/civic/treasury client, and its only persistence
// is a local draft in `localStorage` plus explicit owner-triggered
// copy/download of JSON. Nothing here wires an authored route into
// production traffic.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER,
  TRAFFIC_AUTHORING_ROUTE_STATUSES,
  TRAFFIC_AUTHORING_SCHEMA_VERSION,
  addOcclusionSegment,
  addRoutePoint,
  createEmptyRoute,
  deletePoint,
  exportRoute,
  exportRouteSet,
  insertPointAfter,
  interpolatePerspectiveScale,
  isProgressOccluded,
  movePoint,
  nearestProgressOnRoute,
  parseImportedRouteSet,
  removeOcclusionSegment,
  removePerspectiveKey,
  resolveGhostPreviewProgressPerSecond,
  reverseRoute,
  sampleRouteAtProgress,
  setPerspectiveKey,
  suggestPerspectiveScaleForY,
  validateRoute,
  validateRouteSet,
} from "@/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";
// MET-16B Section 1 — the canonical, version-controlled persistence location
// for owner-authored routes (see MetaverseTrafficAuthoringPanel.jsx's
// "paste the exported JSON into this file" instruction). Statically
// imported so Vite bundles whatever is committed there; read fresh at
// module load, never mutated in place.
import canonicalTrafficRoutesFile from "@/system/metaverse/traffic/metaverseTrafficRoutes.json";

const LOCAL_STORAGE_KEY = "met-16a-traffic-authoring-draft";
const MAX_UNDO_DEPTH = 50;

function readDraftFromLocalStorage() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const result = parseImportedRouteSet(raw);
    return result.routes.length ? result.routes : null;
  } catch {
    return null;
  }
}

// MET-16B Section 1 — reads the canonical metaverseTrafficRoutes.json
// (empty until the owner pastes exported routes into it). Never discards
// anything: an empty/missing/malformed file just yields an empty array,
// the same way a fresh authoring session already starts empty today.
//
// Blank-screen regression hardening: parseImportedRouteSet is already
// designed to fail safely on bad input, but this call runs unconditionally
// during MetaverseCityPage's initial render (inside a useState initializer,
// before any error boundary in the tree could help) — so it is wrapped in
// its own try/catch as a last line of defense. If the canonical file is
// ever genuinely unreadable, the Metaverse must still render with zero
// authored routes rather than fail to render at all.
function readCanonicalRoutes() {
  try {
    const result = parseImportedRouteSet(canonicalTrafficRoutesFile);
    return Array.isArray(result?.routes) ? result.routes : [];
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[MET-16B] Failed to read canonical traffic routes — starting with none.", error);
    }
    return [];
  }
}

function writeDraftToLocalStorage(routes) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exportRouteSet(routes)));
    return true;
  } catch {
    return false;
  }
}

function triggerJsonDownload(payload, filename) {
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export default function useMetaverseTrafficAuthoring({ enabled }) {
  // MET-16B Section 1 — prefer an in-progress local draft (most recent
  // owner work); if there is none, fall back to whatever is already
  // committed in the canonical file, so a fresh session doesn't start
  // empty when the owner has already saved routes there. Never both at
  // once (that would silently duplicate ids) — use "Load Canonical
  // Routes" below to merge canonical routes into an existing draft
  // on demand instead.
  const [routes, setRoutesState] = useState(() => {
    if (!enabled) return [];
    // Blank-screen regression hardening (Section 7): this runs during
    // MetaverseCityPage's initial render, before any component (and
    // therefore before any error boundary) exists — an exception here has
    // nothing to catch it. Both loaders already fail safely internally, but
    // this outer try/catch is the actual guarantee that a startup route-
    // data problem can only ever result in an empty route list, never a
    // failed render of the whole Metaverse.
    try {
      const draft = readDraftFromLocalStorage();
      if (draft && draft.length) return draft;
      return readCanonicalRoutes();
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("[MET-16B] Failed to initialize traffic authoring routes — starting with none.", error);
      }
      return [];
    }
  });
  const [activeRouteId, setActiveRouteId] = useState(() => routes[0]?.id || null);
  const [mode, setMode] = useState("SELECT");
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [occlusionPick, setOcclusionPick] = useState({ picking: "START", startT: null, endT: null });
  const [lastClickProgress, setLastClickProgress] = useState(null);
  const [pendingPerspectiveScale, setPendingPerspectiveScale] = useState(1);
  // MET-16A patch — speedMultiplier is a preset multiplier of a fixed
  // "normal" rate (see GHOST_PREVIEW_SPEED_PRESETS), not a raw progress-per-
  // second value, so the UI can show it as "0.10x" etc. Defaults to
  // GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER (0.10x) for precise lane-alignment
  // inspection. This is authoring-tool-only playback speed — it never
  // affects any future production traffic speed model.
  const [ghost, setGhost] = useState({ playing: false, progress: 0, speedMultiplier: GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER, loop: false });
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  const undoStackRef = useRef([]);

  const activeRoute = useMemo(() => routes.find((route) => route.id === activeRouteId) || null, [routes, activeRouteId]);

  const setRoutes = useCallback((updater) => {
    setRoutesState((previous) => (typeof updater === "function" ? updater(previous) : updater));
  }, []);

  const updateActiveRoute = useCallback(
    (updater, { pushUndo = false } = {}) => {
      setRoutes((previous) => {
        const index = previous.findIndex((route) => route.id === activeRouteId);
        if (index < 0) return previous;
        if (pushUndo) {
          undoStackRef.current.push({ routeId: activeRouteId, points: previous[index].points });
          if (undoStackRef.current.length > MAX_UNDO_DEPTH) undoStackRef.current.shift();
        }
        const next = previous.slice();
        next[index] = updater(previous[index]);
        return next;
      });
    },
    [activeRouteId, setRoutes],
  );

  // ---- Route lifecycle -------------------------------------------------

  const newRoute = useCallback(
    (name) => {
      const route = createEmptyRoute({ name: name || `Route ${routes.length + 1}` });
      setRoutes((previous) => [...previous, route]);
      setActiveRouteId(route.id);
      setMode("DRAW");
      setSelectedPointIndex(null);
      setStatusMessage(`Created "${route.name}". Click along the lane to add points.`);
      return route.id;
    },
    [routes.length, setRoutes],
  );

  const deleteRoute = useCallback(
    (routeId) => {
      const targetId = routeId || activeRouteId;
      if (!targetId) return;
      setRoutes((previous) => previous.filter((route) => route.id !== targetId));
      setActiveRouteId((current) => (current === targetId ? null : current));
    },
    [activeRouteId, setRoutes],
  );

  const duplicateRoute = useCallback(
    (routeId) => {
      const targetId = routeId || activeRouteId;
      const source = routes.find((route) => route.id === targetId);
      if (!source) return;
      const copy = { ...exportRoute(source), id: undefined, name: `${source.name} (copy)`, status: "DRAFT" };
      const created = createEmptyRoute({ name: copy.name });
      const merged = { ...created, ...copy, id: created.id };
      setRoutes((previous) => [...previous, merged]);
      setActiveRouteId(merged.id);
    },
    [activeRouteId, routes, setRoutes],
  );

  const selectRoute = useCallback((routeId) => {
    setActiveRouteId(routeId);
    setSelectedPointIndex(null);
    setOcclusionPick({ picking: "START", startT: null, endT: null });
  }, []);

  const renameActiveRoute = useCallback(
    (name) => updateActiveRoute((route) => ({ ...route, name })),
    [updateActiveRoute],
  );

  const setDirection = useCallback(
    (direction) => updateActiveRoute((route) => ({ ...route, direction })),
    [updateActiveRoute],
  );

  const toggleVehicleClass = useCallback(
    (vehicleClass) =>
      updateActiveRoute((route) => {
        // Defensive: a route arriving via import/canonical-file with a
        // missing/malformed vehicle_classes field must never throw here —
        // fail safely to an empty list rather than blank the page.
        const vehicleClasses = Array.isArray(route.vehicle_classes) ? route.vehicle_classes : [];
        const has = vehicleClasses.includes(vehicleClass);
        return {
          ...route,
          vehicle_classes: has ? vehicleClasses.filter((c) => c !== vehicleClass) : [...vehicleClasses, vehicleClass],
        };
      }),
    [updateActiveRoute],
  );

  const setSpeedClass = useCallback(
    (speedClass) => updateActiveRoute((route) => ({ ...route, speed_class: speedClass })),
    [updateActiveRoute],
  );

  const setStatus = useCallback(
    (status) => updateActiveRoute((route) => ({ ...route, status })),
    [updateActiveRoute],
  );

  const cycleStatus = useCallback(() => {
    updateActiveRoute((route) => {
      const index = TRAFFIC_AUTHORING_ROUTE_STATUSES.indexOf(route.status);
      const next = TRAFFIC_AUTHORING_ROUTE_STATUSES[(index + 1) % TRAFFIC_AUTHORING_ROUTE_STATUSES.length];
      return { ...route, status: next };
    });
  }, [updateActiveRoute]);

  const setNotes = useCallback(
    (notes) => updateActiveRoute((route) => ({ ...route, notes })),
    [updateActiveRoute],
  );

  // ---- Points ------------------------------------------------------------

  const addPoint = useCallback(
    (x, y) => {
      updateActiveRoute((route) => addRoutePoint(route, { x, y }), { pushUndo: true });
    },
    [updateActiveRoute],
  );

  const moveActivePoint = useCallback(
    (index, x, y) => updateActiveRoute((route) => movePoint(route, index, { x, y })),
    [updateActiveRoute],
  );

  const deleteSelectedPoint = useCallback(() => {
    if (selectedPointIndex === null) return;
    updateActiveRoute((route) => deletePoint(route, selectedPointIndex), { pushUndo: true });
    setSelectedPointIndex(null);
  }, [selectedPointIndex, updateActiveRoute]);

  const insertPointAt = useCallback(
    (index, x, y) => updateActiveRoute((route) => insertPointAfter(route, index, { x, y }), { pushUndo: true }),
    [updateActiveRoute],
  );

  const undoLastPoint = useCallback(() => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setRoutes((previous) => previous.map((route) => (route.id === entry.routeId ? { ...route, points: entry.points } : route)));
  }, [setRoutes]);

  const reverseActiveRoute = useCallback(() => updateActiveRoute((route) => reverseRoute(route)), [updateActiveRoute]);

  // ---- Perspective ---------------------------------------------------------

  const captureProgressFromClick = useCallback(
    (x, y) => {
      if (!activeRoute || activeRoute.points.length < 2) return null;
      const t = nearestProgressOnRoute(activeRoute.points, x, y);
      setLastClickProgress(t);
      const pointAtT = sampleRouteAtProgress(activeRoute.points, t);
      setPendingPerspectiveScale(suggestPerspectiveScaleForY(pointAtT?.y ?? y));
      return t;
    },
    [activeRoute],
  );

  const commitPerspectiveKey = useCallback(
    (t, scale) => updateActiveRoute((route) => setPerspectiveKey(route, t, scale)),
    [updateActiveRoute],
  );

  const deletePerspectiveKey = useCallback(
    (t) => updateActiveRoute((route) => removePerspectiveKey(route, t)),
    [updateActiveRoute],
  );

  // ---- Occlusion -----------------------------------------------------------

  const pickOcclusionPoint = useCallback(
    (x, y) => {
      if (!activeRoute || activeRoute.points.length < 2) return;
      const t = nearestProgressOnRoute(activeRoute.points, x, y);
      setOcclusionPick((previous) =>
        previous.picking === "START" ? { ...previous, startT: t, picking: "END" } : { ...previous, endT: t, picking: "START" },
      );
    },
    [activeRoute],
  );

  const commitOcclusionSegment = useCallback(() => {
    setOcclusionPick((previous) => {
      if (previous.startT === null || previous.endT === null) return previous;
      updateActiveRoute((route) => addOcclusionSegment(route, previous.startT, previous.endT), { pushUndo: false });
      return { picking: "START", startT: null, endT: null };
    });
  }, [updateActiveRoute]);

  const deleteOcclusionSegment = useCallback(
    (id) => updateActiveRoute((route) => removeOcclusionSegment(route, id)),
    [updateActiveRoute],
  );

  // ---- Ghost preview ---------------------------------------------------------

  const setGhostPlaying = useCallback((playing) => setGhost((previous) => ({ ...previous, playing })), []);
  const setGhostSpeedMultiplier = useCallback(
    (speedMultiplier) => setGhost((previous) => ({ ...previous, speedMultiplier })),
    [],
  );
  const setGhostLoop = useCallback((loop) => setGhost((previous) => ({ ...previous, loop })), []);
  const restartGhost = useCallback(() => setGhost((previous) => ({ ...previous, progress: 0, playing: true })), []);

  useEffect(() => {
    if (!ghost.playing) return undefined;
    let frame;
    let lastTimestamp = null;
    const tick = (timestamp) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      setGhost((previous) => {
        if (!previous.playing) return previous;
        // Always advances forward — never reversed or ping-ponged. Loop
        // wraps back to 0 only when explicitly enabled; otherwise it stops
        // at the end (progress 1) so the marker never bounces backward.
        let nextProgress = previous.progress + dt * resolveGhostPreviewProgressPerSecond(previous.speedMultiplier);
        let playing = true;
        if (nextProgress >= 1) {
          if (previous.loop) nextProgress %= 1;
          else {
            nextProgress = 1;
            playing = false;
          }
        }
        return { ...previous, progress: nextProgress, playing };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ghost.playing]);

  const ghostPosition = useMemo(() => {
    if (!activeRoute || activeRoute.points.length < 2) return null;
    const sample = sampleRouteAtProgress(activeRoute.points, ghost.progress);
    if (!sample) return null;
    const scale = interpolatePerspectiveScale(activeRoute.perspective, ghost.progress);
    const occluded = isProgressOccluded(activeRoute.occlusion_segments, ghost.progress);
    return { ...sample, scale, occluded };
  }, [activeRoute, ghost.progress]);

  // ---- Save / Export / Import -----------------------------------------------

  const saveDraft = useCallback(() => {
    const ok = writeDraftToLocalStorage(routes);
    setLastSavedAt(ok ? Date.now() : null);
    setStatusMessage(
      ok
        ? "Draft saved locally. Use Export to copy/download JSON for src/system/metaverse/traffic/metaverseTrafficRoutes.json."
        : "Could not save draft to local storage.",
    );
    return ok;
  }, [routes]);

  const exportActiveRouteJson = useCallback(() => (activeRoute ? JSON.stringify(exportRoute(activeRoute), null, 2) : null), [activeRoute]);

  const exportAllRoutesJson = useCallback(() => JSON.stringify(exportRouteSet(routes), null, 2), [routes]);

  const copyAllRoutesToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportAllRoutesJson());
      setStatusMessage("All routes copied to clipboard as JSON.");
      return true;
    } catch {
      setStatusMessage("Clipboard copy failed — use Download instead.");
      return false;
    }
  }, [exportAllRoutesJson]);

  const downloadAllRoutesJson = useCallback(() => {
    const ok = triggerJsonDownload(exportRouteSet(routes), "metaverseTrafficRoutes.json");
    setStatusMessage(ok ? "Downloaded metaverseTrafficRoutes.json." : "Download failed.");
    return ok;
  }, [routes]);

  const importRoutesJson = useCallback((jsonText, { replace = true } = {}) => {
    const result = parseImportedRouteSet(jsonText);
    setImportErrors(result.errors);
    if (!result.routes.length) return result;
    setRoutes((previous) => (replace ? result.routes : [...previous, ...result.routes]));
    setActiveRouteId(result.routes[0].id);
    setStatusMessage(result.valid ? "Import complete." : "Import complete with warnings — see Route Validation.");
    return result;
  }, [setRoutes]);

  // MET-16B Section 1 — merges whatever is currently committed in
  // metaverseTrafficRoutes.json into the current session (skipping any id
  // already present, so it never overwrites in-progress owner edits or
  // duplicates a route). Does not discard or alter anything already loaded.
  const loadCanonicalRoutes = useCallback(() => {
    const canonicalRoutes = readCanonicalRoutes();
    if (!canonicalRoutes.length) {
      setStatusMessage("metaverseTrafficRoutes.json has no routes yet.");
      return { added: 0 };
    }
    let added = 0;
    setRoutes((previous) => {
      const existingIds = new Set(previous.map((route) => route.id));
      const newOnes = canonicalRoutes.filter((route) => !existingIds.has(route.id));
      added = newOnes.length;
      return [...previous, ...newOnes];
    });
    setStatusMessage(added ? `Loaded ${added} route(s) from metaverseTrafficRoutes.json.` : "All canonical routes are already loaded.");
    return { added };
  }, [setRoutes]);

  const validationWarnings = useMemo(() => (activeRoute ? validateRoute(activeRoute) : []), [activeRoute]);
  const routeSetWarnings = useMemo(() => validateRouteSet(routes), [routes]);

  return {
    enabled,
    routes,
    activeRoute,
    activeRouteId,
    mode,
    showAllRoutes,
    selectedPointIndex,
    occlusionPick,
    lastClickProgress,
    pendingPerspectiveScale,
    ghost,
    ghostPosition,
    lastSavedAt,
    importErrors,
    statusMessage,
    validationWarnings,
    routeSetWarnings,
    schemaVersion: TRAFFIC_AUTHORING_SCHEMA_VERSION,
    actions: {
      setMode,
      setShowAllRoutes,
      setSelectedPointIndex,
      newRoute,
      deleteRoute,
      duplicateRoute,
      selectRoute,
      renameActiveRoute,
      setDirection,
      toggleVehicleClass,
      setSpeedClass,
      setStatus,
      cycleStatus,
      setNotes,
      addPoint,
      moveActivePoint,
      deleteSelectedPoint,
      insertPointAt,
      undoLastPoint,
      reverseActiveRoute,
      setPendingPerspectiveScale,
      captureProgressFromClick,
      commitPerspectiveKey,
      deletePerspectiveKey,
      pickOcclusionPoint,
      commitOcclusionSegment,
      deleteOcclusionSegment,
      setOcclusionPick,
      setGhostPlaying,
      setGhostSpeedMultiplier,
      setGhostLoop,
      restartGhost,
      saveDraft,
      exportActiveRouteJson,
      exportAllRoutesJson,
      copyAllRoutesToClipboard,
      downloadAllRoutesJson,
      importRoutesJson,
      loadCanonicalRoutes,
    },
  };
}
