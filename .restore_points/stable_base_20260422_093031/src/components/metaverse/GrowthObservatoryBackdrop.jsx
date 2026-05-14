import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Top 1% Backdrop:
 * - Hero art (blurred + sharpened blend)
 * - Fog layers (animated)
 * - Parallax (mouse + idle drift)
 * - Zero interference with UI (pointer-events: none)
 */
export default function GrowthObservatoryBackdrop({
  artSrc = "/src/assets/hero/growth-observatory-art.png",
}) {
  const ref = useRef(null);
  const [ok, setOk] = useState(true);

  // If the file path is wrong, fail gracefully.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = artSrc;
  }, [artSrc]);

  const layers = useMemo(
    () => ({
      // tiny random offsets so fog doesn’t look “looped”
      fog1Seed: Math.random() * 1000,
      fog2Seed: Math.random() * 1000,
    }),
    [],
  );

  useEffect(() => {
  const el = ref.current;
  if (!el) return;

  // If user prefers reduced motion, keep it calm + static.
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Throttle updates to reduce GPU tearing (Chrome + blur + fixed layers).
  const FPS = reduceMotion ? 0 : 30;
  const FRAME_MS = FPS > 0 ? 1000 / FPS : Infinity;

  let raf = 0;
  let last = 0;
  let running = true;

  function tick(t) {
    if (!running) return;

    if (reduceMotion) {
      el.style.setProperty("--fog1-x", "0px");
      el.style.setProperty("--fog2-x", "0px");
      return;
    }

    if (t - last >= FRAME_MS) {
      last = t;

      // Keep your existing seeds if present, otherwise default.
      const fog1Seed = (layersRef?.current?.fog1Seed ?? 0);
      const fog2Seed = (layersRef?.current?.fog2Seed ?? 0);

      const f1x = (t / 12000 + fog1Seed) % 1;
      const f2x = (t / 16000 + fog2Seed) % 1;

      el.style.setProperty("--fog1-x", `${(f1x * 120 - 60).toFixed(2)}px`);
      el.style.setProperty("--fog2-x", `${(f2x * 160 - 80).toFixed(2)}px`);
    }

    raf = window.requestAnimationFrame(tick);
  }

  function onVis() {
    if (document.hidden) {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else {
      if (!running) {
        running = true;
        last = 0;
        raf = window.requestAnimationFrame(tick);
      }
    }
  }

  document.addEventListener("visibilitychange", onVis);

  raf = window.requestAnimationFrame(tick);

  return () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVis);
  };
}, []);

  return (
    <div ref={ref} className="got-backdrop" aria-hidden="true">
      {/* Hero artwork layers */}
      <div
        className="got-backdrop-art got-backdrop-art--sharp"
        style={{ backgroundImage: ok ? `url(${artSrc})` : "none" }}
      />
      <div
        className="got-backdrop-art got-backdrop-art--blur"
        style={{ backgroundImage: ok ? `url(${artSrc})` : "none" }}
      />

      {/* Fog layers (pure CSS gradients + blend) */}
      <div className="got-backdrop-fog got-backdrop-fog--1" />
      <div className="got-backdrop-fog got-backdrop-fog--2" />

      {/* Dark overlay + vignette to keep text readable */}
      <div className="got-backdrop-overlay" />
      <div className="got-backdrop-vignette" />
    </div>
  );
}
