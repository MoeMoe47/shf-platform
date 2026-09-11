// src/pages/oas/OASPurposeBoundariesLowerMotion.jsx
//
// Calmer companion to OASPurposeBoundariesMotion.jsx (the hero dust
// field) — scoped to .oaspb-lower only, so it never renders over the
// footer (it's sized to its own parent's bounding box, and .oaspb-lower
// itself ends before the footer in document order). Still deliberately
// lighter than the hero (count, speed, trail frequency) — the hero
// stays the most visually active area — but recalibrated for
// visibility: the first color pass (mostly white/pale-gold) blended
// into the lower background's own white/ivory tone almost completely.
// Frost/silver greys are now the dominant palette, with sizes,
// opacity, and speed all raised a step so the drift reads clearly
// against a pale backdrop instead of disappearing into it.
//
// Text protection here isn't a single left/right falloff like the
// hero (which only has to protect one editorial column) — the lower
// section has three text columns with gaps between them, so density
// is shaped by a horizontal curve that dips over each column and
// rises at the two edges and the two inter-column gaps, plus a
// vertical curve that fades in from the hero, stays fullest across
// Overview/Why It Matters/In Practice, tapers through Dive Deeper, and
// reaches zero before the section (and the canvas itself) ends.
import { useEffect, useRef } from "react";

const FROST_GREY = "165,172,178";
const SILVER_GREY = "135,145,155";
const SOFT_WHITE = "255,255,255";
const PALE_GOLD = "205,168,100";

function densityFor(width) {
  // ~100 / ~60 / ~28 total at desktop/tablet/mobile — within the
  // 75-120 / 45-75 / 20-35 target ranges, still well under the hero's
  // own counts at every breakpoint.
  if (width < 640) return { far: 15, mid: 10, near: 3, mobile: true };
  if (width < 1024) return { far: 32, mid: 21, near: 7, mobile: false };
  return { far: 54, mid: 36, near: 12, mobile: false };
}

function driftVector(speed, wobble) {
  return { dx: speed, dy: (Math.random() - 0.5) * 2 * wobble * speed };
}

// Piecewise-linear curve sampled at a handful of control points, both
// for the horizontal (edges + column gaps up, columns down) and
// vertical (fade in from hero, hold, taper into Dive Deeper, gone
// before the footer) density shaping.
function sampleCurve(points, t) {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (clamped >= x0 && clamped <= x1) {
      const f = x1 === x0 ? 0 : (clamped - x0) / (x1 - x0);
      return y0 + (y1 - y0) * f;
    }
  }
  return points[points.length - 1][1];
}

// Edges strong (left orbital edge / right planetary edge), dips over
// the three text columns (~10-30%, ~38-60%, ~70-90%), small rises in
// the two gaps between them (~33%, ~65%) and in the outer margins.
const H_CURVE = [
  [0, 1],
  [0.06, 1],
  [0.14, 0.4],
  [0.3, 0.35],
  [0.34, 0.65],
  [0.38, 0.4],
  [0.6, 0.3],
  [0.65, 0.65],
  [0.7, 0.4],
  [0.9, 0.4],
  [0.94, 1],
  [1, 1],
];

// Fades in from the hero, holds through Overview/Why It
// Matters/In Practice, tapers through Dive Deeper, gone before the
// wrapper (and canvas) ends — so nothing ever reaches the footer.
const V_CURVE = [
  [0, 0.3],
  [0.05, 1],
  [0.46, 1],
  [0.68, 0.4],
  [0.85, 0.18],
  [0.95, 0.04],
  [1, 0],
];

// Picks far/mid layer color so the overall mix across the whole field
// lands close to the approved 45% frost / 30% silver / 15% white /
// 10% gold balance (gold is deliberately rare in far/mid and only
// moderately present in the sparse near layer, never the majority).
function farOrMidColor(goldChance) {
  const r = Math.random();
  if (r < 0.4) return FROST_GREY;
  if (r < 0.78) return SILVER_GREY;
  if (r < 0.93 || goldChance <= 0) return SOFT_WHITE;
  return PALE_GOLD;
}

