import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function makeStarShadows(count, maxX = 2600, maxY = 1600) {
  const rand = (n) => Math.floor(Math.random() * n);
  const stars = [];
  for (let i = 0; i < count; i++) {
    const x = rand(maxX);
    const y = rand(maxY);
    const a = (Math.random() * 0.55 + 0.15).toFixed(2);
    const blur = (Math.random() * 1.8).toFixed(1);
    stars.push(`${x}px ${y}px ${blur}px rgba(255,255,255,${a})`);
  }
  return stars.join(", ");
}

export default function UniverseLayer() {
  const [mounted, setMounted] = useState(false);

  const starsA = useMemo(() => makeStarShadows(220), []);
  const starsB = useMemo(() => makeStarShadows(140), []);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="universe-layer" aria-hidden="true">
      <div className="universe-space" />
      <div className="universe-stars universe-stars-a" style={{ "--stars": starsA }} />
      <div className="universe-stars universe-stars-b" style={{ "--stars": starsB }} />
      <div className="universe-rings" />
      <div className="universe-vignette" />
    </div>,
    document.body
  );
}
