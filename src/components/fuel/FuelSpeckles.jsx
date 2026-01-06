// src/components/fuel/FuelSpeckles.jsx
import React from "react";

/**
 * FuelSpeckles — CSS-only ambient background (radial-gradient speckles).
 * - No canvas; just gradients + keyframes.
 * - Honors prefers-reduced-motion.
 * - Scoped to html[data-app="fuel"] to avoid bleed.
 */
export default function FuelSpeckles({
  opacity = 0.75,     // overall opacity
  scale = 1,          // scale the pattern
  speed = 28,         // seconds per cycle
}){
  React.useEffect(() => {
    const ID = "fuel-speckles-css";
    if (document.getElementById(ID)) return;

    const css = `
    html[data-app="fuel"] .fuel-speckles {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      opacity: ${opacity};
      mix-blend-mode: normal;
      transform: scale(${scale});
      transform-origin: center;
      background:
        radial-gradient(160px 160px at 20% 30%, rgba(255,79,0,.14), rgba(255,79,0,0) 60%),
        radial-gradient(220px 220px at 75% 20%, rgba(16,185,129,.10), rgba(16,185,129,0) 60%),
        radial-gradient(180px 180px at 30% 75%, rgba(15,23,42,.06), rgba(15,23,42,0) 60%),
        radial-gradient(260px 200px at 80% 70%, rgba(255,79,0,.10), rgba(255,79,0,0) 65%);
      background-repeat: no-repeat;
      animation: fuel-speckles-move ${speed}s ease-in-out infinite alternate;
    }
    @keyframes fuel-speckles-move {
      0%   { background-position:
                20% 30%, 75% 20%, 30% 75%, 80% 70%; }
      100% { background-position:
                25% 35%, 70% 25%, 35% 70%, 76% 72%; }
    }
    @media (prefers-reduced-motion: reduce) {
      html[data-app="fuel"] .fuel-speckles { animation: none; }
    }
    /* ensure content stacks above */
    html[data-app="fuel"] .ft-wrap { position: relative; z-index: 1; }
    `;
    const el = document.createElement("style");
    el.id = ID;
    el.textContent = css;
    document.head.appendChild(el);
  }, [opacity, scale, speed]);

  return <div className="fuel-speckles" aria-hidden="true" />;
}
