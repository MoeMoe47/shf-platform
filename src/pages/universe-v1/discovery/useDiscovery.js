// src/pages/universe-v1/discovery/useDiscovery.js
// React access to the cached canonical discovery index (discoverySources.js).
import { useCallback, useEffect, useState } from 'react';
import { getDiscovery, resetDiscoveryCache } from './discoverySources.js';

export default function useDiscovery() {
  const [state, setState] = useState({ phase: 'loading', index: null, status: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getDiscovery()
      .then(({ index, status }) => { if (alive) setState({ phase: 'ready', index, status }); })
      .catch(() => { if (alive) setState({ phase: 'error', index: null, status: null }); });
    return () => { alive = false; };
  }, [attempt]);

  const retry = useCallback(() => {
    resetDiscoveryCache();
    setState({ phase: 'loading', index: null, status: null });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}

// Small debounce for search input so the index is not re-searched on every
// keystroke while typing quickly.
export function useDebouncedValue(value, delayMs = 120) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
