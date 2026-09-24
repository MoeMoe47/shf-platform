const METRIC_KEYS = ["ocean", "clouds", "birds", "ships", "weather", "ui"];
const EMIT_INTERVAL_MS = 250;

const state = {
  frameId: 0,
  fps: 0,
  totalMs: 0,
  metrics: Object.fromEntries(METRIC_KEYS.map((key) => [key, 0])),
  lastFrameAt: 0,
  lastEmitAt: 0,
};

function shouldProfile() {
  return typeof window !== "undefined" && import.meta.env.DEV;
}

function emit(now) {
  if (!shouldProfile() || now - state.lastEmitAt < EMIT_INTERVAL_MS) return;
  state.lastEmitAt = now;
  window.__metaverseFrameProfiler = getMetaverseFrameProfilerSnapshot();
  window.dispatchEvent(new CustomEvent("metaverse-frame-profiler", { detail: window.__metaverseFrameProfiler }));
}

export function recordMetaverseFrameMetric(key, ms) {
  if (!shouldProfile() || !Number.isFinite(ms)) return;
  state.metrics[key] = Math.max(0, ms);
  state.totalMs = METRIC_KEYS.reduce((total, metricKey) => total + (state.metrics[metricKey] || 0), 0);
  emit(performance.now());
}

export function markMetaverseFrame(now = performance.now()) {
  if (!shouldProfile()) return;
  if (state.lastFrameAt > 0) {
    const delta = now - state.lastFrameAt;
    state.fps = delta > 0 ? Math.round(1000 / delta) : state.fps;
  }
  state.lastFrameAt = now;
  state.frameId += 1;
  emit(now);
}

export function getMetaverseFrameProfilerSnapshot() {
  return {
    frameId: state.frameId,
    fps: state.fps,
    totalMs: Number(state.totalMs.toFixed(2)),
    metrics: Object.fromEntries(METRIC_KEYS.map((key) => [key, Number((state.metrics[key] || 0).toFixed(2))])),
  };
}
