// src/system/fabric/fabricConfig.js
// Canonical frontend base URL for the Agent Fabric (services/shf-agent-fabric).
//
// The Fabric's local port is 8090: main.py defaults PORT to 8090 and
// bin/restart_8090.sh (used by ci.sh / preflight.sh) starts it there. The
// SHS API (apps/shs-api, 8091) is configured separately in
// system/identity/authConfig.js — do not route Fabric traffic through it.
//
// Resolution order:
//   1. VITE_FABRIC_API_BASE   canonical (absolute origin where no proxy exists)
//   2. VITE_FABRIC_URL        legacy alias (admin pages)
//   3. VITE_FABRIC_BASE_URL   legacy alias (registry admin client)
//   4. "/fabric-api"          same-origin Vite dev proxy -> http://127.0.0.1:8090
// The same-origin default mirrors the SHS API's "/api" proxy: it keeps Fabric
// session cookies and admin headers (X-Admin-Role, X-CSRF-Token) off the
// cross-origin CORS path. VITE_API_BASE is intentionally NOT consulted:
// several clients read it for different backends, so it cannot identify the Fabric.

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

// Where the Fabric listens locally (the dev proxy target in vite.config.js).
export const FABRIC_LOCAL_TARGET = "http://127.0.0.1:8090";

// Same-origin prefix proxied to FABRIC_LOCAL_TARGET by vite.config.js.
export const FABRIC_PROXY_PREFIX = "/fabric-api";

function clean(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

// Explicitly configured Fabric base, or "" when none of the variables is set.
export const FABRIC_API_BASE_OVERRIDE =
  clean(env.VITE_FABRIC_API_BASE) ||
  clean(env.VITE_FABRIC_URL) ||
  clean(env.VITE_FABRIC_BASE_URL);

// The Fabric base every frontend Fabric client uses.
export const FABRIC_API_BASE = FABRIC_API_BASE_OVERRIDE || FABRIC_PROXY_PREFIX;

// Joins a Fabric-native route path ("/truth/claims", "/api/growth/claims",
// "/admin/agents") onto the canonical Fabric base.
export function fabricUrl(path = "") {
  const value = String(path || "");
  return `${FABRIC_API_BASE}${value && !value.startsWith("/") ? "/" : ""}${value}`;
}
