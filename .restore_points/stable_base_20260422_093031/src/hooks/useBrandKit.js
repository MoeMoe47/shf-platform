// src/hooks/useBrandKit.js
import * as React from "react";

const KEY = "sales.brandKit.v1";
const DEFAULTS = {
  name: "",
  tagline: "",
  logoDataUrl: "",
  primary: "#cc0000",   // SHF Solutions default red
  secondary: "#111111", // near-black
  accent: "#ffffff",    // white
};

/** Persist to localStorage (best effort) */
function save(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch {}
}
function load(key, fb) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fb, ...JSON.parse(raw) } : fb;
  } catch {
    return fb;
  }
}

/** Apply CSS variables to the Sales app root (or <html> as fallback) */
function setCssVars(brand, scopeEl) {
  const el =
    scopeEl ||
    (typeof document !== "undefined" &&
      document.querySelector('[data-app="sales"]')) ||
    (typeof document !== "undefined" && document.documentElement);

  if (!el || !el.style) return;

  const p = brand.primary || DEFAULTS.primary;
  const s = brand.secondary || DEFAULTS.secondary;
  const a = brand.accent || DEFAULTS.accent;

  el.style.setProperty("--client-brand-primary", p);
  el.style.setProperty("--client-brand-secondary", s);
  el.style.setProperty("--client-brand-accent", a);
}

/** Brand kit hook — local state + persistence + CSS vars */
export function useBrandKit() {
  const [brand, setBrand] = React.useState(() => load(KEY, DEFAULTS));

  // persist on change
  React.useEffect(() => {
    save(KEY, brand);
  }, [brand]);

  // apply CSS vars on change
  React.useEffect(() => {
    setCssVars(brand);
  }, [brand.primary, brand.secondary, brand.accent]);

  // cross-tab sync
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue);
          setBrand((prev) => ({ ...prev, ...next }));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = React.useCallback((partial) => {
    setBrand((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = React.useCallback(() => {
    setBrand(DEFAULTS);
  }, []);

  const styleVars = React.useMemo(
    () => ({
      ["--client-brand-primary"]: brand.primary || DEFAULTS.primary,
      ["--client-brand-secondary"]: brand.secondary || DEFAULTS.secondary,
      ["--client-brand-accent"]: brand.accent || DEFAULTS.accent,
    }),
    [brand.primary, brand.secondary, brand.accent]
  );

  const applyVars = React.useCallback((el) => setCssVars(brand, el), [brand]);

  return { brand, update, reset, styleVars, applyVars };
}

export default useBrandKit;
