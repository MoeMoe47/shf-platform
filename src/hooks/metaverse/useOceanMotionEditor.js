import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  OCEAN_ENGINE_STORAGE_KEY,
  addOceanFlowPoint,
  advanceOceanPlayback,
  applyOceanWeatherPreset,
  createFlowPath,
  createFoamZone,
  createOilRigOceanSceneConfig,
  OIL_RIG_DAY_OCEAN_PRESET,
  createTurbulenceZone,
  createWakeZone,
  deleteOceanFlowPoint,
  duplicateOceanEntity,
  exportOceanSceneConfig,
  moveOceanFlowPoint,
  normalizeOceanSceneConfig,
  parseOceanSceneConfigJson,
  stepOceanPlayback,
} from "@/system/metaverse/oceanMotionEngine.js";

function readStoredConfig() {
  try {
    const raw = window.localStorage.getItem(OCEAN_ENGINE_STORAGE_KEY);
    if (!raw) return null;
    return parseOceanSceneConfigJson(raw).config;
  } catch {
    return null;
  }
}

function writeStoredConfig(config) {
  try {
    window.localStorage.setItem(OCEAN_ENGINE_STORAGE_KEY, JSON.stringify(exportOceanSceneConfig(config)));
    return true;
  } catch {
    return false;
  }
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function useOceanMotionEditor({ initialConfig = null, useStoredConfig = true } = {}) {
  const [config, setConfig] = useState(() => (useStoredConfig ? readStoredConfig() : null) || initialConfig || createOilRigOceanSceneConfig());
  const [tool, setTool] = useState("SELECT");
  const [selection, setSelection] = useState({ type: "scene", id: null, pointIndex: null });
  const [playback, setPlayback] = useState(() => config.playbackDefaults);
  const [debug, setDebug] = useState(() => config.debug);
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState("Oil-rig starter scene loaded.");
  const [importText, setImportText] = useState("");
  const lastFrameRef = useRef(null);

  const selectedEntity = useMemo(() => {
    if (selection.type === "flow") return config.flowPaths.find((item) => item.id === selection.id) || null;
    if (selection.type === "foam") return config.foamZones.find((item) => item.id === selection.id) || null;
    if (selection.type === "turbulence") return config.turbulenceZones.find((item) => item.id === selection.id) || null;
    if (selection.type === "wake") return config.wakeZones.find((item) => item.id === selection.id) || null;
    return null;
  }, [config, selection]);

  const commitConfig = useCallback((updater, message) => {
    setConfig((current) => {
      const next = normalizeOceanSceneConfig(typeof updater === "function" ? updater(current) : updater);
      return next;
    });
    if (message) setStatus(message);
  }, []);

  useEffect(() => {
    let active = true;
    let frameHandle = 0;
    let pendingDelta = 0;
    let lastStateCommit = performance.now();
    const tick = (now) => {
      if (!active) return;
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const delta = Math.min(0.08, Math.max(0, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;
      pendingDelta += delta;
      if (now - lastStateCommit >= 250 && !document.hidden) {
        const elapsed = pendingDelta;
        pendingDelta = 0;
        lastStateCommit = now;
        setPlayback((current) => (current.playing ? advanceOceanPlayback(current, elapsed) : current));
      }
      frameHandle = requestAnimationFrame(tick);
    };
    frameHandle = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frameHandle);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tagName = event.target?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      if (event.key === " ") {
        event.preventDefault();
        setPlayback((current) => ({ ...current, playing: !current.playing }));
      } else if (event.key.toLowerCase() === "v") setTool("SELECT");
      else if (event.key.toLowerCase() === "f") setTool("DRAW_FLOW");
      else if (event.key.toLowerCase() === "t") setTool("DRAW_TURBULENCE");
      else if (event.key.toLowerCase() === "o") setTool("DRAW_FOAM");
      else if (event.key.toLowerCase() === "w") setTool("DRAW_WAKE");
      else if (event.key === "Escape") {
        setTool("SELECT");
        setSelection({ type: "scene", id: null, pointIndex: null });
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const save = useCallback(() => {
    const ok = writeStoredConfig(config);
    setStatus(ok ? "Scene configuration saved locally." : "Unable to write local scene configuration.");
    return ok;
  }, [config]);

  const load = useCallback(() => {
    const stored = readStoredConfig();
    if (!stored) {
      setStatus("No local ocean configuration found.");
      return false;
    }
    setConfig(stored);
    setPlayback(stored.playbackDefaults);
    setDebug(stored.debug);
    setSelection({ type: "scene", id: null, pointIndex: null });
    setStatus("Loaded local ocean configuration.");
    return true;
  }, []);

  const exportJson = useCallback(() => JSON.stringify(exportOceanSceneConfig(config), null, 2), [config]);

  const importJson = useCallback((text) => {
    const result = parseOceanSceneConfigJson(text);
    if (!result.config) {
      setStatus(`Import failed: ${result.errors.join(", ")}`);
      return false;
    }
    setConfig(result.config);
    setPlayback(result.config.playbackDefaults);
    setDebug(result.config.debug);
    setSelection({ type: "scene", id: null, pointIndex: null });
    setStatus("Imported ocean scene configuration.");
    return true;
  }, []);

  const updateSelected = useCallback((updater) => {
    if (!selection.id) return;
    commitConfig((current) => {
      const apply = (item) => (item.id === selection.id ? updater(item) : item);
      if (selection.type === "flow") return { ...current, flowPaths: current.flowPaths.map(apply), weatherPreset: "Custom" };
      if (selection.type === "foam") return { ...current, foamZones: current.foamZones.map(apply), weatherPreset: "Custom" };
      if (selection.type === "turbulence") return { ...current, turbulenceZones: current.turbulenceZones.map(apply), weatherPreset: "Custom" };
      if (selection.type === "wake") return { ...current, wakeZones: current.wakeZones.map(apply), weatherPreset: "Custom" };
      return current;
    });
  }, [commitConfig, selection]);

  const updateWave = useCallback((kind, patch) => {
    commitConfig((current) => ({ ...current, weatherPreset: "Custom", waves: { ...current.waves, [kind]: { ...current.waves[kind], ...patch } } }));
  }, [commitConfig]);

  const updateShimmer = useCallback((patch) => {
    commitConfig((current) => ({ ...current, weatherPreset: "Custom", shimmer: { ...current.shimmer, ...patch } }));
  }, [commitConfig]);

  const updateGlobal = useCallback((patch) => {
    commitConfig((current) => ({ ...current, weatherPreset: "Custom", global: { ...current.global, ...patch } }));
  }, [commitConfig]);

  const addFlowPath = useCallback((point = null) => {
    const flow = createFlowPath({
      label: `Current Band ${config.flowPaths.length + 1}`,
      points: point ? [point] : [],
      color: ["#38bdf8", "#22d3ee", "#60a5fa", "#2dd4bf"][config.flowPaths.length % 4],
    });
    commitConfig((current) => ({ ...current, flowPaths: [...current.flowPaths, flow] }), `Created ${flow.label}.`);
    setSelection({ type: "flow", id: flow.id, pointIndex: point ? 0 : null });
    return flow.id;
  }, [commitConfig, config.flowPaths.length]);

  const addZoneAtPoint = useCallback((type, point) => {
    const factory = type === "foam" ? createFoamZone : type === "wake" ? createWakeZone : createTurbulenceZone;
    const zone = type === "wake" ? factory({ sourcePosition: point, label: `Wake ${config.wakeZones.length + 1}` }) : factory({ center: point, label: `${type === "foam" ? "Foam" : "Turbulence"} Zone` });
    commitConfig((current) => ({
      ...current,
      foamZones: type === "foam" ? [...current.foamZones, zone] : current.foamZones,
      turbulenceZones: type === "turbulence" ? [...current.turbulenceZones, zone] : current.turbulenceZones,
      wakeZones: type === "wake" ? [...current.wakeZones, zone] : current.wakeZones,
    }), `Created ${zone.label}.`);
    setSelection({ type, id: zone.id, pointIndex: null });
  }, [commitConfig, config.wakeZones.length]);

  const handleScenePoint = useCallback((point) => {
    setCursor(point);
    if (tool === "DRAW_FLOW") {
      let target = selectedEntity && selection.type === "flow" ? selectedEntity : null;
      if (!target) {
        const id = addFlowPath(point);
        setTool("DRAW_FLOW");
        return id;
      }
      updateSelected((path) => addOceanFlowPoint(path, point));
      setSelection({ type: "flow", id: target.id, pointIndex: target.points.length });
      return target.id;
    }
    if (tool === "DRAW_TURBULENCE") return addZoneAtPoint("turbulence", point);
    if (tool === "DRAW_FOAM") return addZoneAtPoint("foam", point);
    if (tool === "DRAW_WAKE") return addZoneAtPoint("wake", point);
    if (tool === "SELECT") setSelection({ type: "scene", id: null, pointIndex: null });
    return null;
  }, [addFlowPath, addZoneAtPoint, selectedEntity, selection.type, tool, updateSelected]);

  const selectEntity = useCallback((type, id, pointIndex = null) => {
    setSelection({ type, id, pointIndex });
    setTool(type === "flow" ? "EDIT_FLOW" : "SELECT");
  }, []);

  const moveFlowPoint = useCallback((pathId, index, point) => {
    setSelection({ type: "flow", id: pathId, pointIndex: index });
    commitConfig((current) => ({
      ...current,
      flowPaths: current.flowPaths.map((path) => (path.id === pathId ? moveOceanFlowPoint(path, index, point) : path)),
    }));
  }, [commitConfig]);

  const moveZone = useCallback((type, id, point) => {
    commitConfig((current) => {
      const apply = (zone) => {
        if (zone.id !== id) return zone;
        return type === "wake" ? { ...zone, sourcePosition: point } : { ...zone, center: point };
      };
      return {
        ...current,
        foamZones: type === "foam" ? current.foamZones.map(apply) : current.foamZones,
        turbulenceZones: type === "turbulence" ? current.turbulenceZones.map(apply) : current.turbulenceZones,
        wakeZones: type === "wake" ? current.wakeZones.map(apply) : current.wakeZones,
      };
    });
  }, [commitConfig]);

  const removeSelection = useCallback(() => {
    if (!selection.id) return;
    if (selection.type === "flow" && selection.pointIndex !== null) {
      commitConfig((current) => ({
        ...current,
        flowPaths: current.flowPaths.map((path) => (path.id === selection.id ? deleteOceanFlowPoint(path, selection.pointIndex) : path)),
      }), "Deleted selected control point.");
      setSelection((current) => ({ ...current, pointIndex: null }));
      return;
    }
    commitConfig((current) => ({
      ...current,
      flowPaths: current.flowPaths.filter((item) => item.id !== selection.id),
      foamZones: current.foamZones.filter((item) => item.id !== selection.id),
      turbulenceZones: current.turbulenceZones.filter((item) => item.id !== selection.id),
      wakeZones: current.wakeZones.filter((item) => item.id !== selection.id),
    }), "Deleted selected ocean object.");
    setSelection({ type: "scene", id: null, pointIndex: null });
  }, [commitConfig, selection]);

  const duplicateSelection = useCallback(() => {
    if (!selectedEntity || !selection.id) return;
    const copy = duplicateOceanEntity(selectedEntity, selection.type);
    if (copy.center) copy.center = { x: Math.min(100, copy.center.x + 2), y: Math.min(100, copy.center.y + 2) };
    if (copy.sourcePosition) copy.sourcePosition = { x: Math.min(100, copy.sourcePosition.x + 2), y: Math.min(100, copy.sourcePosition.y + 2) };
    commitConfig((current) => ({
      ...current,
      flowPaths: selection.type === "flow" ? [...current.flowPaths, copy] : current.flowPaths,
      foamZones: selection.type === "foam" ? [...current.foamZones, copy] : current.foamZones,
      turbulenceZones: selection.type === "turbulence" ? [...current.turbulenceZones, copy] : current.turbulenceZones,
      wakeZones: selection.type === "wake" ? [...current.wakeZones, copy] : current.wakeZones,
    }), `Duplicated ${selectedEntity.label}.`);
    setSelection({ type: selection.type, id: copy.id, pointIndex: null });
  }, [commitConfig, selectedEntity, selection]);

  return {
    config,
    tool,
    selection,
    selectedEntity,
    playback,
    debug,
    view,
    cursor,
    status,
    importText,
    setImportText,
    actions: {
      setTool,
      setPlayback,
      setDebug,
      setView,
      setCursor,
      commitConfig,
      updateSelected,
      updateWave,
      updateShimmer,
      updateGlobal,
      addFlowPath,
      handleScenePoint,
      selectEntity,
      moveFlowPoint,
      moveZone,
      removeSelection,
      duplicateSelection,
      save,
      load,
      exportJson,
      importJson,
      download: () => downloadJson(exportOceanSceneConfig(config), `${config.id}.json`),
      reset: () => {
        const starter = createOilRigOceanSceneConfig(OIL_RIG_DAY_OCEAN_PRESET);
        setConfig(starter);
        setPlayback(starter.playbackDefaults);
        setDebug(starter.debug);
        setSelection({ type: "scene", id: null, pointIndex: null });
        setStatus("Restored Oil Rig DAY Production Preset.");
      },
      applyPreset: (preset) => commitConfig((current) => applyOceanWeatherPreset(current, preset), `Applied ${preset} preset.`),
      stepFrame: () => setPlayback((current) => stepOceanPlayback(current, 1)),
      restart: () => setPlayback((current) => ({ ...current, time: 0, frame: 0, restartKey: (current.restartKey || 0) + 1, playing: true })),
      scrub: (time) => setPlayback((current) => ({ ...current, time: Number(time) || 0 })),
    },
  };
}
