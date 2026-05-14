// src/utils/useValidCurriculum.js
import React from "react";

/**
 * Resolves a route curriculum to a valid one from /api/curricula.
 * Returns { ready, resolved, list, error }.
 * - If the route value is valid -> resolved = route value
 * - Else -> resolved = first available (or "asl" fallback if empty)
 */
export function useValidCurriculum(routeCur = "asl") {
  const [list, setList]   = React.useState([]);
  const [error, setError] = React.useState("");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setReady(false);
        setError("");
        const r = await fetch("/api/curricula", { signal: ac.signal });
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const j = await r.json();
        const arr = Array.isArray(j) ? j : (j?.curricula || []);
        setList(arr);
      } catch (e) {
        setError(e?.message || "Failed to load curricula");
        setList([]);
      } finally {
        setReady(true);
      }
    })();
    return () => ac.abort();
  }, []);

  let resolved = (routeCur || "").toLowerCase();
  if (ready) {
    if (!list.includes(resolved)) {
      resolved = list[0] || "asl";
    }
  }

  return { ready, resolved, list, error };
}
