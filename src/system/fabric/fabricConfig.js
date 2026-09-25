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
//   4. "/fabric-api"          same-origin dev/proxy path, only automatic outside production
// The same-origin default mirrors the SHS API's "/api" proxy: it keeps Fabric
// session cookies and admin headers (X-Admin-Role, X-CSRF-Token) off the
// cross-origin CORS path. VITE_API_BASE is intentionally NOT consulted:
// several clients read it for different backends, so it cannot identify the Fabric.
//
// Production must either configure VITE_FABRIC_API_BASE (or a legacy alias) or
// explicitly confirm that the production frontend host routes /fabric-api to
// Agent Fabric with VITE_FABRIC_ENABLE_SAME_ORIGIN_PROXY=true. Without one of
// those, Fabric requests use a clear non-service path instead of silently
// assuming a gateway that may not exist.

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

// Where the Fabric listens locally (the dev proxy target in vite.config.js).
export const FABRIC_LOCAL_TARGET = "http://127.0.0.1:8090";

// Same-origin prefix proxied to FABRIC_LOCAL_TARGET by vite.config.js.
export const FABRIC_PROXY_PREFIX = "/fabric-api";
export const FABRIC_PRODUCTION_UNCONFIGURED_BASE = "/__fabric-production-route-unconfigured__";

function clean(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function enabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

export function isFabricProductionBuild(envLike = env) {
  return envLike.PROD === true || String(envLike.MODE || "").toLowerCase() === "production";
}

export function resolveFabricApiBase(envLike = env) {
  const override =
    clean(envLike.VITE_FABRIC_API_BASE) ||
    clean(envLike.VITE_FABRIC_URL) ||
    clean(envLike.VITE_FABRIC_BASE_URL);

  if (override) {
    return override;
  }

  if (isFabricProductionBuild(envLike) && !enabled(envLike.VITE_FABRIC_ENABLE_SAME_ORIGIN_PROXY)) {
    return FABRIC_PRODUCTION_UNCONFIGURED_BASE;
  }

  return FABRIC_PROXY_PREFIX;
}

// Explicitly configured Fabric base, or "" when none of the variables is set.
export const FABRIC_API_BASE_OVERRIDE =
  clean(env.VITE_FABRIC_API_BASE) ||
  clean(env.VITE_FABRIC_URL) ||
  clean(env.VITE_FABRIC_BASE_URL);

// The Fabric base every frontend Fabric client uses.
export const FABRIC_API_BASE = resolveFabricApiBase(env);

// Joins a Fabric-native route path ("/truth/claims", "/api/growth/claims",
// "/admin/agents") onto the canonical Fabric base.
export function fabricUrl(path = "") {
  const value = String(path || "");
  return `${FABRIC_API_BASE}${value && !value.startsWith("/") ? "/" : ""}${value}`;
}
