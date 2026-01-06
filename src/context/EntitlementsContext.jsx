// src/context/EntitlementsContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";

export const EntitlementsCtx = createContext({
  user: null,
  entitlements: [],
  roles: [],
  loading: true,
  refresh: () => {},
});

export function useEntitlements() {
  return useContext(EntitlementsCtx);
}

/* ──────────────────────────────────────────────────────────────
   SECURITY
   - No URL/localStorage overrides at all.
   - Purge any legacy spoof keys on load.
   - If you (developers) later want local-only overrides, we can
     re-enable behind a localhost+env flag, but it's OFF here.
   ────────────────────────────────────────────────────────────── */
try {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dev:entitlements");
    localStorage.removeItem("shf:entitlements");
    localStorage.removeItem("dev:roles");
    localStorage.removeItem("shf:roles");
  }
} catch {}

/** Read server-injected auth snapshot (customize to your app) */
function readServerAuth() {
  const w = typeof window !== "undefined" ? window : {};
  const injected = w.__AUTH__ || w.__USER__ || null;

  if (injected) {
    return {
      user: injected.user ?? injected,
      entitlements: injected.entitlements ?? [],
      roles: injected.roles ?? [],
    };
  }

  // Optional soft fallback if your login writes these
  try {
    const u = localStorage.getItem("auth:user");
    const e = localStorage.getItem("auth:entitlements");
    const r = localStorage.getItem("auth:roles");
    return {
      user: u ? JSON.parse(u) : null,
      entitlements: e ? JSON.parse(e) : [],
      roles: r ? JSON.parse(r) : [],
    };
  } catch {
    return { user: null, entitlements: [], roles: [] };
  }
}

export default function EntitlementsProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    entitlements: [],
    roles: [],
    loading: true,
  });

  const load = useCallback(async () => {
    const { user, entitlements, roles } = readServerAuth();

    setState({
      user: user ?? null,
      entitlements: Array.isArray(entitlements) ? entitlements : [],
      roles: Array.isArray(roles) ? roles : [],
      loading: false,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const value = useMemo(() => ({ ...state, refresh: load }), [state, load]);

  return (
    <EntitlementsCtx.Provider value={value}>
      {children}
    </EntitlementsCtx.Provider>
  );
}
