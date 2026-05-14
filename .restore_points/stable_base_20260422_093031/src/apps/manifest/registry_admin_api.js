// Admin → Fabric Registry API client (UI-facing)
// TOP-1%: deterministic, proxy-friendly, no CORS pain.
//
// Default behavior:
//   - If Vite proxy is set, requests go to "/admin/..." on same origin (5173) and proxy to Fabric (8090).
// Optional override:
//   - localStorage.FABRIC_BASE_URL = "http://127.0.0.1:8090"
//   - OR set VITE_FABRIC_BASE_URL in env (if you wire it into your build)

const ENV_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_FABRIC_BASE_URL) || "";

function normalizeBase(u) {
  return String(u || "").replace(/\/$/, "");
}

// Prefer explicit override, else rely on same-origin proxy (empty base => relative paths)
function getBase() {
  const ls = globalThis?.localStorage;
  const override = ls?.getItem("FABRIC_BASE_URL") || ls?.getItem("shf_fabric_base") || "";
  return normalizeBase(override || ENV_BASE || "");
}

function getAdminKey() {
  const ls = globalThis?.localStorage;
  return ls?.getItem("ADMIN_API_KEY") || ls?.getItem("shf_admin_key") || "";
}

async function req(method, path, body) {
  const base = getBase(); // "" when proxy is used
  const url = (base ? base : "") + path;

  const headers = { "Content-Type": "application/json" };
  const k = getAdminKey();
  if (k) headers["X-Admin-Key"] = k;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const txt = await res.text();
  let json;
  try { json = txt ? JSON.parse(txt) : null; } catch { json = { detail: txt }; }

  if (!res.ok) {
    const msg = json?.detail || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

export async function listRegistry() {
  return req("GET", "/api/admin/registry");
}

export async function listRegistryEvents() {
  return req("GET", "/api/admin/registry/events");
}

export async function getRegistryEntity(entityId) {
  return req("GET", `/api/admin/registry/${encodeURIComponent(entityId)}`);
}

export async function upsertRegistryEntity(payload) {
  return req("POST", "/api/admin/registry/upsert", payload);
}

export async function setRegistryLifecycle(entityId, payload) {
  return req("POST", `/api/admin/registry/${encodeURIComponent(entityId)}/lifecycle`, payload);
}

export async function attestRegistryEntity(entityId, payload) {
  return req("POST", `/api/admin/registry/${encodeURIComponent(entityId)}/attest`, payload);
}
