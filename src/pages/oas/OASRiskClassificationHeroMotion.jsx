// src/pages/oas/OASRiskClassificationHeroMotion.jsx
//
// Hero motion for the Risk Classification page: a frost/silver/gold/
// copper dust particle field, one slow traveling ridge light sweep,
// four sequential ridge-peak illumination glows, and a small
// pointer-driven background parallax shift. All layered between the
// static background (+ its readability fade) and the live text grid —
// see the z-index stack in oas-risk-classification.css
// (.oasrc-hero__atmosphere, .oasrc-hero__sweep, .oasrc-hero__peaks,
// .oasrc-hero__grid).
//
// Canvas for the particle field only (same rationale as
// OASPurposeBoundariesMotion.jsx: one rAF loop, zero per-frame React
// re-renders, and this component isn't mounted at all under
// prefers-reduced-motion — see the page component). The four peak
// glows and the ridge sweep are plain CSS-animated elements — cheap
// enough (a handful of DOM nodes, opacity/transform only) that a
// second canvas would be overkill.
//
// Moon parallax note: the three moons are baked into one flat
// background asset — there are no separate moon sprites, and adding
// new image layers is out of scope ("do not change background
// image"). True independent per-moon parallax isn't possible without
// new assets, so what ships instead is a single small parallax shift
// of the whole background image on pointer move (translate + a
// matching CSS scale to give the shift somewhere to reveal from,
// clipped by the hero's own overflow:hidden — never resizes or
// recrops the asset), capped at the largest of the three requested
// displacements. Moons and ridge move together as one plane rather
// than three independently.
import { useEffect, useRef } from "react";

const FROST = "205,210,214";
const SILVER = "182,188,194";
const GOLD = "214,180,110";
const COPPER = "196,132,86";

// 90-140 desktop / scaled down for tablet+mobile, split far/mid/near
// roughly evenly so no single layer dominates the visible count.
function densityFor(width) {
  if (width < 640) return { far: 16, mid: 12, near: 6 };
  if (width < 1024) return { far: 30, mid: 22, near: 10 };
  return { far: 44, mid: 34, near: 16 };
}

// Coherent lower-left -> upper-right drift (reinforces the escalation
// motif) rather than a random omnidirectional wander.
const DRIFT_ANGLE = -38 * (Math.PI / 180);
const DRIFT_UNIT = { x: Math.cos(DRIFT_ANGLE), y: Math.sin(DRIFT_ANGLE) };

// ~35% frost / 30% silver / 20% pale gold / 15% copper.
function pickColor() {
  const r = Math.random();
  if (r < 0.35) return FROST;
  if (r < 0.65) return SILVER;
  if (r < 0.85) return GOLD;
  return COPPER;
}

function buildParticles(width, height, density) {
  const far = [];
  const mid = [];
  const near = [];

  for (let i = 0; i < density.far; i++) {
    const speed = (20 + Math.random() * 15) / 60; // 20-35 px/sec
    far.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.8 + Math.random() * 0.5, // 0.8-1.3px
      dx: DRIFT_UNIT.x * speed,
      dy: DRIFT_UNIT.y * speed,
      baseAlpha: 0.18 + Math.random() * 0.12, // 0.18-0.30
      color: pickColor(),
      sparkleT: 0,
      sparkleChance: 0.002,
    });
  }

  for (let i = 0; i < density.mid; i++) {
    const speed = (45 + Math.random() * 25) / 60; // 45-70 px/sec
    mid.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.3 + Math.random() * 0.9, // 1.3-2.2px
      dx: DRIFT_UNIT.x * speed,
      dy: DRIFT_UNIT.y * speed,
      baseAlpha: 0.28 + Math.random() * 0.17, // 0.28-0.45
      color: pickColor(),
      sparkleT: 0,
      sparkleChance: 0.0035,
    });
  }

  for (let i = 0; i < density.near; i++) {
    const isStreak = Math.random() < 0.32;
    const speed = isStreak
      ? (120 + Math.random() * 60) / 60 // 120-180 px/sec rare streaks
      : (85 + Math.random() * 45) / 60; // 85-130 px/sec
    near.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: isStreak ? 3.5 + Math.random() * 0.5 : 2 + Math.random() * 1.5, // 2-3.5, glints 3.5-4
      dx: DRIFT_UNIT.x * speed,
      dy: DRIFT_UNIT.y * speed,
      baseAlpha: 0.4 + Math.random() * 0.25, // 0.40-0.65
      color: pickColor(),
      sparkleT: 0,
      sparkleChance: 0.006,
      streak: isStreak,
    });
  }

  return { far, mid, near };
}

