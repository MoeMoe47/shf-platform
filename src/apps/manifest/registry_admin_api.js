// Admin → Fabric Registry API client (UI-facing)
// TOP-1%: deterministic, proxy-friendly, no CORS pain.
//
// Default behavior:
//   - Requests go to the canonical Fabric base (system/fabric/fabricConfig.js):
//     same-origin "/fabric-api/admin/registry/..." proxied to the Fabric (8090).
// Optional override:
//   - localStorage.FABRIC_BASE_URL = "http://127.0.0.1:8090"
//   - OR set VITE_FABRIC_API_BASE (legacy: VITE_FABRIC_URL / VITE_FABRIC_BASE_URL)
//
// Registry admin routes are Agent Fabric-owned (routers/admin_registry_routes.py,
// prefix /admin/registry — no /api prefix; the SHS API has no /admin routes).

import { FABRIC_API_BASE } from "../../system/fabric/fabricConfig.js";

function normalizeBase(u) {
  return String(u || "").replace(/\/$/, "");
}

// Prefer an explicit localStorage override, else the canonical Fabric base.
function getBase() {
  const ls = globalThis?.localStorage;
  const override = ls?.getItem("FABRIC_BASE_URL") || ls?.getItem("shf_fabric_base") || "";
  return normalizeBase(override || FABRIC_API_BASE);
}

async function req(method, path, body) {
  const url = getBase() + path;

  // AFCC-2A.1: no browser-held Fabric admin key. /admin/registry fails closed (401)
  // until a server-side SHS->Fabric auth bridge exists (AFCC-2A.2).
  const headers = { "Content-Type": "application/json" };

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
  return req("GET", "/admin/registry");
}

export async function listRegistryEvents() {
  return req("GET", "/admin/registry/events");
}

export async function getRegistryEntity(entityId) {
  return req("GET", `/admin/registry/${encodeURIComponent(entityId)}`);
}

export async function upsertRegistryEntity(payload) {
  return req("POST", "/admin/registry/upsert", payload);
}

export async function setRegistryLifecycle(entityId, payload) {
  return req("POST", `/admin/registry/${encodeURIComponent(entityId)}/lifecycle`, payload);
}

export async function attestRegistryEntity(entityId, payload) {
  return req("POST", `/admin/registry/${encodeURIComponent(entityId)}/attest`, payload);
}
