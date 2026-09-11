// src/pages/oas/OASPurposeBoundariesMotion.jsx
//
// Silver/gold dust particle field for the Purpose & Boundaries hero.
// Kept out of the main page component because it's pure motion
// plumbing (no content, no layout) — mounted in OASPurposeBoundariesPage.jsx
// as a sibling of .oaspb-hero__bg-fade, below the live content grid,
// above the (now target-free) background image.
//
// Canvas rather than N DOM particle nodes: this hero renders on every
// visit to the page, so the dust field needs to cost close to nothing
// — one rAF loop, zero React re-renders per frame, and the component
// simply isn't mounted at all when prefers-reduced-motion is set (see
// the page component's conditional render).
//
// No pointer coupling in this pass — motion is fully autonomous
// (left-to-right "wind," slight diagonal drift, no hover/parallax).
import { useEffect, useRef } from "react";

// rgba() triples matching the approved palette. Gold is a small
// fraction of the near layer only — "use gold sparingly."
const SILVER = "210,214,218";
const FROST = "235,238,240";
const WHITE = "255,255,255";
const GOLD = "220,185,115";

function densityFor(width) {
  // ~130 / ~70 / ~35 total particles at desktop/tablet/mobile,
  // matching the suggested 90-160 / 50-90 / 20-50 ranges.
  if (width < 640) return { far: 21, mid: 10, near: 4, mobile: true };
  if (width < 1024) return { far: 42, mid: 21, near: 7, mobile: false };
  return { far: 78, mid: 39, near: 13, mobile: false };
}

// Primary drift is left-to-right ("wind"), with a small per-particle
// diagonal wobble — never a random omnidirectional angle.
function driftVector(speed, wobble) {
  return {
    dx: speed,
    dy: (Math.random() - 0.5) * 2 * wobble * speed,
  };
}

function buildParticles(width, height, density) {
  const far = [];
  const mid = [];
  const near = [];

  for (let i = 0; i < density.far; i++) {
    const speed = 0.12 + Math.random() * 0.16;
    const { dx, dy } = driftVector(speed, 0.35);
    far.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 0.7,
      dx,
      dy,
      baseAlpha: 0.08 + Math.random() * 0.12,
      color: Math.random() < 0.55 ? WHITE : FROST,
      sparkleT: 0,
      sparkleChance: 0.0025,
    });
  }

  for (let i = 0; i < density.mid; i++) {
    const speed = 0.35 + Math.random() * 0.3;
    const { dx, dy } = driftVector(speed, 0.3);
    mid.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 1,
      dx,
      dy,
      baseAlpha: 0.22 + Math.random() * 0.18,
      color: SILVER,
      sparkleT: 0,
      sparkleChance: 0.004,
    });
  }

  for (let i = 0; i < density.near; i++) {
    const speed = 0.9 + Math.random() * 0.7;
    const { dx, dy } = driftVector(speed, 0.22);
    const isGold = Math.random() < 0.4;
    near.push({
      x: Math.random() * width,
      y: Math.random() * height,
      px: 0,
      py: 0,
      r: 1.5 + Math.random() * (isGold ? 1.5 : 1.2),
      dx,
      dy,
      baseAlpha: 0.4 + Math.random() * 0.25,
      color: isGold ? GOLD : SILVER,
      sparkleT: 0,
      sparkleChance: 0.006,
      trail: !density.mobile,
    });
  }

  return { far, mid, near };
}

function wrapX(p, width, pad) {
  if (p.x > width + pad) {
    p.x = -pad;
    p.y = Math.random() * (p._height || 0);
  } else if (p.x < -pad) {
    p.x = width + pad;
  }
}

function edgeFade(x, y, width, height, pad) {
  const l = Math.max(0, Math.min(1, x / pad));
  const r = Math.max(0, Math.min(1, (width - x) / pad));
  const t = Math.max(0, Math.min(1, y / (pad * 0.6)));
  const b = Math.max(0, Math.min(1, (height - y) / (pad * 0.6)));
  return Math.min(l, r, t, b);
}

// Keeps the left editorial column calm: particles are heavily damped
// below ~50% width and reach full strength by ~62% — the same general
// zone .oaspb-hero__bg-fade protects, so the two effects agree rather
// than fight each other.
function leftFalloff(x, width) {
  const p = x / width;
  if (p <= 0.12) return 0.05;
  if (p >= 0.62) return 1;
  return 0.05 + ((p - 0.12) / 0.5) * 0.95;
}

export default function HeroAtmosphere() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const hero = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles = buildParticles(1, 1, densityFor(1));
    let raf = null;
    let last = performance.now();

    const sizeCanvas = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = buildParticles(width, height, densityFor(width));
      [...particles.far, ...particles.mid, ...particles.near].forEach((p) => {
        p._height = height;
      });
    };

    sizeCanvas();
    const resizeObserver = new ResizeObserver(() => sizeCanvas());
    resizeObserver.observe(hero);

    const edgePad = 36;

    const drawLayer = (list, withTrail) => {
      for (const p of list) {
        p.x += p.dx;
        p.y += p.dy;
        // Gentle vertical containment so the diagonal wobble never
        // walks a particle far outside the hero before it wraps.
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        wrapX(p, width, edgePad);

        // Organic, infrequent sparkle: a small chance per frame to
        // start a brief rise, then a slow decay — never a rapid flash.
        if (p.sparkleT <= 0.01 && Math.random() < p.sparkleChance) {
          p.sparkleT = 1;
        } else if (p.sparkleT > 0) {
          p.sparkleT *= 0.92;
        }

        const fade = edgeFade(p.x, p.y, width, height, edgePad) * leftFalloff(p.x, width);
        const alpha = Math.max(0, Math.min(1, (p.baseAlpha + p.sparkleT * 0.5) * fade));
        if (alpha <= 0.01) continue;

        if (withTrail && p.trail) {
          const trailLen = 6 + p.r * 2;
          const mag = Math.hypot(p.dx, p.dy) || 1;
          const tx = p.x - (p.dx / mag) * trailLen;
          const ty = p.y - (p.dy / mag) * trailLen;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${p.color},${alpha * 0.35})`;
          ctx.lineWidth = Math.max(0.6, p.r * 0.6);
          ctx.moveTo(tx, ty);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        const r = p.sparkleT > 0.3 ? p.r + p.sparkleT * 1.2 : p.r;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = (now) => {
      last = now;
      ctx.clearRect(0, 0, width, height);
      drawLayer(particles.far, false);
      drawLayer(particles.mid, false);
      drawLayer(particles.near, true);
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="oaspb-hero__atmosphere" aria-hidden="true" />;
}
