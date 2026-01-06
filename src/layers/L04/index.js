import { makeLayer } from "../_layerContract.js";
const KEY = "shf:l04:events:v1";

function readList() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function writeList(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }

export function recordMetric(name, payload = {}) {
  const evt = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: String(name||"metric"), payload, ts: new Date().toISOString() };
  const list = readList();
  list.push(evt);
  writeList(list.length > 500 ? list.slice(-500) : list);
  try { window.dispatchEvent(new CustomEvent("shf:metric", { detail: evt })); } catch {}
  return evt;
}

export const { LAYER, init, status, guard, recommend, default: Layer } = makeLayer({
  id: "L04",
  name: "Telemetry & Data Events",
  short: "Telemetry",
  purpose: "Event logging, metrics, and traceability across apps (dev-safe local store).",
  fundableAngle: "Evidence-based reporting, measurable impact, audit trails.",
}, {
  init() { recordMetric("telemetry:init", { layer: "L04" }); }
});
