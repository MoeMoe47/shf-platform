// src/components/companion/CompanionFace.jsx
// The "digital face" communication surface. This is a placeholder shape —
// no approved character asset exists in the repo or was supplied with this
// task (confirmed via repository audit) — deliberately built as inline SVG
// so it can be swapped for a transparent PNG/WebP, sprite sheet, Lottie,
// Rive, or video asset later by editing only this one file. Nothing else
// in the companion architecture knows or cares how the face is rendered.
import React from "react";

// Simple eye/mouth presets per motion token — kept tiny and declarative so
// swapping in a real asset later means deleting this map, not rewriting
// callers.
const EXPRESSIONS = {
  idle: { eyes: "open", mouth: "flat" },
  blink: { eyes: "closed", mouth: "flat" },
  look: { eyes: "open", mouth: "flat" },
  wave: { eyes: "open", mouth: "smile" },
  thinking: { eyes: "open", mouth: "flat" },
  hint: { eyes: "open", mouth: "smile" },
  fistPump: { eyes: "open", mouth: "smile" },
  miniDance: { eyes: "open", mouth: "smile" },
  victoryDance: { eyes: "open", mouth: "grin" },
  celebrate: { eyes: "open", mouth: "grin" },
  projectVictory: { eyes: "open", mouth: "grin" },
  majorCelebration: { eyes: "open", mouth: "grin" },
  sleep: { eyes: "closed", mouth: "flat" },
  wake: { eyes: "open", mouth: "flat" },
};

export default function CompanionFace({ animation = "idle", size = 56 }) {
  const expr = EXPRESSIONS[animation] || EXPRESSIONS.idle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="brainiact-svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Dark robotic body */}
      <rect x="18" y="40" width="28" height="20" rx="8" fill="#20242c" />
      <rect x="10" y="44" width="8" height="5" rx="2.5" className="brainiact-limb brainiact-limb--left" fill="#2c313b" />
      <rect x="46" y="44" width="8" height="5" rx="2.5" className="brainiact-limb brainiact-limb--right" fill="#2c313b" />

      {/* Pink brain head */}
      <path
        d="M32 6c-10 0-17 6.5-17 15.5 0 5 2 8.7 5 11.3v3.7c0 2.5 2 4.5 4.5 4.5h15c2.5 0 4.5-2 4.5-4.5v-3.7c3-2.6 5-6.3 5-11.3C49 12.5 42 6 32 6Z"
        fill="#f2a6c6"
      />
      {/* Black brain creases */}
      <path d="M20 18c3-3 7-4 10-2" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M26 14c4-2 9-1 12 2" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M22 24c4 2 9 2 13-1" stroke="#1a1a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M38 16c3 1 6 3 7 6" stroke="#1a1a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Glossy digital face mask */}
      <rect x="19" y="26" width="26" height="16" rx="8" fill="#0e1116" opacity="0.92" />
      <rect x="19" y="26" width="26" height="7" rx="6" fill="#ffffff" opacity="0.08" />

      {/* Eyes */}
      {expr.eyes === "open" ? (
        <>
          <circle cx="26.5" cy="33.5" r="2.1" className="brainiact-eye" fill="#7CE0FF" />
          <circle cx="37.5" cy="33.5" r="2.1" className="brainiact-eye" fill="#7CE0FF" />
        </>
      ) : (
        <>
          <rect x="24.5" y="33" width="4" height="1.4" rx="0.7" fill="#7CE0FF" />
          <rect x="35.5" y="33" width="4" height="1.4" rx="0.7" fill="#7CE0FF" />
        </>
      )}

      {/* Mouth */}
      {expr.mouth === "smile" && <path d="M27 38c2 1.6 8 1.6 10 0" stroke="#7CE0FF" strokeWidth="1.4" fill="none" strokeLinecap="round" />}
      {expr.mouth === "grin" && <path d="M26 37.5c2.5 2.4 9.5 2.4 12 0" stroke="#7CE0FF" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      {expr.mouth === "flat" && <rect x="28" y="37.4" width="8" height="1.4" rx="0.7" fill="#7CE0FF" />}
    </svg>
  );
}
