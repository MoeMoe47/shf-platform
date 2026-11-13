// SHUIC_VISIBLE_CINEMATIC_DUST_V5
import React, { useEffect, useRef } from "react";

export default function SolarDustLayer() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let running = true;

    const CONFIG = {
      count: 240,              // toned down from the previous heavy version
      minSize: 0.8,
      maxSize: 2.4,
      minSpeedX: 0.18,
      maxSpeedX: 0.48,
      minSpeedY: -0.035,
      maxSpeedY: 0.035,
      minAlpha: 0.28,
      maxAlpha: 0.58,
      trailLength: 6,
      flicker: 0.018,
    };

    const COLORS = [
      [255, 236, 205], // ivory
      [255, 214, 138], // soft gold
      [255, 173, 92],  // warm orange
    ];

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function pickColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function makeParticle() {
      const color = pickColor();
      const size = rand(CONFIG.minSize, CONFIG.maxSize);
      return {
        x: rand(-width * 0.08, width * 1.08),
        y: rand(-height * 0.08, height * 1.08),
        vx: rand(CONFIG.minSpeedX, CONFIG.maxSpeedX),
        vy: rand(CONFIG.minSpeedY, CONFIG.maxSpeedY),
        size,
        baseAlpha: rand(CONFIG.minAlpha, CONFIG.maxAlpha),
        phase: rand(0, Math.PI * 2),
        twinkle: rand(0.4, 1.2),
        color,
        trail: rand(5, CONFIG.trailLength),
      };
    }

    function resetParticle(p, fromLeft = false) {
      const np = makeParticle();
      p.x = fromLeft ? rand(-width * 0.1, 0) : rand(-width * 0.08, width * 1.08);
      p.y = rand(-height * 0.08, height * 1.08);
      p.vx = np.vx;
      p.vy = np.vy;
      p.size = np.size;
      p.baseAlpha = np.baseAlpha;
      p.phase = np.phase;
      p.twinkle = np.twinkle;
      p.color = np.color;
      p.trail = np.trail;
    }

    function resize() {
      const rect =
        canvas.parentElement?.getBoundingClientRect() ||
        canvas.getBoundingClientRect();

      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: CONFIG.count }, makeParticle);
    }

    function drawStaticFrame() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const [r, g, b] = p.color;
        const alpha = p.baseAlpha * 0.55;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawFrame(time) {
      if (!running) return;

      ctx.clearRect(0, 0, width, height);

      const t = time * 0.001;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x > width + 24) {
          resetParticle(p, true);
        }

        if (p.y < -24) p.y = height + 12;
        if (p.y > height + 24) p.y = -12;

        const [r, g, b] = p.color;
        const pulse = 0.84 + Math.sin(t * p.twinkle + p.phase) * CONFIG.flicker;
        const alpha = Math.max(0.04, Math.min(0.6, p.baseAlpha * pulse));

        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.22})`;
        ctx.lineWidth = Math.max(0.5, p.size * 0.85);
        ctx.beginPath();
        ctx.moveTo(p.x - p.trail, p.y - p.vy * 10);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.shadowBlur = p.size * 6;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrame = window.requestAnimationFrame(drawFrame);
    }

    resize();

    if (reduceMotion.matches) {
      drawStaticFrame();
    } else {
      animationFrame = window.requestAnimationFrame(drawFrame);
    }

    const handleResize = () => {
      resize();
      if (reduceMotion.matches) drawStaticFrame();
    };

    const handleMotionChange = () => {
      window.cancelAnimationFrame(animationFrame);
      resize();
      if (reduceMotion.matches) {
        drawStaticFrame();
      } else {
        animationFrame = window.requestAnimationFrame(drawFrame);
      }
    };

    window.addEventListener("resize", handleResize);
    reduceMotion.addEventListener?.("change", handleMotionChange);

    return () => {
      running = false;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      reduceMotion.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={ref} className="cosmic-solar-dust-canvas" aria-hidden="true" />;
}
