// src/shared/auth/authClient.js
// Minimal, safe auth shim for Treasury header (client-side gating)

let _cachedRoles = null;

function readDevRolesOverride() {
  // ?roles=admin,staff  OR sessionStorage.setItem("dev:roles",'["admin"]')
  try {
    const sp = new URLSearchParams(window.location.search);
    const rolesQ = sp.get("roles");
    if (rolesQ) return rolesQ.split(",").map(s => s.trim()).filter(Boolean);
  } catch {}
  try {
    const raw = sessionStorage.getItem("dev:roles");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
}

export const auth = {
  /** Hook-friendly session (returns plain object; not reactive) */
  getSession() {
    // cache so multiple calls during render don’t thrash storage
    if (_cachedRoles == null) _cachedRoles = readDevRolesOverride();
    const roles = _cachedRoles || ["viewer"]; // default role

    return {
      user: { id: "dev", name: "Dev User" },
      roles,                       // e.g., ["admin"] | ["staff"] | ["viewer"]
      entitlements: ["treasury"],  // expand as needed
    };
  },

  /** Imperative helper to set roles in dev easily */
  __devSetRoles(nextRoles = []) {
    try {
      sessionStorage.setItem("dev:roles", JSON.stringify(nextRoles));
      _cachedRoles = nextRoles;
    } catch {}
  },
};
