// src/pages/universe-v1/discovery/destinationEntry.js
// ------------------------------------------------------------
// Destination entry (SHU Ecosystem Experience V1, Phase 4). Every decision
// still comes from the destination registry (isDestinationAvailable /
// resolveDestinationHref / needsHardNavigation); this module only adds a
// short, restrained entry state before the navigation happens.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isDestinationAvailable,
  needsHardNavigation,
  resolveDestinationHref,
} from '../universeDestinationRegistry.js';

// Long enough to read as intentional, short enough not to feel slow.
export const ENTRY_TRANSITION_MS = 380;

// Pure plan (unit-tested): unavailable destinations are blocked outright —
// no animation, no navigation; reduced motion navigates immediately.
export function planDestinationEntry(destination, { reducedMotion = false } = {}) {
  if (!destination || !isDestinationAvailable(destination)) return { action: 'blocked' };
  return {
    action: 'navigate',
    href: resolveDestinationHref(destination),
    hard: needsHardNavigation(destination),
    delayMs: reducedMotion ? 0 : ENTRY_TRANSITION_MS,
  };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useDestinationEntry(navigate) {
  const [entering, setEntering] = useState(null);
  const timer = useRef(null);

  // A hard navigation can come back through the back/forward cache with
  // this component's state intact; clear the entry state when it does.
  useEffect(() => {
    const onPageShow = () => setEntering(null);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      clearTimeout(timer.current);
    };
  }, []);

  const enter = useCallback((destination, label) => {
    if (entering) return;
    const plan = planDestinationEntry(destination, { reducedMotion: prefersReducedMotion() });
    if (plan.action !== 'navigate') return;
    const go = () => {
      if (plan.hard) window.location.assign(plan.href);
      else {
        setEntering(null);
        navigate(plan.href);
      }
    };
    if (!plan.delayMs) {
      go();
      return;
    }
    setEntering({ id: destination.id, label: label || destination.label || destination.title });
    timer.current = setTimeout(go, plan.delayMs);
  }, [entering, navigate]);

  return { entering, enter };
}
