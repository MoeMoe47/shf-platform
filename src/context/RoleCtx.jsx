// src/context/RoleCtx.jsx
import React from "react";

/**
 * Lightweight Role context
 * - Works standalone
 * - Also auto-derives roles from EntitlementsCtx if present (optional)
 */

export const RoleCtx = React.createContext({
  roles: ["guest"],
  has: () => false,
  setRoles: () => {},
});

export function useRoles() {
  return React.useContext(RoleCtx);
}

export function RoleProvider({ children, initialRoles }) {
  // Optional: derive from EntitlementsCtx if it exists
  // (We don't import it to avoid creating a hard dependency.)
  const entitlements = useMaybeEntitlements();

  const [roles, setRoles] = React.useState(() => {
    if (Array.isArray(initialRoles) && initialRoles.length) return initialRoles;
    // URL override: ?roles=student,career
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get("roles");
      if (raw) return raw.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {}
    // Local dev override
    try {
      const raw = localStorage.getItem("dev:roles");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
        if (typeof raw === "string" && raw.includes(",")) {
          return raw.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    } catch {}
    // Fallback to entitlements or guest
    if (Array.isArray(entitlements?.roles) && entitlements.roles.length) {
      return entitlements.roles;
    }
    return ["guest"];
  });

  // Persist dev role overrides
  React.useEffect(() => {
    try {
      localStorage.setItem("dev:roles", JSON.stringify(roles));
    } catch {}
  }, [roles]);

  const has = React.useCallback(
    (role) => roles?.includes?.(role),
    [roles]
  );

  const value = React.useMemo(
    () => ({ roles, has, setRoles }),
    [roles, has]
  );

  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}

/* ---------- helpers ---------- */
function useMaybeEntitlements() {
  // If EntitlementsCtx exists, safely read it without importing.
  // This avoids circular/optional deps. We rely on window.__entitlements if
  // your EntitlementsProvider sets it; otherwise returns null.
  try {
    return window.__entitlements ?? null;
  } catch {
    return null;
  }
}
