import React, { useEffect, useRef } from "react";

// SHUIC_SOLAR_DUST_MOUNT_REPAIR_V3
// Animated solar embers drifting across the viewport.

const COUNT = 560;
const FRAME_MS = 1000 / 30;
const TAU = Math.PI * 2;

function createParticles() {
  let seed = 837421;

  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  return Array.from({ length: COUNT }, () => ({
    x: random(),
    y: random(),
    vx: 0.025 + random() * 0.085,
    vy: -(0.01 + random() * 0.055),
    size: random() < 0.12
      ? 1.8 + random() * 1.5
      : 0.6 + random() * 1.1,
    alpha: 0.42 + random() * 0.45,
    phase: random() * TAU,
    drift: 0.8 + random() * 1.8,
    type: Math.floor(random() * 3)
  }));
}

export default function SolarDustLayer() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const particles = createParticles();

    const colors = [
      "255,190,80",
      "255,119,37",
      "255,240,195"
    ];

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let width = 1;
    let height = 1;
    let frame = 0;
    let previous = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let active = true;

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const x = p.x * width;
        const y = p.y * height;
        const rgb = colors[p.type];

        const shimmer = 0.75 + 0.25 *
          Math.sin(elapsed * p.drift + p.phase);

        const opacity = p.alpha * shimmer;

        // Bright core and soft ember halo.
        if (p.size > 1.8) {
          const glow = ctx.createRadialGradient(
            x, y, 0, x, y, p.size * 5
          );
          glow.addColorStop(0, `rgba(${rgb},${opacity * 0.4})`);
          glow.addColorStop(1, `rgba(${rgb},0)`);

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, p.size * 5, 0, TAU);
          ctx.fill();
        }

        // Blowing trail behind each particle.
        const trail = p.size > 1.8 ? 20 : 9;
        const angle = Math.atan2(
          p.vy * height, p.vx * width
        );

        ctx.beginPath();
        ctx.moveTo(
          x - Math.cos(angle) * trail,
          y - Math.sin(angle) * trail
        );
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(${rgb},${opacity * 0.56})`;
        ctx.lineWidth = p.size > 1.8 ? 1.35 : 0.6;
        ctx.stroke();

        ctx.fillStyle = `rgba(${rgb},${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, TAU);
        ctx.fill();
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();

      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      const dpr = Math.min(
        window.devicePixelRatio || 1, 1.5
      );

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function tick(now) {
      if (!active || document.hidden || reduced.matches) {
        frame = 0;
        return;
      }

      if (!lastFrame || now - lastFrame >= FRAME_MS) {
        const dt = previous
          ? Math.min((now - previous) / 1000, 0.1)
          : 0;

        previous = now;
        lastFrame = now;
        elapsed += dt;

        for (const p of particles) {
          p.x += (
            p.vx + Math.sin(elapsed + p.phase) * 0.008
          ) * dt;

          p.y += p.vy * dt;

          if (p.x > 1.04) p.x = -0.04;
          if (p.y < -0.04) p.y = 1.04;
        }

        draw();
      }

      frame = requestAnimationFrame(tick);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      lastFrame = 0;

      if (!active) return;

      if (reduced.matches) {
        draw();
      } else if (!document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    document.addEventListener("visibilitychange", refresh);

    if (reduced.addEventListener) {
      reduced.addEventListener("change", refresh);
    } else {
      reduced.addListener(refresh);
    }

    refresh();

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);

      if (reduced.removeEventListener) {
        reduced.removeEventListener("change", refresh);
      } else {
        reduced.removeListener(refresh);
      }
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="cosmic-solar-dust-canvas"
      aria-hidden="true"
    />
  );
}
