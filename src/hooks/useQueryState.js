import { useLocation, useNavigate } from "react-router-dom";
import React from "react";

/**
 * useQueryState("tab","courses")
 * - Keeps state in URLSearchParams; updates don't push a history entry.
 */
export default function useQueryState(key, defaultValue){
  const nav = useNavigate();
  const loc = useLocation();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const value = params.get(key) ?? defaultValue;

  const setValue = React.useCallback((v) => {
    const next = new URLSearchParams(loc.search);
    next.set(key, v);
    nav({ pathname: loc.pathname, search: `?${next.toString()}` }, { replace: true });
  }, [key, loc.pathname, loc.search, nav]);

  return [value, setValue];
}