function buildParticles(width, height, density) {
  const far = [];
  const mid = [];
  const near = [];

  for (let i = 0; i < density.far; i++) {
    const speed = 0.1 + Math.random() * 0.06;
    const { dx, dy } = driftVector(speed, 0.3);
    const color = farOrMidColor(0);
    const range = color === FROST_GREY ? [0.2, 0.28] : color === SILVER_GREY ? [0.22, 0.3] : [0.15, 0.2];
    far.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 0.5,
      dx,
      dy,
      baseAlpha: range[0] + Math.random() * (range[1] - range[0]),
      color,
      sparkleT: 0,
      sparkleChance: 0.0018,
    });
  }

  for (let i = 0; i < density.mid; i++) {
    const speed = 0.24 + Math.random() * 0.12;
    const { dx, dy } = driftVector(speed, 0.28);
    const color = farOrMidColor(0.1);
    const range =
      color === FROST_GREY
        ? [0.28, 0.38]
        : color === SILVER_GREY
          ? [0.32, 0.44]
          : color === PALE_GOLD
            ? [0.2, 0.3]
            : [0.2, 0.28];
    mid.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.2 + Math.random() * 0.8,
      dx,
      dy,
      baseAlpha: range[0] + Math.random() * (range[1] - range[0]),
      color,
      sparkleT: 0,
      sparkleChance: 0.003,
    });
  }

  // The "fast grey dust" tier: mostly silver/frost grey (visibly
  // windblown, short-trailed), with a sparser, faster pale-gold glint
  // mixed in.
  for (let i = 0; i < density.near; i++) {
    const isGold = Math.random() < 0.35;
    const baseSpeed = 0.55 + Math.random() * 0.3;
    const speed = isGold ? baseSpeed * (1.4 + Math.random() * 0.3) : baseSpeed;
    const { dx, dy } = driftVector(speed, 0.2);
    near.push({
      x: Math.random() * width,
      y: Math.random() * height,
      px: 0,
      py: 0,
      r: 2 + Math.random() * 1,
      dx,
      dy,
      baseAlpha: isGold ? 0.22 + Math.random() * 0.16 : 0.34 + Math.random() * 0.14,
      color: isGold ? PALE_GOLD : Math.random() < 0.5 ? SILVER_GREY : FROST_GREY,
      sparkleT: 0,
      sparkleChance: isGold ? 0.008 : 0.005,
      trail: !density.mobile,
    });
  }

  return { far, mid, near };
}

function wrapX(p, width, pad) {
  if (p.x > width + pad) p.x = -pad;
  else if (p.x < -pad) p.x = width + pad;
}

export default function LowerAtmosphere() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const section = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles = buildParticles(1, 1, densityFor(1));
    let raf = null;

    const sizeCanvas = () => {
      const rect = section.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = buildParticles(width, height, densityFor(width));
    };

    sizeCanvas();
    const resizeObserver = new ResizeObserver(() => sizeCanvas());
    resizeObserver.observe(section);

    const drawLayer = (list) => {
      for (const p of list) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -8) p.y = height + 8;
        if (p.y > height + 8) p.y = -8;
        wrapX(p, width, 24);

        if (p.sparkleT <= 0.01 && Math.random() < p.sparkleChance) {
          p.sparkleT = 1;
        } else if (p.sparkleT > 0) {
          p.sparkleT *= 0.9;
        }

        // Gold glints a little more than grey/silver when it sparkles
        // (still a brief brighten, never a flash).
        const sparkleBoost = p.color === PALE_GOLD ? 0.5 : 0.35;
        const shape = sampleCurve(H_CURVE, p.x / width) * sampleCurve(V_CURVE, p.y / height);
        const alpha = Math.max(0, Math.min(1, (p.baseAlpha + p.sparkleT * sparkleBoost) * shape));
        if (alpha <= 0.01) continue;

        if (p.trail) {
          // 5-10px short trail on the fast grey/gold dust only.
          const trailLen = 5 + p.r * 1.6;
          const mag = Math.hypot(p.dx, p.dy) || 1;
          const tx = p.x - (p.dx / mag) * trailLen;
          const ty = p.y - (p.dy / mag) * trailLen;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${p.color},${alpha * 0.35})`;
          ctx.lineWidth = Math.max(0.6, p.r * 0.55);
          ctx.moveTo(tx, ty);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        const r = p.sparkleT > 0.3 ? p.r + p.sparkleT * 0.6 : p.r;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawLayer(particles.far);
      drawLayer(particles.mid);
      drawLayer(particles.near);
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="oaspb-lower__dust" aria-hidden="true" />;
}
