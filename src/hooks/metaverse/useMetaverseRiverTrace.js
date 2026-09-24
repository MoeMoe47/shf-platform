import { useCallback, useEffect, useRef, useState } from "react";
import {
  addRiverPoint,
  clearRiverGeometry,
  createRiverZone,
  deleteRiverPoint,
  moveRiverPoint,
  normalizeRiverTraceState,
  reverseRiverDirection,
  RIVER_TRACE_DEFAULT_STATE,
  updateRiverPoints,
} from "@/system/metaverse/metaverseRiverTraceModel.js";
import { nearestProgressOnRoute } from "@/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";

export const RIVER_TRACE_STORAGE_KEY = "met-river-trace-page1-day";

function readStoredRiverTrace() {
  try {
    return normalizeRiverTraceState(JSON.parse(window.localStorage.getItem(RIVER_TRACE_STORAGE_KEY) || "null"));
  } catch {
    return normalizeRiverTraceState(RIVER_TRACE_DEFAULT_STATE);
  }
}

export function resolveRiverTraceEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("riverFlowDebug")) return false;
  const value = params.get("riverFlowDebug");
  return value !== "0" && value !== "false";
}

export default function useMetaverseRiverTrace({ enabled }) {
  const [state, setState] = useState(() => (enabled ? readStoredRiverTrace() : normalizeRiverTraceState(RIVER_TRACE_DEFAULT_STATE)));
  const [mode, setMode] = useState("TRACE");
  const [geometryType, setGeometryType] = useState("CENTERLINE");
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [zoneType, setZoneType] = useState("NONE");
  const [zonePick, setZonePick] = useState({ startT: null });
  const undoRef = useRef([]);
  const redoRef = useRef([]);

  const commit = useCallback((updater, { undo = true } = {}) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (undo) {
        undoRef.current.push(current);
        if (undoRef.current.length > 50) undoRef.current.shift();
        redoRef.current = [];
      }
      return normalizeRiverTraceState(next);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    try {
      window.localStorage.setItem(RIVER_TRACE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The live session remains usable when browser storage is unavailable.
    }
  }, [enabled, state]);

  const addPoint = useCallback((point) => {
    commit((current) => addRiverPoint(current, geometryType, point));
  }, [commit, geometryType]);

  const movePoint = useCallback((index, point) => {
    commit((current) => moveRiverPoint(current, geometryType, index, point), { undo: false });
  }, [commit, geometryType]);

  const deleteSelectedPoint = useCallback(() => {
    if (selectedPointIndex === null) return;
    commit((current) => deleteRiverPoint(current, geometryType, selectedPointIndex));
    setSelectedPointIndex(null);
  }, [commit, geometryType, selectedPointIndex]);

  const clear = useCallback(() => {
    commit((current) => clearRiverGeometry(current, geometryType));
    setSelectedPointIndex(null);
  }, [commit, geometryType]);

  const undo = useCallback(() => {
    const previous = undoRef.current.pop();
    if (!previous) return;
    setState((current) => {
      redoRef.current.push(current);
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    setState((current) => {
      undoRef.current.push(current);
      return next;
    });
  }, []);

  const pickZoneProgress = useCallback((point) => {
    if (zoneType === "NONE" || state.centerline.length < 2) return;
    const progress = nearestProgressOnRoute(state.centerline, point.x, point.y);
    if (zonePick.startT === null) {
      setZonePick({ startT: progress });
      return;
    }
    commit((current) => ({ ...current, zones: [...current.zones, createRiverZone(zoneType, zonePick.startT, progress)] }));
    setZonePick({ startT: null });
    setMode("TRACE");
  }, [commit, state.centerline, zonePick.startT, zoneType]);

  const pickSelectedPointForZone = useCallback(() => {
    if (geometryType !== "CENTERLINE" || selectedPointIndex === null) return;
    const point = state.centerline[selectedPointIndex];
    if (point) pickZoneProgress(point);
  }, [geometryType, pickZoneProgress, selectedPointIndex, state.centerline]);

  const save = useCallback(() => {
    try {
      window.localStorage.setItem(RIVER_TRACE_STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }, [state]);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);
  const reverseDirection = useCallback(() => commit((current) => reverseRiverDirection(current)), [commit]);

  return {
    enabled,
    state,
    mode,
    geometryType,
    selectedPointIndex,
    zoneType,
    zonePick,
    hasUndo: undoRef.current.length > 0,
    hasRedo: redoRef.current.length > 0,
    actions: {
      setMode,
      setGeometryType: (value) => { setGeometryType(value); setSelectedPointIndex(null); },
      setSelectedPointIndex,
      setZoneType,
      addPoint,
      movePoint,
      deleteSelectedPoint,
      clear,
      undo,
      redo,
      pickZoneProgress,
      pickSelectedPointForZone,
      resetZonePick: () => setZonePick({ startT: null }),
      save,
      exportJson,
      reverseDirection,
      updateFlow: (updater) => commit((current) => ({ ...current, flow: updater(current.flow) }), { undo: false }),
    },
  };
}
