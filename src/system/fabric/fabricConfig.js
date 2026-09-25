// src/system/fabric/fabricConfig.js
// Canonical frontend base URL for the Agent Fabric (services/shf-agent-fabric).
//
// The Fabric's local port is 8090: main.py defaults PORT to 8090 and
// bin/restart_8090.sh (used by ci.sh / preflight.sh) starts it there. The
// SHS API (apps/shs-api, 8091) is configured separately in
// system/identity/authConfig.js — do not route Fabric traffic through it.
//
// Resolution order:
//   1. VITE_FABRIC_API_BASE   canonical
//   2. VITE_FABRIC_URL        legacy alias (admin pages)
//   3. VITE_FABRIC_BASE_URL   legacy alias (registry admin client)
//   4. http://127.0.0.1:8090  local development default
// VITE_API_BASE is intentionally NOT consulted: several clients read it for
// different backends, so it cannot identify the Fabric.

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

export const FABRIC_LOCAL_DEFAULT = "http://127.0.0.1:8090";

function clean(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

// Explicitly configured Fabric base, or "" when none of the variables is set.
// Clients that deliberately default to same-origin relative paths use this.
export const FABRIC_API_BASE_OVERRIDE =
  clean(env.VITE_FABRIC_API_BASE) ||
  clean(env.VITE_FABRIC_URL) ||
  clean(env.VITE_FABRIC_BASE_URL);

// The Fabric base every other frontend client should use.
export const FABRIC_API_BASE = FABRIC_API_BASE_OVERRIDE || FABRIC_LOCAL_DEFAULT;
