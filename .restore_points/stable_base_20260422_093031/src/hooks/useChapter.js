// src/hooks/useChapter.js
import React from "react";

const CACHE = new Map();
const TTL = 1000 * 60 * 5; // 5 minutes

export function useChapter(slug, { curriculum = "asl" } = {}) {
  const key = `${curriculum}:${slug}`;
  const [state, setState] = React.useState(() => {
    const cached = CACHE.get(key);
    if (cached && (Date.now() - cached.t) < TTL) {
      return { loading: false, data: cached.data, error: null };
    }
    return { loading: true, data: null, error: null };
  });

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setState((s) => ({ ...s, loading: !CACHE.has(key) }));
        // prefer cached first
        const cached = CACHE.get(key);
        if (cached && (Date.now() - cached.t) < TTL) {
          if (!cancelled) setState({ loading: false, data: cached.data, error: null });
          return;
        }

        const res = await fetch(`/api/chapters/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const wrapped = {
          slug,
          curriculum,
          data: json,
        };

        CACHE.set(key, { t: Date.now(), data: wrapped });
        if (!cancelled) setState({ loading: false, data: wrapped, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, data: null, error: err });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [key, slug, curriculum]);

  const refresh = React.useCallback(() => {
    CACHE.delete(key);
    setState({ loading: true, data: null, error: null });
  }, [key]);

  return { ...state, refresh };
}
