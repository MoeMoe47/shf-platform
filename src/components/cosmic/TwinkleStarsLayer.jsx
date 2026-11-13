import React, { useEffect, useRef } from "react";

// SHUIC_TWINKLE_VISIBILITY_V2
const STAR_COUNT = 650;
const FRAME_INTERVAL = 1000 / 30;

function createStars() {
  let seed = 923751;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  return Array.from({ length: STAR_COUNT }, () => ({
    x: rand(),
    y: rand(),
    radius: rand() < 0.93
      ? 0.65 + rand() * 1.10
      : 1.35 + rand() * 1.75,
    phase: rand() * Math.PI * 2,
    speed: 0.35 + rand() * 1.3,
    brightness: 0.16 + rand() * 0.35,
    amplitude: 0.30 + rand() * 0.44,
    ivory: rand() > 0.75
  }));
}

export default function TwinkleStarsLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const stars = createStars();
    const motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let frame = 0;
    let running = true;
    let lastFrame = 0;
    let elapsed = 0;
    let lastTime = 0;
    let width = 1;
    let height = 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(elapsed);
    }

    function render(time) {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const pulse = 0.5 + 0.5 *
          Math.sin(time * star.speed + star.phase);

        const alpha = Math.min(
          0.95,
          star.brightness + star.amplitude * pulse
        );

        const x = star.x * width;
        const y = star.y * height;
        const radius = star.radius * (0.8 + pulse * 0.35);

        const rgb = star.ivory ? "255,239,205" : "245,247,255";

        if (star.radius > 1.35) {
          ctx.beginPath();
          ctx.arc(x, y, radius * 4.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},${alpha * 0.045})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.fill();
      }
    }

    function tick(now) {
      if (!running || document.hidden || motion.matches) {
        frame = 0;
        return;
      }

      if (!lastFrame || now - lastFrame >= FRAME_INTERVAL) {
        const dt = lastTime
          ? Math.min((now - lastTime) / 1000, 0.1)
          : 0;

        elapsed += dt;
        render(elapsed);
        lastFrame = now;
        lastTime = now;
      }

      frame = requestAnimationFrame(tick);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      lastTime = 0;

      if (!running) return;

      if (motion.matches) {
        render(0);
      } else if (!document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    document.addEventListener("visibilitychange", refresh);

    if (motion.addEventListener) {
      motion.addEventListener("change", refresh);
    } else {
      motion.addListener(refresh);
    }

    refresh();

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);

      if (motion.removeEventListener) {
        motion.removeEventListener("change", refresh);
      } else {
        motion.removeListener(refresh);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cosmic-twinkle-canvas"
      aria-hidden="true"
    />
  );
}