function wrap(p, width, height, pad) {
  if (p.x > width + pad) {
    p.x = -pad;
    p.y = Math.random() * height;
  } else if (p.x < -pad) {
    p.x = width + pad;
    p.y = Math.random() * height;
  }
  if (p.y > height + pad) p.y = -pad;
  else if (p.y < -pad) p.y = height + pad;
}

// Left editorial column stays the calmest area but is never fully
// swept clean — a low floor lets a few faint particles cross it,
// ramping to full density by hero-center where the ridge/moon art
// itself is unobscured.
function leftFalloff(x, width) {
  const p = x / width;
  if (p <= 0.08) return 0.12;
  if (p >= 0.5) return 1;
  return 0.12 + ((p - 0.08) / 0.42) * 0.88;
}

export default function HeroMotion() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const hero = canvas.closest(".oasrc-hero");
    if (!hero) return undefined;
    const bg = hero.querySelector(".oasrc-hero__bg");
    const ctx = canvas.getContext("2d");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles = buildParticles(1, 1, densityFor(1));
    let raf = null;

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
    };

    sizeCanvas();
    const resizeObserver = new ResizeObserver(() => sizeCanvas());
    resizeObserver.observe(hero);

    const edgePad = 24;

    const drawLayer = (list, glow) => {
      for (const p of list) {
        p.x += p.dx;
        p.y += p.dy;
        wrap(p, width, height, edgePad);

        // Organic, infrequent sparkle: small chance per frame to
        // start a brief rise, then decay — never a rapid flash.
        if (p.sparkleT <= 0.01 && Math.random() < p.sparkleChance) {
          p.sparkleT = 1;
        } else if (p.sparkleT > 0) {
          p.sparkleT *= 0.9;
        }

        const alpha = Math.max(0, Math.min(1, (p.baseAlpha + p.sparkleT * 0.4) * leftFalloff(p.x, width)));
        if (alpha <= 0.01) continue;

        if (p.streak) {
          const trailLen = 6 + p.r * 2.2; // 6-14px, short
          const mag = Math.hypot(p.dx, p.dy) || 1;
          const tx = p.x - (p.dx / mag) * trailLen;
          const ty = p.y - (p.dy / mag) * trailLen;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${p.color},${Math.min(1, alpha * 0.85)})`;
          ctx.lineWidth = Math.max(1.1, p.r * 0.85);
          ctx.lineCap = "round";
          ctx.moveTo(tx, ty);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        const r = p.sparkleT > 0.3 ? p.r + p.sparkleT * 1.2 : p.r;

        // Soft bloom behind mid/near particles — the baked-in dust
        // already in the background art is flat and un-glowing, so a
        // small glow halo is what actually reads as "moving light"
        // rather than blending into that static texture.
        if (glow) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${p.color},${alpha * 0.35})`;
          ctx.shadowColor = `rgba(${p.color},${Math.min(1, alpha * 1.4)})`;
          ctx.shadowBlur = r * 3.2;
          ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color},${Math.min(1, alpha * 1.15)})`;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawLayer(particles.far, false);
      drawLayer(particles.mid, true);
      drawLayer(particles.near, true);
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    // Pointer-driven parallax — see file header for why this is one
    // shared background shift rather than three independent moon
    // layers. Eased toward a target rather than snapping directly, so
    // it reads as a smooth drift rather than a jump.
    let px = 0;
    let py = 0;
    let targetX = 0;
    let targetY = 0;
    let parallaxRaf = null;

    const onMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = -nx * 9; // capped at the largest requested displacement
      targetY = -ny * 5;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tickParallax = () => {
      px += (targetX - px) * 0.08;
      py += (targetY - py) * 0.08;
      if (bg) {
        bg.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) scale(1.05)`;
      }
      parallaxRaf = requestAnimationFrame(tickParallax);
    };

    if (bg) {
      hero.addEventListener("mousemove", onMove);
      hero.addEventListener("mouseleave", onLeave);
      parallaxRaf = requestAnimationFrame(tickParallax);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (parallaxRaf) cancelAnimationFrame(parallaxRaf);
      resizeObserver.disconnect();
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      if (bg) bg.style.transform = "";
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="oasrc-hero__atmosphere" aria-hidden="true" />
      <div className="oasrc-hero__sweep" aria-hidden="true" />
      <div className="oasrc-hero__peaks" aria-hidden="true">
        <span className="oasrc-hero__peak oasrc-hero__peak--1" />
        <span className="oasrc-hero__peak oasrc-hero__peak--2" />
        <span className="oasrc-hero__peak oasrc-hero__peak--3" />
        <span className="oasrc-hero__peak oasrc-hero__peak--4" />
      </div>
    </>
  );
}
