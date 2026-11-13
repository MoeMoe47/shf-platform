import React, { useEffect, useRef } from "react";

export default function EarthHorizonLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Lower, calmer Earth horizon so it supports
      // the hero instead of cutting across it.
      const horizon = (x) => {
        const n = (x - width / 2) / (width / 2);
        return height * (0.84 + 0.10 * n * n);
      };

      // Planet shape
      ctx.beginPath();
      ctx.moveTo(0, horizon(0));
      for (let x = 0; x <= width; x += 4) {
        ctx.lineTo(x, horizon(x));
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const planetFill = ctx.createLinearGradient(
        0, height * 0.78, 0, height
      );
      planetFill.addColorStop(0.00, "#1d2732");
      planetFill.addColorStop(0.18, "#121922");
      planetFill.addColorStop(0.52, "#0a1017");
      planetFill.addColorStop(1.00, "#04070c");

      ctx.fillStyle = planetFill;
      ctx.fill();

      ctx.save();
      ctx.clip();

      // Subtle monochrome land / texture masses
      let seed = 104729;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      for (let i = 0; i < 42; i++) {
        const x = random() * width;
        const y = horizon(x) + random() * height * 0.17;
        const rx = 70 + random() * 240;
        const ry = 16 + random() * 65;
        const rot = (random() - 0.5) * 0.8;

        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0
          ? "rgba(255,255,255,0.022)"
          : "rgba(0,0,0,0.060)";
        ctx.fill();
      }

      // Cloud systems: grayscale / smoky silver
      for (let i = 0; i < 115; i++) {
        const x = random() * width;
        const y = horizon(x) + random() * height * 0.14;
        const rx = 30 + random() * 150;
        const ry = 4 + random() * 18;
        const rot = (random() - 0.5) * 0.45;

        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,228,238,0.040)";
        ctx.fill();
      }

      // Haze / atmospheric texture close to the top of the planet
      for (let i = 0; i < 24; i++) {
        const y = height * (0.81 + i * 0.0035);
        const haze = ctx.createLinearGradient(0, y, width, y);
        haze.addColorStop(0, "rgba(255,255,255,0.000)");
        haze.addColorStop(0.30, "rgba(255,255,255,0.014)");
        haze.addColorStop(0.55, "rgba(255,255,255,0.028)");
        haze.addColorStop(0.80, "rgba(255,255,255,0.012)");
        haze.addColorStop(1, "rgba(255,255,255,0.000)");
        ctx.fillStyle = haze;
        ctx.fillRect(0, y, width, 2.2);
      }

      // Ivory city-light clusters
      for (let i = 0; i < 1400; i++) {
        const belt = Math.floor(random() * 7);
        const clusterX = width * (0.08 + belt * 0.12);
        const x = clusterX + (random() - 0.5) * width * 0.11;
        const y = horizon(x) + 12 + random() * height * 0.13;
        const size = 0.20 + random() * 1.10;
        const alpha = 0.10 + random() * 0.33;

        ctx.fillStyle = `rgba(244,228,195,${alpha})`;
        ctx.fillRect(x, y, size, size);
      }

      // Slight broader light fields from city regions
      for (let i = 0; i < 22; i++) {
        const x = width * (0.08 + (i % 7) * 0.12) + (random() - 0.5) * 60;
        const y = height * (0.88 + random() * 0.05);
        const radius = 35 + random() * 95;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, "rgba(244,228,195,0.045)");
        glow.addColorStop(1, "rgba(244,228,195,0)");

        ctx.fillStyle = glow;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      ctx.restore();

      // Clean white/ivory rim instead of saturated blue
      ctx.beginPath();
      ctx.moveTo(0, horizon(0));
      for (let x = 0; x <= width; x += 4) {
        ctx.lineTo(x, horizon(x));
      }

      ctx.lineWidth = 2.1;
      ctx.strokeStyle = "rgba(232,240,247,0.88)";
      ctx.stroke();

      // Soft atmospheric band
      const atmosphere = ctx.createLinearGradient(
        0, height * 0.79, 0, height * 0.91
      );
      atmosphere.addColorStop(0.00, "rgba(255,255,255,0.00)");
      atmosphere.addColorStop(0.18, "rgba(235,241,247,0.17)");
      atmosphere.addColorStop(0.48, "rgba(215,223,232,0.07)");
      atmosphere.addColorStop(1.00, "rgba(215,223,232,0.00)");

      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, height * 0.75, width, height * 0.20);

      // Warm reflected solar illumination from the right
      const glowX = width * 0.76;
      const glowY = horizon(width * 0.76) + 12;

      const sunReflection = ctx.createRadialGradient(
        glowX, glowY, 0,
        glowX, glowY, width * 0.28
      );
      sunReflection.addColorStop(0.00, "rgba(255,205,120,0.22)");
      sunReflection.addColorStop(0.22, "rgba(255,185,92,0.10)");
      sunReflection.addColorStop(1.00, "rgba(255,185,92,0.00)");

      ctx.fillStyle = sunReflection;
      ctx.fillRect(0, 0, width, height);

      // Fine highlight line on the sun-facing edge
      ctx.beginPath();
      ctx.moveTo(width * 0.53, horizon(width * 0.53));
      for (let x = width * 0.53; x <= width; x += 4) {
        ctx.lineTo(x, horizon(x));
      }

      ctx.lineWidth = 1.35;
      ctx.strokeStyle = "rgba(246,221,175,0.72)";
      ctx.stroke();
    }

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    draw();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cosmic-earth-foreground"
      aria-hidden="true"
    />
  );
}
