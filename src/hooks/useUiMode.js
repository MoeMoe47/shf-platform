// src/hooks/useUiMode.js
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * useUiMode(ns) lets you A/B a page by namespace (e.g., "treasury", "credit")
 * Priority: ?v=new|legacy > localStorage("<ns>:ui") > "legacy"
 */
export function useUiMode(ns = "treasury") {
  const { search } = useLocation();
  return useMemo(() => {
    const sp = new URLSearchParams(search);
    const urlMode = (sp.get("v") || "").toLowerCase();
    const stored = (localStorage.getItem(`${ns}:ui`) || "").toLowerCase();
    const mode = (urlMode || stored || "legacy");
    return mode === "new" ? "new" : "legacy";
  }, [search, ns]);
}

/**
 * setUiMode(ns, mode) persists selection and (optionally) updates the URL ?v=
 */
export function useSetUiMode(ns = "treasury") {
  const navigate = useNavigate();
  return (mode = "legacy", { persist = true, updateUrl = true } = {}) => {
    const next = mode === "new" ? "new" : "legacy";
    if (persist) localStorage.setItem(`${ns}:ui`, next);
    if (updateUrl) {
      const sp = new URLSearchParams(window.location.search);
      sp.set("v", next);
      navigate({ search: `?${sp.toString()}` }, { replace: true });
    }
    return next;
  };
}
