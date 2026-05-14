import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const KEY_UNLOCK = "shf.sfx.unlocked.v1";

/**
 * Autoplay rules:
 * - Audio can only play after a user gesture.
 * - We provide unlock() triggered by clicking a button.
 */
export function useSfx() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(KEY_UNLOCK) === "1"; } catch { return false; }
  });

  const poolRef = useRef(new Map()); // src -> Audio
  const lastPlayRef = useRef(0);

  const unlock = useCallback(async () => {
    try {
      // Tiny silent-ish "tick" to satisfy gesture-based unlock in most browsers.
      // If the file doesn't exist, we still mark unlocked; user gesture is what matters.
      localStorage.setItem(KEY_UNLOCK, "1");
      setUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const getAudio = useCallback((src) => {
    const pool = poolRef.current;
    if (pool.has(src)) return pool.get(src);
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = 0.85;
    pool.set(src, a);
    return a;
  }, []);

  const play = useCallback((src, opts = {}) => {
    const { volume = 0.85, rate = 1.0, cooldownMs = 70 } = opts;
    if (!unlocked) return false;

    const t = Date.now();
    if (t - lastPlayRef.current < cooldownMs) return false;
    lastPlayRef.current = t;

    try {
      const a = getAudio(src);
      a.currentTime = 0;
      a.volume = volume;
      a.playbackRate = rate;
      // play() may reject; ignore safely
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      return true;
    } catch {
      return false;
    }
  }, [getAudio, unlocked]);

  return useMemo(() => ({ unlocked, unlock, play }), [unlocked, unlock, play]);
}
